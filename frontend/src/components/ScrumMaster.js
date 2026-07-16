import { useState, useEffect } from "react";
import axios from "axios";

const API = process.env.REACT_APP_API_URL ||
    "http://127.0.0.1:8000";

function ScrumMaster() {
    const [status, setStatus] = useState(null);
    const [aiReport, setAiReport] = useState("");
    const [generatedAt, setGeneratedAt] = useState("");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        loadStatus();
    }, []);

    async function loadStatus() {
        setLoading(true);
        try {
            const res = await axios.get(
                `${API}/scrum/status`
            );
            setStatus(res.data.status);
            setAiReport(res.data.ai_report);
            setGeneratedAt(res.data.generated_at);
        } catch (error) {
            console.log("Error loading scrum status");
        }
        setLoading(false);
    }

    async function sendReport() {
        setSending(true);
        setMessage("");
        try {
            await axios.post(
                `${API}/scrum/daily-report`
            );
            setMessage(
                "✅ Daily scrum report sent to " +
                "team leader's email!"
            );
        } catch (error) {
            setMessage("❌ Failed to send report.");
        }
        setSending(false);
    }

    if (loading) {
        return (
            <div style={styles.container}>
                <p style={styles.loadingText}>
                    🤖 AI Scrum Master is analyzing
                    project status...
                </p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <h2 style={styles.pageTitle}>
                🤖 AI Scrum Master
            </h2>
            <p style={styles.pageDesc}>
                Your AI Scrum Master automatically
                generates daily standup reports and
                sends them to the team leader every
                morning.
            </p>

            {/* Header Actions */}
            <div style={styles.actionBox}>
                <div>
                    <p style={styles.generatedAt}>
                        Last updated: {generatedAt}
                    </p>
                </div>
                <div style={styles.actionButtons}>
                    <button
                        style={styles.refreshBtn}
                        onClick={loadStatus}
                    >
                        🔄 Refresh
                    </button>
                    <button
                        style={
                            sending
                                ? styles.sendBtnDisabled
                                : styles.sendBtn
                        }
                        onClick={sendReport}
                        disabled={sending}
                    >
                        {sending
                            ? "📧 Sending..."
                            : "📧 Send Report Now"
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

            {status && (
                <div style={styles.reportGrid}>

                    {/* Done Yesterday */}
                    <div style={styles.reportCard}>
                        <h3 style={{
                            ...styles.cardTitle,
                            color: "#16a34a"
                        }}>
                            ✅ Completed Yesterday
                        </h3>
                        {status.done_yesterday.length > 0
                            ? status.done_yesterday.map(
                                (item, i) => (
                                <div
                                    key={i}
                                    style={styles.doneItem}
                                >
                                    <span style={
                                        styles.itemTask
                                    }>
                                        {item.task}
                                    </span>
                                    <span style={
                                        styles.itemBy
                                    }>
                                        by {item.by}
                                    </span>
                                </div>
                            ))
                            : (
                            <p style={styles.emptyText}>
                                No tasks completed yesterday
                            </p>
                        )}
                    </div>

                    {/* In Progress */}
                    <div style={styles.reportCard}>
                        <h3 style={{
                            ...styles.cardTitle,
                            color: "#f59e0b"
                        }}>
                            🔄 In Progress Today
                        </h3>
                        {status.in_progress.length > 0
                            ? status.in_progress
                                .slice(0, 5)
                                .map((item, i) => (
                                <div
                                    key={i}
                                    style={styles.progressItem}
                                >
                                    <span style={
                                        styles.itemTask
                                    }>
                                        {item.task}
                                    </span>
                                    <span style={
                                        styles.itemBy
                                    }>
                                        {item.by} •{" "}
                                        Due: {item.deadline}
                                    </span>
                                </div>
                            ))
                            : (
                            <p style={styles.emptyText}>
                                No tasks in progress
                            </p>
                        )}
                    </div>

                    {/* Blockers */}
                    <div style={styles.reportCard}>
                        <h3 style={{
                            ...styles.cardTitle,
                            color: "#dc2626"
                        }}>
                            🚨 Blockers
                        </h3>
                        {status.overdue.length > 0
                            ? status.overdue
                                .slice(0, 5)
                                .map((item, i) => (
                                <div
                                    key={i}
                                    style={styles.blockerItem}
                                >
                                    <span style={
                                        styles.itemTask
                                    }>
                                        {item.task}
                                    </span>
                                    <span style={{
                                        ...styles.itemBy,
                                        color: "#dc2626"
                                    }}>
                                        Overdue since{" "}
                                        {item.deadline}
                                        {" "}({item.by})
                                    </span>
                                </div>
                            ))
                            : (
                            <div style={styles.noBlockers}>
                                ✅ No blockers today!
                            </div>
                        )}
                    </div>

                    {/* Team Workload */}
                    <div style={styles.reportCard}>
                        <h3 style={{
                            ...styles.cardTitle,
                            color: "#4f46e5"
                        }}>
                            👥 Team Workload
                        </h3>
                        {status.team_workload.length > 0
                            ? status.team_workload.map(
                                (emp, i) => (
                                <div
                                    key={i}
                                    style={styles.workloadItem}
                                >
                                    <span style={
                                        styles.empName
                                    }>
                                        👤 {emp.name}
                                    </span>
                                    <span style={
                                        styles.empWorkload
                                    }>
                                        {emp.active_tasks}{" "}
                                        tasks —{" "}
                                        {emp.workload}
                                    </span>
                                </div>
                            ))
                            : (
                            <p style={styles.emptyText}>
                                No employees found
                            </p>
                        )}
                    </div>

                </div>
            )}

            {/* AI Report */}
            {aiReport && (
                <div style={styles.aiReportBox}>
                    <h3 style={styles.aiReportTitle}>
                        🤖 AI Scrum Master Analysis
                    </h3>
                    <p style={styles.aiReportText}>
                        {aiReport}
                    </p>
                </div>
            )}

            {/* Auto Schedule Info */}
            <div style={styles.scheduleInfo}>
                <h3 style={styles.scheduleTitle}>
                    ⏰ Automatic Schedule
                </h3>
                <p style={styles.scheduleText}>
                    The AI Scrum Master automatically
                    sends this report to the team
                    leader every day at midnight.
                    No manual action needed.
                </p>
                <div style={styles.scheduleItems}>
                    <div style={styles.scheduleItem}>
                        <span style={styles.scheduleIcon}>
                            📧
                        </span>
                        <span>
                            Daily email sent at midnight
                        </span>
                    </div>
                    <div style={styles.scheduleItem}>
                        <span style={styles.scheduleIcon}>
                            🤖
                        </span>
                        <span>
                            AI analyzes all tasks
                            automatically
                        </span>
                    </div>
                    <div style={styles.scheduleItem}>
                        <span style={styles.scheduleIcon}>
                            📊
                        </span>
                        <span>
                            Tracks progress, blockers
                            and workload
                        </span>
                    </div>
                </div>
            </div>

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
    loadingText: {
        textAlign: "center",
        color: "#4f46e5",
        padding: "40px",
        fontSize: "16px",
        fontWeight: "bold",
    },
    actionBox: {
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "20px 28px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    generatedAt: {
        margin: 0,
        fontSize: "13px",
        color: "#888",
    },
    actionButtons: {
        display: "flex",
        gap: "12px",
    },
    refreshBtn: {
        padding: "10px 20px",
        backgroundColor: "#f0f4f8",
        color: "#4f46e5",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "14px",
    },
    sendBtn: {
        padding: "10px 20px",
        backgroundColor: "#4f46e5",
        color: "white",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "14px",
    },
    sendBtnDisabled: {
        padding: "10px 20px",
        backgroundColor: "#a5b4fc",
        color: "white",
        border: "none",
        borderRadius: "8px",
        cursor: "not-allowed",
        fontWeight: "bold",
        fontSize: "14px",
    },
    success: {
        color: "#16a34a",
        fontWeight: "bold",
        margin: 0,
        padding: "12px 16px",
        backgroundColor: "#dcfce7",
        borderRadius: "8px",
    },
    error: {
        color: "#dc2626",
        fontWeight: "bold",
        margin: 0,
        padding: "12px 16px",
        backgroundColor: "#fee2e2",
        borderRadius: "8px",
    },
    reportGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "20px",
    },
    reportCard: {
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    cardTitle: {
        margin: 0,
        fontSize: "16px",
        fontWeight: "bold",
    },
    doneItem: {
        padding: "10px 12px",
        backgroundColor: "#dcfce7",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
    },
    progressItem: {
        padding: "10px 12px",
        backgroundColor: "#fef9c3",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
    },
    blockerItem: {
        padding: "10px 12px",
        backgroundColor: "#fee2e2",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
    },
    workloadItem: {
        padding: "10px 12px",
        backgroundColor: "#f8fafc",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    itemTask: {
        fontSize: "14px",
        color: "#1a1a2e",
        fontWeight: "600",
    },
    itemBy: {
        fontSize: "12px",
        color: "#888",
    },
    empName: {
        fontSize: "14px",
        color: "#1a1a2e",
        fontWeight: "600",
    },
    empWorkload: {
        fontSize: "13px",
        color: "#888",
    },
    emptyText: {
        color: "#aaa",
        fontSize: "13px",
        textAlign: "center",
        padding: "12px",
        margin: 0,
    },
    noBlockers: {
        padding: "12px",
        backgroundColor: "#dcfce7",
        borderRadius: "8px",
        color: "#16a34a",
        fontWeight: "bold",
        textAlign: "center",
    },
    aiReportBox: {
        backgroundColor: "#eff6ff",
        borderRadius: "12px",
        padding: "24px",
        border: "1px solid #bfdbfe",
    },
    aiReportTitle: {
        margin: "0 0 12px 0",
        fontSize: "16px",
        color: "#1e40af",
        fontWeight: "bold",
    },
    aiReportText: {
        margin: 0,
        fontSize: "14px",
        color: "#1e40af",
        lineHeight: "1.8",
        whiteSpace: "pre-line",
    },
    scheduleInfo: {
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    },
    scheduleTitle: {
        margin: "0 0 8px 0",
        fontSize: "16px",
        color: "#1a1a2e",
        fontWeight: "bold",
    },
    scheduleText: {
        margin: "0 0 16px 0",
        fontSize: "14px",
        color: "#888",
        lineHeight: "1.6",
    },
    scheduleItems: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    scheduleItem: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontSize: "14px",
        color: "#444",
    },
    scheduleIcon: {
        fontSize: "18px",
    },
};

export default ScrumMaster;