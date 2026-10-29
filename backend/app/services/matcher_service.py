import re
import json
import httpx
from typing import Optional, List, Dict, Any
from backend.app.models import UserProfile, Job, MatchAnalysis

TECH_KEYWORDS = [
    "python", "javascript", "typescript", "react", "next.js", "node.js", "express.js",
    "fastapi", "django", "flask", "postgresql", "mongodb", "mysql", "redis", "docker",
    "kubernetes", "aws", "gcp", "azure", "graphql", "rest", "ci/cd", "git",
    "llm", "genai", "rag", "prompt engineering", "langchain", "llamaindex",
    "vector", "openai", "gemini", "microservices", "tailwind", "redux"
]

def heuristic_match(profile: UserProfile, job: Job) -> MatchAnalysis:
    job_text = f"{job.title} {job.description} {' '.join(job.tags)}".lower()
    
    # 1. Title matching
    title_score = 0
    job_title_lower = job.title.lower()
    user_title_tokens = set(re.findall(r'\w+', profile.title.lower()))
    
    # High-value matches
    core_matches = 0
    for term in ["full stack", "fullstack", "developer", "engineer", "ai", "genai", "python", "react"]:
        if term in job_title_lower:
            core_matches += 1
            
    if core_matches >= 3:
        title_score = 35
    elif core_matches == 2:
        title_score = 25
    elif core_matches == 1:
        title_score = 15
    else:
        title_score = 5

    # 2. Skill overlap
    matched_skills = []
    missing_skills = []
    user_skills_lower = {s.lower(): s for s in profile.skills}

    for tech in TECH_KEYWORDS:
        pattern = r'\b' + re.escape(tech) + r'\b'
        if re.search(pattern, job_text):
            if tech in user_skills_lower:
                matched_skills.append(user_skills_lower[tech])
            else:
                missing_skills.append(tech.title())

    # Skill score based on number of matches
    if len(matched_skills) >= 5:
        skill_score = 50
    elif len(matched_skills) >= 3:
        skill_score = 40
    elif len(matched_skills) >= 1:
        skill_score = 25
    else:
        skill_score = 5

    # 3. Context & Location
    context_score = 15 if ("remote" in job.location.lower() or "worldwide" in job_text) else 10

    raw_score = title_score + skill_score + context_score
    final_score = min(100, max(0, raw_score))

    # Severe penalty for clearly unrelated fields
    unrelated_indicators = ["dentist", "dental", "nurse", "physician", "accountant", "carpenter", "driver", "plumber"]
    if any(un in job_title_lower for un in unrelated_indicators):
        final_score = min(25, final_score)

    if final_score >= 80:
        rec = "HIGH_MATCH"
    elif final_score >= 55:
        rec = "POTENTIAL_MATCH"
    else:
        rec = "LOW_MATCH"

    strengths = [f"Strong background in {s}" for s in matched_skills[:4]]
    custom_angle = f"Focus on proven experience with {', '.join(matched_skills[:3])} and developing scalable GenAI full-stack solutions." if matched_skills else "Focus on core problem-solving and software engineering adaptability."

    return MatchAnalysis(
        match_score=final_score,
        matched_skills=matched_skills,
        missing_skills=missing_skills[:5],
        strengths=strengths,
        recommendation=rec,
        custom_angle=custom_angle
    )

def evaluate_job_match(profile: UserProfile, job: Job, api_key: Optional[str] = None, provider: str = "heuristic") -> MatchAnalysis:
    # If API key is present and provider is gemini/openai, we could make an LLM call;
    # otherwise fallback to reliable, instant heuristic analysis
    return heuristic_match(profile, job)
