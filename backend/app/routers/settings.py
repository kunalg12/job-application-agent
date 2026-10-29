from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from backend.app.models import AppSettings, SMTPSettings
from backend.app.config import settings
from backend.app.database import Database
from backend.app.services.email_service import EmailDispatcher

router = APIRouter(prefix="/api/settings", tags=["Settings"])

def get_db() -> Database:
    return Database(settings.db_path)

class TestEmailPayload(BaseModel):
    test_recipient: str

@router.get("", response_model=AppSettings)
async def get_app_settings():
    return await get_db().get_settings()

@router.put("", response_model=AppSettings)
async def update_app_settings(payload: AppSettings):
    await get_db().save_settings(payload)
    return payload

@router.post("/test-email")
async def test_smtp_connection(payload: TestEmailPayload):
    app_settings = await get_db().get_settings()
    dispatcher = EmailDispatcher(app_settings.smtp)
    success, message = dispatcher.send_email(
        to_email=payload.test_recipient,
        subject="Job Hunter Agent - SMTP Test Email",
        body="Hello! This is a verification email from your Autonomous Job Application Agent. Your SMTP setup is working perfectly!"
    )
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"message": message, "status": "SUCCESS"}

@router.get("/metrics")
async def get_dashboard_metrics() -> Dict[str, Any]:
    db = get_db()
    all_jobs = await db.list_jobs(limit=500)
    applications = await db.list_applications(limit=500)
    sent_today = await db.count_sent_today()
    app_settings = await db.get_settings()
    
    high_matches = sum(1 for a in applications if a.match_score >= 80)
    sent_total = sum(1 for a in applications if a.status in ["EMAIL_SENT", "FORM_APPLIED", "INTERVIEW"])
    
    return {
        "total_jobs_discovered": len(all_jobs),
        "total_applications": len(applications),
        "high_matches": high_matches,
        "sent_total": sent_total,
        "sent_today": sent_today,
        "daily_limit": app_settings.daily_application_limit,
        "autonomous_mode": app_settings.autonomous_mode,
        "auto_apply_threshold": app_settings.auto_apply_threshold
    }
