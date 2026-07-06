import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
MAIL_FROM = os.getenv("MAIL_FROM")

def send_email(to_email: str, subject: str, body: str):
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = MAIL_FROM
        msg["To"] = to_email

        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif;
                     background-color: #f0f4f8;
                     padding: 20px;">
            <div style="max-width: 600px;
                        margin: 0 auto;
                        background-color: white;
                        border-radius: 12px;
                        padding: 30px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1);">

                <h2 style="color: #4f46e5; margin-top: 0;">
                    TaskFlow Notification
                </h2>

                <div style="background-color: #f8fafc;
                            border-radius: 8px;
                            padding: 20px;
                            border-left: 4px solid #4f46e5;">
                    {body}
                </div>

                <p style="color: #888;
                           font-size: 12px;
                           margin-top: 20px;">
                    This is an automated message from TaskFlow.
                    Please do not reply to this email.
                </p>
            </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(MAIL_USERNAME, MAIL_PASSWORD)
            server.sendmail(MAIL_FROM, to_email, msg.as_string())

        print(f"✅ Email sent to {to_email}")
        return True

    except Exception as e:
        print(f"❌ Email error: {e}")
        return False


def send_deadline_reminder(
    employee_name: str,
    employee_email: str,
    task_title: str,
    deadline: str,
    project_name: str
):
    subject = f"⏰ Task Deadline Tomorrow — {task_title}"
    body = f"""
    <h3 style="color: #1a1a2e;">Hello {employee_name},</h3>
    <p>Your task deadline is <strong>tomorrow</strong>.</p>
    <p><strong>Task:</strong> {task_title}</p>
    <p><strong>Project:</strong> {project_name}</p>
    <p><strong>Deadline:</strong>
        <span style="color: #dc2626;">{deadline}</span>
    </p>
    <p>Please complete and mark your task as done before the deadline.</p>
    """
    return send_email(employee_email, subject, body)


def send_overdue_alert(
    leader_name: str,
    leader_email: str,
    task_title: str,
    deadline: str,
    employee_name: str,
    project_name: str
):
    subject = f"🚨 Overdue Task Alert — {task_title}"
    body = f"""
    <h3 style="color: #1a1a2e;">Hello {leader_name},</h3>
    <p>A task is <strong style="color: #dc2626;">overdue</strong>
    and has not been completed.</p>
    <p><strong>Task:</strong> {task_title}</p>
    <p><strong>Project:</strong> {project_name}</p>
    <p><strong>Assigned To:</strong> {employee_name}</p>
    <p><strong>Deadline Was:</strong>
        <span style="color: #dc2626;">{deadline}</span>
    </p>
    <p>Please follow up with <strong>{employee_name}</strong>
    immediately.</p>
    """
    return send_email(leader_email, subject, body)


def send_task_completed(
    leader_name: str,
    leader_email: str,
    task_title: str,
    employee_name: str,
    project_name: str,
    completed_at: str
):
    subject = f"✅ Task Completed — {task_title}"
    body = f"""
    <h3 style="color: #1a1a2e;">Hello {leader_name},</h3>
    <p>A task has been
    <strong style="color: #16a34a;">completed</strong>.</p>
    <p><strong>Task:</strong> {task_title}</p>
    <p><strong>Project:</strong> {project_name}</p>
    <p><strong>Completed By:</strong> {employee_name}</p>
    <p><strong>Completed At:</strong>
        <span style="color: #16a34a;">{completed_at}</span>
    </p>
    """
    return send_email(leader_email, subject, body)