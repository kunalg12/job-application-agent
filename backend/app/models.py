import uuid
from enum import Enum
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field

class Job(BaseModel):
    id: str
    title: str
    company: str
    location: Optional[str] = "Remote"
    description: str
    url: str
    source: str = "remoteok"
    recruiter_email: Optional[str] = None
    salary: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class MatchAnalysis(BaseModel):
    match_score: int = Field(ge=0, le=100)
    matched_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    recommendation: str = "POTENTIAL_MATCH" # HIGH_MATCH, POTENTIAL_MATCH, LOW_MATCH
    custom_angle: Optional[str] = None

class Application(BaseModel):
    id: str
    job_id: str
    job_title: str
    company: str
    match_score: int = 0
    recruiter_email: Optional[str] = None
    application_url: Optional[str] = None
    status: str = "DISCOVERED" # DISCOVERED, STAGED, UNROUTABLE, EMAIL_SENT, FORM_APPLIED, INTERVIEW, REJECTED, ARCHIVED
    email_subject: Optional[str] = None
    email_body: Optional[str] = None
    cover_letter: Optional[str] = None
    cover_letter_pdf_path: Optional[str] = None
    matched_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    notes: Optional[str] = None
    applied_at: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

DEFAULT_SKILLS = [
    "Python", "FastAPI", "React", "TypeScript", "JavaScript", "Docker",
    "PostgreSQL", "MongoDB", "Node.js", "Tailwind CSS", "Git", "REST",
    "GenAI", "LLM", "Prompt Engineering", "OpenAI", "LangChain"
]

class UserProfile(BaseModel):
    name: str = "Kunal Gursal"
    email: str = "kunalgursal.dev@gmail.com"
    phone: str = "+91-8308793636"
    location: str = "Pune, India (Open to Remote / Relocation)"
    title: str = "AI Full Stack Developer | Full Stack & GenAI Engineer"
    summary: str = "AI Full Stack Developer with 3+ years experience building production web apps, microservices, and GenAI features."
    linkedin: Optional[str] = "https://linkedin.com/in/kunal-gursal"
    github: Optional[str] = "https://github.com/kunalgursal"
    portfolio: Optional[str] = None
    skills: List[str] = Field(default_factory=lambda: list(DEFAULT_SKILLS))
    work_authorization: str = "Authorized to work in India / Remote globally / Open to Visa sponsorship"
    notice_period: str = "Immediate / 30 Days"
    salary_expectation: str = "$90,000 - $130,000 / ₹25L - ₹35L"
    resume_file_path: Optional[str] = None

class SMTPSettings(BaseModel):
    host: str = "smtp.gmail.com"
    port: int = 587
    username: str = ""
    password: str = ""
    from_name: str = "Kunal Gursal"
    use_tls: bool = True

class AppSettings(BaseModel):
    autonomous_mode: bool = False # False = Tier 1 (Staged 1-Click), True = Tier 2 (Full Auto-Pilot)
    auto_apply_threshold: int = 85 # Minimum score to auto-apply in autonomous mode
    daily_application_limit: int = 20
    target_titles: List[str] = Field(default_factory=lambda: [
        "AI Full Stack Developer", "GenAI Engineer", "Full Stack Developer", "Python Developer", "React Developer"
    ])
    preferred_locations: List[str] = Field(default_factory=lambda: ["Remote", "Worldwide", "India", "US Remote"])
    smtp: SMTPSettings = Field(default_factory=SMTPSettings)
    llm_provider: str = "heuristic" # "gemini", "openai", "heuristic"
    llm_api_key: Optional[str] = None

class AuditLog(BaseModel):
    id: Optional[int] = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    event_type: str # EMAIL_SENT, FORM_SUBMITTED, JOB_DISCOVERED, AUTO_APPLY_TRIGGERED
    details: str
    status: str # SUCCESS, FAILURE

# --- SaaS Multi-Tenant & Interview Notetaker Models ---

class RoundType(str, Enum):
    RECRUITER_SCREEN = "RECRUITER_SCREEN"
    TECH_CODING = "TECH_CODING"
    SYSTEM_DESIGN = "SYSTEM_DESIGN"
    BEHAVIORAL = "BEHAVIORAL"
    HIRING_MANAGER = "HIRING_MANAGER"
    EXECUTIVE = "EXECUTIVE"
    OFFER = "OFFER"

class RoundSource(str, Enum):
    VOICE_NOTE = "VOICE_NOTE"
    EMAIL_FORWARD = "EMAIL_FORWARD"
    SCRATCHPAD = "SCRATCHPAD"
    MANUAL = "MANUAL"

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    inbound_email_token: str = Field(default_factory=lambda: f"user-{uuid.uuid4().hex[:8]}")
    subscription_tier: str = "FREE" # FREE, PRO, ENTERPRISE
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class InterviewRound(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    user_id: str
    round_number: int = 1
    round_title: str
    round_type: RoundType = RoundType.RECRUITER_SCREEN
    scheduled_at: Optional[str] = None
    duration_minutes: int = 45
    interviewer_info: List[Any] = Field(default_factory=list)
    raw_input_source: RoundSource = RoundSource.SCRATCHPAD
    raw_input_text: Optional[str] = None
    audio_url: Optional[str] = None
    summary: Optional[str] = None
    candidate_feeling: Optional[str] = None # STRONG_YES, MODERATE, NEUTRAL, CONCERNED
    feedback_received: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class InterviewQuestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    round_id: str
    user_id: str
    question_text: str
    question_category: str = "GENERAL" # CODING_DSA, SYSTEM_DESIGN, EXPERIENCE, CULTURE_BEHAVIORAL
    candidate_answer_notes: Optional[str] = None
    areas_to_improve: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class RoundPrepBriefing(BaseModel):
    company_name: str
    round_title: str
    overview: str
    key_topics_to_review: List[str] = Field(default_factory=list)
    predicted_questions: List[str] = Field(default_factory=list)
    tips_based_on_history: List[str] = Field(default_factory=list)
