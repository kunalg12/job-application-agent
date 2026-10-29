import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    db_path: str = os.getenv("DB_PATH", str(Path(__file__).parent.parent / "data" / "job_agent.db"))
    default_resume_path: str = os.getenv(
        "DEFAULT_RESUME_PATH", 
        "/home/kunal/Downloads/Kunal_Gursal_Resume.pdf"
    )
    port: int = 8000
    host: str = "127.0.0.1"

settings = Settings()
