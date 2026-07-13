import os
import json
from datetime import datetime, timedelta
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def plan_sprints(tasks: list, project_name: str) -> dict:
    """
    Use AI to plan sprints from task list
    Each sprint is 2 weeks long
    """
    if not tasks:
        return {"sprints": []}

    # Prepare task summary for AI
    task_summary = ""
    for task in tasks:
        task_summary += (
            f"- Task: {task['title']}, "
            f"Priority: {task['priority']}, "
            f"Deadline: {task['deadline']}, "
            f"Status: {task['status']}\n"
        )

    prompt = f"""You are an Agile Sprint Planning AI.

Project: {project_name}

Tasks to plan:
{task_summary}

Create a sprint plan. Each sprint is exactly 14 days.
Start from today: {datetime.now().strftime('%Y-%m-%d')}

Rules:
- High priority tasks go in earlier sprints
- Each sprint should have 3-5 tasks maximum
- Tasks with earlier deadlines go in earlier sprints
- Balance the workload across sprints

Return ONLY valid JSON in this exact format:
{{
  "sprints": [
    {{
      "sprint_number": 1,
      "title": "Sprint 1 - Foundation",
      "start_date": "2024-01-01",
      "end_date": "2024-01-14",
      "tasks": ["Task name 1", "Task name 2"],
      "goal": "One sentence sprint goal",
      "ai_recommendation": "Brief advice for this sprint"
    }}
  ]
}}

Return ONLY the JSON, nothing else."""

    try:
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
        )

        result_text = response.choices[0].message\
            .content.strip()

        try:
            return json.loads(result_text)
        except:
            start = result_text.find("{")
            end = result_text.rfind("}") + 1
            if start != -1 and end > start:
                return json.loads(
                    result_text[start:end]
                )
            raise Exception("Could not parse response")

    except Exception as e:
        print(f"Sprint planning AI error: {e}")

        # Fallback — create basic sprints manually
        return create_basic_sprints(tasks)


def create_basic_sprints(tasks: list) -> dict:
    """
    Create basic sprints without AI
    Used as fallback if Groq fails
    """
    # Sort tasks by priority and deadline
    priority_order = {"high": 0, "medium": 1, "low": 2}
    sorted_tasks = sorted(
        tasks,
        key=lambda t: (
            priority_order.get(t["priority"], 1),
            t["deadline"] or "9999-12-31"
        )
    )

    sprints = []
    sprint_size = 3
    today = datetime.now()

    for i in range(0, len(sorted_tasks), sprint_size):
        sprint_num = (i // sprint_size) + 1
        sprint_tasks = sorted_tasks[i:i + sprint_size]

        start_date = today + timedelta(
            days=(sprint_num - 1) * 14
        )
        end_date = start_date + timedelta(days=13)

        sprints.append({
            "sprint_number": sprint_num,
            "title": f"Sprint {sprint_num}",
            "start_date": start_date.strftime(
                "%Y-%m-%d"
            ),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "tasks": [t["title"] for t in sprint_tasks],
            "goal": f"Complete {len(sprint_tasks)} tasks",
            "ai_recommendation": (
                "Focus on high priority tasks first."
            )
        })

    return {"sprints": sprints}


def generate_sprint_summary(sprint: dict) -> str:
    """Generate AI summary for a sprint"""
    try:
        prompt = f"""Write a very short (2-3 sentences) 
sprint summary for a project manager.

Sprint: {sprint['title']}
Duration: {sprint['start_date']} to {sprint['end_date']}
Tasks: {', '.join(sprint['tasks'])}
Goal: {sprint.get('goal', 'Complete sprint tasks')}

Write in simple, professional language."""

        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
        )

        return response.choices[0].message.content\
            .strip()

    except Exception as e:
        return f"Sprint {sprint['sprint_number']} " \
               f"contains {len(sprint['tasks'])} tasks " \
               f"to be completed by {sprint['end_date']}."