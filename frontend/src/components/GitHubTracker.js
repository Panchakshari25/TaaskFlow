import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://127.0.0.1:8000";

function GitHubTracker() {
    const [repos, setRepos] = useState([]);
    const [selectedRepo, setSelectedRepo] = useState("");
    const [developerName, setDeveloperName] = useState("");
    const [days, setDays] = useState(7);
    const [commits, setCommits] = useState([]);
    const [score, setScore] = useState(null);
    const [loading, setLoading] = useState(false);
    const [repoLoading, setRepoLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadRepos();
    }, []);

    async function loadRepos() {
        try {
            const res = await axios.get(`${API}/github/repos`);
            setRepos(res.data);
        } catch (error) {
            setError(
                "Could not load GitHub repos. " +
                "Check your GitHub token in .env file."
            );
        }
        setRepoLoading(false);
    }

    async function fetchCommits() {
        if (!selectedRepo) {
            setError("Please select a repository first.");
            return;
        }

        setLoading(true);
        setError("");
        setCommits([]);
        setScore(null);

        try {
            const res = await axios.post(
                `${API}/github/commits`,
                {
                    repo_name: selectedRepo,
                    developer_name: developerName,
                    days: days
                }
            );

            setCommits(res.data.commits);
            setScore(res.data.score);

        } catch (error) {
            setError("Error fetching commits. Try again.");
        }

        setLoading(false);
    }

    function getScoreColor(score) {
        if (score >= 70) return "#16a34a";
        if (score >= 40) return "#f59e0b";
        return "#dc2626";
    }

    function getScoreLabel(score) {
        if (score >= 70) return "High Activity 🟢";
        if (score >= 40) return "Medium Activity 🟡";
        if (score > 0)   return "Low Activity 🔴";
        return "No Activity ⚫";
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    }

    return (
        <div style={styles.container}>
            <h2 style={styles.pageTitle}>
                🔗 GitHub Commit Tracker
            </h2>
            <p style={styles.pageDesc}>
                Track real developer activity from GitHub.
                See who is actually writing code and how much.
            </p>

            {/* Filter Section */}
            <div style={styles.filterBox}>
                <h3 style={styles.sectionTitle}>
                    Search Commits
                </h3>

                {/* Repository Select */}
                <div style={styles.formGroup}>
                    <label style={styles.label}>
                        Select Repository
                    </label>
                    {repoLoading ? (
                        <p style={styles.loadingText}>
                            Loading repos...
                        </p>
                    ) : (
                        <select
                            style={styles.select}
                            value={selectedRepo}
                            onChange={(e) =>
                                setSelectedRepo(e.target.value)
                            }
                        >
                            <option value="">
                                -- Select a repository --
                            </option>
                            {repos.map((repo) => (
                                <option
                                    key={repo.id}
                                    value={repo.name}
                                >
                                    {repo.name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Developer Name */}
                <div style={styles.formGroup}>
                    <label style={styles.label}>
                        Developer Name (optional)
                    </label>
                    <input
                        style={styles.input}
                        type="text"
                        placeholder="e.g. Roshan (leave empty for all)"
                        value={developerName}
                        onChange={(e) =>
                            setDeveloperName(e.target.value)
                        }
                    />
                </div>

                {/* Days */}
                <div style={styles.formGroup}>
                    <label style={styles.label}>
                        Last how many days?
                    </label>
                    <select
                        style={styles.select}
                        value={days}
                        onChange={(e) =>
                            setDays(parseInt(e.target.value))
                        }
                    >
                        <option value={7}>Last 7 days</option>
                        <option value={14}>Last 14 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={60}>Last 60 days</option>
                    </select>
                </div>

                <button
                    style={loading
                        ? styles.buttonDisabled
                        : styles.button
                    }
                    onClick={fetchCommits}
                    disabled={loading}
                >
                    {loading
                        ? "⏳ Fetching from GitHub..."
                        : "🔍 Fetch Commits"
                    }
                </button>

                {error && (
                    <p style={styles.error}>{error}</p>
                )}
            </div>

            {/* AI Progress Score */}
            {score && (
                <div style={styles.scoreBox}>
                    <h3 style={styles.sectionTitle}>
                        🤖 AI Progress Score
                    </h3>

                    <div style={styles.scoreMain}>
                        <div style={{
                            ...styles.scoreBig,
                            color: getScoreColor(score.score)
                        }}>
                            {score.score}
                            <span style={styles.scorePercent}>
                                /100
                            </span>
                        </div>

                        <div style={styles.scoreInfo}>
                            <p style={{
                                ...styles.scoreLabel,
                                color: getScoreColor(score.score)
                            }}>
                                {getScoreLabel(score.score)}
                            </p>

                            <div style={styles.scoreStats}>
                                <div style={styles.statItem}>
                                    <span style={styles.statNum}>
                                        {score.commit_count}
                                    </span>
                                    <span style={styles.statLabel}>
                                        Commits
                                    </span>
                                </div>
                                <div style={styles.statItem}>
                                    <span style={styles.statNum}>
                                        {score.total_files}
                                    </span>
                                    <span style={styles.statLabel}>
                                        Files Changed
                                    </span>
                                </div>
                                <div style={styles.statItem}>
                                    <span style={styles.statNum}>
                                        {score.last_commit || "N/A"}
                                    </span>
                                    <span style={styles.statLabel}>
                                        Last Commit
                                    </span>
                                </div>
                            </div>

                            {/* Score Breakdown */}
                            <div style={styles.breakdown}>
                                <p style={styles.breakdownTitle}>
                                    Score Breakdown:
                                </p>
                                <div style={styles.breakdownItem}>
                                    <span>Commit Count (40%)</span>
                                    <span style={{
                                        color: "#4f46e5",
                                        fontWeight: "bold"
                                    }}>
                                        {score.breakdown.commit_score}
                                        pts
                                    </span>
                                </div>
                                <div style={styles.breakdownItem}>
                                    <span>Recency (40%)</span>
                                    <span style={{
                                        color: "#4f46e5",
                                        fontWeight: "bold"
                                    }}>
                                        {score.breakdown.recency_score}
                                        pts
                                    </span>
                                </div>
                                <div style={styles.breakdownItem}>
                                    <span>Files Changed (20%)</span>
                                    <span style={{
                                        color: "#4f46e5",
                                        fontWeight: "bold"
                                    }}>
                                        {score.breakdown.files_score}
                                        pts
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Score Circle */}
                        <div style={styles.scoreCircle}>
                            <div style={{
                                ...styles.circleInner,
                                background: `conic-gradient(
                                    ${getScoreColor(score.score)}
                                    ${score.score * 3.6}deg,
                                    #f0f4f8 0deg
                                )`
                            }}>
                                <div style={styles.circleCenter}>
                                    <span style={{
                                        fontSize: "24px",
                                        fontWeight: "bold",
                                        color: getScoreColor(
                                            score.score
                                        )
                                    }}>
                                        {score.score}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Commits List */}
            {commits.length > 0 && (
                <div style={styles.commitsBox}>
                    <h3 style={styles.sectionTitle}>
                        📝 Commit History
                        ({commits.length} commits)
                    </h3>

                    <div style={styles.commitsList}>
                        {commits.map((commit, index) => (
                            <div
                                key={index}
                                style={styles.commitItem}
                            >
                                <div style={styles.commitLeft}>
                                    <div style={styles.commitSha}>
                                        {commit.sha}
                                    </div>
                                </div>

                                <div style={styles.commitContent}>
                                    <p style={styles.commitMessage}>
                                        {commit.message}
                                    </p>
                                    <div style={styles.commitMeta}>
                                        <span style={styles.commitAuthor}>
                                            👤 {commit.author}
                                        </span>
                                        <span style={styles.commitDate}>
                                            📅 {formatDate(commit.date)}
                                        </span>
                                        <span style={styles.commitFiles}>
                                            📁 {commit.files_changed} changes
                                        </span>
                                    </div>
                                </div>

                                <a 
                                    href={commit.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={styles.viewLink}
                                >
                                    View
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty state */}
            {!loading && commits.length === 0 && score && (
                <div style={styles.emptyCommits}>
                    <p>😶 No commits found for this search.</p>
                    <p>Try changing the developer name or days range.</p>
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
    filterBox: {
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "28px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    sectionTitle: {
        margin: 0,
        fontSize: "18px",
        color: "#1a1a2e",
        fontWeight: "bold",
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
    input: {
        padding: "12px",
        fontSize: "15px",
        borderRadius: "8px",
        border: "1px solid #ddd",
        outline: "none",
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
    error: {
        color: "#dc2626",
        fontWeight: "bold",
        margin: 0,
    },
    loadingText: {
        color: "#888",
        margin: 0,
    },
    scoreBox: {
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "28px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    scoreMain: {
        display: "flex",
        alignItems: "flex-start",
        gap: "24px",
    },
    scoreBig: {
        fontSize: "64px",
        fontWeight: "bold",
        lineHeight: 1,
        flexShrink: 0,
    },
    scorePercent: {
        fontSize: "20px",
        color: "#888",
    },
    scoreInfo: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    scoreLabel: {
        margin: 0,
        fontSize: "18px",
        fontWeight: "bold",
    },
    scoreStats: {
        display: "flex",
        gap: "24px",
    },
    statItem: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
    },
    statNum: {
        fontSize: "18px",
        fontWeight: "bold",
        color: "#1a1a2e",
    },
    statLabel: {
        fontSize: "11px",
        color: "#888",
        textTransform: "uppercase",
    },
    breakdown: {
        backgroundColor: "#f8fafc",
        borderRadius: "8px",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    breakdownTitle: {
        margin: "0 0 4px 0",
        fontSize: "12px",
        color: "#888",
        fontWeight: "bold",
        textTransform: "uppercase",
    },
    breakdownItem: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: "13px",
        color: "#444",
    },
    scoreCircle: {
        flexShrink: 0,
    },
    circleInner: {
        width: "120px",
        height: "120px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    circleCenter: {
        width: "90px",
        height: "90px",
        borderRadius: "50%",
        backgroundColor: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    commitsBox: {
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "28px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    commitsList: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    commitItem: {
        display: "flex",
        alignItems: "flex-start",
        gap: "14px",
        padding: "14px",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
        backgroundColor: "#f8fafc",
    },
    commitLeft: {
        flexShrink: 0,
    },
    commitSha: {
        backgroundColor: "#1a1a2e",
        color: "#4ade80",
        padding: "4px 8px",
        borderRadius: "4px",
        fontSize: "12px",
        fontFamily: "monospace",
    },
    commitContent: {
        flex: 1,
    },
    commitMessage: {
        margin: "0 0 8px 0",
        fontSize: "14px",
        color: "#1a1a2e",
        fontWeight: "600",
    },
    commitMeta: {
        display: "flex",
        gap: "16px",
        flexWrap: "wrap",
    },
    commitAuthor: {
        fontSize: "12px",
        color: "#4f46e5",
        fontWeight: "600",
    },
    commitDate: {
        fontSize: "12px",
        color: "#888",
    },
    commitFiles: {
        fontSize: "12px",
        color: "#888",
    },
    viewLink: {
        padding: "4px 12px",
        backgroundColor: "#4f46e5",
        color: "white",
        borderRadius: "6px",
        textDecoration: "none",
        fontSize: "12px",
        fontWeight: "bold",
        flexShrink: 0,
    },
    emptyCommits: {
        textAlign: "center",
        padding: "40px",
        backgroundColor: "white",
        borderRadius: "12px",
        color: "#888",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    },
};

export default GitHubTracker;