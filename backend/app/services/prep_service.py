from typing import Dict, Any, List, Optional
from backend.app.models import RoundPrepBriefing, RoundType, InterviewRound, InterviewQuestion
from backend.app.database import Database

SYSTEM_DESIGN_PREDICTED = [
    "How would you design a distributed time-series metrics ingestion engine with sub-second queries?",
    "How do you handle hot-key partitioning and database replication lag across multi-region clusters?",
    "Describe your strategy for cache invalidation (Write-Through vs Cache-Aside) under high write concurrency.",
    "How would you design rate limiters protecting public APIs from volumetric DDoS traffic?"
]

CODING_PREDICTED = [
    "Implement an LRU Cache with O(1) get and put time complexity.",
    "Find the longest path in a directed acyclic graph (DAG) representing task dependencies.",
    "Design and implement a concurrent worker pool handling asynchronous job queues.",
    "Optimize a vector search similarity query with cosine distance under memory constraints."
]

BEHAVIORAL_PREDICTED = [
    "Tell me about a high-severity production outage you diagnosed and resolved under pressure.",
    "Describe a situation where you had a strong technical disagreement with a team member or leader.",
    "Walk through an architectural decision you made that you would do differently in hindsight.",
    "How do you balance reducing technical debt against meeting tight product roadmap deadlines?"
]

RECRUITER_PREDICTED = [
    "Can you give a 2-minute elevator pitch of your recent full-stack and AI engineering experience?",
    "What motivated you to apply to our company, and what kind of technical challenges excite you most?",
    "What are your target compensation and availability expectations for this role?"
]

async def generate_round_prep_briefing(
    db: Database,
    user_id: str,
    company_id: str,
    round_id: str
) -> RoundPrepBriefing:
    target_round = await db.get_interview_round_by_id(user_id, round_id)
    company_name = company_id
    round_title = target_round.round_title if target_round else "Upcoming Interview Round"
    round_type = target_round.round_type if target_round else RoundType.TECH_CODING

    # Collect previous questions and weak points from historical rounds
    all_rounds = await db.list_interview_rounds_for_company(user_id, company_id)
    historical_weak_spots: List[str] = []
    historical_questions_count = 0

    for r in all_rounds:
        questions = await db.list_questions_for_round(user_id, r.id)
        historical_questions_count += len(questions)
        for q in questions:
            if q.areas_to_improve:
                historical_weak_spots.append(q.areas_to_improve)

    # Customize predictions and topics based on round type
    key_topics: List[str] = []
    predicted_questions: List[str] = []
    tips: List[str] = []

    if round_type == RoundType.SYSTEM_DESIGN:
        predicted_questions = SYSTEM_DESIGN_PREDICTED
        key_topics = ["Distributed Kafka / Event streaming", "Sharded PostgreSQL / NoSQL storage", "P99 SLA latency guarantees", "Cache stampede mitigations"]
        tips.append("Start with high-level API contracts and SLA numbers before diving into deep component diagrams.")
    elif round_type == RoundType.BEHAVIORAL or round_type == RoundType.CULTURE_ADD:
        predicted_questions = BEHAVIORAL_PREDICTED
        key_topics = ["STAR method (Situation, Task, Action, Result)", "Measurable business outcomes", "Collaborative conflict resolution"]
        tips.append("Frame every story around ownership, explicit numbers (e.g. 40% latency reduction), and lessons learned.")
    elif round_type == RoundType.RECRUITER_SCREEN:
        predicted_questions = RECRUITER_PREDICTED
        key_topics = ["Elevator pitch", "Company value proposition", "Compensation and timeline alignment"]
        tips.append("Be crisp on your current stack and demonstrate genuine knowledge of their latest product launches.")
    else:  # TECH_CODING or default
        predicted_questions = CODING_PREDICTED
        key_topics = ["Time and space complexity (Big-O)", "Edge cases & defensive input checks", "Async Python / TypeScript concurrency primitives"]
        tips.append("Think out loud continuously. Clarify constraints and discuss trade-offs before writing code.")

    # Incorporate historical areas to improve
    if historical_weak_spots:
        for spot in historical_weak_spots[:2]:
            tips.append(f"Review previous hesitation: {spot}")

    overview = (
        f"Pre-round intelligence briefing for {company_name} - {round_title}. "
        f"Synthesized from {len(all_rounds)} recorded rounds and {historical_questions_count} historical questions."
    )

    return RoundPrepBriefing(
        company_name=company_name,
        round_title=round_title,
        overview=overview,
        key_topics_to_review=key_topics,
        predicted_questions=predicted_questions,
        tips_based_on_history=tips
    )

async def generate_thank_you_email(
    db: Database,
    user_id: str,
    round_id: str
) -> Dict[str, str]:
    round_obj = await db.get_interview_round_by_id(user_id, round_id)
    profile = await db.get_profile()

    interviewer_name = "Hiring Team"
    if round_obj and round_obj.interviewer_info:
        first = round_obj.interviewer_info[0]
        if isinstance(first, dict) and "name" in first:
            interviewer_name = first["name"]
        elif isinstance(first, str):
            interviewer_name = first

    company_name = round_obj.company_id if round_obj else "the company"
    round_name = round_obj.round_title if round_obj else "interview"

    subject = f"Thank You – {round_name} with {company_name}"
    body = f"""Hi {interviewer_name},

Thank you for taking the time to speak with me today regarding the {round_name} at {company_name}. I really enjoyed our conversation and learning more about the team's engineering priorities.

Our discussion regarding distributed systems and scalable product architecture reaffirmed my enthusiasm for this role. I am confident my background in full-stack engineering and GenAI systems aligns strongly with the problems your team is solving.

Please feel free to let me know if there are any further questions or follow-up details I can provide. I look forward to the next steps!

Best regards,
{profile.name or 'Candidate'}
{profile.email or ''}
"""
    return {
        "subject": subject,
        "body": body.strip()
    }
