import { useState, useEffect } from "react";
import axios from "axios";
import TaskHistory from "./TaskHistory";

const API = "http://127.0.0.1:8000";

function Projects() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [projectName, setProjectName] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectTasks, setProjectTasks] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const res = await axios.get(`${API}/projects`);
      setProjects(res.data);
    } catch (error) {
      console.log("Error loading projects");
    }
  }

  async function handleUpload() {
    if (!projectName || !file) {
      setMessage("Please enter project name and select a file.");
      return;
    }

    setLoading(true);
    setMessage("Uploading file and analyzing with AI... please wait...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("project_name", projectName);
      formData.append("user_id", user.id);

      await axios.post(`${API}/projects/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setMessage("Project created successfully! AI has split it into tasks.");
      setProjectName("");
      setFile(null);
      loadProjects();

    } catch (error) {
      setMessage(
        error.response?.data?.detail || "Upload failed. Please try again."
      );
    }

    setLoading(false);
  }

  async function loadProjectTasks(projectId) {
    try {
      const res = await axios.get(`${API}/projects/${projectId}/tasks`);
      setProjectTasks(res.data);
      setSelectedProject(projectId);
    } catch (error) {
      console.log("Error loading tasks");
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.pageTitle}>📁 Projects</h2>

      {/* Upload Section - only for team leaders */}
      {user?.role === "team_leader" && (
        <div style={styles.uploadBox}>
          <h3 style={styles.sectionTitle}>Upload Agreement File</h3>
          <p style={styles.sectionDesc}>
            Upload your client agreement PDF or Word file. Our AI will
            automatically read it and split it into modules, tasks and
            subtasks.
          </p>

          <input
            style={styles.input}
            type="text"
            placeholder="Enter project name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />

          <input
            style={styles.fileInput}
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={(e) => setFile(e.target.files[0])}
          />

          {file && (
            <p style={styles.fileName}>📄 Selected: {file.name}</p>
          )}

          <button
            style={loading ? styles.buttonDisabled : styles.button}
            onClick={handleUpload}
            disabled={loading}
          >
            {loading ? "⏳ AI is analyzing..." : "🚀 Upload & Generate Tasks"}
          </button>

          {message && (
            <p style={
              message.includes("successfully")
                ? styles.success
                : styles.error
            }>
              {message}
            </p>
          )}
        </div>
      )}

      {/* Projects List */}
      <div style={styles.projectsList}>
        <h3 style={styles.sectionTitle}>All Projects</h3>

        {projects.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No projects yet. Upload an agreement file to create one!</p>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} style={styles.projectCard}>
              <div style={styles.projectInfo}>
                <h4 style={styles.projectName}>📁 {project.name}</h4>
                <p style={styles.projectDesc}>{project.description}</p>
                <p style={styles.projectDate}>
                  Created: {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                style={styles.viewButton}
                onClick={() => loadProjectTasks(project.id)}
              >
                View Tasks
              </button>
            </div>
          ))
        )}
      </div>

      {/* Task Board */}
      {projectTasks && (
        <div style={styles.taskBoard}>
          <h3 style={styles.sectionTitle}>
            📋 {projectTasks.project_name} — Task Board
          </h3>

          {projectTasks.modules.map((module) => (
            <div key={module.id} style={styles.moduleBox}>
              <h4 style={styles.moduleName}>🗂 {module.name}</h4>

              <div style={styles.taskGrid}>
                {module.tasks.map((task) => (
                  <div key={task.id} style={styles.taskCard}>

                    {/* Priority and Status */}
                    <div style={styles.taskHeader}>
                      <span style={
                        task.priority === "high"
                          ? styles.priorityHigh
                          : task.priority === "medium"
                          ? styles.priorityMedium
                          : styles.priorityLow
                      }>
                        {task.priority.toUpperCase()}
                      </span>
                      <span style={styles.taskStatus}>
                        {task.status}
                      </span>
                    </div>

                    <h5 style={styles.taskTitle}>{task.title}</h5>
                    <p style={styles.taskDesc}>{task.description}</p>
                    <p style={styles.taskDeadline}>
                      📅 Deadline: {task.deadline}
                    </p>

                    {/* Subtasks */}
                    <div style={styles.subtaskList}>
                      <p style={styles.subtaskHeading}>Subtasks:</p>
                      {task.subtasks.map((sub) => (
                        <div key={sub.id} style={styles.subtaskItem}>
                          ☐ {sub.title}
                        </div>
                      ))}
                    </div>

                    {/* View History Button */}
                    <button
                      style={styles.historyBtn}
                      onClick={() => {
                        setSelectedTask(task);
                        setShowHistory(true);
                      }}
                    >
                      📋 View History
                    </button>

                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task History Popup */}
      {showHistory && selectedTask && (
        <TaskHistory
          taskId={selectedTask.id}
          taskTitle={selectedTask.title}
          onClose={() => {
            setShowHistory(false);
            setSelectedTask(null);
          }}
        />
      )}

    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  pageTitle: {
    margin: 0,
    fontSize: "24px",
    color: "#1a1a2e",
    fontWeight: "bold",
  },
  uploadBox: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "28px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "18px",
    color: "#1a1a2e",
    fontWeight: "bold",
  },
  sectionDesc: {
    margin: 0,
    fontSize: "14px",
    color: "#888",
    lineHeight: "1.6",
  },
  input: {
    padding: "12px",
    fontSize: "15px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    outline: "none",
  },
  fileInput: {
    padding: "10px",
    fontSize: "14px",
    border: "2px dashed #ddd",
    borderRadius: "8px",
    cursor: "pointer",
    backgroundColor: "#f8fafc",
  },
  fileName: {
    margin: 0,
    fontSize: "13px",
    color: "#4f46e5",
    fontWeight: "bold",
  },
  button: {
    padding: "14px",
    fontSize: "16px",
    backgroundColor: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  buttonDisabled: {
    padding: "14px",
    fontSize: "16px",
    backgroundColor: "#a5b4fc",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "not-allowed",
    fontWeight: "bold",
  },
  success: {
    color: "#16a34a",
    fontWeight: "bold",
    margin: 0,
  },
  error: {
    color: "#dc2626",
    fontWeight: "bold",
    margin: 0,
  },
  projectsList: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "28px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  emptyState: {
    padding: "24px",
    textAlign: "center",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "2px dashed #e2e8f0",
    color: "#aaa",
  },
  projectCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
  },
  projectInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  projectName: {
    margin: 0,
    fontSize: "16px",
    color: "#1a1a2e",
    fontWeight: "bold",
  },
  projectDesc: {
    margin: 0,
    fontSize: "13px",
    color: "#888",
  },
  projectDate: {
    margin: 0,
    fontSize: "12px",
    color: "#aaa",
  },
  viewButton: {
    padding: "8px 18px",
    backgroundColor: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  },
  taskBoard: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "28px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  moduleBox: {
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "16px",
    backgroundColor: "#f8fafc",
  },
  moduleName: {
    margin: "0 0 14px 0",
    fontSize: "16px",
    color: "#1a1a2e",
    fontWeight: "bold",
  },
  taskGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "14px",
  },
  taskCard: {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "16px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    border: "1px solid #e2e8f0",
  },
  taskHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priorityHigh: {
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "bold",
  },
  priorityMedium: {
    backgroundColor: "#fef9c3",
    color: "#ca8a04",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "bold",
  },
  priorityLow: {
    backgroundColor: "#dcfce7",
    color: "#16a34a",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "bold",
  },
  taskStatus: {
    fontSize: "11px",
    color: "#888",
    textTransform: "capitalize",
  },
  taskTitle: {
    margin: 0,
    fontSize: "14px",
    color: "#1a1a2e",
    fontWeight: "bold",
  },
  taskDesc: {
    margin: 0,
    fontSize: "12px",
    color: "#888",
    lineHeight: "1.5",
  },
  taskDeadline: {
    margin: 0,
    fontSize: "12px",
    color: "#4f46e5",
    fontWeight: "bold",
  },
  subtaskList: {
    borderTop: "1px solid #f0f0f0",
    paddingTop: "8px",
    marginTop: "4px",
  },
  subtaskHeading: {
    margin: "0 0 6px 0",
    fontSize: "11px",
    color: "#888",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  subtaskItem: {
    fontSize: "12px",
    color: "#555",
    padding: "3px 0",
  },
  historyBtn: {
    padding: "6px 12px",
    backgroundColor: "#f0f4f8",
    color: "#4f46e5",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
    marginTop: "4px",
  },
};

export default Projects;