import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://127.0.0.1:8000";

function Milestones({ projectId, projectName }) {
    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (projectId) loadMilestones();
    }, [projectId]);

    async function loadMilestones() {
        try {
            const res = await axios.get(
                `${API}/projects/${projectId}/milestones`
            );
            setMilestones(res.data);
        } catch (error) {
            console.log("Error loading milestones");
        }
        setLoading(false);
    }

    function getStatusColor(status) {
        switch (status) {
            case "completed":  return "#16a34a";
            case "in_progress": return "#f59e0b";
            case "missed":     return "#dc2626";
            case "pending":    return "#888";
            default:           return "#888";
        }
    }

    function getStatusIcon(status) {
        switch (status) {
            case "completed":   return "✅";
            case "in_progress": return "🔄";
            case "missed":      return "❌";
            case "pending":     return "⏳";
            default:            return "⏳";
        }
    }

    function getStatusLabel(status) {
        switch (status) {
            case "completed":   return "Completed";
            case "in_progress": return "In Progress";
            case "missed":      return "Missed";
            case "pending":     return "Pending";
            default:            return "Pending";
        }
    }

    if (loading) {
        return (
            <p style={{ color: "#888", padding: "20px" }}>
                Loading milestones...
            </p>
        );
    }

    if (milestones.length === 0) {
        return (
            <div style={styles.emptyState}>
                <p>No milestones yet.</p>
                <p>Upload a project to generate milestones.</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>
                🎯 AI Milestones — {projectName}
            </h3>

            {/* Progress Overview */}
            <div style={styles.overviewRow}>
                <div style={styles.overviewCard}>
                    <p style={styles.overviewLabel}>Total</p>
                    <h3 style={styles.overviewNum}>
                        {milestones.length}
                    </h3>
                </div>
                <div style={styles.overviewCard}>
                    <p style={styles.overviewLabel}>✅ Done</p>
                    <h3 style={{
                        ...styles.overviewNum,
                        color: "#16a34a"
                    }}>
                        {milestones.filter(
                            m => m.status === "completed"
                        ).length}
                    </h3>
                </div>
                <div style={styles.overviewCard}>
                    <p style={styles.overviewLabel}>🔄 Running</p>
                    <h3 style={{
                        ...styles.overviewNum,
                        color: "#f59e0b"
                    }}>
                        {milestones.filter(
                            m => m.status === "in_progress"
                        ).length}
                    </h3>
                </div>
                <div style={styles.overviewCard}>
                    <p style={styles.overviewLabel}>❌ Missed</p>
                    <h3 style={{
                        ...styles.overviewNum,
                        color: "#dc2626"
                    }}>
                        {milestones.filter(
                            m => m.status === "missed"
                        ).length}
                    </h3>
                </div>
            </div>

            {/* Milestone Cards */}
            <div style={styles.milestoneList}>
                {milestones.map((milestone, index) => (
                    <div
                        key={milestone.id}
                        style={{
                            ...styles.milestoneCard,
                            borderLeft: `4px solid ${
                                getStatusColor(milestone.status)
                            }`
                        }}
                    >
                        {/* Header */}
                        <div style={styles.milestoneHeader}>
                            <div style={styles.milestoneLeft}>
                                <div style={{
                                    ...styles.milestoneNumber,
                                    backgroundColor:
                                        getStatusColor(milestone.status)
                                }}>
                                    {milestone.milestone_number}
                                </div>
                                <div>
                                    <h4 style={styles.milestoneTitle}>
                                        {milestone.title}
                                    </h4>
                                    <p style={styles.milestoneDesc}>
                                        {milestone.description}
                                    </p>
                                </div>
                            </div>

                            <div style={styles.milestoneRight}>
                                <span style={{
                                    ...styles.statusBadge,
                                    backgroundColor:
                                        getStatusColor(
                                            milestone.status
                                        ) + "20",
                                    color: getStatusColor(
                                        milestone.status
                                    ),
                                    border: `1px solid ${
                                        getStatusColor(milestone.status)
                                    }`
                                }}>
                                    {getStatusIcon(milestone.status)}{" "}
                                    {getStatusLabel(milestone.status)}
                                </span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div style={styles.progressSection}>
                            <div style={styles.progressHeader}>
                                <span style={styles.progressLabel}>
                                    Task Completion
                                </span>
                                <span style={{
                                    ...styles.progressPercent,
                                    color: getStatusColor(milestone.status)
                                }}>
                                    {milestone.completion_percentage}%
                                </span>
                            </div>
                            <div style={styles.progressBar}>
                                <div style={{
                                    ...styles.progressFill,
                                    width: `${milestone.completion_percentage}%`,
                                    backgroundColor: getStatusColor(
                                        milestone.status
                                    )
                                }} />
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={styles.milestoneFooter}>
                            <span style={styles.dueDate}>
                                📅 Due: {milestone.due_date}
                            </span>
                            <span style={styles.updatedAt}>
                                🔄 Last updated:{" "}
                                {new Date(
                                    milestone.updated_at
                                ).toLocaleDateString()}
                            </span>
                        </div>

                    </div>
                ))}
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    title: {
        margin: 0,
        fontSize: "18px",
        color: "#1a1a2e",
        fontWeight: "bold",
    },
    emptyState: {
        textAlign: "center",
        padding: "30px",
        backgroundColor: "#f8fafc",
        borderRadius: "8px",
        border: "2px dashed #e2e8f0",
        color: "#aaa",
    },
    overviewRow: {
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "12px",
    },
    overviewCard: {
        backgroundColor: "#f8fafc",
        borderRadius: "8px",
        padding: "16px",
        textAlign: "center",
        border: "1px solid #e2e8f0",
    },
    overviewLabel: {
        margin: "0 0 8px 0",
        fontSize: "12px",
        color: "#888",
        fontWeight: "600",
    },
    overviewNum: {
        margin: 0,
        fontSize: "28px",
        fontWeight: "bold",
        color: "#1a1a2e",
    },
    milestoneList: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    milestoneCard: {
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    milestoneHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    milestoneLeft: {
        display: "flex",
        alignItems: "flex-start",
        gap: "14px",
        flex: 1,
    },
    milestoneNumber: {
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: "bold",
        fontSize: "16px",
        flexShrink: 0,
    },
    milestoneTitle: {
        margin: "0 0 4px 0",
        fontSize: "15px",
        color: "#1a1a2e",
        fontWeight: "bold",
    },
    milestoneDesc: {
        margin: 0,
        fontSize: "13px",
        color: "#888",
    },
    milestoneRight: {
        flexShrink: 0,
    },
    statusBadge: {
        padding: "4px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "bold",
    },
    progressSection: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    progressHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    progressLabel: {
        fontSize: "12px",
        color: "#888",
        fontWeight: "600",
    },
    progressPercent: {
        fontSize: "14px",
        fontWeight: "bold",
    },
    progressBar: {
        width: "100%",
        height: "10px",
        backgroundColor: "#f0f4f8",
        borderRadius: "5px",
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: "5px",
        transition: "width 0.5s ease",
    },
    milestoneFooter: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    dueDate: {
        fontSize: "12px",
        color: "#4f46e5",
        fontWeight: "600",
    },
    updatedAt: {
        fontSize: "12px",
        color: "#aaa",
    },
};

export default Milestones;