import pytest
from unittest.mock import AsyncMock, patch
from backend.app.services.scraper_service import (
    extract_recruiter_email,
    normalize_remoteok_job,
    normalize_arbeitnow_job,
    parse_custom_job_text
)

def test_extract_recruiter_email():
    text = "Join our team! Send your CV and portfolio to careers@innovate.ai for fast tracking."
    email = extract_recruiter_email(text, company="innovate")
    assert email == "careers@innovate.ai"

def test_extract_recruiter_email_domain_heuristic():
    text = "We are hiring a Senior GenAI Engineer. Remote worldwide."
    email = extract_recruiter_email(text, company="TechCorp", company_domain="techcorp.com")
    assert email == "careers@techcorp.com"

def test_normalize_remoteok_job():
    raw = {
        "id": "12345",
        "position": "Senior AI Developer",
        "company": "DeepTech",
        "location": "Worldwide",
        "description": "Building RAG systems. Email talent@deeptech.io",
        "url": "https://remoteok.com/remote-jobs/12345",
        "tags": ["python", "ai"]
    }
    job = normalize_remoteok_job(raw)
    assert job.title == "Senior AI Developer"
    assert job.company == "DeepTech"
    assert job.recruiter_email == "talent@deeptech.io"

def test_parse_custom_job_text():
    raw = """
    Company: Anthropic Partner
    Title: Full Stack GenAI Engineer
    Location: Remote
    Description: We are developing multi-agent assistants using Python and React. Please apply by emailing jobs@partner.co
    """
    job = parse_custom_job_text(raw)
    assert job.company == "Anthropic Partner" or "Anthropic" in job.company
    assert "GenAI" in job.title or "Full Stack" in job.title
    assert job.recruiter_email == "jobs@partner.co"
