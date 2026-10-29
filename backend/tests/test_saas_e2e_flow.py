import asyncio
import io
import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.database import Database
from backend.app.config import settings
from backend.app.models import User, RoundSource

@pytest.mark.asyncio
async def test_complete_saas_interview_notetaker_multi_tenant_flow():
    """
    Validates end-to-end multi-tenant lifecycle:
    1. Tenant A & Tenant B onboarding
    2. Recruiter email inbound webhook for Tenant A
    3. Tenant A voice debrief ingestion with AI structuring
    4. Tenant B concurrent voice memo for different company
    5. Strict multi-tenant isolation verification
    6. Round prep briefing generation and thank you email formulation
    """
    db = Database(settings.db_path)
    await db.init_db()

    # 1. Onboard two distinct tenant users
    user_a = User(
        id="tenant-alpha-001",
        email="alpha@jobhunter.dev",
        name="Alice Alpha",
        inbound_email_token="tok-alpha-777"
    )
    user_b = User(
        id="tenant-beta-002",
        email="beta@jobhunter.dev",
        name="Bob Beta",
        inbound_email_token="tok-beta-888"
    )
    await db.create_user(user_a)
    await db.create_user(user_b)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 2. Recruiter invites Tenant A to Round 1 at Stripe
        email_payload = {
            "to": "tok-alpha-777@inbound.jobhunter.ai",
            "from": "recruiting@stripe.com",
            "subject": "Interview Invitation: Stripe Technical Screen with Maya Lin",
            "text": """
            Hi Alice,
            We're excited to invite you to Round 1: Technical Screen with Maya Lin (Staff Engineer)
            on Thursday, Nov 12 at 10:00 AM PST.
            Meeting link: https://meet.google.com/str-ipe-scr
            We will discuss distributed payment pipelines, idempotency keys, and queue processing.
            Best,
            Stripe Recruiting Team
            """
        }
        res_email = await client.post("/api/webhooks/inbound-email", json=email_payload)
        assert res_email.status_code == 200
        email_data = res_email.json()
        assert email_data["status"] == "processed"
        round_a1_id = email_data["round_id"]

        # 3. Tenant A records a voice debrief after completing Round 1
        voice_mock_bytes = b"GUMBO_AUDIO_VOICE_MEMO_INTERVIEW_DEBRIEF_ALICE"
        files_a = {
            "file": ("alice_round1_debrief.webm", voice_mock_bytes, "audio/webm")
        }
        data_a = {
            "user_id": user_a.id,
            "company_name": "Stripe",
            "round_id": round_a1_id
        }
        res_voice_a = await client.post("/api/ingest/voice", files=files_a, data=data_a)
        assert res_voice_a.status_code == 200
        voice_a_json = res_voice_a.json()
        assert voice_a_json["status"] == "success"
        assert voice_a_json["round"]["id"] == round_a1_id
        assert voice_a_json["round"]["raw_input_source"] == "VOICE_NOTE"

        # 4. Tenant B concurrently uploads voice debrief for Datadog
        files_b = {
            "file": ("bob_debrief.webm", b"GUMBO_AUDIO_VOICE_MEMO_INTERVIEW_BOB", "audio/webm")
        }
        data_b = {
            "user_id": user_b.id,
            "company_name": "Datadog"
        }
        res_voice_b = await client.post("/api/ingest/voice", files=files_b, data=data_b)
        assert res_voice_b.status_code == 200
        round_b1_id = res_voice_b.json()["round_id"]

        # 5. Strict multi-tenant isolation checks
        # User A checks Stripe rounds -> sees their Stripe round
        rounds_a = await client.get("/api/companies/Stripe/rounds", params={"user_id": user_a.id})
        assert rounds_a.status_code == 200
        rounds_a_list = rounds_a.json()
        assert len(rounds_a_list) >= 1
        assert any(r["id"] == round_a1_id for r in rounds_a_list)

        # User B checks Stripe rounds -> gets 0 rounds (isolated!)
        rounds_b_stripe = await client.get("/api/companies/Stripe/rounds", params={"user_id": user_b.id})
        assert rounds_b_stripe.status_code == 200
        assert len(rounds_b_stripe.json()) == 0

        # User B attempts to access User A's round detail -> 404 Not Found!
        leak_attempt = await client.get(f"/api/rounds/{round_a1_id}", params={"user_id": user_b.id})
        assert leak_attempt.status_code == 404

        # User B attempts to hijack / overwrite User A's round -> 403 Forbidden!
        hijack_attempt = await client.post("/api/ingest/text", json={
            "raw_text": "Malicious takeover attempt",
            "user_id": user_b.id,
            "round_id": round_a1_id
        })
        assert hijack_attempt.status_code == 403

        # User A accesses their own round detail -> 200 with questions
        valid_detail = await client.get(f"/api/rounds/{round_a1_id}", params={"user_id": user_a.id})
        assert valid_detail.status_code == 200
        assert valid_detail.json()["round"]["id"] == round_a1_id

        # Verify static audio serving works via /audio route
        audio_url = voice_a_json["round"]["audio_url"]
        audio_serve_res = await client.get(audio_url)
        assert audio_serve_res.status_code == 200
        assert len(audio_serve_res.content) > 0

        # 6. Generate round prep briefing for Tenant A
        prep_res = await client.get(f"/api/rounds/{round_a1_id}/prep", params={"user_id": user_a.id})
        assert prep_res.status_code == 200
        prep_json = prep_res.json()
        assert "stripe" in prep_json["company_name"].lower()
        assert len(prep_json["predicted_questions"]) >= 2
        assert len(prep_json["key_topics_to_review"]) >= 1

        # 7. Generate thank you note for Tenant A
        thank_res = await client.post(f"/api/rounds/{round_a1_id}/thank-you", params={"user_id": user_a.id})
        assert thank_res.status_code == 200
        thank_json = thank_res.json()
        assert "Maya Lin" in thank_json["body"] or "Stripe" in thank_json["body"]
