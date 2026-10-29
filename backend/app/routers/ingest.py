import os
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel

from backend.app.config import settings
from backend.app.database import Database
from backend.app.models import InterviewRound, InterviewQuestion, RoundSource, RoundType
from backend.app.services.interview_parser_service import parse_unstructured_interview_note
from backend.app.services.transcription_service import transcribe_audio_file, ALLOWED_AUDIO_EXTENSIONS, MAX_AUDIO_BYTES

router = APIRouter(prefix="/api/ingest", tags=["Ingest"])

def get_db() -> Database:
    return Database(settings.db_path)

class TextIngestRequest(BaseModel):
    raw_text: str
    user_id: str
    company_name: Optional[str] = None
    round_id: Optional[str] = None

@router.post("/text")
async def ingest_scratchpad_text(request: TextIngestRequest):
    db = get_db()
    if not request.raw_text or not request.raw_text.strip():
        raise HTTPException(status_code=400, detail="Empty text payload")

    parsed = parse_unstructured_interview_note(request.raw_text, source=RoundSource.SCRATCHPAD)
    company_id = request.company_name or parsed.company_name or "Company"
    target_round_id = request.round_id or str(uuid.uuid4())

    # Verify tenant ownership if round_id is specified
    if request.round_id:
        async with db.get_connection() as conn:
            async with conn.execute("SELECT user_id FROM interview_rounds WHERE id = ?", (request.round_id,)) as cursor:
                row = await cursor.fetchone()
                if row and row["user_id"] != request.user_id:
                    raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to modify this round")

    round_obj = InterviewRound(
        id=target_round_id,
        company_id=company_id,
        user_id=request.user_id,
        round_number=parsed.round_number,
        round_title=parsed.round_title,
        round_type=parsed.round_type,
        interviewer_info=[{"name": n} for n in parsed.interviewer_names],
        raw_input_source=RoundSource.SCRATCHPAD,
        raw_input_text=request.raw_text,
        summary=parsed.summary,
        candidate_feeling=parsed.candidate_feeling
    )
    await db.save_interview_round(round_obj)

    for q_text in parsed.questions_extracted:
        q_obj = InterviewQuestion(
            id=str(uuid.uuid4()),
            round_id=target_round_id,
            user_id=request.user_id,
            question_text=q_text,
            question_category=parsed.round_type.value if hasattr(parsed.round_type, 'value') else str(parsed.round_type),
            areas_to_improve=parsed.areas_to_improve
        )
        await db.save_interview_question(q_obj)

    return {
        "status": "success",
        "round_id": round_obj.id,
        "round": round_obj.model_dump(),
        "parsed_context": parsed.model_dump()
    }

@router.post("/voice")
async def ingest_voice_recording(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    company_name: Optional[str] = Form(None),
    round_id: Optional[str] = Form(None)
):
    db = get_db()
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
    if ext not in ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio format '{ext}'. Allowed: {', '.join(sorted(ALLOWED_AUDIO_EXTENSIONS))}"
        )

    content = await file.read()
    if len(content) > MAX_AUDIO_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"Audio file exceeds maximum allowed size ({MAX_AUDIO_BYTES / (1024 * 1024):.0f}MB)"
        )

    audio_dir = os.path.join("data", "audio")
    os.makedirs(audio_dir, exist_ok=True)
    saved_filename = f"{uuid.uuid4()}{ext}"
    saved_path = os.path.join(audio_dir, saved_filename)

    with open(saved_path, "wb") as f:
        f.write(content)

    transcript = await transcribe_audio_file(saved_path)
    parsed = parse_unstructured_interview_note(transcript, source=RoundSource.VOICE_NOTE)
    assigned_company = company_name or parsed.company_name or "Company"
    target_round_id = round_id or str(uuid.uuid4())

    # Verify tenant ownership if round_id is specified
    if round_id:
        async with db.get_connection() as conn:
            async with conn.execute("SELECT user_id FROM interview_rounds WHERE id = ?", (round_id,)) as cursor:
                row = await cursor.fetchone()
                if row and row["user_id"] != user_id:
                    raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to modify this round")

    round_obj = InterviewRound(
        id=target_round_id,
        company_id=assigned_company,
        user_id=user_id,
        round_number=parsed.round_number,
        round_title=parsed.round_title,
        round_type=parsed.round_type,
        interviewer_info=[{"name": n} for n in parsed.interviewer_names],
        raw_input_source=RoundSource.VOICE_NOTE,
        raw_input_text=transcript,
        audio_url=f"/audio/{saved_filename}",
        summary=parsed.summary,
        candidate_feeling=parsed.candidate_feeling
    )
    await db.save_interview_round(round_obj)

    for q_text in parsed.questions_extracted:
        q_obj = InterviewQuestion(
            id=str(uuid.uuid4()),
            round_id=target_round_id,
            user_id=user_id,
            question_text=q_text,
            question_category=parsed.round_type.value if hasattr(parsed.round_type, 'value') else str(parsed.round_type),
            areas_to_improve=parsed.areas_to_improve
        )
        await db.save_interview_question(q_obj)

    return {
        "status": "success",
        "round_id": round_obj.id,
        "transcript": transcript,
        "round": round_obj.model_dump(),
        "parsed_context": parsed.model_dump()
    }
