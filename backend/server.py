from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Request
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field, ConfigDict

from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user_id,
)
from seo_analyzer import analyze_url
import ai_service


# --- Mongo setup ---
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="SEO Framework API")
api = APIRouter(prefix="/api")

logger = logging.getLogger("seo_framework")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s | %(message)s")


# ---------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def public_user(doc: dict) -> dict:
    return {
        "id": doc["id"],
        "email": doc["email"],
        "name": doc.get("name") or doc["email"].split("@")[0],
        "role": doc.get("role", "user"),
        "created_at": doc.get("created_at"),
    }


# ---------------------------------------------------------------
# Auth models / endpoints
# ---------------------------------------------------------------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: Optional[str] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class AuthOut(BaseModel):
    user: dict
    token: str


def _set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
        path="/",
    )


@api.post("/auth/register", response_model=AuthOut)
async def register(body: RegisterIn, response: Response):
    email = body.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": email,
        "password_hash": hash_password(body.password),
        "name": body.name or email.split("@")[0],
        "role": "user",
        "created_at": now_iso(),
    }
    await db.users.insert_one(user_doc)
    token = create_access_token(user_doc["id"], email)
    _set_auth_cookie(response, token)
    return {"user": public_user(user_doc), "token": token}


@api.post("/auth/login", response_model=AuthOut)
async def login(body: LoginIn, response: Response):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], email)
    _set_auth_cookie(response, token)
    return {"user": public_user(user), "token": token}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api.get("/auth/me")
async def me(user_id: str = Depends(get_current_user_id)):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return public_user(user)


# ---------------------------------------------------------------
# Projects (saved websites)
# ---------------------------------------------------------------
class ProjectIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    url: str
    description: Optional[str] = None
    target_keywords: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    target_keywords: Optional[str] = None


@api.post("/projects")
async def create_project(body: ProjectIn, user_id: str = Depends(get_current_user_id)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "name": body.name,
        "url": body.url,
        "description": body.description or "",
        "target_keywords": body.target_keywords or "",
        "created_at": now_iso(),
        "last_audit_at": None,
        "last_score": None,
    }
    await db.projects.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/projects")
async def list_projects(user_id: str = Depends(get_current_user_id)):
    cursor = db.projects.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(500)


@api.get("/projects/{project_id}")
async def get_project(project_id: str, user_id: str = Depends(get_current_user_id)):
    doc = await db.projects.find_one({"id": project_id, "user_id": user_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    return doc


@api.patch("/projects/{project_id}")
async def update_project(project_id: str, body: ProjectUpdate, user_id: str = Depends(get_current_user_id)):
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    res = await db.projects.update_one({"id": project_id, "user_id": user_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    doc = await db.projects.find_one({"id": project_id}, {"_id": 0})
    return doc


@api.delete("/projects/{project_id}")
async def delete_project(project_id: str, user_id: str = Depends(get_current_user_id)):
    res = await db.projects.delete_one({"id": project_id, "user_id": user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.audits.delete_many({"project_id": project_id, "user_id": user_id})
    return {"ok": True}


# ---------------------------------------------------------------
# Audits
# ---------------------------------------------------------------
class AuditIn(BaseModel):
    url: str
    project_id: Optional[str] = None


@api.post("/audits")
async def run_audit(body: AuditIn, user_id: str = Depends(get_current_user_id)):
    result = await analyze_url(body.url)

    # Generate AI recommendations only when fetch succeeded
    ai_recs = None
    if not result.get("fetch_failed"):
        try:
            ai_recs = await ai_service.audit_recommendations(result)
        except Exception as e:
            logger.warning("AI recs failed: %s", e)
            ai_recs = {"summary": "AI recommendations are temporarily unavailable.", "priority_actions": [], "wins": [], "next_30_days": []}

    audit_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "project_id": body.project_id,
        "url": result.get("url", body.url),
        "created_at": now_iso(),
        "result": result,
        "ai_recommendations": ai_recs,
    }
    await db.audits.insert_one(audit_doc)

    if body.project_id:
        await db.projects.update_one(
            {"id": body.project_id, "user_id": user_id},
            {"$set": {"last_audit_at": audit_doc["created_at"], "last_score": result.get("overall_score")}},
        )

    audit_doc.pop("_id", None)
    return audit_doc


@api.get("/audits")
async def list_audits(project_id: Optional[str] = None, user_id: str = Depends(get_current_user_id)):
    query = {"user_id": user_id}
    if project_id:
        query["project_id"] = project_id
    cursor = db.audits.find(query, {"_id": 0, "result.content.text_preview": 0}).sort("created_at", -1).limit(100)
    audits = await cursor.to_list(100)
    # Trim heavy fields in list view
    for a in audits:
        result = a.get("result") or {}
        a["summary"] = {
            "overall_score": result.get("overall_score"),
            "categories": result.get("categories"),
            "url": result.get("url"),
            "issue_count": len(result.get("issues") or []),
        }
        a.pop("result", None)
        a.pop("ai_recommendations", None)
    return audits


@api.get("/audits/{audit_id}")
async def get_audit(audit_id: str, user_id: str = Depends(get_current_user_id)):
    doc = await db.audits.find_one({"id": audit_id, "user_id": user_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Audit not found")
    return doc


@api.delete("/audits/{audit_id}")
async def delete_audit(audit_id: str, user_id: str = Depends(get_current_user_id)):
    res = await db.audits.delete_one({"id": audit_id, "user_id": user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Audit not found")
    return {"ok": True}


# ---------------------------------------------------------------
# AI tools
# ---------------------------------------------------------------
class MetaTagsIn(BaseModel):
    business_name: str
    description: str
    target_keywords: Optional[str] = ""


class KeywordsIn(BaseModel):
    seed_topic: str
    industry: Optional[str] = ""
    location: Optional[str] = ""


class CompetitorsIn(BaseModel):
    your_site: str
    competitors: List[str]
    industry: Optional[str] = ""


@api.post("/ai/meta-tags")
async def ai_meta_tags(body: MetaTagsIn, user_id: str = Depends(get_current_user_id)):
    try:
        result = await ai_service.generate_meta_tags(body.business_name, body.description, body.target_keywords or "")
        await db.ai_history.insert_one({
            "id": str(uuid.uuid4()), "user_id": user_id, "kind": "meta_tags",
            "input": body.model_dump(), "result": result, "created_at": now_iso(),
        })
        return result
    except Exception as e:
        logger.exception("meta tags failed")
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")


@api.post("/ai/keywords")
async def ai_keywords(body: KeywordsIn, user_id: str = Depends(get_current_user_id)):
    try:
        result = await ai_service.keyword_research(body.seed_topic, body.industry or "", body.location or "")
        await db.ai_history.insert_one({
            "id": str(uuid.uuid4()), "user_id": user_id, "kind": "keywords",
            "input": body.model_dump(), "result": result, "created_at": now_iso(),
        })
        return result
    except Exception as e:
        logger.exception("keywords failed")
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")


@api.post("/ai/competitors")
async def ai_competitors(body: CompetitorsIn, user_id: str = Depends(get_current_user_id)):
    try:
        result = await ai_service.competitor_analysis(body.your_site, body.competitors, body.industry or "")
        await db.ai_history.insert_one({
            "id": str(uuid.uuid4()), "user_id": user_id, "kind": "competitors",
            "input": body.model_dump(), "result": result, "created_at": now_iso(),
        })
        return result
    except Exception as e:
        logger.exception("competitors failed")
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")


# ---------------------------------------------------------------
# Dashboard summary
# ---------------------------------------------------------------
@api.get("/dashboard/summary")
async def dashboard_summary(user_id: str = Depends(get_current_user_id)):
    projects_count = await db.projects.count_documents({"user_id": user_id})
    audits_count = await db.audits.count_documents({"user_id": user_id})
    # avg score of latest audit per project
    projects = await db.projects.find({"user_id": user_id}, {"_id": 0, "last_score": 1}).to_list(500)
    scored = [p["last_score"] for p in projects if p.get("last_score") is not None]
    avg_score = int(sum(scored) / len(scored)) if scored else None
    recent_audits_cursor = db.audits.find(
        {"user_id": user_id}, {"_id": 0, "id": 1, "url": 1, "created_at": 1, "result.overall_score": 1}
    ).sort("created_at", -1).limit(5)
    recent_audits = await recent_audits_cursor.to_list(5)
    for a in recent_audits:
        a["overall_score"] = (a.pop("result", {}) or {}).get("overall_score")
    return {
        "projects_count": projects_count,
        "audits_count": audits_count,
        "average_score": avg_score,
        "recent_audits": recent_audits,
    }


@api.get("/")
async def root():
    return {"service": "SEO Framework API", "status": "ok"}


# ---------------------------------------------------------------
# Mount + middleware
# ---------------------------------------------------------------
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.projects.create_index("id", unique=True)
    await db.projects.create_index("user_id")
    await db.audits.create_index("id", unique=True)
    await db.audits.create_index([("user_id", 1), ("created_at", -1)])

    # Seed admin + demo user
    seeds = [
        {"email": os.environ.get("ADMIN_EMAIL", "admin@seoframework.com"),
         "password": os.environ.get("ADMIN_PASSWORD", "admin123"),
         "name": "Admin", "role": "admin"},
        {"email": "demo@smallbiz.com", "password": "demo1234", "name": "Demo Owner", "role": "user"},
    ]
    for s in seeds:
        existing = await db.users.find_one({"email": s["email"]})
        if not existing:
            await db.users.insert_one({
                "id": str(uuid.uuid4()),
                "email": s["email"],
                "password_hash": hash_password(s["password"]),
                "name": s["name"],
                "role": s["role"],
                "created_at": now_iso(),
            })
    logger.info("Startup complete. Seeded users (if missing).")


@app.on_event("shutdown")
async def on_shutdown():
    client.close()
