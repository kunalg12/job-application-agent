import pytest
from backend.app.services.automation_service import map_ats_fields, FormFillResult

def test_map_ats_fields():
    selectors = [
        {"id": "first_name", "type": "text"},
        {"id": "last_name", "type": "text"},
        {"name": "email", "type": "email"},
        {"name": "phone", "type": "tel"},
        {"name": "resume", "type": "file"},
        {"id": "custom_salary_expectation", "type": "text", "required": True}
    ]
    mapping, unmapped_required = map_ats_fields(selectors)
    assert mapping["first_name"] == "profile.first_name"
    assert mapping["email"] == "profile.email"
    assert "custom_salary_expectation" in unmapped_required

def test_form_fill_result_model():
    res = FormFillResult(
        status="FILLED",
        filled_fields=["first_name", "last_name", "email", "resume"],
        unmapped_fields=[],
        screenshot_path=None
    )
    assert res.status == "FILLED"
    assert len(res.filled_fields) == 4
