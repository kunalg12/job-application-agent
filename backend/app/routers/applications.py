import os
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from typing import List, Optional
from pydantic import BaseModel
from backend.app.models import Application, SMTPSettings
from backend.app.config import settings
from backend.app.database import Database
from backend.app.services.matcher_service import evaluate_job_match
from backend.app.services.tailor_service import generate_cold_email, generate_cover_letter, build_cover_letter_pdf
from backend.app.services.email_service import EmailDispatcher
from backend.app.services.automation_service import autofill_job_application

router = APIRouter(prefix="/api/applications", tags=["Applications"])

def get_db() -> Database:
    return Database(settings.db_path)

class UpdateApplicationPayload(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    email_subject: Optional[str] = None
    email_body: Optional[str] = None
    cover_letter: Optional[str] = None
    recruiter_email: Optional[str] = None

class SendEmailPayload(BaseModel):
    to_email: Optional[str] = None
    subject: Optional[str] = None
    body: Optional[str] = None

@router.get("", response_model=List[Application])
async def list_applications():
    return await get_db().list_applications(limit=100)

@router.post("/stage/{job_id}", response_model=Application)
async def stage_application(job_id: str):
    db = get_db()
    job = await db.get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    profile = await db.get_profile()
    analysis = evaluate_job_match(profile, job)
    
    email_draft = generate_cold_email(profile, job, analysis)
    cover_letter_text = generate_cover_letter(profile, job, analysis)
    
    # Generate cover letter PDF in cache dir
    pdf_dir = "/tmp/job_agent_pdfs"
    os.makedirs(pdf_dir, exist_ok=True)
    pdf_path = f"{pdf_dir}/Cover_Letter_{job.company.replace(' ', '_')}_{job.id}.pdf"
    build_cover_letter_pdf(cover_letter_text, profile, job, pdf_path)

    # Determine status: if neither email nor url is available, flag as UNROUTABLE
    initial_status = "STAGED"
    if not job.recruiter_email and not job.url:
        initial_status = "UNROUTABLE"

    app_id = f"app_{job.id}"
    app = Application(
        id=app_id,
        job_id=job.id,
        job_title=job.title,
        company=job.company,
        match_score=analysis.match_score,
        recruiter_email=job.recruiter_email,
        application_url=job.url,
        status=initial_status,
        email_subject=email_draft["subject"],
        email_body=email_draft["body"],
        cover_letter=cover_letter_text,
        cover_letter_pdf_path=pdf_path,
        matched_skills=analysis.matched_skills,
        missing_skills=analysis.missing_skills
    )
    await db.save_application(app)
    return app

@router.post("/{app_id}/email")
async def send_email_for_application(app_id: str, payload: Optional[SendEmailPayload] = None):
    db = get_db()
    app = await db.get_application_by_id(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    profile = await db.get_profile()
    app_settings = await db.get_settings()
    
    # Rate limit check
    sent_today = await db.count_sent_today()
    if sent_today >= app_settings.daily_application_limit:
        raise HTTPException(
            status_code=429,
            detail=f"Daily limit reached ({sent_today}/{app_settings.daily_application_limit}). You can adjust this in Settings."
        )

    to_email = (payload.to_email if payload and payload.to_email else app.recruiter_email)
    subject = (payload.subject if payload and payload.subject else app.email_subject)
    body = (payload.body if payload and payload.body else app.email_body)

    if not to_email:
        raise HTTPException(status_code=400, detail="No recipient email address specified for this job.")

    # Validate that candidate's resume PDF actually exists on disk before dispatching
    resume_path = profile.resume_file_path or settings.default_resume_path
    if not resume_path or not os.path.exists(resume_path):
        raise HTTPException(
            status_code=400,
            detail="Resume PDF file not found. Please upload your resume in Candidate Profile settings before sending applications."
        )

    attachments = [resume_path]
    if app.cover_letter_pdf_path and os.path.exists(app.cover_letter_pdf_path):
        attachments.append(app.cover_letter_pdf_path)

    dispatcher = EmailDispatcher(app_settings.smtp)
    success, message = dispatcher.send_email(
        to_email=to_email,
        subject=subject,
        body=body,
        attachment_paths=attachments
    )

    if not success:
        await db.log_audit("EMAIL_SENT", f"Failed email to {to_email} for {app.job_title}: {message}", "FAILURE")
        raise HTTPException(status_code=400, detail=message)

    # Persist user edits and mark sent
    app.recruiter_email = to_email
    app.email_subject = subject
    app.email_body = body
    app.status = "EMAIL_SENT"
    app.applied_at = datetime.now(timezone.utc).isoformat()
    await db.save_application(app)
    await db.log_audit("EMAIL_SENT", f"Dispatched application email to {to_email} for {app.job_title} at {app.company}", "SUCCESS")
    return {"message": message, "status": "EMAIL_SENT"}

@router.post("/{app_id}/autofill")
async def autofill_for_application(app_id: str, headless: bool = False):
    db = get_db()
    app = await db.get_application_by_id(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    profile = await db.get_profile()
    resume_path = profile.resume_file_path or settings.default_resume_path
    
    result = await autofill_job_application(
        job_url=app.application_url or "",
        profile=profile,
        resume_path=resume_path,
        cover_letter=app.cover_letter,
        headless=headless
    )

    if result.status in ["FILLED", "ACTION_REQUIRED"]:
        app.status = "FORM_APPLIED" if result.status == "FILLED" else "ACTION_REQUIRED"
        app.notes = result.message
        await db.save_application(app)
        await db.log_audit("FORM_AUTOFILLED", f"{result.status} for {app.company}: {result.message}", "SUCCESS")

    return result.model_dump()

@router.patch("/{app_id}", response_model=Application)
async def update_application(app_id: str, payload: UpdateApplicationPayload):
    db = get_db()
    app = await db.get_application_by_id(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    if payload.status:
        app.status = payload.status
    if payload.notes is not None:
        app.notes = payload.notes
    if payload.email_subject:
        app.email_subject = payload.email_subject
    if payload.email_body:
        app.email_body = payload.email_body
    if payload.cover_letter:
        app.cover_letter = payload.cover_letter
        # Rebuild PDF with updated text
        if app.cover_letter_pdf_path:
            job_obj = await db.get_job_by_id(app.job_id)
            if job_obj:
                profile_obj = await db.get_profile()
                build_cover_letter_pdf(payload.cover_letter, profile_obj, job_obj, app.cover_letter_pdf_path)
    if payload.recruiter_email:
        app.recruiter_email = payload.recruiter_email

    await db.save_application(app)
    return app

@router.get("/{app_id}/pdf")
async def get_cover_letter_pdf(app_id: str):
    db = get_db()
    app = await db.get_application_by_id(app_id)
    if not app or not app.cover_letter_pdf_path or not os.path.exists(app.cover_letter_pdf_path):
        raise HTTPException(status_code=404, detail="PDF not found")
    return FileResponse(app.cover_letter_pdf_path, media_type="application/pdf", filename=f"CoverLetter_{app.company}.pdf")
