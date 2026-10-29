import pytest
from backend.app.database import Database
from backend.app.models import User, InterviewRound, InterviewQuestion, RoundType, RoundSource

@pytest.mark.asyncio
async def test_saas_multi_tenant_database(tmp_path):
    db_path = str(tmp_path / "saas_test.db")
    db = Database(db_path)
    await db.init_db()

    # 1. Create Users
    user1 = User(
        id="user-1",
        email="kunal@example.com",
        name="Kunal Gursal",
        inbound_email_token="kunal-x89f",
        subscription_tier="PRO"
    )
    user2 = User(
        id="user-2",
        email="other@example.com",
        name="Other Candidate",
        inbound_email_token="other-y12a",
        subscription_tier="FREE"
    )
    await db.create_user(user1)
    await db.create_user(user2)

    fetched_user1 = await db.get_user_by_email("kunal@example.com")
    assert fetched_user1 is not None
    assert fetched_user1.name == "Kunal Gursal"
    assert fetched_user1.inbound_email_token == "kunal-x89f"

    fetched_by_token = await db.get_user_by_inbound_token("kunal-x89f")
    assert fetched_by_token is not None
    assert fetched_by_token.id == "user-1"

    # 2. Create Interview Round for User 1
    round1 = InterviewRound(
        id="round-1",
        company_id="comp-stripe",
        user_id=user1.id,
        round_number=1,
        round_title="Recruiter Initial Screen",
        round_type=RoundType.RECRUITER_SCREEN,
        scheduled_at="2026-11-01T15:00:00Z",
        duration_minutes=30,
        interviewer_info=[{"name": "Sarah Miller", "role": "Senior Tech Recruiter"}],
        raw_input_source=RoundSource.VOICE_NOTE,
        raw_input_text="Sarah asked about my experience with FastAPI and multi-agent systems.",
        summary="Positive conversation about full-stack role at Stripe.",
        candidate_feeling="STRONG_YES",
        feedback_received="Moving forward to Technical Coding screen next Tuesday."
    )
    await db.save_interview_round(round1)

    # 3. Create Interview Round for User 2 (Isolation Check)
    round2 = InterviewRound(
        id="round-2",
        company_id="comp-uber",
        user_id=user2.id,
        round_number=1,
        round_title="Uber Screen",
        round_type=RoundType.RECRUITER_SCREEN,
        duration_minutes=30,
        raw_input_source=RoundSource.SCRATCHPAD
    )
    await db.save_interview_round(round2)

    # 4. Multi-Tenant Query Isolation
    user1_rounds = await db.list_interview_rounds_for_user(user1.id)
    assert len(user1_rounds) == 1
    assert user1_rounds[0].id == "round-1"
    assert user1_rounds[0].round_title == "Recruiter Initial Screen"

    company_rounds = await db.list_interview_rounds_for_company(user1.id, "comp-stripe")
    assert len(company_rounds) == 1
    assert company_rounds[0].candidate_feeling == "STRONG_YES"

    # 5. Add Questions
    q1 = InterviewQuestion(
        id="q-1",
        round_id="round-1",
        user_id=user1.id,
        question_text="How do you handle Redis distributed locks and token buckets?",
        question_category="SYSTEM_DESIGN",
        candidate_answer_notes="Explained Redlock algorithm and lease timeouts.",
        areas_to_improve="Mention jitter on reconnection."
    )
    await db.save_interview_question(q1)

    questions = await db.list_questions_for_round(user1.id, "round-1")
    assert len(questions) == 1
    assert questions[0].question_text.startswith("How do you handle")
