import threading
import time
from datetime import datetime, date
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Task, User, Module, Project, TaskHistory
from email_helper import send_deadline_reminder, send_overdue_alert

def check_deadlines():
    print(f"\n🤖 AI Agent running at {datetime.now().strftime('%H:%M:%S')}")

    db = SessionLocal()

    try:
        today = date.today()

        pending_tasks = db.query(Task).filter(
            Task.status != "completed"
        ).all()

        print(f"Checking {len(pending_tasks)} pending tasks...")

        for task in pending_tasks:
            if not task.deadline:
                continue

            try:
                deadline_date = datetime.strptime(
                    task.deadline, "%Y-%m-%d"
                ).date()
            except:
                continue

            days_until_deadline = (deadline_date - today).days

            module = db.query(Module).filter(
                Module.id == task.module_id
            ).first()

            if not module:
                continue

            project = db.query(Project).filter(
                Project.id == module.project_id
            ).first()

            if not project:
                continue

            leader = db.query(User).filter(
                User.id == project.created_by
            ).first()

            # Deadline is tomorrow — remind employee
            if days_until_deadline == 1 and task.assigned_to:
                employee = db.query(User).filter(
                    User.id == task.assigned_to
                ).first()

                if employee:
                    print(f"Sending reminder to {employee.email}")
                    send_deadline_reminder(
                        employee_name=employee.name,
                        employee_email=employee.email,
                        task_title=task.title,
                        deadline=task.deadline,
                        project_name=project.name
                    )

                    history = TaskHistory(
                        task_id=task.id,
                        action="reminder_sent",
                        done_by="AI Agent",
                        details=f"Reminder sent to {employee.email}"
                    )
                    db.add(history)

            # Deadline passed — alert team leader
            elif days_until_deadline < 0:
                task.status = "overdue"

                if leader:
                    employee_name = "Unassigned"
                    if task.assigned_to:
                        employee = db.query(User).filter(
                            User.id == task.assigned_to
                        ).first()
                        if employee:
                            employee_name = employee.name

                    print(f"Sending overdue alert to {leader.email}")
                    send_overdue_alert(
                        leader_name=leader.name,
                        leader_email=leader.email,
                        task_title=task.title,
                        deadline=task.deadline,
                        employee_name=employee_name,
                        project_name=project.name
                    )

                    history = TaskHistory(
                        task_id=task.id,
                        action="overdue_alert",
                        done_by="AI Agent",
                        details=f"Overdue alert sent to {leader.email}"
                    )
                    db.add(history)

        db.commit()
        print("✅ AI Agent check complete!")

    except Exception as e:
        print(f"❌ AI Agent error: {e}")
    finally:
        db.close()


def run_scheduler():
    while True:
        check_deadlines()
        print("💤 AI Agent sleeping for 24 hours...")
        time.sleep(86400)


def start_scheduler():
    thread = threading.Thread(target=run_scheduler, daemon=True)
    thread.start()
    print("🤖 AI Email Agent started in background!")