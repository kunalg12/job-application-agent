import pytest
from backend.app.models import UserProfile, Job, MatchAnalysis
from backend.app.services.matcher_service import evaluate_job_match

def test_evaluate_job_match_heuristic_high_match():
    profile = UserProfile(
        name="Kunal Gursal",
        email="kunalgursal.dev@gmail.com",
        skills=["Python", "FastAPI", "React", "Next.js", "Docker", "LLM", "RAG"]
    )
    job = Job(
        id="test_1",
        title="AI Full Stack Developer",
        company="Cognitive Co",
        location="Remote",
        description="We need a Full Stack Engineer experienced with Python, FastAPI, React, and building LLM RAG pipelines.",
        url="https://example.com/job1",
        source="remoteok"
    )
    analysis = evaluate_job_match(profile, job)
    assert analysis.match_score >= 80
    assert "Python" in analysis.matched_skills
    assert "FastAPI" in analysis.matched_skills
    assert len(analysis.matched_skills) >= 3
    assert analysis.recommendation == "HIGH_MATCH"

def test_evaluate_job_match_low_match():
    profile = UserProfile(
        name="Kunal Gursal",
        skills=["Python", "FastAPI"]
    )
    job = Job(
        id="test_low",
        title="Senior Dental Hygienist",
        company="Smile Clinic",
        description="Must have DDS or dental hygienist license and clinical experience.",
        url="https://example.com/dental",
        source="manual"
    )
    analysis = evaluate_job_match(profile, job)
    assert analysis.match_score < 40
    assert analysis.recommendation == "LOW_MATCH"
