import os
import shutil
from fastapi import APIRouter, HTTPException, UploadFile, File
from backend.app.models import UserProfile
from backend.app.config import settings
from backend.app.database import Database
from backend.app.services.resume_service import extract_text_from_pdf, parse_resume_profile

router = APIRouter(prefix="/api/profile", tags=["Profile"])

def get_db() -> Database:
    return Database(settings.db_path)

@router.get("", response_model=UserProfile)
async def get_user_profile():
    db = get_db()
    profile = await db.get_profile()
    # If skills are empty, initialize from default resume
    if not profile.skills and os.path.exists(settings.default_resume_path):
        text = extract_text_from_pdf(settings.default_resume_path)
        if text:
            parsed = parse_resume_profile(text, file_path=settings.default_resume_path)
            await db.save_profile(parsed)
            return parsed
    return profile

@router.put("", response_model=UserProfile)
async def update_user_profile(payload: UserProfile):
    db = get_db()
    await db.save_profile(payload)
    return payload

@router.post("/upload-resume", response_model=UserProfile)
async def upload_resume(file: UploadFile = File(...)):
    db = get_db()
    if not file.filename.endswith((".pdf", ".txt")):
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported.")
        
    uploads_dir = "/tmp/job_agent_uploads"
    os.makedirs(uploads_dir, exist_ok=True)
    
    # Secure filename sanitization against path traversal
    safe_basename = os.path.basename(file.filename)
    import uuid
    safe_filename = f"{uuid.uuid4().hex[:8]}_{safe_basename}"
    saved_path = os.path.join(uploads_dir, safe_filename)
    
    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    if safe_filename.endswith(".pdf"):
        text = extract_text_from_pdf(saved_path)
    else:
        with open(saved_path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()

    profile = parse_resume_profile(text, file_path=saved_path)
    await db.save_profile(profile)
    await db.log_audit("RESUME_UPLOAD", f"Uploaded and parsed {safe_basename} with {len(profile.skills)} skills", "SUCCESS")
    return profile
