from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from backend.app.config import settings
from backend.app.database import Database
from backend.app.models import InterviewRound, InterviewQuestion, RoundPrepBriefing
from backend.app.services.prep_service import generate_round_prep_briefing, generate_thank_you_email

router = APIRouter(tags=["Interview Rounds"])

def get_db() -> Database:
    return Database(settings.db_path)

@router.get("/api/companies/{company_id}/rounds", response_model=List[InterviewRound])
async def list_rounds_for_company(
    company_id: str,
    user_id: str = Query("default-user")
):
    db = get_db()
    return await db.list_interview_rounds_for_company(user_id, company_id)

@router.post("/api/companies/{company_id}/rounds", response_model=InterviewRound)
async def create_or_update_round(
    company_id: str,
    round_obj: InterviewRound
):
    db = get_db()
    round_obj.company_id = company_id
    # Check tenant ownership if modifying existing round
    if round_obj.id:
        async with db.get_connection() as conn:
            async with conn.execute("SELECT user_id FROM interview_rounds WHERE id = ?", (round_obj.id,)) as cursor:
                row = await cursor.fetchone()
                if row and row["user_id"] != round_obj.user_id:
                    raise HTTPException(status_code=403, detail="Forbidden: You do not own this round")
    await db.save_interview_round(round_obj)
    return round_obj

@router.get("/api/rounds/{round_id}")
async def get_round_detail(
    round_id: str,
    user_id: str = Query("default-user")
):
    db = get_db()
    round_obj = await db.get_interview_round_by_id(user_id, round_id)
    if not round_obj:
        raise HTTPException(status_code=404, detail="Interview round not found")
    questions = await db.list_questions_for_round(user_id, round_id)
    return {
        "round": round_obj.model_dump(),
        "questions": [q.model_dump() for q in questions]
    }

@router.get("/api/rounds/{round_id}/prep", response_model=RoundPrepBriefing)
async def get_prep_briefing(
    round_id: str,
    user_id: str = Query("default-user")
):
    db = get_db()
    round_obj = await db.get_interview_round_by_id(user_id, round_id)
    if not round_obj:
        raise HTTPException(status_code=404, detail="Interview round not found")
    briefing = await generate_round_prep_briefing(db, user_id, round_obj.company_id, round_id)
    return briefing

@router.post("/api/rounds/{round_id}/thank-you")
async def create_thank_you_note(
    round_id: str,
    user_id: str = Query("default-user")
):
    db = get_db()
    round_obj = await db.get_interview_round_by_id(user_id, round_id)
    if not round_obj:
        raise HTTPException(status_code=404, detail="Interview round not found")
    return await generate_thank_you_email(db, user_id, round_id)
