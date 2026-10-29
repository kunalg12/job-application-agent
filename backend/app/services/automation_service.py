import os
import re
from typing import List, Dict, Any, Tuple, Optional
from pydantic import BaseModel
from backend.app.models import UserProfile

class FormFillResult(BaseModel):
    status: str # "FILLED", "SUBMITTED", "ACTION_REQUIRED", "FAILED"
    filled_fields: List[str] = []
    unmapped_fields: List[str] = []
    screenshot_path: Optional[str] = None
    message: str = ""
    clipboard_payload: Optional[str] = None

FIELD_PATTERNS = {
    "profile.first_name": [r"first.*name", r"fname", r"^first$"],
    "profile.last_name": [r"last.*name", r"lname", r"^last$"],
    "profile.name": [r"^name$", r"full.*name", r"candidate.*name"],
    "profile.email": [r"email", r"e-mail"],
    "profile.phone": [r"phone", r"mobile", r"tel"],
    "profile.linkedin": [r"linkedin"],
    "profile.github": [r"github"],
    "profile.portfolio": [r"portfolio", r"website", r"web.*site"],
    "profile.resume_file_path": [r"resume", r"^cv$", r"attach.*resume"],
    "cover_letter_text": [r"cover.*letter", r"additional.*info", r"comments"]
}

def map_ats_fields(elements: List[Dict[str, Any]]) -> Tuple[Dict[str, str], List[str]]:
    mapping = {}
    unmapped_required = []

    for el in elements:
        identifier = (el.get("id") or el.get("name") or el.get("placeholder") or "").lower()
        el_type = (el.get("type") or "text").lower()
        is_required = el.get("required", False)

        matched_target = None
        for target, patterns in FIELD_PATTERNS.items():
            for pat in patterns:
                if re.search(pat, identifier):
                    matched_target = target
                    break
            if matched_target:
                break

        key = el.get("id") or el.get("name") or identifier
        if matched_target:
            mapping[key] = matched_target
        elif is_required and el_type not in ["hidden", "submit", "button"]:
            unmapped_required.append(key)

    return mapping, unmapped_required

async def autofill_job_application(
    job_url: str,
    profile: UserProfile,
    resume_path: Optional[str] = None,
    cover_letter: Optional[str] = None,
    headless: bool = True
) -> FormFillResult:
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        return FormFillResult(
            status="FAILED",
            message="Playwright is not installed in the environment."
        )

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=headless)
            page = await browser.new_page()
            await page.goto(job_url, timeout=30000, wait_until="domcontentloaded")

            # Generate candidate clipboard payload for manual fallback
            clipboard_payload = (
                f"Candidate: {profile.name}\n"
                f"Email: {profile.email}\n"
                f"Phone: {profile.phone}\n"
                f"Location: {profile.location}\n"
                f"LinkedIn: {profile.linkedin}\n"
                f"GitHub: {profile.github}\n"
                f"Work Authorization: {profile.work_authorization}\n"
                f"Notice Period: {profile.notice_period}\n\n"
                f"--- COVER LETTER ---\n{cover_letter or ''}"
            )

            # Extract interactive inputs across all page frames (including iframes)
            dom_elements = []
            target_frames = [page] + page.frames
            for frame in target_frames:
                try:
                    inputs = await frame.query_selector_all("input, textarea, select")
                    for inp in inputs:
                        el_id = await inp.get_attribute("id") or ""
                        el_name = await inp.get_attribute("name") or ""
                        el_type = await inp.get_attribute("type") or "text"
                        required = await inp.get_attribute("required") is not None
                        dom_elements.append({
                            "id": el_id,
                            "name": el_name,
                            "type": el_type,
                            "required": required
                        })
                except Exception:
                    pass

            mapping, unmapped_required = map_ats_fields(dom_elements)
            filled = []

            # Split name into first and last
            name_parts = profile.name.split()
            first_name = name_parts[0] if name_parts else profile.name
            last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""

            for key, target in mapping.items():
                val = None
                if target == "profile.first_name":
                    val = first_name
                elif target == "profile.last_name":
                    val = last_name
                elif target == "profile.name":
                    val = profile.name
                elif target == "profile.email":
                    val = profile.email
                elif target == "profile.phone":
                    val = profile.phone
                elif target == "profile.linkedin":
                    val = profile.linkedin
                elif target == "profile.github":
                    val = profile.github
                elif target == "profile.portfolio":
                    val = profile.portfolio
                elif target == "cover_letter_text":
                    val = cover_letter

                for frame in target_frames:
                    try:
                        if val:
                            el = await frame.query_selector(f"input[name='{key}'], input#{key}, textarea[name='{key}'], textarea#{key}")
                            if el:
                                await el.fill(val)
                                filled.append(key)
                                break
                        elif target == "profile.resume_file_path" and resume_path and os.path.exists(resume_path):
                            file_input = await frame.query_selector(f"input[type='file'][name='{key}'], input[type='file']#{key}, input[type='file']")
                            if file_input:
                                await file_input.set_input_files(resume_path)
                                filled.append(key)
                                break
                    except Exception:
                        pass

            # Screenshot result
            screenshot_dir = "/tmp/job_agent_screenshots"
            os.makedirs(screenshot_dir, exist_ok=True)
            screenshot_path = f"{screenshot_dir}/autofill_{abs(hash(job_url))}.png"
            await page.screenshot(path=screenshot_path)
            
            # In headless mode close browser; in supervised mode keep open for user review
            if headless:
                await browser.close()

            status = "ACTION_REQUIRED" if unmapped_required else "FILLED"
            msg = f"Autofilled {len(filled)} fields."
            if unmapped_required:
                msg += f" Note: {len(unmapped_required)} required fields need manual attention: {', '.join(unmapped_required[:3])}"

            return FormFillResult(
                status=status,
                filled_fields=filled,
                unmapped_fields=unmapped_required,
                screenshot_path=screenshot_path,
                message=msg,
                clipboard_payload=clipboard_payload
            )
    except Exception as e:
        return FormFillResult(
            status="FAILED",
            message=f"Browser automation error: {str(e)}"
        )
