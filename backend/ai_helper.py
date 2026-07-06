import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def extract_text_from_file(file_path: str, filename: str) -> str:
    """Read text from uploaded file"""

    if filename.endswith(".pdf"):
        try:
            import PyPDF2
            text = ""
            with open(file_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    text += page.extract_text() or ""
            return text
        except Exception as e:
            print(f"PDF error: {e}")
            return ""

    elif filename.endswith(".docx"):
        try:
            from docx import Document
            doc = Document(file_path)
            text = ""
            for para in doc.paragraphs:
                text += para.text + "\n"
            return text
        except Exception as e:
            print(f"DOCX error: {e}")
            return ""

    else:
        # Plain text file
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        except Exception as e:
            print(f"Text file error: {e}")
            return ""


def split_into_tasks(document_text: str, project_name: str) -> dict:
    """Send document to AI and get modules/tasks/subtasks"""

    prompt = f"""You are a project manager AI. Read this project document and create a structured plan.

Project Name: {project_name}

Document:
{document_text[:2000]}

Return ONLY a valid JSON object in this exact format:

{{
  "modules": [
    {{
      "name": "Module Name",
      "tasks": [
        {{
          "title": "Task title",
          "description": "Brief description",
          "priority": "high",
          "deadline_days": 7,
          "subtasks": [
            {{"title": "Subtask 1"}},
            {{"title": "Subtask 2"}}
          ]
        }}
      ]
    }}
  ]
}}

Rules:
- Create 3 to 4 modules
- Each module has 2 to 3 tasks
- Each task has 2 subtasks
- priority is only: low, medium, or high
- deadline_days is a number between 3 and 30
- Return ONLY the JSON, nothing else"""

    try:
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
        )

        result_text = response.choices[0].message.content.strip()
        print("AI Response:", result_text[:200])

        # Try to parse JSON
        try:
            return json.loads(result_text)
        except:
            # Extract JSON if AI added extra text
            start = result_text.find("{")
            end = result_text.rfind("}") + 1
            if start != -1 and end > start:
                json_str = result_text[start:end]
                return json.loads(json_str)
            else:
                raise Exception("Could not parse AI response as JSON")

    except Exception as e:
        print(f"AI Error: {e}")
        # Return a default structure if AI fails
        return {
            "modules": [
                {
                    "name": "Module 1 - Planning",
                    "tasks": [
                        {
                            "title": "Requirements Analysis",
                            "description": "Analyze all project requirements",
                            "priority": "high",
                            "deadline_days": 5,
                            "subtasks": [
                                {"title": "Gather requirements"},
                                {"title": "Document requirements"}
                            ]
                        },
                        {
                            "title": "Project Planning",
                            "description": "Create project plan and timeline",
                            "priority": "high",
                            "deadline_days": 7,
                            "subtasks": [
                                {"title": "Create timeline"},
                                {"title": "Assign responsibilities"}
                            ]
                        }
                    ]
                },
                {
                    "name": "Module 2 - Development",
                    "tasks": [
                        {
                            "title": "Frontend Development",
                            "description": "Build user interface",
                            "priority": "medium",
                            "deadline_days": 14,
                            "subtasks": [
                                {"title": "Design screens"},
                                {"title": "Implement UI"}
                            ]
                        },
                        {
                            "title": "Backend Development",
                            "description": "Build server and database",
                            "priority": "medium",
                            "deadline_days": 14,
                            "subtasks": [
                                {"title": "Create APIs"},
                                {"title": "Setup database"}
                            ]
                        }
                    ]
                },
                {
                    "name": "Module 3 - Testing",
                    "tasks": [
                        {
                            "title": "Unit Testing",
                            "description": "Test individual components",
                            "priority": "medium",
                            "deadline_days": 20,
                            "subtasks": [
                                {"title": "Write test cases"},
                                {"title": "Fix bugs"}
                            ]
                        },
                        {
                            "title": "Final Testing",
                            "description": "Test complete system",
                            "priority": "high",
                            "deadline_days": 25,
                            "subtasks": [
                                {"title": "Integration testing"},
                                {"title": "User acceptance testing"}
                            ]
                        }
                    ]
                }
            ]
        }