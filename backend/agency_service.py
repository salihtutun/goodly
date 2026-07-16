"""Agency service — multi-tenant client management for SEO agencies.

Adds parent_user_id to users for agency hierarchy.
Agency owners can view/manage client accounts, run audits on their behalf,
and generate white-label reports.
"""
import uuid
import logging
from typing import List, Optional

from database import db
from dependencies import now_iso

logger = logging.getLogger("agency_service")


async def create_client(
    *,
    agency_user_id: str,
    email: str,
    name: str,
    website: str,
    plan: str = "free",
) -> dict:
    """Create a client account under an agency.

    The agency_user_id becomes the parent_user_id on the client account.
    """
    from auth import hash_password

    # Check if email already exists
    existing = await db.users.find_one({"email": email.lower().strip()})
    if existing:
        raise ValueError(f"User with email {email} already exists")

    # Check agency plan limits
    agency = await db.users.find_one({"id": agency_user_id})
    if not agency:
        raise ValueError("Agency user not found")

    client_count = await db.users.count_documents({"parent_user_id": agency_user_id})
    max_clients = _get_max_clients(agency.get("plan", "free"))
    if client_count >= max_clients:
        raise ValueError(
            f"Client limit reached ({max_clients}). Upgrade your agency plan to add more clients."
        )

    user_doc = {
        "id": str(uuid.uuid4()),
        "email": email.lower().strip(),
        "password_hash": hash_password(str(uuid.uuid4())),  # Random password
        "name": name,
        "role": "user",
        "plan": plan,
        "onboarded": False,
        "email_verified": True,  # Agency-managed accounts are pre-verified
        "parent_user_id": agency_user_id,
        "created_at": now_iso(),
    }
    await db.users.insert_one(user_doc)

    # Auto-create a project for the client
    project_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_doc["id"],
        "name": f"{name}'s Website",
        "url": website,
        "description": "Managed by agency",
        "target_keywords": "",
        "schedule": "monthly",
        "next_audit_at": None,
        "created_at": now_iso(),
        "last_audit_at": None,
        "last_score": None,
    }
    await db.projects.insert_one(project_doc)

    user_doc.pop("_id", None)
    user_doc.pop("password_hash", None)
    return {
        "client": user_doc,
        "project": project_doc,
    }


async def list_clients(agency_user_id: str) -> List[dict]:
    """List all clients under an agency."""
    clients = await db.users.find(
        {"parent_user_id": agency_user_id},
        {"password_hash": 0, "_id": 0},
    ).sort("created_at", -1).to_list(500)

    # Enrich with latest audit scores
    for client in clients:
        last_audit = await db.audits.find(
            {"user_id": client["id"]},
            {"result.overall_score": 1, "created_at": 1},
        ).sort("created_at", -1).limit(1).to_list(1)
        client["last_score"] = (
            (last_audit[0].get("result") or {}).get("overall_score")
            if last_audit else None
        )
        client["last_audit_at"] = (
            last_audit[0].get("created_at") if last_audit else None
        )
        client["project_count"] = await db.projects.count_documents(
            {"user_id": client["id"]}
        )
        client["audit_count"] = await db.audits.count_documents(
            {"user_id": client["id"]}
        )

    return clients


async def get_client(agency_user_id: str, client_id: str) -> Optional[dict]:
    """Get a single client's details."""
    client = await db.users.find_one(
        {"id": client_id, "parent_user_id": agency_user_id},
        {"password_hash": 0, "_id": 0},
    )
    if not client:
        return None

    # Enrich
    last_audit = await db.audits.find(
        {"user_id": client_id},
        {"result.overall_score": 1, "created_at": 1},
    ).sort("created_at", -1).limit(1).to_list(1)
    client["last_score"] = (
        (last_audit[0].get("result") or {}).get("overall_score")
        if last_audit else None
    )

    client["projects"] = await db.projects.find(
        {"user_id": client_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)

    client["recent_audits"] = await db.audits.find(
        {"user_id": client_id},
        {"_id": 0, "result.content.text_preview": 0},
    ).sort("created_at", -1).limit(10).to_list(10)

    return client


async def run_client_audit(
    *,
    agency_user_id: str,
    client_id: str,
    url: str,
    project_id: Optional[str] = None,
) -> dict:
    """Run an audit on behalf of a client."""
    # Verify client belongs to agency
    client = await db.users.find_one({
        "id": client_id,
        "parent_user_id": agency_user_id,
    })
    if not client:
        raise ValueError("Client not found or not owned by this agency")

    from services import run_audit as _run_audit
    return await _run_audit(
        url=url,
        user_id=client_id,
        project_id=project_id,
    )


async def get_agency_dashboard(agency_user_id: str) -> dict:
    """Get agency-wide dashboard with all client metrics."""
    clients = await list_clients(agency_user_id)

    total_clients = len(clients)
    total_projects = sum(c.get("project_count", 0) for c in clients)
    total_audits = sum(c.get("audit_count", 0) for c in clients)

    scores = [c["last_score"] for c in clients if c.get("last_score") is not None]
    avg_score = int(sum(scores) / len(scores)) if scores else None

    # Clients needing attention (score < 50 or no audit in 30 days)
    from datetime import datetime, timezone, timedelta
    cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    needs_attention = [
        c for c in clients
        if (c.get("last_score") is not None and c["last_score"] < 50)
        or (c.get("last_audit_at") is None or c["last_audit_at"] < cutoff)
    ]

    return {
        "total_clients": total_clients,
        "total_projects": total_projects,
        "total_audits": total_audits,
        "average_score": avg_score,
        "clients_needing_attention": len(needs_attention),
        "clients": clients,
        "needs_attention": needs_attention[:10],
    }


def _get_max_clients(plan: str) -> int:
    """Get max clients allowed per agency plan."""
    limits = {
        "free": 0,
        "starter": 3,
        "pro": 15,
        "concierge": 50,
    }
    return limits.get(plan, 0)
