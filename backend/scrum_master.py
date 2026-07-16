import os
import json
import threading
import time
from datetime import datetime, date, timedelta
from groq import Groq
from dotenv import load_dotenv
from database import SessionLocal
from models import Task, User, Project, Module
from email_helper import send_email

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def get_project_status(db) -> dict:
    """Get complete status of all projects"""

    status = {
        "done_yesterday": [],
        "in_progress": [],
        "overdue": [],
        "not_started": [],
        "team_workload": []
    }

    yesterday = (
        date.today() - timedelta(days=1)
    ).strftime("%Y-%m-%d")

    # Get tasks completed yesterday
    tasks_done = db.query(Task).filter(
        Task.status == "completed"
    ).all()

    for task in tasks_done:
        if task.completed_at:
            completed_date = task.completed_at\
                .strftime("%Y-%m-%d")
            if completed_date == yesterday:
                employee_name = "Unknown"
                if task.assigned_to:
                    emp = db.query(User).filter(
                        User.id == task.assigned_to
                    ).first()
                    if emp:
                        employee_name = emp.name

                status["done_yesterday"].append({
                    "task": task.title,
                    "by": employee_name
                })

    # Get in-progress tasks
    in_progress = db.query(Task).filter(
        Task.status == "in_progress"
    ).all()

    for task in in_progress:
        employee_name = "Unassigned"
        if task.assigned_to:
            emp = db.query(User).filter(
                User.id == task.assigned_to
            ).first()
            if emp:
                employee_name = emp.name

        status["in_progress"].append({
            "task": task.title,
            "by": employee_name,
            "deadline": task.deadline
        })

    # Get overdue tasks
    today_str = date.today().strftime("%Y-%m-%d")
    overdue = db.query(Task).filter(
        Task.status.in_(["pending", "overdue"]),
        Task.deadline < today_str
    ).all()

    for task in overdue:
        employee_name = "Unassigned"
        if task.assigned_to:
            emp = db.query(User).filter(
                User.id == task.assigned_to
            ).first()
            if emp:
                employee_name = emp.name

        status["overdue"].append({
            "task": task.title,
            "by": employee_name,
            "deadline": task.deadline
        })

    # Get team workload
    employees = db.query(User).filter(
        User.role == "employee"
    ).all()

    for emp in employees:
        active = db.query(Task).filter(
            Task.assigned_to == emp.id,
            Task.status.in_([
                "pending", "in_progress"
            ])
        ).count()

        status["team_workload"].append({
            "name": emp.name,
            "active_tasks": active,
            "workload": (
                "High 🔴" if active > 4
                else "Medium 🟡" if active > 2
                else "Low 🟢"
            )
        })

    return status


def generate_scrum_report(status: dict) -> str:
    """Use Groq AI to generate scrum report"""

    prompt = f"""You are an AI Scrum Master.
Generate a professional daily standup report.

Project Status:
- Tasks completed yesterday: {json.dumps(status['done_yesterday'])}
- Tasks in progress today: {json.dumps(status['in_progress'])}
- Overdue tasks (blockers): {json.dumps(status['overdue'])}
- Team workload: {json.dumps(status['team_workload'])}

Write a clear, concise standup report with:
1. What was completed yesterday
2. What is being worked on today
3. Blockers or risks
4. One AI recommendation

Keep it under 200 words.
Use simple, professional language.
Do NOT use markdown headers with #.
Just use plain text with clear sections."""

    try:
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.4,
        )

        return response.choices[0].message\
            .content.strip()

    except Exception as e:
        print(f"Scrum report AI error: {e}")

        # Manual fallback report
        report = f"Daily Standup Report — " \
                 f"{date.today().strftime('%d %B %Y')}\n\n"

        if status["done_yesterday"]:
            report += "COMPLETED YESTERDAY:\n"
            for item in status["done_yesterday"]:
                report += f"✅ {item['task']}" \
                          f" by {item['by']}\n"
        else:
            report += "COMPLETED YESTERDAY:\n" \
                      "No tasks completed yesterday.\n"

        report += "\nIN PROGRESS TODAY:\n"
        if status["in_progress"]:
            for item in status["in_progress"][:5]:
                report += f"🔄 {item['task']}" \
                          f" ({item['by']})\n"
        else:
            report += "No tasks in progress.\n"

        if status["overdue"]:
            report += "\nBLOCKERS:\n"
            for item in status["overdue"][:3]:
                report += f"🚨 {item['task']}" \
                          f" is overdue\n"

        return report


def send_daily_scrum_report():
    """Generate and send daily scrum report"""
    print(f"\n🤖 AI Scrum Master running at "
          f"{datetime.now().strftime('%H:%M:%S')}")

    db = SessionLocal()

    try:
        # Get all team leaders
        leaders = db.query(User).filter(
            User.role == "team_leader"
        ).all()

        if not leaders:
            print("No team leaders found")
            return

        # Get project status
        status = get_project_status(db)

        # Generate AI report
        report_text = generate_scrum_report(status)

        # Build HTML report
        done_html = ""
        if status["done_yesterday"]:
            for item in status["done_yesterday"]:
                done_html += f"""
                <div style='padding:8px;
                    background:#dcfce7;
                    border-radius:6px;
                    margin:4px 0'>
                    ✅ <strong>{item['task']}</strong>
                    — by {item['by']}
                </div>"""
        else:
            done_html = """
            <p style='color:#888'>
                No tasks completed yesterday.
            </p>"""

        progress_html = ""
        if status["in_progress"]:
            for item in status["in_progress"][:5]:
                progress_html += f"""
                <div style='padding:8px;
                    background:#fef9c3;
                    border-radius:6px;
                    margin:4px 0'>
                    🔄 <strong>{item['task']}</strong>
                    — {item['by']}
                    (Due: {item['deadline']})
                </div>"""
        else:
            progress_html = """
            <p style='color:#888'>
                No tasks in progress.
            </p>"""

        blocker_html = ""
        if status["overdue"]:
            for item in status["overdue"][:5]:
                blocker_html += f"""
                <div style='padding:8px;
                    background:#fee2e2;
                    border-radius:6px;
                    margin:4px 0'>
                    🚨 <strong>{item['task']}</strong>
                    — Overdue since {item['deadline']}
                    (Assigned to: {item['by']})
                </div>"""
        else:
            blocker_html = """
            <div style='padding:8px;
                background:#dcfce7;
                border-radius:6px'>
                ✅ No blockers today!
            </div>"""

        workload_html = ""
        for emp in status["team_workload"]:
            workload_html += f"""
            <div style='padding:8px;
                background:#f8fafc;
                border-radius:6px;
                margin:4px 0;
                display:flex;
                justify-content:space-between'>
                <span>👤 {emp['name']}</span>
                <span>{emp['active_tasks']} tasks
                — {emp['workload']}</span>
            </div>"""

        # Send to all team leaders
        for leader in leaders:
            send_email(
                to_email=leader.email,
                subject=(
                    f"🤖 Daily Scrum Report — "
                    f"{date.today().strftime('%d %B %Y')}"
                ),
                body=f"""
                <h2 style='color:#1a1a2e;
                    margin-top:0'>
                    🤖 AI Scrum Master
                </h2>
                <p style='color:#888'>
                    Daily Standup Report —
                    {date.today().strftime(
                        '%d %B %Y, %A'
                    )}
                </p>

                <h3 style='color:#16a34a'>
                    ✅ Completed Yesterday
                </h3>
                {done_html}

                <h3 style='color:#f59e0b;
                    margin-top:20px'>
                    🔄 In Progress Today
                </h3>
                {progress_html}

                <h3 style='color:#dc2626;
                    margin-top:20px'>
                    🚨 Blockers
                </h3>
                {blocker_html}

                <h3 style='color:#4f46e5;
                    margin-top:20px'>
                    👥 Team Workload
                </h3>
                {workload_html}

                <div style='background:#eff6ff;
                    border-radius:8px;
                    padding:16px;
                    margin-top:20px;
                    border-left:4px solid #4f46e5'>
                    <p style='margin:0;
                        font-weight:bold;
                        color:#1e40af'>
                        🤖 AI Analysis:
                    </p>
                    <p style='margin:8px 0 0 0;
                        color:#1e40af;
                        white-space:pre-line'>
                        {report_text}
                    </p>
                </div>
                """
            )
            print(f"✅ Scrum report sent to {leader.email}")

    except Exception as e:
        print(f"❌ Scrum Master error: {e}")
    finally:
        db.close()


def run_scrum_master():
    """Run every 24 hours"""
    while True:
        send_daily_scrum_report()
        print("💤 AI Scrum Master sleeping 24 hours...")
        time.sleep(86400)


def start_scrum_master():
    """Start in background thread"""
    thread = threading.Thread(
        target=run_scrum_master,
        daemon=True
    )
    thread.start()
    print("🤖 AI Scrum Master started!")