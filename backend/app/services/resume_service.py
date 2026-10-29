import os
import re
from typing import Optional, List
from pypdf import PdfReader
from backend.app.models import UserProfile

KNOWN_SKILLS = [
    "Python", "JavaScript", "TypeScript", "React", "React.js", "Next.js", "Node.js", "Express.js",
    "FastAPI", "Django", "Flask", "PostgreSQL", "MongoDB", "MySQL", "Redis", "SQLite",
    "Docker", "Kubernetes", "AWS", "Azure", "GCP", "CI/CD", "Git", "GitHub", "Linux",
    "LLM", "GenAI", "RAG", "Prompt Engineering", "OpenAI", "Gemini", "LangChain", "LlamaIndex",
    "Vector Databases", "ChromaDB", "Pinecone", "GraphQL", "REST", "Microservices",
    "HTML5", "CSS3", "Tailwind", "Tailwind CSS", "Redux", "Jest", "Pytest", "Selenium", "Playwright"
]

def extract_text_from_pdf(pdf_path: str) -> str:
    if not pdf_path or not os.path.exists(pdf_path):
        return ""
    try:
        reader = PdfReader(pdf_path)
        text_parts = []
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text_parts.append(t)
        return "\n".join(text_parts).strip()
    except Exception:
        return ""

def parse_resume_profile(raw_text: str, file_path: Optional[str] = None) -> UserProfile:
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    
    # Extract name (default fallback Kunal Gursal if not found)
    name = "Kunal Gursal"
    if lines:
        first_line = lines[0]
        # If first line looks like a name (not an email or url)
        if len(first_line.split()) <= 4 and not "@" in first_line and not "http" in first_line:
            name = first_line.title()

    # Extract email
    email_match = re.search(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', raw_text)
    email = email_match.group(0) if email_match else "kunalgursal.dev@gmail.com"

    # Extract phone
    phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}', raw_text)
    phone = phone_match.group(0) if phone_match else "+91-8308793636"

    # Extract LinkedIn
    linkedin_match = re.search(r'linkedin\.com/in/[a-zA-Z0-9_-]+', raw_text)
    linkedin = f"https://{linkedin_match.group(0)}" if linkedin_match else "https://linkedin.com/in/kunal-gursal"

    # Extract GitHub
    github_match = re.search(r'github\.com/[a-zA-Z0-9_-]+', raw_text)
    github = f"https://{github_match.group(0)}" if github_match else "https://github.com/kunalgursal"

    # Extract Skills
    found_skills = set()
    raw_text_lower = raw_text.lower()
    for skill in KNOWN_SKILLS:
        # Match word boundaries
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, raw_text_lower):
            found_skills.add(skill)

    # Extract Summary
    summary = "AI Full Stack Developer experienced with building production web apps, microservices, and GenAI features."
    summary_match = re.search(r'(?:PROFESSIONAL SUMMARY|SUMMARY|ABOUT ME)\s*\n+(.*?)(?=\n+[A-Z\s]{4,}|\Z)', raw_text, re.DOTALL | re.IGNORECASE)
    if summary_match:
        extracted_summary = summary_match.group(1).strip()
        if len(extracted_summary) > 20:
            summary = " ".join(extracted_summary.split())

    return UserProfile(
        name=name,
        email=email,
        phone=phone,
        location="Pune, India (Open to Remote / Relocation)",
        title="AI Full Stack Developer | Full Stack & GenAI Engineer",
        summary=summary,
        linkedin=linkedin,
        github=github,
        skills=sorted(list(found_skills)),
        resume_file_path=file_path
    )
