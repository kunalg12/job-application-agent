import io
import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app

@pytest.mark.asyncio
async def test_ingest_text_scratchpad():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "raw_text": "Had an initial recruiter screen at Figma with Jessica Taylor. We discussed role scope and comp expectations.",
            "user_id": "user-test-uuid-1",
            "company_name": "Figma"
        }
        res = await client.post("/api/ingest/text", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "success"
        assert "round" in data
        assert data["round"]["company_id"] == "Figma" or "Figma" in data["round"]["company_id"]
        assert "round_id" in data
        assert "parsed_context" in data
        assert "jessica" in [name.lower() for name in data["parsed_context"]["interviewer_names"]] or "jessica taylor" in [name.lower() for name in data["parsed_context"]["interviewer_names"]]

@pytest.mark.asyncio
async def test_ingest_voice_audio_upload():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Mock audio file (WebM format)
        mock_audio_content = b"GUMBO_AUDIO_HEADER_TEST_BYTES_VOICE_MEMO"
        files = {
            "file": ("interview_debrief.webm", mock_audio_content, "audio/webm")
        }
        data = {
            "user_id": "user-test-uuid-1",
            "company_name": "Uber"
        }
        res = await client.post("/api/ingest/voice", files=files, data=data)
        assert res.status_code == 200
        result = res.json()
        assert result["status"] == "success"
        assert "transcript" in result
        assert "parsed_context" in result
        assert "round_id" in result
        assert result["round"]["raw_input_source"] == "VOICE_NOTE"

@pytest.mark.asyncio
async def test_ingest_voice_invalid_extension_rejected():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        files = {
            "file": ("malicious_payload.exe", b"MZ...", "application/octet-stream")
        }
        res = await client.post("/api/ingest/voice", files=files, data={"user_id": "u1"})
        assert res.status_code in [400, 422]

@pytest.mark.asyncio
async def test_ingest_voice_oversized_file_rejected():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Mock file slightly over 25MB
        huge_content = b"0" * (25 * 1024 * 1024 + 1024)
        files = {
            "file": ("huge_recording.webm", huge_content, "audio/webm")
        }
        res = await client.post("/api/ingest/voice", files=files, data={"user_id": "u1"})
        assert res.status_code == 400
        assert "exceeds maximum allowed size" in res.json()["detail"]
