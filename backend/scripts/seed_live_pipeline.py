import asyncio
import os
import uuid
from datetime import datetime, timezone

from backend.app.config import settings
from backend.app.database import Database
from backend.app.models import (
    User, Job, Application, InterviewRound, InterviewQuestion,
    RoundType, RoundSource, UserProfile
)

async def seed_data():
    db = Database(settings.db_path)
    await db.init_db()

    # 1. Ensure Kunal's primary SaaS tenant user exists
    user = User(
        id="default-user",
        email="kunalgursal2923@gmail.com",
        name="Kunal Gursal",
        inbound_email_token="kunal-gursal-inbound",
        subscription_tier="PRO",
        created_at=datetime.now(timezone.utc).isoformat()
    )
    await db.create_user(user)
    print("Seeded user tenant: Kunal Gursal (default-user)")

    # 2. Update Profile to match Kunal's exact credentials
    profile = UserProfile(
        name="Kunal Gursal",
        email="kunalgursal2923@gmail.com",
        phone="+91-8308793636",
        location="Pune, Maharashtra, India",
        title="AI Full Stack Engineer & GenAI Systems Developer",
        summary="Experienced Full Stack & GenAI Engineer with 3+ years architecting production web services with React, Next.js, Python/FastAPI, TypeScript, and orchestrating multi-agent systems, RAG pipelines, and vector databases.",
        linkedin="https://linkedin.com/in/kunalgursal",
        github="https://github.com/kunalg12",
        skills=[
            "Python", "FastAPI", "React", "Next.js", "TypeScript", "Node.js",
            "GenAI", "LLMs", "RAG", "Agentic AI", "Docker", "AWS", "PostgreSQL",
            "Redis", "Kafka", "Vector Databases", "Prompt Engineering"
        ],
        work_authorization="Citizen of India",
        notice_period="Immediate / 15 Days",
        salary_expectation="Market Rate / Negotiable",
        resume_file_path=settings.default_resume_path
    )
    await db.save_profile(profile)
    print("Updated candidate profile for Kunal Gursal")

    # 3. Live Pipeline Data
    applications_data = [
        # --- ACTIVE INTERVIEWS ---
        {
            "company": "Coders Brain Technology Pvt. Ltd.",
            "title": "AI Full Stack Developer (Pune)",
            "status": "INTERVIEW",
            "score": 92,
            "recruiter_email": "madhuri@codersbrain.com",
            "notes": "In Review / Screening — Updated CV (Kunal_Gursal_Resume.pdf) sent; awaiting virtual Round 1 slot (2–3 rounds total). Contact: Madhuri Sabbavarapu (+91 8121117377).",
            "round": {
                "title": "Round 1: Screening & Technical Alignment",
                "type": RoundType.RECRUITER_SCREEN,
                "interviewer": [{"name": "Madhuri Sabbavarapu", "role": "Recruiting Lead (+91 8121117377)"}],
                "summary": "Updated CV shared. Evaluated alignment with AI full-stack development scope (FastAPI, React, GenAI LLM agents). Awaiting virtual Round 1 technical slot.",
                "feeling": "STRONG_YES",
                "questions": [
                    ("Can you walk through your experience building production GenAI full-stack applications with FastAPI and React?", "EXPERIENCE", "Highlight Cognizant and autonomous agent project metrics"),
                    ("What is your comfort level with Python backend microservices and asynchronous task pipelines?", "TECH_CODING", "Emphasize Celery, Redis queues, and async/await FastAPI architecture"),
                    ("What are your current notice period and compensation expectations for the Pune location?", "CULTURE_BEHAVIORAL", "Reiterate immediate/15-day availability")
                ]
            }
        },
        {
            "company": "LTM (LTIMindtree)",
            "title": "Java Full Stack Developer – L1",
            "status": "INTERVIEW",
            "score": 88,
            "recruiter_email": "neethu.shathriyag@ltm.com",
            "notes": "Interviewing (AI Assessment) — Berribot Mastermind AI interview & coding assessment window. Contact: Neethu Shathriya.",
            "round": {
                "title": "Round 1: Berribot Mastermind AI Assessment",
                "type": RoundType.TECH_CODING,
                "interviewer": [{"name": "Neethu Shathriya", "role": "LTM Talent Acquisition"}, {"name": "Berribot AI", "role": "Automated Evaluator"}],
                "summary": "Berribot Mastermind AI coding & technical evaluation window. Covers data structures, algorithms, Java/Node.js microservices, and system architecture.",
                "feeling": "YES",
                "questions": [
                    ("Implement an efficient multi-threaded task runner or asynchronous event-driven worker.", "TECH_CODING", "Brush up on thread-safety and queue buffering"),
                    ("Explain RESTful API architecture best practices, idempotency keys, and middleware patterns.", "SYSTEM_DESIGN", "Mention status code conventions and token validation"),
                    ("How would you diagnose and optimize database read/write latency in high-traffic enterprise applications?", "SYSTEM_DESIGN", "Cover index optimization, connection pooling, and Redis caching")
                ]
            }
        },
        {
            "company": "Adam Infotech / Source One (Client: HCL)",
            "title": "Full Stack Developer (ReactJS, NodeJS & AWS, Pune)",
            "status": "INTERVIEW",
            "score": 90,
            "recruiter_email": "haseena.m@adaminfotech.com",
            "notes": "Recruiter Screening — JD shared after phone discussion; awaiting email acknowledgment. Contact: Haseena M (+91 9949741522).",
            "round": {
                "title": "Round 1: Technical Screening & AWS Fit",
                "type": RoundType.RECRUITER_SCREEN,
                "interviewer": [{"name": "Haseena M", "role": "Technical Recruiter (+91 9949741522)"}],
                "summary": "JD shared for HCL client project. Full stack requirements include ReactJS, NodeJS, AWS deployment (S3, CloudFront, Lambda), and REST API integrations.",
                "feeling": "YES",
                "questions": [
                    ("Explain your hands-on experience deploying full stack applications on AWS (S3, CloudFront, EC2/Lambda).", "SYSTEM_DESIGN", "Describe CI/CD GitHub Actions pipelines to AWS S3/CloudFront"),
                    ("How do you manage complex application state and side-effects in modern React applications?", "TECH_CODING", "Mention React Context, Zustand/Redux, and optimistic updates")
                ]
            }
        },
        {
            "company": "i2e Consulting",
            "title": "AI Full Stack Engineer (Pune)",
            "status": "INTERVIEW",
            "score": 94,
            "recruiter_email": "anushka.panchabhai@i2econsulting.com",
            "notes": "Shortlisted (Hireathon) — Invited to 1-day coding assignment & panel interview at 91Springboard Baner. Contact: Anushka Panchabhai (+91 7977753437).",
            "round": {
                "title": "Round 1: AI Hireathon & In-Person Technical Panel",
                "type": RoundType.TECH_CODING,
                "interviewer": [{"name": "Anushka Panchabhai", "role": "HR Lead (+91 7977753437)"}, {"name": "Senior Engineering Panel", "role": "i2e Consulting"}],
                "summary": "Shortlisted for 1-day AI Full Stack Engineer Hireathon at 91Springboard Baner. Hands-on coding assignment in Python/FastAPI/React, followed by panel defense.",
                "feeling": "STRONG_YES",
                "questions": [
                    ("Build an agentic pipeline connecting an LLM with external APIs and strictly validated structured JSON output.", "TECH_CODING", "Review Pydantic v2 schemas and function calling tool definitions"),
                    ("Defend your database schema choices for handling concurrent user chat sessions and high-throughput vector search.", "SYSTEM_DESIGN", "Articulate SQLite WAL / Postgres pgvector indexing trade-offs")
                ]
            }
        },
        {
            "company": "Smart Analytica Pvt. Ltd.",
            "title": "AI/ML Engineer (Python, LLM & Agentic AI, Mumbai)",
            "status": "INTERVIEW",
            "score": 95,
            "recruiter_email": "Rohit.Deshmukh@smart-analytica.com",
            "notes": "Interview Slot Booking — Invited to submit Level 1 online interview availability via Google Form or email reply. Contact: Rohit Deshmukh.",
            "round": {
                "title": "Round 1: Level 1 Technical Deep Dive (Agentic AI & LLMs)",
                "type": RoundType.TECH_CODING,
                "interviewer": [{"name": "Rohit Deshmukh", "role": "Engineering Lead"}],
                "summary": "Invited to schedule Level 1 online interview. Focus areas: Python, LLM orchestration, agentic architectures, RAG pipelines, and vector database embeddings.",
                "feeling": "STRONG_YES",
                "questions": [
                    ("How do you handle context window management and retrieval chunking in production RAG systems?", "SYSTEM_DESIGN", "Explain semantic chunking, reranking with Cross-Encoders, and hybrid search"),
                    ("Explain agentic loop design patterns (ReAct, Plan-and-Solve) and error recovery mechanisms.", "TECH_CODING", "Walk through autonomous tool execution with fallback retries")
                ]
            }
        },
        {
            "company": "Larsen & Toubro",
            "title": "Engineering Interview Invite (Pune)",
            "status": "ACTION_REQUIRED",
            "score": 80,
            "recruiter_email": "bhumikaravat14@messages.naukri.com",
            "notes": "⚠️ Verify Authenticity — Links point to external .info domain (larsentoubro.com.interview-qa-011.info) and WhatsApp number. Flagged as suspicious; exercise caution.",
            "round": None
        },

        # --- RECENT APPLICATIONS, OFFERS & DECISIONS ---
        {
            "company": "RippleHire",
            "title": "AI Intern – Marketing",
            "status": "FORM_APPLIED",
            "score": 85,
            "recruiter_email": "saritha.fernandes@ripplehire.com",
            "notes": "Offer Accepted — Formal offer received Jul 2 and signed offer letter submitted Jul 3, 2026. Onboarding docs submitted.",
            "round": None
        },
        {
            "company": "TeamViewer Germany GmbH",
            "title": "Software Engineering (European Talent Pool)",
            "status": "FORM_APPLIED",
            "score": 86,
            "recruiter_email": "no-reply@teamviewer.teamtailor-mail.com",
            "notes": "Applied (Talent Pool) — Profile retained in active talent pool for upcoming openings.",
            "round": None
        },
        {
            "company": "Synechron",
            "title": "Full Stack Developer (Node.js, React.js, TS & AI)",
            "status": "FORM_APPLIED",
            "score": 91,
            "recruiter_email": "job@monsterindia.com",
            "notes": "Applied via foundit — Application confirmed.",
            "round": None
        },
        {
            "company": "HCLTech",
            "title": "Senior Full Stack Java Developer – React.js (Req 163155)",
            "status": "REJECTED",
            "score": 89,
            "recruiter_email": "HCL_IB_Interview@hcltech.com",
            "notes": "Attended Teams Technical Discussion on Oct 16; not selected on Oct 22.",
            "round": {
                "title": "Round 1: Teams Technical Discussion",
                "type": RoundType.TECH_CODING,
                "interviewer": [{"name": "HCL Technical Panel", "role": "HCLTech India"}],
                "summary": "Technical Discussion covering Java microservices, React.js hooks, and distributed system concepts. Completed Oct 16.",
                "feeling": "MODERATE",
                "questions": [
                    ("How do you handle cross-origin resource sharing (CORS) and JWT token validation across microservices?", "TECH_CODING", "Reviewed HTTP headers and bearer auth mechanisms")
                ]
            }
        },
        {
            "company": "EPAM India",
            "title": "Senior Software Engineer – Java with Cloud (AWS)",
            "status": "REJECTED",
            "score": 87,
            "recruiter_email": "wfacareerindia@epam.com",
            "notes": "Not selected on Oct 11; cooldown period active until Feb 8, 2027.",
            "round": None
        },
        {
            "company": "NCR Atleos",
            "title": "Software Engineer II – .Net Fullstack (R1154753)",
            "status": "REJECTED",
            "score": 82,
            "recruiter_email": "ncratleos@myworkday.com",
            "notes": "Applied via Workday portal Oct 2; not moving forward as of Oct 12.",
            "round": None
        },
        {
            "company": "G-P (Globalization Partners)",
            "title": "Fullstack AI Engineer",
            "status": "REJECTED",
            "score": 93,
            "recruiter_email": "no-reply@g-p.com",
            "notes": "Not moving forward after initial application review.",
            "round": None
        },

        # --- DIRECT EMAIL APPLICATIONS ---
        {
            "company": "AlignSoul",
            "title": "React Developer",
            "status": "EMAIL_SENT",
            "score": 90,
            "recruiter_email": "hr@alignsoul.com",
            "notes": "Direct Email Application — Resume and cover letter sent directly to hiring team.",
            "round": None
        },
        {
            "company": "Protectt.ai",
            "title": "Software Engineer",
            "status": "EMAIL_SENT",
            "score": 88,
            "recruiter_email": "careers@protectt.ai",
            "notes": "Direct Email Application — Resume submitted.",
            "round": None
        },
        {
            "company": "Asmadiya Technologies",
            "title": "React Native Developer",
            "status": "EMAIL_SENT",
            "score": 86,
            "recruiter_email": "hr@asmadiya.com",
            "notes": "Direct Email Application — Portfolio and resume submitted.",
            "round": None
        },

        # --- PIPELINE & DISCOVERY TRACKER ---
        {
            "company": "Kaara Info Systems",
            "title": "Full Stack AI Developer",
            "status": "STAGED",
            "score": 91,
            "recruiter_email": "recruiter@kaarainfosys.com",
            "notes": "Direct recruiter invitation on foundit (Oct 28–29). Ready for tailored outreach.",
            "round": None
        },
        {
            "company": "Infosys",
            "title": "Full Stack Specialist Programmer",
            "status": "STAGED",
            "score": 89,
            "recruiter_email": "careers@infosys.com",
            "notes": "From Google Drive pipeline tracker. High-fit target.",
            "round": None
        },
        {
            "company": "Lentra.ai",
            "title": "Software Engineer (Fintech & AI Platforms)",
            "status": "STAGED",
            "score": 93,
            "recruiter_email": "talent@lentra.ai",
            "notes": "From Google Drive pipeline tracker. Fast-growing AI fintech startup in Pune.",
            "round": None
        },
        {
            "company": "UsefulBI",
            "title": "Full Stack & Generative AI Engineer",
            "status": "STAGED",
            "score": 94,
            "recruiter_email": "careers@usefulbi.com",
            "notes": "From Google Drive pipeline tracker. GenAI and BI solutions.",
            "round": None
        },
        {
            "company": "CoverSure",
            "title": "Senior AI Developer",
            "status": "STAGED",
            "score": 92,
            "recruiter_email": "hiring@coversure.in",
            "notes": "From Google Drive pipeline tracker. InsurTech AI stack.",
            "round": None
        },
        {
            "company": "Accenture",
            "title": "Application Development Associate",
            "status": "FORM_APPLIED",
            "score": 87,
            "recruiter_email": "accenture.recruitment@accenture.com",
            "notes": "Accenture candidate portal application verified Sep 23, 2026.",
            "round": None
        },
        {
            "company": "Naukri Batch Applications (Capgemini, Persistent, PwC, Airtel)",
            "title": "Batch Applied: SDE 2 & Full Stack Developer Roles (71 Total)",
            "status": "FORM_APPLIED",
            "score": 85,
            "recruiter_email": "info@naukri.com",
            "notes": "Batch applications tracked: 16 on Oct 2, 51 on Oct 1, 4 in Sep across top tech enterprises in Pune.",
            "round": None
        }
    ]

    for item in applications_data:
        job_id = f"job-{uuid.uuid4().hex[:10]}"
        app_id = f"app-{uuid.uuid4().hex[:10]}"

        # Insert Job
        job = Job(
            id=job_id,
            title=item["title"],
            company=item["company"],
            location="Pune / Remote",
            description=f"Opportunity for {item['title']} at {item['company']}. {item['notes']}",
            url=f"https://pipeline.kunalgursal.dev/{uuid.uuid4().hex[:8]}/{item['company'].lower().replace(' ', '-')}",
            source="gmail_drive_sync",
            recruiter_email=item.get("recruiter_email"),
            tags=["Python", "FastAPI", "React", "AI", "Full Stack"],
            created_at=datetime.now(timezone.utc).isoformat()
        )
        await db.save_job(job)

        # Insert Application
        app_obj = Application(
            id=app_id,
            job_id=job_id,
            job_title=item["title"],
            company=item["company"],
            match_score=item["score"],
            recruiter_email=item.get("recruiter_email"),
            status=item["status"],
            notes=item["notes"],
            matched_skills=["Python", "FastAPI", "React", "GenAI", "Full Stack"],
            missing_skills=[],
            applied_at=datetime.now(timezone.utc).isoformat(),
            created_at=datetime.now(timezone.utc).isoformat()
        )
        await db.save_application(app_obj)

        # Insert Interview Round if active or historical
        if item.get("round"):
            r_info = item["round"]
            round_id = f"rnd-{uuid.uuid4().hex[:10]}"
            round_obj = InterviewRound(
                id=round_id,
                company_id=item["company"],
                user_id="default-user",
                round_number=1,
                round_title=r_info["title"],
                round_type=r_info["type"],
                interviewer_info=r_info["interviewer"],
                raw_input_source=RoundSource.EMAIL_FORWARD,
                raw_input_text=item["notes"],
                summary=r_info["summary"],
                candidate_feeling=r_info.get("feeling", "YES"),
                created_at=datetime.now(timezone.utc).isoformat()
            )
            await db.save_interview_round(round_obj)

            # Insert Questions
            for q_text, q_cat, q_area in r_info.get("questions", []):
                q_obj = InterviewQuestion(
                    id=f"q-{uuid.uuid4().hex[:10]}",
                    round_id=round_id,
                    user_id="default-user",
                    question_text=q_text,
                    question_category=q_cat,
                    areas_to_improve=q_area,
                    created_at=datetime.now(timezone.utc).isoformat()
                )
                await db.save_interview_question(q_obj)

    print(f"Successfully seeded {len(applications_data)} real job applications and interview rounds!")

if __name__ == "__main__":
    asyncio.run(seed_data())
