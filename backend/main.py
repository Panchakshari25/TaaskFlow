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

# Create all tables
Base.metadata.create_all(bind=engine)

# Create uploads folder
os.makedirs("uploads", exist_ok=True)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────
# Input shapes
# ─────────────────────────────────────────

class RegisterInput(BaseModel):
    name: str
    email: str
    password: str
    role: str = "employee"

class LoginInput(BaseModel):
    email: str
    password: str

# ─────────────────────────────────────────
# Basic routes
# ─────────────────────────────────────────

@app.get("/")
def home():
    return {"message": "TaskFlow backend is running!"}

@app.post("/register")
def register(data: RegisterInput, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
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
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"user_id": user.id, "role": user.role})
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

# ─────────────────────────────────────────
# Upload agreement and create project
# ─────────────────────────────────────────

@app.post("/projects/upload")
async def upload_agreement(
    file: UploadFile = File(...),
    project_name: str = Form(...),
    user_id: int = Form(...),
    db: Session = Depends(get_db)
):
    # Save uploaded file
    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract text from file
    document_text = extract_text_from_file(file_path, file.filename)

    if not document_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Could not read text from file. Please use a PDF or Word document."
        )

    # Send to AI and get modules/tasks/subtasks
    ai_result = split_into_tasks(document_text, project_name)

    # Save project to database
    new_project = Project(
        name=project_name,
        description=f"Created from {file.filename}",
        created_by=user_id
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    # Save modules, tasks, subtasks
    for mod_data in ai_result.get("modules", []):
        new_module = Module(
            name=mod_data["name"],
            project_id=new_project.id
        )
        db.add(new_module)
        db.commit()
        db.refresh(new_module)

        for task_data in mod_data.get("tasks", []):
            # Calculate deadline date
            days = task_data.get("deadline_days", 7)
            deadline = (datetime.now() + timedelta(days=days)).strftime("%Y-%m-%d")

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

            # Save task history - created
            history = TaskHistory(
                task_id=new_task.id,
                action="created",
                done_by="AI System",
                details=f"Task created automatically from agreement document"
            )
            db.add(history)

            # Save subtasks
            for sub_data in task_data.get("subtasks", []):
                new_subtask = Subtask(
                    title=sub_data["title"],
                    task_id=new_task.id
                )
                db.add(new_subtask)

        db.commit()

    return {
        "message": "Project created successfully!",
        "project_id": new_project.id,
        "project_name": new_project.name
    }

# ─────────────────────────────────────────
# Get all projects
# ─────────────────────────────────────────

@app.get("/projects")
def get_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    result = []
    for p in projects:
        result.append({
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "created_at": str(p.created_at)
        })
    return result

# ─────────────────────────────────────────
# Get all modules and tasks for a project
# ─────────────────────────────────────────

@app.get("/projects/{project_id}/tasks")
def get_project_tasks(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

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
            task_data = {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "status": task.status,
                "priority": task.priority,
                "deadline": task.deadline,
                "assigned_to": task.assigned_to,
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