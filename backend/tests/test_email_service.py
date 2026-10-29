import pytest
import os
import tempfile
from unittest.mock import patch, MagicMock
from backend.app.services.email_service import EmailDispatcher
from backend.app.models import SMTPSettings

def test_send_application_email_success():
    smtp_settings = SMTPSettings(
        host="smtp.gmail.com",
        port=587,
        username="test@gmail.com",
        password="secret_app_password",
        from_name="Kunal Gursal",
        use_tls=True
    )
    dispatcher = EmailDispatcher(smtp_settings)
    
    with patch("smtplib.SMTP") as mock_smtp:
        server_instance = MagicMock()
        mock_smtp.return_value.__enter__.return_value = server_instance
        
        with tempfile.NamedTemporaryFile(suffix=".pdf") as tmp:
            tmp.write(b"%PDF-1.4 sample content")
            tmp.flush()
            
            success, message = dispatcher.send_email(
                to_email="recruiter@company.com",
                subject="Application: AI Full Stack Developer - Kunal Gursal",
                body="Hello,\nPlease find my resume and cover letter attached.",
                attachment_paths=[tmp.name]
            )
            assert success is True
            assert "successfully" in message.lower()
            assert server_instance.starttls.called
            assert server_instance.login.called
            assert server_instance.send_message.called

def test_send_application_email_validation():
    smtp_settings = SMTPSettings(username="")
    dispatcher = EmailDispatcher(smtp_settings)
    success, message = dispatcher.send_email(
        to_email="invalid-email",
        subject="Test",
        body="Body"
    )
    assert success is False
    assert "invalid" in message.lower() or "configured" in message.lower()
