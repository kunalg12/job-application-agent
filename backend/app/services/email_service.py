import os
import re
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from typing import List, Tuple, Optional
from backend.app.models import SMTPSettings

class EmailDispatcher:
    def __init__(self, settings: SMTPSettings):
        self.settings = settings

    def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        attachment_paths: Optional[List[str]] = None
    ) -> Tuple[bool, str]:
        # Validation & Header Injection Defense
        if not to_email or '\r' in to_email or '\n' in to_email:
            return False, f"Invalid recipient email address: '{to_email}'"

        clean_to_email = to_email.strip()
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", clean_to_email):
            return False, f"Invalid recipient email address: '{to_email}'"

        clean_subject = re.sub(r'[\r\n]+', ' ', subject).strip() if subject else ""

        if not self.settings.username or not self.settings.password:
            return False, "SMTP credentials are not configured. Please enter your email and App Password in Settings."

        msg = MIMEMultipart()
        clean_from_name = re.sub(r'[\r\n]+', ' ', self.settings.from_name).strip() if self.settings.from_name else ""
        from_header = f"{clean_from_name} <{self.settings.username}>" if clean_from_name else self.settings.username
        msg["From"] = from_header
        msg["To"] = clean_to_email
        msg["Subject"] = clean_subject

        # Attach text body
        msg.attach(MIMEText(body, "plain"))

        # Attach PDF files
        if attachment_paths:
            for path in attachment_paths:
                if path and os.path.exists(path):
                    try:
                        filename = os.path.basename(path)
                        with open(path, "rb") as f:
                            part = MIMEApplication(f.read(), Name=filename)
                        part["Content-Disposition"] = f'attachment; filename="{filename}"'
                        msg.attach(part)
                    except Exception as e:
                        return False, f"Failed to attach file {path}: {str(e)}"

        try:
            if self.settings.port == 465 or not self.settings.use_tls:
                with smtplib.SMTP_SSL(self.settings.host, self.settings.port, timeout=15) as server:
                    server.login(self.settings.username, self.settings.password)
                    server.send_message(msg)
            else:
                with smtplib.SMTP(self.settings.host, self.settings.port, timeout=15) as server:
                    server.starttls()
                    server.login(self.settings.username, self.settings.password)
                    server.send_message(msg)

            return True, f"Email sent successfully to {to_email}"
        except smtplib.SMTPAuthenticationError:
            return False, "SMTP Authentication failed. For Gmail, please use an App Password (not your normal account password)."
        except Exception as e:
            return False, f"SMTP Error sending email: {str(e)}"
