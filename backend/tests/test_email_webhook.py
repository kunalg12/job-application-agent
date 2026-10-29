import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.database import Database
from backend.app.config import settings
from backend.app.models import User

@pytest.mark.asyncio
async def test_inbound_recruiter_email_webhook():
    db = Database(settings.db_path)
    await db.init_db()
    # Ensure a tenant user exists with an inbound token
    test_user = User(
        id="user-webhook-tenant-1",
        email="kunal.webhook@example.com",
        name="Kunal G",
        inbound_email_token="user-wh-tok-99"
    )
    await db.create_user(test_user)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Simulate inbound email webhook payload (SendGrid / Postmark format)
        webhook_payload = {
            "to": "user-wh-tok-99@inbound.jobhunter.ai",
            "from": "recruiting@linear.app",
            "subject": "Interview with Linear: Round 2 Architecture Screen",
            "text": """
            Hi Kunal,
            We are looking forward to speaking with you on Friday, Nov 7 at 11:00 AM PST.
            You will meet with Karri Saarinen to discuss React state architecture and real-time syncing.
            Meeting link: https://meet.google.com/lin-ear-sync
            Best,
            Linear Recruiting Team
            """,
            "html": "<p>Hi Kunal, ...</p>"
        }

        res = await client.post("/api/webhooks/inbound-email", json=webhook_payload)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "processed"
        assert "round_id" in data
        assert data["company"].lower() == "linear"

        # Verify idempotency: posting the same email updates without duplicating
        res2 = await client.post("/api/webhooks/inbound-email", json=webhook_payload)
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2["round_id"] == data["round_id"]
        assert data2["status"] == "updated"

@pytest.mark.asyncio
async def test_inbound_email_unknown_token_rejected():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        webhook_payload = {
            "to": "non-existent-user@inbound.jobhunter.ai",
            "from": "recruiter@random.com",
            "subject": "Job",
            "text": "Hi"
        }
        res = await client.post("/api/webhooks/inbound-email", json=webhook_payload)
        assert res.status_code == 404
