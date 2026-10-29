import os
import re
import json
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from backend.app.models import RoundType, RoundSource
from backend.app.services.tailor_service import sanitize_untrusted_text

class ParsedInterviewContext(BaseModel):
    company_name: str = ""
    round_number: int = 1
    round_title: str = "Interview Round"
    round_type: RoundType = RoundType.TECH_CODING
    interviewer_names: List[str] = Field(default_factory=list)
    scheduled_at: Optional[str] = None
    duration_minutes: Optional[int] = 45
    meeting_link: Optional[str] = None
    key_topics: List[str] = Field(default_factory=list)
    questions_extracted: List[str] = Field(default_factory=list)
    candidate_feeling: Optional[str] = None
    areas_to_improve: Optional[str] = None
    summary: str = ""
    source: RoundSource = RoundSource.SCRATCHPAD

COMMON_TECH_TOPICS = [
    "rag", "fastapi", "distributed systems", "vector search", "llm", "kafka", "redis",
    "cassandra", "p99 latency", "microservices", "python", "typescript", "react",
    "docker", "kubernetes", "postgres", "sql", "graphql", "system design", "metrics ingestion"
]

def parse_unstructured_interview_note(raw_text: str, source: RoundSource = RoundSource.SCRATCHPAD) -> ParsedInterviewContext:
    """
    Parses unstructured recruiter emails, voice memo transcripts, or scratchpad notes into a structured
    ParsedInterviewContext with strict sanitization and injection defenses.
    """
    cleaned_text = sanitize_untrusted_text(raw_text or "", max_chars=12000)
    
    # 1. Extract Company Name
    company_name = ""
    company_patterns = [
        r'(?:position|engineer|developer|role)\s+at\s+([A-Z][a-zA-Z0-9_\-]+)',
        r'(?:at|with)\s+([A-Z][a-zA-Z0-9_\-]+)\s+Recruiting\s+Team',
        r'interview\s+at\s+([A-Z][a-zA-Z0-9_\-]+)',
        r'at\s+([A-Z][a-zA-Z0-9_\-]+)\s+with',
        r'(?:walked out of|finished|completed|had)\s+(?:round\s+\d+|interview|technical|screen)\s+.*?\s+at\s+([A-Z][a-zA-Z0-9_\-]+)',
        r'(?:invite you to.*?\bat\b)\s+([A-Z][a-zA-Z0-9_\-]+)',
        r'([A-Z][a-zA-Z0-9_\-]+)\s+Recruiting\s+Team',
    ]
    for pattern in company_patterns:
        match = re.search(pattern, cleaned_text, flags=re.IGNORECASE)
        if match:
            candidate = match.group(1).strip()
            # Exclude false positives like "The", "Our", "A", "Tuesday", etc.
            if candidate.lower() not in ["the", "our", "an", "a", "tuesday", "monday", "wednesday", "thursday", "friday", "saturday", "sunday"]:
                company_name = candidate
                break
    
    if not company_name:
        # Fallback keyword scan
        for token in ["Stripe", "Datadog", "Coinbase", "Google", "Meta", "Amazon", "Apple", "Microsoft", "Netflix", "Uber", "Airbnb"]:
            if re.search(r'\b' + re.escape(token) + r'\b', cleaned_text, flags=re.IGNORECASE):
                company_name = token
                break

    # 2. Extract Round Number & Title
    round_number = 1
    round_num_match = re.search(r'(?:round|rnd)\s*(\d+)', cleaned_text, flags=re.IGNORECASE)
    if round_num_match:
        try:
            round_number = int(round_num_match.group(1))
        except ValueError:
            round_number = 1
            
    round_title = f"Round {round_number}"
    title_match = re.search(r'(?:Round\s*\d+\s*:\s*|invited?\s+to\s+)([\w\s\-]+?(?:Screen|Interview|Technical|System Design|Culture|Debrief))', cleaned_text, flags=re.IGNORECASE)
    if title_match:
        round_title = title_match.group(1).strip()
    elif "technical screen" in cleaned_text.lower():
        round_title = "Technical Screen"
    elif "system design" in cleaned_text.lower():
        round_title = "System Design"
    elif "initial interview" in cleaned_text.lower():
        round_title = "Initial Interview"

    # 3. Classify Round Type
    lower_text = cleaned_text.lower()
    if "system design" in lower_text or "architecture" in lower_text:
        round_type = RoundType.SYSTEM_DESIGN
    elif "culture" in lower_text or "behavioral" in lower_text or "values" in lower_text:
        round_type = RoundType.BEHAVIORAL
    elif "executive" in lower_text or "vp" in lower_text or "founder" in lower_text:
        round_type = RoundType.EXECUTIVE
    elif "recruiter" in lower_text or "screen" in lower_text or "initial" in lower_text:
        round_type = RoundType.RECRUITER_SCREEN
    elif "coding" in lower_text or "technical" in lower_text or "algorithm" in lower_text or "dsa" in lower_text:
        round_type = RoundType.TECH_CODING
    else:
        round_type = RoundType.TECH_CODING

    # 4. Extract Interviewer Names
    interviewer_names: List[str] = []
    interviewer_patterns = [
        r'meeting with\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)',
        r'with\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:at|\(|who|Staff|Senior|Lead)',
        r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+asked me',
        r'with\s+([A-Z][a-z]+\s+[A-Z][a-z]+)',
    ]
    for pattern in interviewer_patterns:
        matches = re.finditer(pattern, cleaned_text)
        for m in matches:
            name = m.group(1).strip()
            if name.lower() not in ["google meet", "the team", "our team", "hiring manager", "tuesday", "round"]:
                if name not in interviewer_names:
                    interviewer_names.append(name)

    # 5. Extract Key Topics
    key_topics: List[str] = []
    for topic in COMMON_TECH_TOPICS:
        if re.search(r'\b' + re.escape(topic) + r'\b', lower_text):
            key_topics.append(topic)
    
    # Check for topics explicitly mentioned after "discuss" or "about"
    discuss_match = re.search(r'(?:discuss|cover|topics include)\s+([^.\n]+)', cleaned_text, flags=re.IGNORECASE)
    if discuss_match:
        items = re.split(r'[,;]|\band\b', discuss_match.group(1))
        for item in items:
            cleaned_item = item.strip()
            if len(cleaned_item) > 2 and cleaned_item not in key_topics:
                key_topics.append(cleaned_item)

    # 6. Extract Questions
    questions_extracted: List[str] = []
    # Match sentences where interviewer asked something or ending with ?
    sentences = re.split(r'(?<=[.?!])\s+', cleaned_text)
    for s in sentences:
        s_clean = s.strip()
        if not s_clean:
            continue
        if re.search(r'(?:asked me|wanted to know|question was|how to|can you explain)\b', s_clean, flags=re.IGNORECASE) or s_clean.endswith('?'):
            questions_extracted.append(s_clean)

    # 7. Candidate Sentiment / Feeling
    candidate_feeling = None
    if re.search(r'\bstrong yes\b', lower_text):
        candidate_feeling = "STRONG_YES"
    elif re.search(r'\b(?:crushed it|did great|super confident|felt amazing)\b', lower_text):
        candidate_feeling = "STRONG_YES"
    elif re.search(r'\b(?:did well|positive|went fine|good feeling)\b', lower_text):
        candidate_feeling = "YES"
    elif re.search(r'\b(?:hesitated|struggled|rough|unsure|tough)\b', lower_text):
        candidate_feeling = "UNSURE"

    # 8. Areas to Improve
    areas_to_improve = None
    improve_match = re.search(r'(?:hesitated when|struggled (?:with|when)|improve on|could have done better on)\s+([^.\n]+)', cleaned_text, flags=re.IGNORECASE)
    if improve_match:
        areas_to_improve = improve_match.group(0).strip()
    elif "p99" in lower_text or "latency" in lower_text:
        # Check context
        p99_sent = [s for s in sentences if "p99" in s.lower() or "latency" in s.lower()]
        if p99_sent:
            areas_to_improve = p99_sent[0].strip()

    # 9. Clean Summary
    first_paragraph = cleaned_text.split('\n\n')[0].strip()
    summary = cleaned_text[:300].strip()

    return ParsedInterviewContext(
        company_name=company_name or "Company",
        round_number=round_number,
        round_title=round_title,
        round_type=round_type,
        interviewer_names=interviewer_names,
        key_topics=key_topics,
        questions_extracted=questions_extracted,
        candidate_feeling=candidate_feeling,
        areas_to_improve=areas_to_improve,
        summary=summary,
        source=source
    )
