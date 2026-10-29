import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.database import Database
from backend.app.config import settings
from backend.app.models import User, InterviewRound, InterviewQuestion, RoundType, RoundSource

@pytest.mark.asyncio
async def test_prep_briefing_and_rounds_crud():
    db = Database(settings.db_path)
    await db.init_db()

    user_id = "user-prep-test-1"
    user = User(id=user_id, email="prep@test.com", name="Candidate K")
    await db.create_user(user)

    # Seed round 1 (Technical Screen) with questions and areas to improve
    round1 = InterviewRound(
        id="round-test-1",
        company_id="Stripe",
        user_id=user_id,
        round_number=1,
        round_title="Round 1: Technical Screen",
        round_type=RoundType.TECH_CODING,
        interviewer_info=[{"name": "Alice"}],
        summary="Covered Python algorithms and RAG architectures.",
        candidate_feeling="STRONG_YES"
    )
    await db.save_interview_round(round1)

    q1 = InterviewQuestion(
        id="q-test-1",
        round_id="round-test-1",
        user_id=user_id,
        question_text="How would you implement LRU cache with O(1) ops?",
        areas_to_improve="Could explain doubly linked list pointer updates faster"
    )
    await db.save_interview_question(q1)

    # Seed round 2 (System Design)
    round2 = InterviewRound(
        id="round-test-2",
        company_id="Stripe",
        user_id=user_id,
        round_number=2,
        round_title="Round 2: Distributed Systems Design",
        round_type=RoundType.SYSTEM_DESIGN,
        interviewer_info=[{"name": "Bob Chen"}],
        summary="Upcoming system design round on ledger scaling."
    )
    await db.save_interview_round(round2)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. List rounds for company
        res_list = await client.get("/api/companies/Stripe/rounds", params={"user_id": user_id})
        assert res_list.status_code == 200
        rounds_data = res_list.json()
        assert len(rounds_data) == 2
        assert rounds_data[0]["round_number"] == 1
        assert rounds_data[1]["round_number"] == 2

        # 2. Generate prep briefing for round 2
        prep_res = await client.get("/api/rounds/round-test-2/prep", params={"user_id": user_id})
        assert prep_res.status_code == 200
        prep_data = prep_res.json()
        assert "predicted_questions" in prep_data
        assert len(prep_data["predicted_questions"]) >= 2
        assert len(prep_data["key_topics_to_review"]) >= 1
        # Should incorporate previous round feedback or round type context
        assert "stripe" in prep_data["company_name"].lower()

        # 3. Generate thank you note for round 1
        thank_res = await client.post("/api/rounds/round-test-1/thank-you", params={"user_id": user_id})
        assert thank_res.status_code == 200
        thank_data = thank_res.json()
        assert "Alice" in thank_data["body"] or "Stripe" in thank_data["body"]
        assert "subject" in thank_data
