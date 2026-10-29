from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from typing import List, Optional
from pydantic import BaseModel
from backend.app.models import Job, MatchAnalysis
from backend.app.config import settings
from backend.app.database import Database
from backend.app.services.scraper_service import fetch_all_jobs, parse_custom_job_text
from backend.app.services.matcher_service import evaluate_job_match

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])
db = Database(settings.db_path)

class ImportJobRequest(BaseModel):
    title: str
    company: str
    location: Optional[str] = "Remote"
    description: str
    url: Optional[str] = None
    source: str = "manual"
    recruiter_email: Optional[str] = None

class JobWithAnalysis(Job):
    match_score: int = 0
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    recommendation: str = "POTENTIAL_MATCH"

@router.get("", response_model=List[JobWithAnalysis])
async def get_jobs(
    search: Optional[str] = None,
    remote_only: bool = False,
    min_score: int = 0,
    limit: int = 100
):
    profile = await db.get_profile()
    all_jobs = await db.list_jobs(limit=limit)
    
    results = []
    for j in all_jobs:
        if remote_only and "remote" not in j.location.lower() and "worldwide" not in j.description.lower():
            continue
        if search:
            q = search.lower()
            if q not in j.title.lower() and q not in j.company.lower() and q not in j.description.lower():
                continue

        analysis = evaluate_job_match(profile, j)
        if analysis.match_score >= min_score:
            res = JobWithAnalysis(
                **j.model_dump(),
                match_score=analysis.match_score,
                matched_skills=analysis.matched_skills,
                missing_skills=analysis.missing_skills,
                recommendation=analysis.recommendation
            )
            results.append(res)
            
    # Sort by match score descending
    results.sort(key=lambda x: x.match_score, reverse=True)
    return results

async def run_scan_worker():
    profile = await db.get_profile()
    app_settings = await db.get_settings()
    jobs = await fetch_all_jobs(max_per_source=25)
    for j in jobs:
        await db.save_job(j)
        # If in autonomous mode (Tier 2) and score exceeds threshold
        if app_settings.autonomous_mode:
            analysis = evaluate_job_match(profile, j)
            if analysis.match_score >= app_settings.auto_apply_threshold:
                # Stage and auto-apply logic
                pass
    await db.log_audit("JOB_SCAN", f"Ingested {len(jobs)} jobs from remote boards", "SUCCESS")

@router.post("/scan")
async def trigger_scan(background_tasks: BackgroundTasks):
    background_tasks.add_task(run_scan_worker)
    return {"message": "Job scan triggered in background", "status": "running"}

@router.post("/import", response_model=Job)
async def import_job(payload: ImportJobRequest):
    custom_text = f"Title: {payload.title}\nCompany: {payload.company}\nLocation: {payload.location}\n{payload.description}"
    job = parse_custom_job_text(custom_text, custom_url=payload.url)
    job.title = payload.title
    job.company = payload.company
    job.location = payload.location or "Remote"
    if payload.recruiter_email:
        job.recruiter_email = payload.recruiter_email
    await db.save_job(job)
    return job
