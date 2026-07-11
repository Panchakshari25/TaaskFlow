import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://127.0.0.1:8000";

function Workload() {
    const [workload, setWorkload] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadWorkload();
    }, []);

    async function loadWorkload() {
        try {
            const res = await axios.get(`${API}/workload`);
            setWorkload(res.data);
        } catch (error) {
            console.log("Error loading workload");
        }
        setLoading(false);
    }

    function getWorkloadEmoji(level) {
        switch (level) {
            case "free":       return "😊";
            case "low":        return "🟢";
            case "medium":     return "🟡";
            case "high":       return "🔴";
            case "overloaded": return "🚨";
            default:           return "⚪";
        }
    }

    function getWorkloadMessage(level) {
        switch (level) {
            case "free":       return "No tasks assigned";
            case "low":        return "Low workload — can take more tasks";
            case "medium":     return "Medium workload — manageable";
            case "high":       return "High workload — be careful";
            case "overloaded": return "Overloaded — reassign tasks immediately!";
            default:           return "";
        }
    }

    if (loading) {
        return (
            <div style={styles.container}>
                <p style={styles.loadingText}>
                    Loading workload data...
                </p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <h2 style={styles.pageTitle}>📈 Team Workload Meter</h2>
            <p style={styles.pageDesc}>
                See how much work each team member currently has.
                Red means overloaded, Green means available.
            </p>

            {/* Summary Cards */}
            <div style={styles.summaryRow}>
                <div style={styles.summaryCard}>
                    <p style={styles.summaryLabel}>Total Members</p>
                    <h2 style={styles.summaryNumber}>
                        {workload.length}
                    </h2>
                </div>
                <div style={styles.summaryCard}>
                    <p style={styles.summaryLabel}>🔴 High Workload</p>
                    <h2 style={{
                        ...styles.summaryNumber,
                        color: "#dc2626"
                    }}>
                        {workload.filter(
                            w => w.workload_level === "high" ||
                                 w.workload_level === "overloaded"
                        ).length}
                    </h2>
                </div>
                <div style={styles.summaryCard}>
                    <p style={styles.summaryLabel}>🟡 Medium Workload</p>
                    <h2 style={{
                        ...styles.summaryNumber,
                        color: "#f59e0b"
                    }}>
                        {workload.filter(
                            w => w.workload_level === "medium"
                        ).length}
                    </h2>
                </div>
                <div style={styles.summaryCard}>
                    <p style={styles.summaryLabel}>🟢 Low / Free</p>
                    <h2 style={{
                        ...styles.summaryNumber,
                        color: "#16a34a"
                    }}>
                        {workload.filter(
                            w => w.workload_level === "low" ||
                                 w.workload_level === "free"
                        ).length}
                    </h2>
                </div>
            </div>

            {/* Workload Cards */}
            <div style={styles.workloadList}>
                {workload.map((member) => (
                    <div key={member.id} style={styles.memberCard}>

                        {/* Left — Avatar and Info */}
                        <div style={styles.memberLeft}>
                            <div style={{
                                ...styles.avatar,
                                backgroundColor: member.workload_color
                            }}>
                                {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div style={styles.memberInfo}>
                                <h4 style={styles.memberName}>
                                    {member.name}
                                </h4>
                                <p style={styles.memberRole}>
                                    {member.role === "team_leader"
                                        ? "👑 Team Leader"
                                        : "👤 Employee"
                                    }
                                </p>
                                <p style={styles.memberEmail}>
                                    {member.email}
                                </p>
                            </div>
                        </div>

                        {/* Right — Workload Bar */}
                        <div style={styles.workloadRight}>

                            {/* Level Badge */}
                            <div style={styles.levelRow}>
                                <span style={{
                                    ...styles.levelBadge,
                                    backgroundColor:
                                        member.workload_color + "20",
                                    color: member.workload_color,
                                    borderColor: member.workload_color
                                }}>
                                    {getWorkloadEmoji(member.workload_level)}{" "}
                                    {member.workload_level.toUpperCase()}
                                </span>
                                <span style={styles.taskCount}>
                                    {member.active_tasks} active tasks
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div style={styles.barBackground}>
                                <div style={{
                                    ...styles.barFill,
                                    width: `${member.workload_percentage}%`,
                                    backgroundColor: member.workload_color
                                }} />
                            </div>

                            {/* Message */}
                            <p style={{
                                ...styles.workloadMessage,
                                color: member.workload_color
                            }}>
                                {getWorkloadMessage(member.workload_level)}
                            </p>

                            {/* Task Stats */}
                            <div style={styles.taskStats}>
                                <span style={styles.statItem}>
                                    ⏳ Active: {member.active_tasks}
                                </span>
                                <span style={styles.statItem}>
                                    ✅ Done: {member.completed_tasks}
                                </span>
                                <span style={styles.statItem}>
                                    📊 Total:{" "}
                                    {member.active_tasks +
                                     member.completed_tasks}
                                </span>
                            </div>

                        </div>

                    </div>
                ))}
            </div>

            {/* Refresh Button */}
            <button
                style={styles.refreshBtn}
                onClick={loadWorkload}
            >
                🔄 Refresh Workload Data
            </button>

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
        color: "#888",
        padding: "40px",
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
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        textAlign: "center",
    },
    summaryLabel: {
        margin: "0 0 8px 0",
        fontSize: "13px",
        color: "#888",
        fontWeight: "600",
    },
    summaryNumber: {
        margin: 0,
        fontSize: "32px",
        fontWeight: "bold",
        color: "#1a1a2e",
    },
    workloadList: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    memberCard: {
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        display: "flex",
        alignItems: "center",
        gap: "24px",
    },
    memberLeft: {
        display: "flex",
        alignItems: "center",
        gap: "16px",
        minWidth: "250px",
    },
    avatar: {
        width: "52px",
        height: "52px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: "bold",
        fontSize: "20px",
        flexShrink: 0,
    },
    memberInfo: {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
    },
    memberName: {
        margin: 0,
        fontSize: "16px",
        color: "#1a1a2e",
        fontWeight: "bold",
    },
    memberRole: {
        margin: 0,
        fontSize: "13px",
        color: "#888",
    },
    memberEmail: {
        margin: 0,
        fontSize: "12px",
        color: "#aaa",
    },
    workloadRight: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },
    levelRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    },
    levelBadge: {
        padding: "4px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "bold",
        border: "1px solid",
    },
    taskCount: {
        fontSize: "13px",
        color: "#888",
    },
    barBackground: {
        width: "100%",
        height: "12px",
        backgroundColor: "#f0f4f8",
        borderRadius: "6px",
        overflow: "hidden",
    },
    barFill: {
        height: "100%",
        borderRadius: "6px",
        transition: "width 0.5s ease",
    },
    workloadMessage: {
        margin: 0,
        fontSize: "13px",
        fontWeight: "600",
    },
    taskStats: {
        display: "flex",
        gap: "20px",
        marginTop: "4px",
    },
    statItem: {
        fontSize: "12px",
        color: "#888",
    },
    refreshBtn: {
        padding: "12px 24px",
        backgroundColor: "#4f46e5",
        color: "white",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "14px",
        alignSelf: "flex-start",
    },
};

export default Workload;