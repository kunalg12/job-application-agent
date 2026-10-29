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
    status: str = "DISCOVERED" # DISCOVERED, STAGED, EMAIL_SENT, FORM_APPLIED, INTERVIEW, REJECTED
    email_subject: Optional[str] = None
    email_body: Optional[str] = None
    cover_letter: Optional[str] = None
    cover_letter_pdf_path: Optional[str] = None
    matched_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    notes: Optional[str] = None
    applied_at: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

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
    skills: List[str] = Field(default_factory=list)
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
