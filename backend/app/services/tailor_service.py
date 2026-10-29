import os
import re
from xml.sax.saxutils import escape as xml_escape
from datetime import datetime
from typing import Dict, Any, Optional
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from backend.app.models import UserProfile, Job, MatchAnalysis

def sanitize_untrusted_text(text: str, max_chars: int = 15000) -> str:
    """Sanitizes untrusted text from external job boards to defend against injection and crashes."""
    if not text:
        return ""
    # Strip HTML comments (frequent vector for hidden prompt injection)
    cleaned = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)
    # Strip dangerous HTML/XML tags
    cleaned = re.sub(r'<(script|iframe|style|object|embed|system|prompt)[^>]*>.*?</\1>', '', cleaned, flags=re.IGNORECASE | re.DOTALL)
    cleaned = re.sub(r'<(script|iframe|style|object|embed|system|prompt)[^>]*>', '', cleaned, flags=re.IGNORECASE)
    # Remove null bytes and non-printable control characters
    cleaned = "".join(ch for ch in cleaned if ch == '\n' or ch == '\t' or ch >= ' ')
    return cleaned[:max_chars].strip()

def generate_cold_email(profile: UserProfile, job: Job, analysis: MatchAnalysis) -> Dict[str, str]:
    matched_skills_str = ", ".join(analysis.matched_skills[:4]) if analysis.matched_skills else "Full Stack & GenAI development"
    
    subject = f"Application: {job.title} – {profile.name} (Experienced Full Stack & GenAI Engineer)"
    
    body = f"""Hi {job.company} Hiring Team,

I noticed your opening for the {job.title} position and wanted to reach out directly. With 3+ years of experience building production full-stack web applications and GenAI systems (specializing in {matched_skills_str}), I am confident I can make an immediate impact on your team.

At Cognizant and in my recent projects, I have architected resilient web services using React, Next.js, Python/FastAPI, and orchestrated RAG and multi-agent workflows. {analysis.custom_angle or ''}

I have attached my resume and tailored cover letter for your review. I would welcome the opportunity to connect for 10-15 minutes to discuss how my skill set aligns with your current priorities at {job.company}.

Thank you for your time and consideration.

Best regards,
{profile.name}
{profile.phone} | {profile.email}
LinkedIn: {profile.linkedin}
GitHub: {profile.github or 'https://github.com/kunalgursal'}
"""
    return {
        "subject": subject,
        "body": body.strip()
    }

def generate_cover_letter(profile: UserProfile, job: Job, analysis: MatchAnalysis) -> str:
    skills_highlight = ", ".join(analysis.matched_skills[:5]) if analysis.matched_skills else "Python, FastAPI, React, Docker, and GenAI LLM systems"
    
    cover_letter = f"""Dear Hiring Manager at {job.company},

I am writing to express my strong enthusiasm for the {job.title} position at {job.company}. With a proven track record of 3+ years in AI full-stack development, modern frontend engineering, and building resilient backend microservices, I am excited about the opportunity to contribute to your engineering team.

In my current and previous experience, I have developed and deployed end-to-end full-stack applications utilizing modern web stacks including React, Next.js, TypeScript, Node.js, and Python/FastAPI. Furthermore, I have specialized in architecting Generative AI applications, designing production RAG pipelines, prompt engineering workflows, and integrating document intelligence services that solve concrete business challenges.

Your opening for {job.title} strongly resonates with my background in {skills_highlight}. {analysis.custom_angle or f"I am particularly drawn to {job.company}'s mission and technological vision."} Throughout my career, I have prided myself on writing clean, testable, and maintainable code, adopting Agile and Test-Driven Development methodologies, and collaborating across cross-functional engineering teams.

Thank you very much for your time and consideration of my application. I would welcome the chance to speak with you further regarding how my technical expertise can accelerate {job.company}'s initiatives.

Sincerely,

{profile.name}
{profile.email} | {profile.phone}
{profile.linkedin}
"""
    return cover_letter.strip()

def build_cover_letter_pdf(cover_letter_text: str, profile: UserProfile, job: Job, output_path: str) -> str:
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    name_style = ParagraphStyle(
        'CoverLetterName',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=4
    )
    
    contact_style = ParagraphStyle(
        'CoverLetterContact',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#64748B'),
        spaceAfter=12
    )

    body_style = ParagraphStyle(
        'CoverLetterBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=15,
        textColor=colors.HexColor('#334155'),
        spaceAfter=12
    )
    
    story = []
    
    # Header (XML escaped for ReportLab safe parsing)
    story.append(Paragraph(xml_escape(profile.name.upper()), name_style))
    contact_line = f"{xml_escape(profile.email)} &bull; {xml_escape(profile.phone)} &bull; {xml_escape(profile.location)}"
    story.append(Paragraph(contact_line, contact_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CBD5E1'), spaceAfter=16))
    
    # Date
    today_str = datetime.now().strftime("%B %d, %Y")
    story.append(Paragraph(today_str, contact_style))
    story.append(Spacer(1, 8))
    
    # Body paragraphs
    paragraphs = cover_letter_text.split("\n\n")
    for para in paragraphs:
        cleaned_para = para.strip().replace("\n", " ")
        if cleaned_para:
            safe_para = xml_escape(cleaned_para)
            story.append(Paragraph(safe_para, body_style))
            
    doc.build(story)
    return output_path
