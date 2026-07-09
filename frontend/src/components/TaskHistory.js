import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://127.0.0.1:8000";

function TaskHistory({ taskId, taskTitle, onClose }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, [taskId]);

    async function loadHistory() {
        try {
            const res = await axios.get(
                `${API}/tasks/${taskId}/history`
            );
            setHistory(res.data);
        } catch (error) {
            console.log("Error loading history");
        }
        setLoading(false);
    }

    function getActionColor(action) {
        switch (action) {
            case "created":       return "#16a34a";
            case "assigned":      return "#4f46e5";
            case "status_changed": return "#f59e0b";
            case "completed":     return "#16a34a";
            case "overdue_alert": return "#dc2626";
            case "reminder_sent": return "#f59e0b";
            default:              return "#888";
        }
    }

    function getActionIcon(action) {
        switch (action) {
            case "created":        return "🟢";
            case "assigned":       return "👤";
            case "status_changed": return "🔄";
            case "completed":      return "✅";
            case "overdue_alert":  return "🚨";
            case "reminder_sent":  return "⏰";
            default:               return "📝";
        }
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    }

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>

                {/* Header */}
                <div style={styles.header}>
                    <div>
                        <h2 style={styles.title}>📋 Task History</h2>
                        <p style={styles.taskName}>{taskTitle}</p>
                    </div>
                    <button
                        style={styles.closeBtn}
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                {/* History List */}
                <div style={styles.historyList}>
                    {loading ? (
                        <p style={styles.loadingText}>
                            Loading history...
                        </p>
                    ) : history.length === 0 ? (
                        <div style={styles.emptyState}>
                            <p>No history found for this task.</p>
                        </div>
                    ) : (
                        history.map((item, index) => (
                            <div key={item.id} style={styles.historyItem}>

                                {/* Timeline line */}
                                <div style={styles.timelineLeft}>
                                    <div style={{
                                        ...styles.dot,
                                        backgroundColor: getActionColor(item.action)
                                    }}>
                                        <span style={styles.dotIcon}>
                                            {getActionIcon(item.action)}
                                        </span>
                                    </div>
                                    {index < history.length - 1 && (
                                        <div style={styles.line} />
                                    )}
                                </div>

                                {/* Content */}
                                <div style={styles.historyContent}>
                                    <div style={styles.historyHeader}>
                                        <span style={{
                                            ...styles.actionBadge,
                                            backgroundColor:
                                                getActionColor(item.action) + "20",
                                            color: getActionColor(item.action)
                                        }}>
                                            {item.action.replace("_", " ").toUpperCase()}
                                        </span>
                                        <span style={styles.doneBy}>
                                            by {item.done_by}
                                        </span>
                                    </div>

                                    <p style={styles.details}>
                                        {item.details}
                                    </p>

                                    <p style={styles.date}>
                                        📅 {formatDate(item.created_at)}
                                    </p>
                                </div>

                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
    },
    modal: {
        backgroundColor: "white",
        borderRadius: "16px",
        width: "600px",
        maxHeight: "80vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "24px",
        borderBottom: "1px solid #e2e8f0",
        backgroundColor: "#f8fafc",
    },
    title: {
        margin: 0,
        fontSize: "20px",
        color: "#1a1a2e",
        fontWeight: "bold",
    },
    taskName: {
        margin: "4px 0 0 0",
        fontSize: "14px",
        color: "#888",
    },
    closeBtn: {
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        border: "none",
        backgroundColor: "#f0f4f8",
        cursor: "pointer",
        fontSize: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
        color: "#888",
    },
    historyList: {
        padding: "24px",
        overflowY: "auto",
        flex: 1,
    },
    loadingText: {
        textAlign: "center",
        color: "#888",
        padding: "40px",
    },
    emptyState: {
        textAlign: "center",
        padding: "40px",
        color: "#aaa",
        backgroundColor: "#f8fafc",
        borderRadius: "8px",
        border: "2px dashed #e2e8f0",
    },
    historyItem: {
        display: "flex",
        gap: "16px",
        marginBottom: "8px",
    },
    timelineLeft: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minWidth: "40px",
    },
    dot: {
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    dotIcon: {
        fontSize: "16px",
    },
    line: {
        width: "2px",
        flex: 1,
        backgroundColor: "#e2e8f0",
        margin: "4px 0",
        minHeight: "20px",
    },
    historyContent: {
        flex: 1,
        paddingBottom: "20px",
    },
    historyHeader: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "6px",
    },
    actionBadge: {
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: "bold",
    },
    doneBy: {
        fontSize: "13px",
        color: "#888",
    },
    details: {
        margin: "0 0 6px 0",
        fontSize: "14px",
        color: "#444",
        lineHeight: "1.5",
    },
    date: {
        margin: 0,
        fontSize: "12px",
        color: "#aaa",
    },
};

export default TaskHistory;