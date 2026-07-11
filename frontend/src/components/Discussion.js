import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API = "http://127.0.0.1:8000";

function Discussion({ taskId, taskTitle, onClose }) {
    const user = JSON.parse(localStorage.getItem("user"));
    const [comments, setComments] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        loadComments();
    }, [taskId]);

    useEffect(() => {
        scrollToBottom();
    }, [comments]);

    async function loadComments() {
        try {
            const res = await axios.get(
                `${API}/tasks/${taskId}/comments`
            );
            setComments(res.data);
        } catch (error) {
            console.log("Error loading comments");
        }
        setLoading(false);
    }

    async function sendComment() {
        if (!message.trim()) return;

        setSending(true);
        try {
            await axios.post(
                `${API}/tasks/${taskId}/comments`,
                {
                    user_id: user.id,
                    user_name: user.name,
                    message: message.trim()
                }
            );
            setMessage("");
            loadComments();
        } catch (error) {
            console.log("Error sending comment");
        }
        setSending(false);
    }

    function handleKeyPress(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendComment();
        }
    }

    function scrollToBottom() {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    function formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    }

    function getAvatarColor(name) {
        const colors = [
            "#4f46e5", "#16a34a", "#dc2626",
            "#f59e0b", "#0891b2", "#7c3aed"
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    }

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>

                {/* Header */}
                <div style={styles.header}>
                    <div>
                        <h2 style={styles.title}>
                            💬 Discussion
                        </h2>
                        <p style={styles.taskName}>
                            {taskTitle}
                        </p>
                    </div>
                    <button
                        style={styles.closeBtn}
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                {/* Messages */}
                <div style={styles.messageList}>
                    {loading ? (
                        <p style={styles.centerText}>
                            Loading messages...
                        </p>
                    ) : comments.length === 0 ? (
                        <div style={styles.emptyState}>
                            <p style={styles.emptyIcon}>💬</p>
                            <p style={styles.emptyText}>
                                No messages yet.
                            </p>
                            <p style={styles.emptySubText}>
                                Be the first to start the discussion!
                            </p>
                        </div>
                    ) : (
                        comments.map((comment) => {
                            const isMe =
                                comment.user_id === user.id;
                            return (
                                <div
                                    key={comment.id}
                                    style={{
                                        ...styles.messageRow,
                                        flexDirection: isMe
                                            ? "row-reverse"
                                            : "row"
                                    }}
                                >
                                    {/* Avatar */}
                                    <div style={{
                                        ...styles.avatar,
                                        backgroundColor:
                                            getAvatarColor(
                                                comment.user_name
                                            )
                                    }}>
                                        {comment.user_name
                                            .charAt(0)
                                            .toUpperCase()
                                        }
                                    </div>

                                    {/* Bubble */}
                                    <div style={{
                                        ...styles.bubble,
                                        backgroundColor: isMe
                                            ? "#4f46e5"
                                            : "white",
                                        color: isMe
                                            ? "white"
                                            : "#1a1a2e",
                                        alignItems: isMe
                                            ? "flex-end"
                                            : "flex-start"
                                    }}>
                                        {!isMe && (
                                            <p style={styles.senderName}>
                                                {comment.user_name}
                                            </p>
                                        )}
                                        <p style={styles.messageText}>
                                            {comment.message}
                                        </p>
                                        <p style={{
                                            ...styles.timeText,
                                            color: isMe
                                                ? "rgba(255,255,255,0.7)"
                                                : "#aaa"
                                        }}>
                                            {formatTime(comment.created_at)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input Box */}
                <div style={styles.inputArea}>
                    <div style={styles.inputRow}>
                        <div style={{
                            ...styles.inputAvatar,
                            backgroundColor:
                                getAvatarColor(user.name)
                        }}>
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <textarea
                            style={styles.textarea}
                            placeholder="Type your message... (Press Enter to send)"
                            value={message}
                            onChange={(e) =>
                                setMessage(e.target.value)
                            }
                            onKeyPress={handleKeyPress}
                            rows={2}
                        />
                        <button
                            style={
                                sending || !message.trim()
                                    ? styles.sendBtnDisabled
                                    : styles.sendBtn
                            }
                            onClick={sendComment}
                            disabled={sending || !message.trim()}
                        >
                            {sending ? "..." : "Send"}
                        </button>
                    </div>
                    <p style={styles.hint}>
                        Press Enter to send • Shift+Enter for new line
                    </p>
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
        backgroundColor: "#f0f4f8",
        borderRadius: "16px",
        width: "620px",
        height: "80vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        overflow: "hidden",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 24px",
        backgroundColor: "white",
        borderBottom: "1px solid #e2e8f0",
    },
    title: {
        margin: 0,
        fontSize: "20px",
        color: "#1a1a2e",
        fontWeight: "bold",
    },
    taskName: {
        margin: "4px 0 0 0",
        fontSize: "13px",
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
        fontWeight: "bold",
        color: "#888",
    },
    messageList: {
        flex: 1,
        overflowY: "auto",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    centerText: {
        textAlign: "center",
        color: "#888",
        padding: "40px",
    },
    emptyState: {
        textAlign: "center",
        padding: "60px 20px",
    },
    emptyIcon: {
        fontSize: "48px",
        margin: "0 0 16px 0",
    },
    emptyText: {
        margin: "0 0 8px 0",
        fontSize: "18px",
        color: "#888",
        fontWeight: "bold",
    },
    emptySubText: {
        margin: 0,
        fontSize: "14px",
        color: "#aaa",
    },
    messageRow: {
        display: "flex",
        alignItems: "flex-end",
        gap: "10px",
    },
    avatar: {
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: "bold",
        fontSize: "14px",
        flexShrink: 0,
    },
    bubble: {
        maxWidth: "70%",
        padding: "12px 16px",
        borderRadius: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    },
    senderName: {
        margin: 0,
        fontSize: "12px",
        color: "#4f46e5",
        fontWeight: "bold",
    },
    messageText: {
        margin: 0,
        fontSize: "14px",
        lineHeight: "1.5",
        wordBreak: "break-word",
    },
    timeText: {
        margin: 0,
        fontSize: "11px",
    },
    inputArea: {
        backgroundColor: "white",
        padding: "16px 20px",
        borderTop: "1px solid #e2e8f0",
    },
    inputRow: {
        display: "flex",
        alignItems: "flex-end",
        gap: "10px",
    },
    inputAvatar: {
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: "bold",
        fontSize: "14px",
        flexShrink: 0,
    },
    textarea: {
        flex: 1,
        padding: "10px 14px",
        fontSize: "14px",
        borderRadius: "20px",
        border: "1px solid #e2e8f0",
        outline: "none",
        resize: "none",
        fontFamily: "Arial, sans-serif",
        lineHeight: "1.5",
    },
    sendBtn: {
        padding: "10px 20px",
        backgroundColor: "#4f46e5",
        color: "white",
        border: "none",
        borderRadius: "20px",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "14px",
        flexShrink: 0,
    },
    sendBtnDisabled: {
        padding: "10px 20px",
        backgroundColor: "#a5b4fc",
        color: "white",
        border: "none",
        borderRadius: "20px",
        cursor: "not-allowed",
        fontWeight: "bold",
        fontSize: "14px",
        flexShrink: 0,
    },
    hint: {
        margin: "8px 0 0 46px",
        fontSize: "11px",
        color: "#aaa",
    },
};

export default Discussion;