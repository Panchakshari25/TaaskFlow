import { useState, useEffect } from "react";
import axios from "axios";

const API = process.env.REACT_APP_API_URL ||
    "http://127.0.0.1:8000";

function SprintPlanning() {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] =
        useState("");
    const [sprints, setSprints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [planning, setPlanning] = useState(false);
    const [message, setMessage] = useState("");
    const [totalTasks, setTotalTasks] = useState(0);

    useEffect(() => {
        loadProjects();
    }, []);

    async function loadProjects() {
        try {
            const res = await axios.get(
                `${API}/projects`
            );
            setProjects(res.data);
        } catch (error) {
            console.log("Error loading projects");
        }
    }

    async function loadExistingSprints(projectId) {
        try {
            const res = await axios.get(
                `${API}/projects/${projectId}/sprints`
            );
            setSprints(res.data);
        } catch (error) {
            console.log("Error loading sprints");
        }
    }

    async function handleProjectChange(projectId) {
        setSelectedProject(projectId);
        setSprints([]);
        setMessage("");
        if (projectId) {
            await loadExistingSprints(projectId);
        }
    }

    async function generateSprints() {
        if (!selectedProject) {
            setMessage("Please select a project first.");
            return;
        }

        setPlanning(true);
        setMessage(
            "🤖 AI is planning sprints... please wait..."
        );
        setSprints([]);

        try {
            const res = await axios.post(
                `${API}/projects/${selectedProject}/plan-sprints`
            );

            setSprints(res.data.sprints);
            setTotalTasks(res.data.total_tasks);
            setMessage(
                `✅ AI created ${res.data.sprints.length} ` +
                `sprints for ${res.data.total_tasks} tasks!`
            );

        } catch (error) {
            setMessage(
                error.response?.data?.detail ||
                "Error planning sprints."
            );
        }

        setPlanning(false);
    }

    function getStatusColor(status) {
        switch (status) {
            case "active":    return "#16a34a";
            case "completed": return "#4f46e5";
            case "planned":   return "#f59e0b";
            default:          return "#888";
        }
    }

    function getStatusIcon(status) {
        switch (status) {
            case "active":    return "🟢";
            case "completed": return "✅";
            case "planned":   return "📅";
            default:          return "⏳";
        }
    }

    function getDaysLeft(endDate) {
        const end = new Date(endDate);
        const today = new Date();
        const diff = Math.ceil(
            (end - today) / (1000 * 60 * 60 * 24)
        );
        if (diff < 0) return "Ended";
        if (diff === 0) return "Ends today";
        return `${diff} days left`;
    }

    function getPriorityIcon(task) {
        if (task.toLowerCase().includes("high") ||
            task.toLowerCase().includes("critical")) {
            return "🔴";
        }
        if (task.toLowerCase().includes("low")) {
            return "🟢";
        }
        return "🟡";
    }

    return (
        <div style={styles.container}>
            <h2 style={styles.pageTitle}>
                🏃 Sprint Planning AI
            </h2>
            <p style={styles.pageDesc}>
                Our AI automatically divides your project
                tasks into 2-week sprints based on
                priority, deadlines, and workload balance.
            </p>

            {/* Project Selection */}
            <div style={styles.controlBox}>
                <div style={styles.controlRow}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>
                            Select Project
                        </label>
                        <select
                            style={styles.select}
                            value={selectedProject}
                            onChange={(e) =>
                                handleProjectChange(
                                    e.target.value
                                )
                            }
                        >
                            <option value="">
                                -- Choose a project --
                            </option>
                            {projects.map(p => (
                                <option
                                    key={p.id}
                                    value={p.id}
                                >
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>
                            &nbsp;
                        </label>
                        <button
                            style={
                                planning
                                    ? styles.btnDisabled
                                    : styles.btn
                            }
                            onClick={generateSprints}
                            disabled={planning}
                        >
                            {planning
                                ? "⏳ AI Planning..."
                                : "🤖 Generate Sprint Plan"
                            }
                        </button>
                    </div>
                </div>

                {message && (
                    <p style={
                        message.includes("✅")
                            ? styles.success
                            : message.includes("🤖")
                            ? styles.info
                            : styles.error
                    }>
                        {message}
                    </p>
                )}
            </div>

            {/* Sprint Summary */}
            {sprints.length > 0 && (
                <div style={styles.summaryRow}>
                    <div style={styles.summaryCard}>
                        <p style={styles.summaryLabel}>
                            Total Sprints
                        </p>
                        <h2 style={styles.summaryNum}>
                            {sprints.length}
                        </h2>
                    </div>
                    <div style={styles.summaryCard}>
                        <p style={styles.summaryLabel}>
                            Total Tasks
                        </p>
                        <h2 style={styles.summaryNum}>
                            {totalTasks}
                        </h2>
                    </div>
                    <div style={styles.summaryCard}>
                        <p style={styles.summaryLabel}>
                            Duration
                        </p>
                        <h2 style={styles.summaryNum}>
                            {sprints.length * 2} weeks
                        </h2>
                    </div>
                    <div style={styles.summaryCard}>
                        <p style={styles.summaryLabel}>
                            End Date
                        </p>
                        <h2 style={{
                            ...styles.summaryNum,
                            fontSize: "16px"
                        }}>
                            {sprints[sprints.length - 1]
                                ?.end_date}
                        </h2>
                    </div>
                </div>
            )}

            {/* Sprint Cards */}
            {sprints.length > 0 && (
                <div style={styles.sprintList}>
                    {sprints.map((sprint, index) => (
                        <div
                            key={sprint.id || index}
                            style={{
                                ...styles.sprintCard,
                                borderTop: `4px solid ${
                                    getStatusColor(
                                        sprint.status
                                    )
                                }`
                            }}
                        >
                            {/* Sprint Header */}
                            <div style={styles.sprintHeader}>
                                <div style={styles.sprintLeft}>
                                    <div style={{
                                        ...styles.sprintNum,
                                        backgroundColor:
                                            getStatusColor(
                                                sprint.status
                                            )
                                    }}>
                                        {sprint.sprint_number}
                                    </div>
                                    <div>
                                        <h3 style={
                                            styles.sprintTitle
                                        }>
                                            {sprint.title}
                                        </h3>
                                        <p style={
                                            styles.sprintDates
                                        }>
                                            📅 {sprint.start_date}
                                            {" → "}
                                            {sprint.end_date}
                                            {" · "}
                                            <span style={{
                                                color:
                                                    getStatusColor(
                                                        sprint.status
                                                    ),
                                                fontWeight: "bold"
                                            }}>
                                                {getDaysLeft(
                                                    sprint.end_date
                                                )}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                <span style={{
                                    ...styles.statusBadge,
                                    backgroundColor:
                                        getStatusColor(
                                            sprint.status
                                        ) + "20",
                                    color: getStatusColor(
                                        sprint.status
                                    ),
                                    border: `1px solid ${
                                        getStatusColor(
                                            sprint.status
                                        )
                                    }`
                                }}>
                                    {getStatusIcon(
                                        sprint.status
                                    )}{" "}
                                    {sprint.status
                                        .charAt(0)
                                        .toUpperCase() +
                                        sprint.status.slice(1)
                                    }
                                </span>
                            </div>

                            {/* Sprint Goal */}
                            {sprint.goal && (
                                <div style={styles.goalBox}>
                                    <p style={styles.goalText}>
                                        🎯 <strong>Goal:</strong>{" "}
                                        {sprint.goal}
                                    </p>
                                </div>
                            )}

                            {/* Tasks */}
                            {sprint.tasks &&
                                sprint.tasks.length > 0 && (
                                <div style={styles.taskSection}>
                                    <p style={styles.taskHeading}>
                                        Tasks in this sprint:
                                    </p>
                                    <div style={styles.taskList}>
                                        {sprint.tasks.map(
                                            (task, i) => (
                                            <div
                                                key={i}
                                                style={
                                                    styles.taskItem
                                                }
                                            >
                                                <span>
                                                    {getPriorityIcon(
                                                        task
                                                    )}
                                                </span>
                                                <span style={
                                                    styles.taskName
                                                }>
                                                    {task}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* AI Summary */}
                            {sprint.ai_summary && (
                                <div style={styles.aiSummary}>
                                    <p style={
                                        styles.aiSummaryTitle
                                    }>
                                        🤖 AI Summary:
                                    </p>
                                    <p style={
                                        styles.aiSummaryText
                                    }>
                                        {sprint.ai_summary}
                                    </p>
                                </div>
                            )}

                            {/* AI Recommendation */}
                            {sprint.ai_recommendation && (
                                <div style={styles.recommendation}>
                                    <p style={
                                        styles.recommendationText
                                    }>
                                        💡 {sprint.ai_recommendation}
                                    </p>
                                </div>
                            )}

                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {sprints.length === 0 &&
                !planning &&
                selectedProject && (
                <div style={styles.emptyState}>
                    <p style={styles.emptyIcon}>🏃</p>
                    <p style={styles.emptyTitle}>
                        No sprints planned yet
                    </p>
                    <p style={styles.emptyDesc}>
                        Click Generate Sprint Plan to let
                        AI organize your tasks into sprints
                    </p>
                </div>
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
    pageDesc: {
        margin: 0,
        fontSize: "14px",
        color: "#888",
        lineHeight: "1.6",
    },
    controlBox: {
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "28px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    controlRow: {
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: "16px",
        alignItems: "end",
    },
    formGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    label: {
        fontSize: "14px",
        color: "#444",
        fontWeight: "600",
    },
    select: {
        padding: "12px",
        fontSize: "15px",
        borderRadius: "8px",
        border: "1px solid #ddd",
        outline: "none",
        backgroundColor: "white",
    },
    btn: {
        padding: "12px 24px",
        fontSize: "15px",
        backgroundColor: "#4f46e5",
        color: "white",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "bold",
        whiteSpace: "nowrap",
    },
    btnDisabled: {
        padding: "12px 24px",
        fontSize: "15px",
        backgroundColor: "#a5b4fc",
        color: "white",
        border: "none",
        borderRadius: "8px",
        cursor: "not-allowed",
        fontWeight: "bold",
        whiteSpace: "nowrap",
    },
    success: {
        color: "#16a34a",
        fontWeight: "bold",
        margin: 0,
    },
    info: {
        color: "#4f46e5",
        fontWeight: "bold",
        margin: 0,
    },
    error: {
        color: "#dc2626",
        fontWeight: "bold",
        margin: 0,
    },
    summaryRow: {
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "16px",
    },
    summaryCard: {
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "20px",
        textAlign: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    },
    summaryLabel: {
        margin: "0 0 8px 0",
        fontSize: "13px",
        color: "#888",
        fontWeight: "600",
    },
    summaryNum: {
        margin: 0,
        fontSize: "28px",
        fontWeight: "bold",
        color: "#1a1a2e",
    },
    sprintList: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    sprintCard: {
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    sprintHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    sprintLeft: {
        display: "flex",
        alignItems: "flex-start",
        gap: "14px",
    },
    sprintNum: {
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: "bold",
        fontSize: "16px",
        flexShrink: 0,
    },
    sprintTitle: {
        margin: "0 0 4px 0",
        fontSize: "18px",
        color: "#1a1a2e",
        fontWeight: "bold",
    },
    sprintDates: {
        margin: 0,
        fontSize: "13px",
        color: "#888",
    },
    statusBadge: {
        padding: "4px 14px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "bold",
        flexShrink: 0,
    },
    goalBox: {
        backgroundColor: "#eff6ff",
        borderRadius: "8px",
        padding: "12px 16px",
        border: "1px solid #bfdbfe",
    },
    goalText: {
        margin: 0,
        fontSize: "14px",
        color: "#1e40af",
    },
    taskSection: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },
    taskHeading: {
        margin: 0,
        fontSize: "13px",
        color: "#888",
        fontWeight: "bold",
        textTransform: "uppercase",
    },
    taskList: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    taskItem: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 12px",
        backgroundColor: "#f8fafc",
        borderRadius: "6px",
        border: "1px solid #e2e8f0",
    },
    taskName: {
        fontSize: "14px",
        color: "#1a1a2e",
    },
    aiSummary: {
        backgroundColor: "#f8fafc",
        borderRadius: "8px",
        padding: "14px",
        border: "1px solid #e2e8f0",
    },
    aiSummaryTitle: {
        margin: "0 0 6px 0",
        fontSize: "12px",
        color: "#888",
        fontWeight: "bold",
        textTransform: "uppercase",
    },
    aiSummaryText: {
        margin: 0,
        fontSize: "14px",
        color: "#444",
        lineHeight: "1.6",
    },
    recommendation: {
        backgroundColor: "#fefce8",
        borderRadius: "8px",
        padding: "12px 16px",
        border: "1px solid #fef08a",
    },
    recommendationText: {
        margin: 0,
        fontSize: "13px",
        color: "#854d0e",
    },
    emptyState: {
        textAlign: "center",
        padding: "60px",
        backgroundColor: "white",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    },
    emptyIcon: {
        fontSize: "48px",
        margin: "0 0 16px 0",
    },
    emptyTitle: {
        margin: "0 0 8px 0",
        fontSize: "18px",
        color: "#1a1a2e",
        fontWeight: "bold",
    },
    emptyDesc: {
        margin: 0,
        fontSize: "14px",
        color: "#888",
    },
};

export default SprintPlanning;