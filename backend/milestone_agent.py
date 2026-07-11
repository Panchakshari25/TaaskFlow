import threading
import time
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Task, User, Project, Module, Milestone, TaskHistory
from email_helper import send_email


def create_milestones_for_project(
    project_id: int,
    db: Session
):
    """Create 4 milestones automatically when project is created"""

    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        return

    # Check if milestones already exist
    existing = db.query(Milestone).filter(
        Milestone.project_id == project_id
    ).first()

    if existing:
        return

    # Get all tasks in this project to find date range
    all_tasks = []
    for module in project.modules:
        for task in module.tasks:
            if task.deadline:
                all_tasks.append(task)

    if not all_tasks:
        return

    # Find earliest and latest deadline
    deadlines = []
    for task in all_tasks:
        try:
            d = datetime.strptime(task.deadline, "%Y-%m-%d").date()
            deadlines.append(d)
        except:
            continue

    if not deadlines:
        return

    start_date = date.today()
    end_date = max(deadlines)
    total_days = (end_date - start_date).days

    if total_days <= 0:
        total_days = 30

    # Create 4 milestones
    milestones_data = [
        {
            "number": 1,
            "title": "Milestone 1 — Project Kickoff & Planning",
            "description": "Initial tasks and planning phase completed",
            "days": total_days // 4
        },
        {
            "number": 2,
            "title": "Milestone 2 — Development Phase 1",
            "description": "First half of development tasks completed",
            "days": total_days // 2
        },
        {
            "number": 3,
            "title": "Milestone 3 — Development Phase 2",
            "description": "Second half of development tasks completed",
            "days": (total_days * 3) // 4
        },
        {
            "number": 4,
            "title": "Milestone 4 — Final Delivery",
            "description": "All tasks completed and project delivered",
            "days": total_days
        }
    ]

    for m in milestones_data:
        due_date = (
            start_date + timedelta(days=m["days"])
        ).strftime("%Y-%m-%d")

        milestone = Milestone(
            project_id=project_id,
            title=m["title"],
            description=m["description"],
            due_date=due_date,
            status="pending",
            milestone_number=m["number"],
            completion_percentage=0
        )
        db.add(milestone)

    db.commit()
    print(f"✅ Created 4 milestones for project {project_id}")


def calculate_milestone_progress(
    project_id: int,
    milestone_number: int,
    db: Session
) -> int:
    """Calculate what % of tasks are done for this milestone"""

    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        return 0

    # Get milestone date range
    milestones = db.query(Milestone).filter(
        Milestone.project_id == project_id
    ).order_by(Milestone.milestone_number).all()

    if not milestones or milestone_number > len(milestones):
        return 0

    current_milestone = milestones[milestone_number - 1]

    # Get previous milestone date
    if milestone_number == 1:
        start_date = date.today().replace(
            month=1, day=1
        ).strftime("%Y-%m-%d")
    else:
        prev_milestone = milestones[milestone_number - 2]
        start_date = prev_milestone.due_date

    end_date = current_milestone.due_date

    # Count tasks in this milestone's date range
    total_tasks = 0
    completed_tasks = 0

    for module in project.modules:
        for task in module.tasks:
            if task.deadline:
                if start_date <= task.deadline <= end_date:
                    total_tasks += 1
                    if task.status == "completed":
                        completed_tasks += 1

    if total_tasks == 0:
        return 0

    return int((completed_tasks / total_tasks) * 100)


def check_milestones():
    """Check all milestones and update status"""
    print(f"\n🎯 Milestone Agent running at "
          f"{datetime.now().strftime('%H:%M:%S')}")

    db = SessionLocal()

    try:
        today = date.today()

        # Get all projects
        projects = db.query(Project).all()

        for project in projects:
            # Create milestones if not exist
            create_milestones_for_project(project.id, db)

            # Get milestones for this project
            milestones = db.query(Milestone).filter(
                Milestone.project_id == project.id
            ).order_by(Milestone.milestone_number).all()

            # Get team leader
            leader = db.query(User).filter(
                User.id == project.created_by
            ).first()

            for milestone in milestones:
                if milestone.status == "completed":
                    continue

                # Calculate progress
                progress = calculate_milestone_progress(
                    project.id,
                    milestone.milestone_number,
                    db
                )

                # Update completion percentage
                milestone.completion_percentage = progress
                milestone.updated_at = datetime.now()

                # Parse due date
                try:
                    due_date = datetime.strptime(
                        milestone.due_date, "%Y-%m-%d"
                    ).date()
                except:
                    continue

                days_left = (due_date - today).days

                # Update milestone status
                if progress == 100:
                    milestone.status = "completed"
                    print(f"✅ Milestone {milestone.milestone_number} "
                          f"completed for project {project.name}")

                    # Send completion email to leader
                    if leader:
                        send_email(
                            to_email=leader.email,
                            subject=f"✅ Milestone Completed — "
                                    f"{milestone.title}",
                            body=f"""
                            <h3>Hello {leader.name},</h3>
                            <p>A milestone has been
                            <strong style='color:#16a34a'>
                            completed</strong>!</p>
                            <p><strong>Project:</strong>
                            {project.name}</p>
                            <p><strong>Milestone:</strong>
                            {milestone.title}</p>
                            <p><strong>Progress:</strong>
                            {progress}% complete</p>
                            <p>Keep up the great work! 🎉</p>
                            """
                        )

                elif days_left < 0 and progress < 100:
                    milestone.status = "missed"
                    print(f"❌ Milestone {milestone.milestone_number} "
                          f"missed for project {project.name}")

                    # Send missed email to leader
                    if leader:
                        send_email(
                            to_email=leader.email,
                            subject=f"❌ Milestone Missed — "
                                    f"{milestone.title}",
                            body=f"""
                            <h3>Hello {leader.name},</h3>
                            <p>A milestone has been
                            <strong style='color:#dc2626'>
                            missed</strong>!</p>
                            <p><strong>Project:</strong>
                            {project.name}</p>
                            <p><strong>Milestone:</strong>
                            {milestone.title}</p>
                            <p><strong>Progress:</strong>
                            Only {progress}% completed</p>
                            <p><strong>Due Date Was:</strong>
                            {milestone.due_date}</p>
                            <p>Please review and take action
                            immediately.</p>
                            """
                        )

                elif days_left <= 3 and progress < 50:
                    milestone.status = "in_progress"
                    print(f"⚠️ Milestone {milestone.milestone_number} "
                          f"at risk for project {project.name}")

                    # Send at-risk warning
                    if leader:
                        send_email(
                            to_email=leader.email,
                            subject=f"⚠️ Milestone At Risk — "
                                    f"{milestone.title}",
                            body=f"""
                            <h3>Hello {leader.name},</h3>
                            <p>A milestone is
                            <strong style='color:#f59e0b'>
                            at risk</strong>!</p>
                            <p><strong>Project:</strong>
                            {project.name}</p>
                            <p><strong>Milestone:</strong>
                            {milestone.title}</p>
                            <p><strong>Due In:</strong>
                            {days_left} days</p>
                            <p><strong>Current Progress:</strong>
                            Only {progress}% done</p>
                            <p>Please take immediate action
                            to complete remaining tasks.</p>
                            """
                        )

                else:
                    milestone.status = "in_progress" \
                        if progress > 0 else "pending"

            db.commit()

        print("✅ Milestone Agent check complete!")

    except Exception as e:
        print(f"❌ Milestone Agent error: {e}")
    finally:
        db.close()


def run_milestone_agent():
    """Run every 24 hours"""
    while True:
        check_milestones()
        print("💤 Milestone Agent sleeping for 24 hours...")
        time.sleep(86400)


def start_milestone_agent():
    """Start in background thread"""
    thread = threading.Thread(
        target=run_milestone_agent,
        daemon=True
    )
    thread.start()
    print("🎯 AI Milestone Agent started in background!")