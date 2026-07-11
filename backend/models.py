from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

# Users table
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="employee")
    created_at = Column(DateTime, default=func.now())

# Projects table - one project = one uploaded agreement
class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=func.now())
    # One project has many modules
    modules = relationship("Module", back_populates="project")

# Modules table - big sections of a project
class Module(Base):
    __tablename__ = "modules"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"))
    created_at = Column(DateTime, default=func.now())
    project = relationship("Project", back_populates="modules")
    # One module has many tasks
    tasks = relationship("Task", back_populates="module")

# Tasks table
class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default="pending")
    # pending, in_progress, completed
    priority = Column(String, default="medium")
    # low, medium, high
    deadline = Column(String)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    module_id = Column(Integer, ForeignKey("modules.id"))
    created_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime, nullable=True)
    module = relationship("Module", back_populates="tasks")
    # One task has many subtasks
    subtasks = relationship("Subtask", back_populates="task")
    # Task history log
    history = relationship("TaskHistory", back_populates="task")

# Subtasks table
class Subtask(Base):
    __tablename__ = "subtasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    status = Column(String, default="pending")
    task_id = Column(Integer, ForeignKey("tasks.id"))
    created_at = Column(DateTime, default=func.now())
    task = relationship("Task", back_populates="subtasks")

# Task History table - logs every action on a task
class TaskHistory(Base):
    __tablename__ = "task_history"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    action = Column(String)
    # created, status_changed, assigned, completed
    done_by = Column(String)
    # name of person who did this action
    details = Column(Text)
    created_at = Column(DateTime, default=func.now())
    task = relationship("Task", back_populates="history")
    
    # Comments table - discussion on each task
class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    user_name = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now())
    
    # Milestones table
class Milestone(Base):
    __tablename__ = "milestones"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    title = Column(String, nullable=False)
    description = Column(Text)
    due_date = Column(String)
    status = Column(String, default="pending")
    # pending, in_progress, completed, missed
    milestone_number = Column(Integer)
    completion_percentage = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now())