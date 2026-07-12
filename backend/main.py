from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta
import os
import shutil

from database import engine, get_db, Base
from models import User, Project, Module, Task, Subtask, TaskHistory
from auth import hash_password, verify_password, create_access_token
from ai_helper import extract_text_from_file, split_into_tasks
from email_helper import send_task_completed
from scheduler import start_scheduler
from milestone_agent import start_milestone_agent, create_milestones_for_project
from github_helper import (
    get_user_repos,
    get_repo_commits,
    get_developer_commits,
    calculate_commit_score
)


Base.metadata.create_all(bind=engine)
os.makedirs("uploads", exist_ok=True)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

start_scheduler()
start_milestone_agent()


class RegisterInput(BaseModel):
    name: str
    email: str
    password: str
    role: str = "employee"


class LoginInput(BaseModel):
    email: str
    password: str


class TaskStatusUpdate(BaseModel):
    status: str
    user_id: int
    user_name: str


class AssignTaskInput(BaseModel):
    user_id: int
    
class GitHubRepoInput(BaseModel):
    repo_name: str
    developer_name: str = ""
    days: int = 7   
    
class PRAnalysisInput(BaseModel):
    repo_name: str
    state: str = "all"
    
class CommentInput(BaseModel):
    user_id: int
    user_name: str
    message: str


@app.get("/")
def home():
    return {"message": "TaskFlow backend is running!"}


@app.post("/register")
def register(data: RegisterInput, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(
        User.email == data.email
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    hashed = hash_password(data.password)
    new_user = User(
        name=data.name,
        email=data.email,
        password=hashed,
        role=data.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Registration successful!", "user_id": new_user.id}


@app.post("/login")
def login(data: LoginInput, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.email == data.email
    ).first()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )
    token = create_access_token(
        {"user_id": user.id, "role": user.role}
    )
    return {
        "message": "Login successful!",
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }


@app.get("/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role
        }
        for u in users
    ]


@app.post("/projects/upload")
async def upload_agreement(
    file: UploadFile = File(...),
    project_name: str = Form(...),
    user_id: int = Form(...),
    db: Session = Depends(get_db)
):
    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    document_text = extract_text_from_file(file_path, file.filename)

    if not document_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Could not read text from file."
        )

    ai_result = split_into_tasks(document_text, project_name)

    new_project = Project(
        name=project_name,
        description=f"Created from {file.filename}",
        created_by=user_id
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    for mod_data in ai_result.get("modules", []):
        new_module = Module(
            name=mod_data["name"],
            project_id=new_project.id
        )
        db.add(new_module)
        db.commit()
        db.refresh(new_module)

        for task_data in mod_data.get("tasks", []):
            days = task_data.get("deadline_days", 7)
            deadline = (
                datetime.now() + timedelta(days=days)
            ).strftime("%Y-%m-%d")

            new_task = Task(
                title=task_data["title"],
                description=task_data.get("description", ""),
                priority=task_data.get("priority", "medium"),
                deadline=deadline,
                status="pending",
                module_id=new_module.id
            )
            db.add(new_task)
            db.commit()
            db.refresh(new_task)

            history = TaskHistory(
                task_id=new_task.id,
                action="created",
                done_by="AI System",
                details="Task created from agreement"
            )
            db.add(history)

            for sub_data in task_data.get("subtasks", []):
                new_subtask = Subtask(
                    title=sub_data["title"],
                    task_id=new_task.id
                )
                db.add(new_subtask)
        db.commit()

    # Create milestones automatically
    create_milestones_for_project(new_project.id, db)

    return {
        "message": "Project created successfully!",
        "project_id": new_project.id,
        "project_name": new_project.name
    } 


@app.get("/projects")
def get_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "created_at": str(p.created_at)
        }
        for p in projects
    ]


@app.get("/projects/{project_id}/tasks")
def get_project_tasks(
    project_id: int,
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()
    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    result = {
        "project_name": project.name,
        "modules": []
    }

    for module in project.modules:
        mod_data = {
            "id": module.id,
            "name": module.name,
            "tasks": []
        }

        for task in module.tasks:
            assigned_name = None
            if task.assigned_to:
                assigned_user = db.query(User).filter(
                    User.id == task.assigned_to
                ).first()
                if assigned_user:
                    assigned_name = assigned_user.name

            task_data = {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "status": task.status,
                "priority": task.priority,
                "deadline": task.deadline,
                "assigned_to": task.assigned_to,
                "assigned_name": assigned_name,
                "completed_at": str(task.completed_at)
                    if task.completed_at else None,
                "subtasks": [
                    {
                        "id": s.id,
                        "title": s.title,
                        "status": s.status
                    }
                    for s in task.subtasks
                ]
            }
            mod_data["tasks"].append(task_data)

        result["modules"].append(mod_data)

    return result


@app.put("/tasks/{task_id}/status")
def update_task_status(
    task_id: int,
    data: TaskStatusUpdate,
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    old_status = task.status
    task.status = data.status

    if data.status == "completed":
        task.completed_at = datetime.now()

        module = db.query(Module).filter(
            Module.id == task.module_id
        ).first()
        if module:
            project = db.query(Project).filter(
                Project.id == module.project_id
            ).first()
            if project:
                leader = db.query(User).filter(
                    User.id == project.created_by
                ).first()
                if leader:
                    send_task_completed(
                        leader_name=leader.name,
                        leader_email=leader.email,
                        task_title=task.title,
                        employee_name=data.user_name,
                        project_name=project.name,
                        completed_at=datetime.now().strftime(
                            "%d %B %Y at %I:%M %p"
                        )
                    )

    history = TaskHistory(
        task_id=task.id,
        action="status_changed",
        done_by=data.user_name,
        details=f"Status changed from {old_status} to {data.status}"
    )
    db.add(history)
    db.commit()

    return {"message": f"Task status updated to {data.status}"}


@app.put("/tasks/{task_id}/assign")
def assign_task(
    task_id: int,
    data: AssignTaskInput,
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    task.assigned_to = data.user_id

    history = TaskHistory(
        task_id=task.id,
        action="assigned",
        done_by="Team Leader",
        details=f"Task assigned to {user.name}"
    )
    db.add(history)
    db.commit()

    return {"message": f"Task assigned to {user.name}"}


@app.get("/tasks/{task_id}/history")
def get_task_history(
    task_id: int,
    db: Session = Depends(get_db)
):
    history = db.query(TaskHistory).filter(
        TaskHistory.task_id == task_id
    ).order_by(TaskHistory.created_at.desc()).all()

    return [
        {
            "id": h.id,
            "action": h.action,
            "done_by": h.done_by,
            "details": h.details,
            "created_at": str(h.created_at)
        }
        for h in history
    ]
      
@app.get("/workload")
def get_workload(db: Session = Depends(get_db)):
    users = db.query(User).all()
    result = []

    for user in users:
        # Count pending and in_progress tasks
        active_tasks = db.query(Task).filter(
            Task.assigned_to == user.id,
            Task.status.in_(["pending", "in_progress", "overdue"])
        ).count()

        # Count completed tasks
        completed_tasks = db.query(Task).filter(
            Task.assigned_to == user.id,
            Task.status == "completed"
        ).count()

        # Calculate workload level
        if active_tasks == 0:
            level = "free"
            color = "#16a34a"
            percentage = 0
        elif active_tasks <= 2:
            level = "low"
            color = "#16a34a"
            percentage = 25
        elif active_tasks <= 4:
            level = "medium"
            color = "#f59e0b"
            percentage = 60
        elif active_tasks <= 6:
            level = "high"
            color = "#dc2626"
            percentage = 85
        else:
            level = "overloaded"
            color = "#7f1d1d"
            percentage = 100

        result.append({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "active_tasks": active_tasks,
            "completed_tasks": completed_tasks,
            "workload_level": level,
            "workload_color": color,
            "workload_percentage": percentage
        })

    return result
@app.post("/tasks/{task_id}/comments")
def add_comment(
    task_id: int,
    data: CommentInput,
    db: Session = Depends(get_db)
):
    from models import Comment
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    new_comment = Comment(
        task_id=task_id,
        user_id=data.user_id,
        user_name=data.user_name,
        message=data.message
    )
    db.add(new_comment)

    # Log in history
    history = TaskHistory(
        task_id=task_id,
        action="comment_added",
        done_by=data.user_name,
        details=f"Comment added: {data.message[:50]}..."
            if len(data.message) > 50
            else f"Comment added: {data.message}"
    )
    db.add(history)
    db.commit()

    return {"message": "Comment added successfully!"}


@app.get("/tasks/{task_id}/comments")
def get_comments(
    task_id: int,
    db: Session = Depends(get_db)
):
    from models import Comment
    comments = db.query(Comment).filter(
        Comment.task_id == task_id
    ).order_by(Comment.created_at.asc()).all()

    return [
        {
            "id": c.id,
            "user_id": c.user_id,
            "user_name": c.user_name,
            "message": c.message,
            "created_at": str(c.created_at)
        }
        for c in comments
    ]
    
@app.get("/projects/{project_id}/milestones")
def get_milestones(
    project_id: int,
    db: Session = Depends(get_db)
):
    from models import Milestone

    milestones = db.query(Milestone).filter(
        Milestone.project_id == project_id
    ).order_by(Milestone.milestone_number).all()

    return [
        {
            "id": m.id,
            "title": m.title,
            "description": m.description,
            "due_date": m.due_date,
            "status": m.status,
            "milestone_number": m.milestone_number,
            "completion_percentage": m.completion_percentage,
            "updated_at": str(m.updated_at)
        }
        for m in milestones
    ]
    
    @app.get("/github/repos")
    def github_repos():
        repos = get_user_repos()
        if not repos:
            raise HTTPException(
                status_code=400,
                detail="Could not fetch GitHub repos. Check your token."
            )
        return repos


@app.post("/github/commits")
def github_commits(data: GitHubRepoInput):
    if data.developer_name:
        commits = get_developer_commits(
            data.repo_name,
            data.developer_name,
            data.days
        )
    else:
        commits = get_repo_commits(
            data.repo_name,
            data.days
        )

    score = calculate_commit_score(commits)

    return {
        "commits": commits,
        "score": score,
        "repo": data.repo_name,
        "developer": data.developer_name or "All"
    }


@app.post("/github/progress-score")
def github_progress_score(data: GitHubRepoInput):
    commits = get_developer_commits(
        data.repo_name,
        data.developer_name,
        data.days
    )
    score = calculate_commit_score(commits)
    return score
  
@app.post("/github/pull-requests")
def get_pull_requests(data: PRAnalysisInput):
    from github_helper import (
        get_pull_requests,
        analyze_pr_quality,
        get_pr_statistics
    )

    prs = get_pull_requests(
        data.repo_name,
        data.state
    )

    if not prs:
        return {
            "pull_requests": [],
            "statistics": {},
            "message": "No PRs found"
        }

    # Analyze each PR
    analyzed_prs = []
    for pr in prs:
        analysis = analyze_pr_quality(pr)
        analyzed_prs.append({
            **pr,
            "analysis": analysis
        })

    # Get overall statistics
    stats = get_pr_statistics(data.repo_name)

    return {
        "pull_requests": analyzed_prs,
        "statistics": stats
    }
    
@app.post("/test-email")
def test_email():
    from email_helper import send_email
    result = send_email(
        to_email="panchaksharichakor9881@gmail.com",
        subject="TaskFlow Test Email",
        body="<p>Your backend email is working!</p>"
    )
    if result:
        return {"message": "Test email sent! Check your Gmail."}
    else:
        raise HTTPException(
            status_code=500,
            detail="Email failed. Check App Password in .env file."
        )
        
        
        