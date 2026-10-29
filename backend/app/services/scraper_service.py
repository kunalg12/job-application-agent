import re
import hashlib
import httpx
from typing import Optional, List, Dict, Any
from urllib.parse import urlparse
from backend.app.models import Job

USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"

def generate_job_id(company: str, title: str, url: Optional[str] = None) -> str:
    key = f"{company.lower().strip()}:{title.lower().strip()}"
    return hashlib.sha256(key.encode()).hexdigest()[:16]

def extract_recruiter_email(description: str, company: Optional[str] = None, company_domain: Optional[str] = None) -> Optional[str]:
    # 1. Direct email regex in description
    pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
    matches = re.findall(pattern, description)
    # Filter out common false positives or image assets
    valid_matches = [m for m in matches if not m.endswith(('.png', '.jpg', '.jpeg', '.gif', '.svg')) and 'sentry' not in m and 'example.com' not in m]
    if valid_matches:
        return valid_matches[0]

    # 2. Domain heuristic fallback ONLY if real company domain is provided
    if company_domain:
        clean_domain = company_domain.lower().replace("www.", "").strip("/")
        if "." in clean_domain:
            return f"careers@{clean_domain}"

    return None

def normalize_remoteok_job(raw: Dict[str, Any]) -> Job:
    company = raw.get("company", "Unknown Company")
    title = raw.get("position", "Software Engineer")
    url = raw.get("url", f"https://remoteok.com/remote-jobs/{raw.get('id', '')}")
    description = raw.get("description", "")
    
    # Check domain from url if possible
    domain = None
    if url:
        try:
            parsed = urlparse(url)
            domain = parsed.netloc
        except Exception:
            pass

    email = extract_recruiter_email(description, company=company)
    tags = raw.get("tags", [])
    salary = raw.get("salary") or raw.get("compensation") or None

    return Job(
        id=generate_job_id(company, title, url),
        title=title,
        company=company,
        location=raw.get("location", "Remote"),
        description=description,
        url=url,
        source="remoteok",
        recruiter_email=email,
        salary=salary,
        tags=tags
    )

def normalize_arbeitnow_job(raw: Dict[str, Any]) -> Job:
    company = raw.get("company_name", "Unknown Company")
    title = raw.get("title", "Developer")
    url = raw.get("url", "")
    description = raw.get("description", "")
    
    email = extract_recruiter_email(description, company=company)
    tags = raw.get("tags", [])
    location = "Remote" if raw.get("remote") else raw.get("location", "Remote")

    return Job(
        id=generate_job_id(company, title, url),
        title=title,
        company=company,
        location=location,
        description=description,
        url=url,
        source="arbeitnow",
        recruiter_email=email,
        tags=tags
    )

def normalize_jobicy_job(raw: Dict[str, Any]) -> Job:
    company = raw.get("companyName", "Unknown Company")
    title = raw.get("jobTitle", "Engineer")
    url = raw.get("url", "")
    description = raw.get("jobDescription", "")
    
    email = extract_recruiter_email(description, company=company)
    salary = raw.get("annualSalaryMin")
    salary_str = f"${salary:,}/yr" if salary else None

    return Job(
        id=generate_job_id(company, title, url),
        title=title,
        company=company,
        location=raw.get("jobGeo", "Remote"),
        description=description,
        url=url,
        source="jobicy",
        recruiter_email=email,
        salary=salary_str,
        tags=[raw.get("jobCategory", "Tech")]
    )

def parse_custom_job_text(raw_text: str, custom_url: Optional[str] = None) -> Job:
    lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
    company = "Custom Employer"
    title = "Software Engineer"
    location = "Remote"

    for line in lines:
        lower = line.lower()
        if lower.startswith("company:") or lower.startswith("company -"):
            company = line.split(":", 1)[-1].strip()
        elif lower.startswith("title:") or lower.startswith("role:") or lower.startswith("position:"):
            title = line.split(":", 1)[-1].strip()
        elif lower.startswith("location:"):
            location = line.split(":", 1)[-1].strip()

    email = extract_recruiter_email(raw_text, company=company)
    url = custom_url or f"https://job.custom/{generate_job_id(company, title)}"

    return Job(
        id=generate_job_id(company, title, url),
        title=title,
        company=company,
        location=location,
        description=raw_text,
        url=url,
        source="manual",
        recruiter_email=email
    )

async def fetch_remoteok_jobs(limit: int = 40) -> List[Job]:
    url = "https://remoteok.com/api"
    headers = {"User-Agent": USER_AGENT}
    jobs = []
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                listings = data[1:] if len(data) > 1 and isinstance(data, list) else []
                for item in listings[:limit]:
                    if isinstance(item, dict) and item.get("position"):
                        jobs.append(normalize_remoteok_job(item))
    except Exception as e:
        print(f"Error fetching from RemoteOK: {e}")
    return jobs

async def fetch_arbeitnow_jobs(limit: int = 40) -> List[Job]:
    url = "https://www.arbeitnow.com/api/job-board-api"
    headers = {"User-Agent": USER_AGENT}
    jobs = []
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                listings = data.get("data", [])
                for item in listings[:limit]:
                    jobs.append(normalize_arbeitnow_job(item))
    except Exception as e:
        print(f"Error fetching from Arbeitnow: {e}")
    return jobs

async def fetch_jobicy_jobs(limit: int = 20) -> List[Job]:
    url = f"https://jobicy.com/api/v2/remote-jobs?count={limit}"
    headers = {"User-Agent": USER_AGENT}
    jobs = []
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                listings = data.get("jobs", [])
                for item in listings[:limit]:
                    jobs.append(normalize_jobicy_job(item))
    except Exception as e:
        print(f"Error fetching from Jobicy: {e}")
    return jobs

async def fetch_all_jobs(max_per_source: int = 30) -> List[Job]:
    all_jobs: Dict[str, Job] = {}
    
    # Ingest from all 3 sources concurrently
    remoteok_jobs = await fetch_remoteok_jobs(limit=max_per_source)
    arbeitnow_jobs = await fetch_arbeitnow_jobs(limit=max_per_source)
    jobicy_jobs = await fetch_jobicy_jobs(limit=max_per_source)

    for job in remoteok_jobs + arbeitnow_jobs + jobicy_jobs:
        if job.id not in all_jobs:
            all_jobs[job.id] = job

    return list(all_jobs.values())
