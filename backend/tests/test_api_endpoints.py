import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app

@pytest.mark.asyncio
async def test_get_health_and_settings():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"
        
        settings_resp = await client.get("/api/settings")
        assert settings_resp.status_code == 200
        assert "autonomous_mode" in settings_resp.json()

        profile_resp = await client.get("/api/profile")
        assert profile_resp.status_code == 200
        assert "name" in profile_resp.json()

        metrics_resp = await client.get("/api/settings/metrics")
        assert metrics_resp.status_code == 200
        assert "total_jobs_discovered" in metrics_resp.json()

@pytest.mark.asyncio
async def test_jobs_and_staging_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Import custom job
        job_payload = {
            "title": "Senior AI Full Stack Engineer",
            "company": "DeepMind Partner",
            "location": "Remote",
            "description": "Building multi-agent systems with Python, FastAPI and React. Contact jobs@deepmindpartner.com",
            "url": "https://example.com/job-123",
            "recruiter_email": "jobs@deepmindpartner.com"
        }
        import_res = await client.post("/api/jobs/import", json=job_payload)
        assert import_res.status_code == 200
        job_data = import_res.json()
        assert job_data["company"] == "DeepMind Partner"
        job_id = job_data["id"]

        # List jobs
        jobs_res = await client.get("/api/jobs")
        assert jobs_res.status_code == 200
        assert len(jobs_res.json()) >= 1

        # Stage job
        stage_res = await client.post(f"/api/applications/stage/{job_id}")
        assert stage_res.status_code == 200
        staged_data = stage_res.json()
        assert staged_data["status"] == "STAGED"
        assert staged_data["match_score"] >= 70
        assert staged_data["recruiter_email"] == "jobs@deepmindpartner.com"
        assert len(staged_data["email_body"]) > 30
