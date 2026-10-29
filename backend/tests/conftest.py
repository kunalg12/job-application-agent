import pytest
import os
import tempfile
from backend.app.config import settings
from backend.app.database import Database

@pytest.fixture(autouse=True)
def isolated_test_db(tmp_path, monkeypatch):
    test_db_path = str(tmp_path / "isolated_test.db")
    monkeypatch.setattr(settings, "db_path", test_db_path)
    return test_db_path
