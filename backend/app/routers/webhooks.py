import re
import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field, ConfigDict

from backend.app.config import settings
from backend.app.database import Database
from backend.app.models import InterviewRound, InterviewQuestion, RoundSource
from backend.app.services.interview_parser_service import parse_unstructured_interview_note
from backend.app.services.tailor_service import sanitize_untrusted_text

router = APIRouter(prefix="/api/webhooks", tags=["Webhooks"])

def get_db() -> Database:
    return Database(settings.db_path)

class InboundEmailWebhookPayload(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    to: str
    from_email: Optional[str] = Field(default=None, alias="from")
    subject: str = ""
    text: Optional[str] = None
    html: Optional[str] = None
    attachments: Optional[List[Dict[str, Any]]] = None

@router.post("/inbound-email")
async def handle_inbound_recruiter_email(payload: InboundEmailWebhookPayload):
    db = get_db()

    # 1. Extract tenant token from 'to' field (e.g. user-abc12345@inbound.domain.com)
    match = re.search(r'([a-zA-Z0-9_\-]+)@', payload.to)
    token = match.group(1) if match else payload.to.strip()

    user = await db.get_user_by_inbound_token(token)
    if not user:
        # Fallback: check if any part of the 'to' string matches a known user token
        async with db.get_connection() as conn:
            async with conn.execute("SELECT * FROM users") as cursor:
                rows = await cursor.fetchall()
                for row in rows:
                    if row["inbound_email_token"] in payload.to:
                        from backend.app.models import User
                        user = User(**dict(row))
                        break

    if not user:
        raise HTTPException(status_code=404, detail="User tenant not found for inbound token")

    # 2. Extract and sanitize email content
    body_content = payload.text or payload.html or ""
    full_email_text = f"Subject: {payload.subject}\n\n{body_content}"
    sanitized_text = sanitize_untrusted_text(full_email_text, max_chars=15000)

    # 3. Contextual Parsing
    parsed = parse_unstructured_interview_note(sanitized_text, source=RoundSource.EMAIL_FORWARD)
    company_name = parsed.company_name or "Company"

    # 4. Check for existing rounds for idempotency
    existing_rounds = await db.list_interview_rounds_for_company(user.id, company_name)
    matched_round: Optional[InterviewRound] = None

    for r in existing_rounds:
        if r.round_number == parsed.round_number or (r.round_title and parsed.round_title and r.round_title.lower() == parsed.round_title.lower()):
            matched_round = r
            break

    if matched_round:
        # Idempotent update
        matched_round.round_title = parsed.round_title or matched_round.round_title
        matched_round.round_type = parsed.round_type
        matched_round.interviewer_info = [{"name": n} for n in parsed.interviewer_names] if parsed.interviewer_names else matched_round.interviewer_info
        matched_round.meeting_link = parsed.meeting_link or matched_round.meeting_link
        matched_round.raw_input_text = sanitized_text
        matched_round.summary = parsed.summary or matched_round.summary
        await db.save_interview_round(matched_round)

        return {
            "status": "updated",
            "round_id": matched_round.id,
            "company": company_name,
            "round_number": matched_round.round_number
        }
    else:
        # Create new round
        new_round_id = str(uuid.uuid4())
        new_round = InterviewRound(
            id=new_round_id,
            company_id=company_name,
            user_id=user.id,
            round_number=parsed.round_number,
            round_title=parsed.round_title,
            round_type=parsed.round_type,
            meeting_link=parsed.meeting_link,
            interviewer_info=[{"name": n} for n in parsed.interviewer_names],
            raw_input_source=RoundSource.EMAIL_FORWARD,
            raw_input_text=sanitized_text,
            summary=parsed.summary
        )
        await db.save_interview_round(new_round)

        # Save extracted questions
        for q_text in parsed.questions_extracted:
            q_obj = InterviewQuestion(
                id=str(uuid.uuid4()),
                round_id=new_round_id,
                user_id=user.id,
                question_text=q_text,
                question_category=parsed.round_type.value if hasattr(parsed.round_type, 'value') else str(parsed.round_type),
                areas_to_improve=parsed.areas_to_improve
            )
            await db.save_interview_question(q_obj)

        return {
            "status": "processed",
            "round_id": new_round.id,
            "company": company_name,
            "round_number": new_round.round_number
        }
