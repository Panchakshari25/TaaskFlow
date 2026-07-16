import os
import json
import threading
import time
from datetime import datetime, date
from groq import Groq
from dotenv import load_dotenv
from database import SessionLocal
from models import Task, User, Project, Module
from email_helper import send_email

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
GITHUB_REPO = os.getenv("GITHUB_REPO", "")
GITHUB_USERNAME = os.getenv("GITHUB_USERNAME", "")


def get_release_readiness(
    project_id: int,
    db
) -> dict:
    """Check how ready project is for release"""

    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        return {}

    total_tasks = 0
    completed_tasks = 0
    pending_tasks = []
    modules_status = []

    for module in project.modules:
        mod_total = 0
        mod_completed = 0
        mod_pending = []

        for task in module.tasks:
            total_tasks += 1
            mod_total += 1

            if task.status == "completed":
                completed_tasks += 1
                mod_completed += 1
            else:
                pending_tasks.append({
                    "title": task.title,
                    "status": task.status,
                    "priority": task.priority,
                    "deadline": task.deadline
                })
                mod_pending.append(task.title)

        mod_percentage = int(
            (mod_completed / mod_total * 100)
        ) if mod_total > 0 else 0

        modules_status.append({
            "name": module.name,
            "total": mod_total,
            "completed": mod_completed,
            "percentage": mod_percentage,
            "pending": mod_pending
        })

    overall_percentage = int(
        (completed_tasks / total_tasks * 100)
    ) if total_tasks > 0 else 0

    is_ready = overall_percentage >= 100

    return {
        "project_name": project.name,
        "project_id": project.id,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "pending_tasks": pending_tasks,
        "overall_percentage": overall_percentage,
        "is_ready": is_ready,
        "modules_status": modules_status
    }


def generate_release_notes(
    project_name: str,
    commits: list,
    readiness: dict
) -> str:
    """Use Groq AI to generate release notes"""

    commit_summary = ""
    for commit in commits[:20]:
        commit_summary += (
            f"- {commit['message']}"
            f" ({commit['author']})\n"
        )

    modules_summary = ""
    for mod in readiness.get("modules_status", []):
        modules_summary += (
            f"- {mod['name']}: "
            f"{mod['percentage']}% complete\n"
        )

    prompt = f"""Generate professional release notes
for a software project.

Project: {project_name}
Overall Completion: {readiness.get('overall_percentage', 0)}%
Ready for Release: {readiness.get('is_ready', False)}

Module Status:
{modules_summary}

Recent Git Commits:
{commit_summary if commit_summary else 'No commits available'}

Write release notes that include:
1. Brief project description (1-2 sentences)
2. What features are included
3. What is still in progress
4. Known limitations if any

Keep it under 150 words.
Write in simple, professional language.
Do not use markdown headers with #."""

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
        print(f"Release notes AI error: {e}")

        percentage = readiness.get(
            'overall_percentage', 0
        )
        return (
            f"{project_name} Release Notes\n\n"
            f"Current completion: {percentage}%\n"
            f"Total tasks: "
            f"{readiness.get('total_tasks', 0)}\n"
            f"Completed: "
            f"{readiness.get('completed_tasks', 0)}\n\n"
            f"This release includes completed modules "
            f"and features as tracked in TaskFlow."
        )


def check_release_readiness_all():
    """Check all projects for release readiness"""
    print(f"\n🚀 Release Manager running at "
          f"{datetime.now().strftime('%H:%M:%S')}")

    db = SessionLocal()

    try:
        projects = db.query(Project).all()

        for project in projects:
            readiness = get_release_readiness(
                project.id, db
            )

            if not readiness:
                continue

            # Only notify when project is 100% done
            if readiness["is_ready"]:
                leader = db.query(User).filter(
                    User.id == project.created_by
                ).first()

                if leader:
                    # Get commits if repo available
                    commits = []
                    if GITHUB_REPO:
                        try:
                            from github_helper import \
                                get_repo_commits
                            commits = get_repo_commits(
                                GITHUB_REPO, 30
                            )
                        except:
                            pass

                    # Generate release notes
                    notes = generate_release_notes(
                        project.name,
                        commits,
                        readiness
                    )

                    # Send release ready email
                    send_email(
                        to_email=leader.email,
                        subject=(
                            f"🚀 Project Ready for Release "
                            f"— {project.name}"
                        ),
                        body=f"""
                        <h2 style='color:#16a34a'>
                            🚀 Project Ready for Release!
                        </h2>
                        <p>All tasks in
                        <strong>{project.name}</strong>
                        are completed and the project
                        is ready for release.</p>

                        <div style='background:#dcfce7;
                            padding:16px;
                            border-radius:8px;
                            margin:16px 0'>
                            <h3 style='margin:0;
                                color:#16a34a'>
                                ✅ 100% Complete
                            </h3>
                            <p style='margin:8px 0 0 0;
                                color:#16a34a'>
                                All {readiness['total_tasks']}
                                tasks completed successfully!
                            </p>
                        </div>

                        <h3>📝 AI Generated Release Notes:</h3>
                        <div style='background:#f8fafc;
                            padding:16px;
                            border-radius:8px;
                            border-left:4px solid #4f46e5'>
                            <p style='white-space:pre-line;
                                margin:0'>
                                {notes}
                            </p>
                        </div>
                        """
                    )
                    print(f"🚀 Release notification "
                          f"sent for {project.name}")

    except Exception as e:
        print(f"❌ Release Manager error: {e}")
    finally:
        db.close()


def run_release_manager():
    """Run every 12 hours"""
    while True:
        check_release_readiness_all()
        print("💤 Release Manager sleeping 12 hours...")
        time.sleep(43200)


def start_release_manager():
    """Start in background thread"""
    thread = threading.Thread(
        target=run_release_manager,
        daemon=True
    )
    thread.start()
    print("🚀 AI Release Manager started!")