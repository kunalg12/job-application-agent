import pytest
import os
from backend.app.services.resume_service import extract_text_from_pdf, parse_resume_profile

SAMPLE_RESUME_TEXT = """
KUNAL GURSAL
AI FULL STACK DEVELOPER | FULL STACK & GENAI ENGINEER
Pune, India | +91-8308793636 | kunalgursal.dev@gmail.com | linkedin.com/in/kunal-gursal

PROFESSIONAL SUMMARY
AI Full Stack Developer with 3+ years of experience building web applications and GenAI features.
React.js, Next.js, TypeScript, Node.js, Python, FastAPI, Docker.

TECHNICAL SKILLS
Languages: Python, TypeScript, JavaScript
Frameworks: React, Next.js, FastAPI
AI: LLM, RAG, Prompt Engineering
"""

def test_parse_resume_profile():
    profile = parse_resume_profile(SAMPLE_RESUME_TEXT)
    assert profile.name == "Kunal Gursal"
    assert profile.email == "kunalgursal.dev@gmail.com"
    assert "Python" in profile.skills
    assert "FastAPI" in profile.skills
    assert "React" in profile.skills or "React.js" in profile.skills
    assert profile.phone == "+91-8308793636"

def test_extract_text_from_pdf_fallback_on_missing():
    text = extract_text_from_pdf("/nonexistent/path/fake.pdf")
    assert text == ""
