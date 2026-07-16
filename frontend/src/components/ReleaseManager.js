import { useState, useEffect } from "react";
import axios from "axios";

const API = process.env.REACT_APP_API_URL ||
    "http://127.0.0.1:8000";

function ReleaseManager() {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] =
        useState("");
    const [releaseData, setReleaseData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState("");

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

    async function checkRelease() {
        if (!selectedProject) {
            setMessage(
                "Please select a project first."
            );
            return;
        }

        setLoading(true);
        setMessage("");
        setReleaseData(null);

        try {
            const res = await axios.get(
                `${API}/projects/${selectedProject}/release-status`
            );
            setReleaseData(res.data);
        } catch (error) {
            setMessage(
                "Error checking release status."
            );
        }

        setLoading(false);
    }

    async function sendReleaseReport() {
        setSending(true);
        setMessage("");

        try {
            await axios.post(
                `${API}/projects/${selectedProject}/send-release-report`
            );
            setMessage(
                "✅ Release report sent to " +
                "team leader's email!"
            );
        } catch (error) {
            setMessage(
                "❌ Failed to send release report."
            );
        }

        setSending(false);
    }

    function getReadinessColor(percentage) {
        if (percentage >= 100) return "#16a34a";
        if (percentage >= 75) return "#f59e0b";
        if (percentage >= 50) return "#f97316";
        return "#dc2626";
    }

    function getModuleIcon(percentage) {
        if (percentage === 100) return "✅";
        if (percentage >= 50) return "🔄";
        return "⏳";
    }

    return (
        <div style={styles.container}>
            <h2 style={styles.pageTitle}>
                🚀 AI Release Manager
            </h2>
            <p style={styles.pageDesc}>
                Check if your project is ready for
                release. AI analyzes all tasks and
                GitHub commits to generate professional
                release notes automatically.
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
                            onChange={(e) => {
                                setSelectedProject(
                                    e.target.value
                                );
                                setReleaseData(null);
                                setMessage("");
                            }}
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
                                loading
                                    ? styles.btnDisabled
                                    : styles.btn
                            }
                            onClick={checkRelease}
                            disabled={loading}
                        >
                            {loading
                                ? "⏳ Analyzing..."
                                : "🔍 Check Release Status"
                            }
                        </button>
                    </div>
                </div>

                {message && (
                    <p style={
                        message.includes("✅")
                            ? styles.success
                            : styles.error
                    }>
                        {message}
                    </p>
                )}
            </div>

            {/* Release Status */}
            {releaseData && (
                <>
                    {/* Readiness Banner */}
                    <div style={{
                        ...styles.readinessBanner,
                        backgroundColor:
                            releaseData.is_ready
                                ? "#dcfce7"
                                : "#fef9c3",
                        borderColor:
                            releaseData.is_ready
                                ? "#16a34a"
                                : "#f59e0b"
                    }}>
                        <div>
                            <h2 style={{
                                margin: 0,
                                color: releaseData.is_ready
                                    ? "#16a34a"
                                    : "#f59e0b",
                                fontSize: "24px"
                            }}>
                                {releaseData.is_ready
                                    ? "🚀 READY FOR RELEASE!"
                                    : "⏳ NOT READY YET"
                                }
                            </h2>
                            <p style={{
                                margin: "4px 0 0 0",
                                color: "#888",
                                fontSize: "14px"
                            }}>
                                {releaseData.project_name}
                                {" · "}
                                {releaseData.commits_analyzed}
                                {" "}commits analyzed
                            </p>
                        </div>

                        <button
                            style={
                                sending
                                    ? styles.sendBtnDisabled
                                    : styles.sendBtn
                            }
                            onClick={sendReleaseReport}
                            disabled={sending}
                        >
                            {sending
                                ? "📧 Sending..."
                                : "📧 Send Release Report"
                            }
                        </button>
                    </div>

                    {/* Progress Overview */}
                    <div style={styles.progressBox}>
                        <div style={styles.progressHeader}>
                            <h3 style={styles.sectionTitle}>
                                📊 Overall Progress
                            </h3>
                            <span style={{
                                fontSize: "24px",
                                fontWeight: "bold",
                                color: getReadinessColor(
                                    releaseData
                                    .overall_percentage
                                )
                            }}>
                                {releaseData
                                    .overall_percentage}%
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div style={styles.progressBar}>
                            <div style={{
                                ...styles.progressFill,
                                width: `${releaseData.overall_percentage}%`,
                                backgroundColor:
                                    getReadinessColor(
                                        releaseData
                                        .overall_percentage
                                    )
                            }} />
                        </div>

                        <div style={styles.progressStats}>
                            <span style={styles.statBadge}>
                                ✅ {releaseData
                                    .completed_tasks}{" "}
                                completed
                            </span>
                            <span style={{
                                ...styles.statBadge,
                                backgroundColor: "#fee2e2",
                                color: "#dc2626"
                            }}>
                                ⏳ {releaseData
                                    .pending_tasks
                                    .length}{" "}
                                pending
                            </span>
                            <span style={{
                                ...styles.statBadge,
                                backgroundColor: "#eff6ff",
                                color: "#4f46e5"
                            }}>
                                📋 {releaseData
                                    .total_tasks}{" "}
                                total
                            </span>
                        </div>
                    </div>

                    {/* Module Status */}
                    <div style={styles.modulesBox}>
                        <h3 style={styles.sectionTitle}>
                            📁 Module Status
                        </h3>
                        {releaseData.modules_status
                            .map((mod, i) => (
                            <div
                                key={i}
                                style={{
                                    ...styles.moduleItem,
                                    borderLeft: `4px solid ${
                                        getReadinessColor(
                                            mod.percentage
                                        )
                                    }`
                                }}
                            >
                                <div style={
                                    styles.moduleHeader
                                }>
                                    <span style={
                                        styles.moduleIcon
                                    }>
                                        {getModuleIcon(
                                            mod.percentage
                                        )}
                                    </span>
                                    <span style={
                                        styles.moduleName
                                    }>
                                        {mod.name}
                                    </span>
                                    <span style={{
                                        ...styles.modulePercent,
                                        color:
                                            getReadinessColor(
                                                mod.percentage
                                            )
                                    }}>
                                        {mod.percentage}%
                                    </span>
                                </div>

                                <div style={
                                    styles.moduleBar
                                }>
                                    <div style={{
                                        ...styles
                                            .moduleFill,
                                        width:
                                            `${mod.percentage}%`,
                                        backgroundColor:
                                            getReadinessColor(
                                                mod
                                                .percentage
                                            )
                                    }} />
                                </div>

                                <p style={
                                    styles.moduleStats
                                }>
                                    {mod.completed}/
                                    {mod.total} tasks done
                                </p>

                                {mod.pending.length > 0
                                    && (
                                    <div style={
                                        styles.modulePending
                                    }>
                                        <p style={
                                            styles
                                            .pendingLabel
                                        }>
                                            Pending:
                                        </p>
                                        {mod.pending
                                            .map((t, j) => (
                                            <span
                                                key={j}
                                                style={
                                                    styles
                                                    .pendingTag
                                                }
                                            >
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Release Notes */}
                    <div style={styles.notesBox}>
                        <h3 style={styles.sectionTitle}>
                            📝 AI Generated Release Notes
                        </h3>
                        <p style={styles.notesText}>
                            {releaseData.release_notes}
                        </p>
                    </div>

                    {/* Pending Tasks */}
                    {releaseData.pending_tasks.length > 0
                        && (
                        <div style={styles.pendingBox}>
                            <h3 style={{
                                ...styles.sectionTitle,
                                color: "#dc2626"
                            }}>
                                ⏳ Tasks Still Pending
                            </h3>
                            {releaseData.pending_tasks
                                .map((task, i) => (
                                <div
                                    key={i}
                                    style={
                                        styles.pendingTask
                                    }
                                >
                                    <div>
                                        <p style={
                                            styles
                                            .pendingTaskTitle
                                        }>
                                            {task.title}
                                        </p>
                                        <p style={
                                            styles
                                            .pendingTaskMeta
                                        }>
                                            Status:{" "}
                                            {task.status}
                                            {" · "}
                                            Priority:{" "}
                                            {task.priority}
                                            {" · "}
                                            Due:{" "}
                                            {task.deadline}
                                        </p>
                                    </div>
                                    <span style={{
                                        ...styles
                                            .priorityBadge,
                                        backgroundColor:
                                            task.priority
                                            === "high"
                                                ? "#fee2e2"
                                                : task
                                                .priority
                                                === "medium"
                                                ? "#fef9c3"
                                                : "#dcfce7",
                                        color:
                                            task.priority
                                            === "high"
                                                ? "#dc2626"
                                                : task
                                                .priority
                                                === "medium"
                                                ? "#ca8a04"
                                                : "#16a34a"
                                    }}>
                                        {task.priority
                                            .toUpperCase()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </>
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
        padding: "12px",
        backgroundColor: "#dcfce7",
        borderRadius: "8px",
    },
    error: {
        color: "#dc2626",
        fontWeight: "bold",
        margin: 0,
        padding: "12px",
        backgroundColor: "#fee2e2",
        borderRadius: "8px",
    },
    readinessBanner: {
        borderRadius: "12px",
        padding: "24px 28px",
        border: "2px solid",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    sendBtn: {
        padding: "12px 24px",
        backgroundColor: "#4f46e5",
        color: "white",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "14px",
    },
    sendBtnDisabled: {
        padding: "12px 24px",
        backgroundColor: "#a5b4fc",
        color: "white",
        border: "none",
        borderRadius: "8px",
        cursor: "not-allowed",
        fontWeight: "bold",
        fontSize: "14px",
    },
    progressBox: {
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    progressHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    sectionTitle: {
        margin: 0,
        fontSize: "18px",
        color: "#1a1a2e",
        fontWeight: "bold",
    },
    progressBar: {
        width: "100%",
        height: "16px",
        backgroundColor: "#f0f4f8",
        borderRadius: "8px",
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: "8px",
        transition: "width 0.5s ease",
    },
    progressStats: {
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
    },
    statBadge: {
        padding: "6px 14px",
        backgroundColor: "#dcfce7",
        color: "#16a34a",
        borderRadius: "20px",
        fontSize: "13px",
        fontWeight: "bold",
    },
    modulesBox: {
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
    },
    moduleItem: {
        padding: "16px",
        backgroundColor: "#f8fafc",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },
    moduleHeader: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
    },
    moduleIcon: {
        fontSize: "18px",
    },
    moduleName: {
        flex: 1,
        fontSize: "15px",
        color: "#1a1a2e",
        fontWeight: "bold",
    },
    modulePercent: {
        fontSize: "16px",
        fontWeight: "bold",
    },
    moduleBar: {
        width: "100%",
        height: "8px",
        backgroundColor: "#e2e8f0",
        borderRadius: "4px",
        overflow: "hidden",
    },
    moduleFill: {
        height: "100%",
        borderRadius: "4px",
        transition: "width 0.3s ease",
    },
    moduleStats: {
        margin: 0,
        fontSize: "12px",
        color: "#888",
    },
    modulePending: {
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        alignItems: "center",
    },
    pendingLabel: {
        margin: 0,
        fontSize: "12px",
        color: "#888",
        fontWeight: "bold",
    },
    pendingTag: {
        padding: "3px 10px",
        backgroundColor: "#fee2e2",
        color: "#dc2626",
        borderRadius: "4px",
        fontSize: "12px",
    },
    notesBox: {
        backgroundColor: "#f8fafc",
        borderRadius: "12px",
        padding: "24px",
        border: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    notesText: {
        margin: 0,
        fontSize: "14px",
        color: "#444",
        lineHeight: "1.8",
        whiteSpace: "pre-line",
    },
    pendingBox: {
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    pendingTask: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px",
        backgroundColor: "#fff8f8",
        borderRadius: "8px",
        border: "1px solid #fecaca",
    },
    pendingTaskTitle: {
        margin: "0 0 4px 0",
        fontSize: "14px",
        color: "#1a1a2e",
        fontWeight: "bold",
    },
    pendingTaskMeta: {
        margin: 0,
        fontSize: "12px",
        color: "#888",
    },
    priorityBadge: {
        padding: "4px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "bold",
    },
};

export default ReleaseManager;