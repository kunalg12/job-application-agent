import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app

@pytest.mark.asyncio
async def test_complete_job_application_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Check profile is populated from Kunal's resume
        profile_res = await client.get("/api/profile")
        assert profile_res.status_code == 200
        assert "Kunal" in profile_res.json()["name"]
        
        # 2. Ingest a sample job
        job_payload = {
            "title": "AI Full Stack Developer",
            "company": "NextGen AI",
            "location": "Remote",
            "description": "Looking for Python, FastAPI, React, and GenAI experience. Send email to careers@nextgen.ai",
            "url": "https://nextgen.ai/careers/1",
            "source": "manual",
            "recruiter_email": "careers@nextgen.ai"
        }
        import_res = await client.post("/api/jobs/import", json=job_payload)
        assert import_res.status_code == 200
        job_id = import_res.json()["id"]
        
        # 3. Stage for review & trigger tailoring
        stage_res = await client.post(f"/api/applications/stage/{job_id}")
        assert stage_res.status_code == 200
        app_data = stage_res.json()
        assert app_data["match_score"] >= 80
        assert len(app_data["email_body"]) > 50
        assert "NextGen AI" in app_data["cover_letter"]
        
        # 4. Check applications list includes staged application
        apps_res = await client.get("/api/applications")
        assert apps_res.status_code == 200
        assert any(a["id"] == app_data["id"] for a in apps_res.json())
