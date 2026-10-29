import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.database import Database
from backend.app.services.resume_service import extract_text_from_pdf, parse_resume_profile
from backend.app.routers import jobs, applications, profile, settings as settings_router, ingest, webhooks, interview_rounds

@asynccontextmanager
async def lifespan(app: FastAPI):
    db = Database(settings.db_path)
    await db.init_db()
    
    # Pre-populate profile from default resume if empty
    current_profile = await db.get_profile()
    if not current_profile.skills and os.path.exists(settings.default_resume_path):
        text = extract_text_from_pdf(settings.default_resume_path)
        if text:
            parsed = parse_resume_profile(text, file_path=settings.default_resume_path)
            await db.save_profile(parsed)
            print(f"Loaded profile for {parsed.name} with {len(parsed.skills)} skills from resume.")
            
    yield

app = FastAPI(
    title="Job Hunter AI Agent API",
    description="Autonomous Job Search, Fit Matching & Application Outreach System",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router)
app.include_router(applications.router)
app.include_router(profile.router)
app.include_router(settings_router.router)
app.include_router(ingest.router)
app.include_router(webhooks.router)
app.include_router(interview_rounds.router)

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "agent": "Job Hunter Agent", "version": "1.0.0"}
