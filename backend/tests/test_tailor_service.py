import pytest
import os
import tempfile
from backend.app.models import UserProfile, Job, MatchAnalysis
from backend.app.services.tailor_service import (
    generate_cold_email,
    generate_cover_letter,
    build_cover_letter_pdf
)

def test_generate_cold_email_and_pdf():
    profile = UserProfile(
        name="Kunal Gursal",
        email="kunalgursal.dev@gmail.com",
        phone="+91-8308793636",
        linkedin="https://linkedin.com/in/kunal-gursal",
        skills=["Python", "FastAPI", "React", "GenAI"]
    )
    job = Job(
        id="j_99",
        title="GenAI Full Stack Engineer",
        company="Nexus AI",
        location="Remote",
        description="Looking for an engineer to build GenAI applications using React and FastAPI.",
        url="https://nexus.ai/jobs/99",
        source="jobicy"
    )
    analysis = MatchAnalysis(
        match_score=90,
        matched_skills=["Python", "FastAPI", "React"],
        missing_skills=[],
        recommendation="HIGH_MATCH",
        custom_angle="Highlight 3+ years experience with RAG pipelines and enterprise React apps."
    )
    
    email_draft = generate_cold_email(profile, job, analysis)
    assert "Nexus AI" in email_draft["subject"] or "GenAI" in email_draft["subject"]
    assert "Kunal Gursal" in email_draft["body"]
    assert "FastAPI" in email_draft["body"] or "React" in email_draft["body"]

    cover_letter = generate_cover_letter(profile, job, analysis)
    assert "Nexus AI" in cover_letter
    
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        pdf_path = build_cover_letter_pdf(cover_letter, profile, job, tmp.name)
        assert os.path.exists(pdf_path)
        assert os.path.getsize(pdf_path) > 1000
        os.remove(pdf_path)
