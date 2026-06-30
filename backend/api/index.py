"""Goodly API - Vercel Serverless Demo Backend."""
import os, json, uuid
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr

app = FastAPI(title="Goodly API")

app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

def now(): return datetime.now(timezone.utc).isoformat()

@app.get("/api/")
@app.get("/api/health")
async def health():
    return {"service":"Goodly API","status":"ok","version":"1.7.0","mode":"demo"}

@app.post("/api/auth/login")
async def login():
    return {"user":{"id":"demo","email":"demo@goodly.app","name":"Demo User","role":"user","plan":"concierge","onboarded":True,"email_verified":True},"token":"demo"}

@app.post("/api/auth/register")
async def register():
    return {"user":{"id":"demo","email":"demo@goodly.app","name":"Demo User","role":"user","plan":"free","onboarded":False,"email_verified":False},"token":"demo"}

@app.get("/api/auth/me")
async def me():
    return {"id":"demo","email":"demo@goodly.app","name":"Demo User","role":"user","plan":"concierge","onboarded":True,"email_verified":True}

@app.post("/api/auth/logout")
async def logout(): return {"ok":True}

@app.post("/api/auth/forgot-password")
async def forgot(): return {"ok":True,"message":"If that email exists, we sent a reset link."}

@app.post("/api/auth/reset-password")
async def reset(): return {"ok":True,"message":"Password reset."}

@app.post("/api/auth/onboarded")
async def onboarded(): return {"ok":True}

@app.get("/api/dashboard/summary")
async def summary():
    return {"projects_count":3,"audits_count":12,"average_score":72,"recent_audits":[{"id":"a1","url":"https://example.com","created_at":now(),"overall_score":78}]}

@app.get("/api/dashboard/visibility")
async def visibility():
    return {"overall_score":68,"informed_fraction":0.6,"weights":{"google":0.22,"gbp":0.2,"instagram":0.13,"tiktok":0.13,"youtube":0.12,"ai_assistants":0.2},"breakdown":{"google":{"score":78,"has_data":True},"gbp":{"score":None,"has_data":False},"instagram":{"score":65,"has_data":True},"tiktok":{"score":None,"has_data":False},"youtube":{"score":None,"has_data":False},"ai_assistants":{"score":55,"has_data":True}},"checked_at":now()}

@app.get("/api/projects")
async def projects():
    return [{"id":"p1","name":"Greenhouse Lane Co.","url":"https://greenhouselane.com","last_score":78,"created_at":now()},{"id":"p2","name":"Clay & Kiln Studio","url":"https://claykiln.com","last_score":65,"created_at":now()}]

@app.get("/api/billing/plans")
async def plans():
    return [{"id":"free","name":"Self-serve","price_usd":0,"features":["3 audits/mo","1 project","AI action plan"]},{"id":"concierge","name":"Concierge","price_usd":1000,"features":["Done-for-you SEO","Dedicated specialist","Unlimited audits"]}]

@app.get("/api/billing/me")
async def billing(): return {"plan":{"id":"concierge","name":"Concierge"},"usage":{"audits_this_month":5,"projects_count":3},"transactions":[]}

@app.get("/api/social/audits")
async def social(): return []

@app.get("/api/gbp/audits")
async def gbp(): return []

@app.get("/api/ai-visibility/history")
async def aiv(): return []

@app.get("/api/scheduler/runs")
async def runs(): return []

@app.get("/api/concierge/brief")
async def brief(): return None

@app.get("/api/serp/history")
async def serp(): return []

@app.get("/api/{path:path}")
async def catchall(path:str): return {"message":f"Demo: /api/{path}","mode":"demo"}

@app.post("/api/{path:path}")
async def catchall_post(path:str): return {"message":f"Demo: /api/{path}","mode":"demo"}

from mangum import Mangum
handler = Mangum(app, lifespan="off")
