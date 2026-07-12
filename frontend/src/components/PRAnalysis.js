import { useState, useEffect } from "react";
import axios from "axios";

const API = process.env.REACT_APP_API_URL ||
    "http://127.0.0.1:8000";

function PRAnalysis() {
    const [repos, setRepos] = useState([]);
    const [selectedRepo, setSelectedRepo] = useState("");
    const [prState, setPrState] = useState("all");
    const [prs, setPrs] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [repoLoading, setRepoLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedPR, setExpandedPR] = useState(null);

    useEffect(() => {
        loadRepos();
    }, []);

    async function loadRepos() {
        try {
            const res = await axios.get(
                `${API}/github/repos`
            );
            setRepos(res.data);
        } catch (error) {
            setError("Could not load repos.");
        }
        setRepoLoading(false);
    }

    async function fetchPRs() {
        if (!selectedRepo) {
            setError("Please select a repository.");
            return;
        }

        setLoading(true);
        setError("");
        setPrs([]);
        setStatistics(null);

        try {
            const res = await axios.post(
                `${API}/github/pull-requests`,
                {
                    repo_name: selectedRepo,
                    state: prState
                }
            );

            setPrs(res.data.pull_requests || []);
            setStatistics(res.data.statistics);

        } catch (error) {
            setError(
                "Error fetching PRs. " +
                "Check your GitHub token."
            );
        }

        setLoading(false);
    }

    function getStateColor(state, merged) {
        if (merged) return "#8b5cf6";
        if (state === "open") return "#16a34a";
        return "#dc2626";
    }

    function getStateLabel(state, merged) {
        if (merged) return "Merged";
        if (state === "open") return "Open";
        return "Closed";
    }

    function getScoreColor(score) {
        if (score >= 70) return "#16a34a";
        if (score >= 40) return "#f59e0b";
        return "#dc2626";
    }

    function getReviewColor(status) {
        switch (status) {
            case "approved": return "#16a34a";
            case "changes_requested": return "#dc2626";
            case "reviewed": return "#f59e0b";
            default: return "#888";
        }
    }

    function getReviewLabel(status) {
        switch (status) {
            case "approved": return "✅ Approved";
            case "changes_requested":
                return "❌ Changes Requested";
            case "reviewed": return "👀 Reviewed";
            default: return "⏳ Pending Review";
        }
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    }

    return (
        <div style={styles.container}>
            <h2 style={styles.pageTitle}>
                🔀 Pull Request Analysis
            </h2>
            <p style={styles.pageDesc}>
                Analyze all pull requests from your GitHub
                repository. See who is contributing,
                review quality, and merge rates.
            </p>

            {/* Filter Section */}
            <div style={styles.filterBox}>
                <h3 style={styles.sectionTitle}>
                    Fetch Pull Requests
                </h3>

                <div style={styles.filterRow}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>
                            Repository
                        </label>
                        {repoLoading ? (
                            <p style={styles.loadingText}>
                                Loading...
                            </p>
                        ) : (
                            <select
                                style={styles.select}
                                value={selectedRepo}
                                onChange={(e) =>
                                    setSelectedRepo(
                                        e.target.value
                                    )
                                }
                            >
                                <option value="">
                                    -- Select Repository --
                                </option>
                                {repos.map(repo => (
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

                    <div style={styles.formGroup}>
                        <label style={styles.label}>
                            PR Status
                        </label>
                        <select
                            style={styles.select}
                            value={prState}
                            onChange={(e) =>
                                setPrState(e.target.value)
                            }
                        >
                            <option value="all">
                                All PRs
                            </option>
                            <option value="open">
                                Open Only
                            </option>
                            <option value="closed">
                                Closed Only
                            </option>
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
                            onClick={fetchPRs}
                            disabled={loading}
                        >
                            {loading
                                ? "⏳ Loading..."
                                : "🔍 Analyze PRs"
                            }
                        </button>
                    </div>
                </div>

                {error && (
                    <p style={styles.error}>{error}</p>
                )}
            </div>

            {/* Statistics Cards */}
            {statistics && (
                <div style={styles.statsRow}>
                    <div style={styles.statCard}>
                        <p style={styles.statLabel}>
                            Total PRs
                        </p>
                        <h2 style={styles.statNum}>
                            {statistics.total}
                        </h2>
                    </div>
                    <div style={styles.statCard}>
                        <p style={styles.statLabel}>
                            🟢 Open
                        </p>
                        <h2 style={{
                            ...styles.statNum,
                            color: "#16a34a"
                        }}>
                            {statistics.open}
                        </h2>
                    </div>
                    <div style={styles.statCard}>
                        <p style={styles.statLabel}>
                            🟣 Merged
                        </p>
                        <h2 style={{
                            ...styles.statNum,
                            color: "#8b5cf6"
                        }}>
                            {statistics.merged}
                        </h2>
                    </div>
                    <div style={styles.statCard}>
                        <p style={styles.statLabel}>
                            🔴 Closed
                        </p>
                        <h2 style={{
                            ...styles.statNum,
                            color: "#dc2626"
                        }}>
                            {statistics.closed}
                        </h2>
                    </div>
                    <div style={styles.statCard}>
                        <p style={styles.statLabel}>
                            Merge Rate
                        </p>
                        <h2 style={{
                            ...styles.statNum,
                            color: "#4f46e5"
                        }}>
                            {statistics.merge_rate}%
                        </h2>
                    </div>
                    <div style={styles.statCard}>
                        <p style={styles.statLabel}>
                            Avg Changes
                        </p>
                        <h2 style={styles.statNum}>
                            {statistics.avg_changes}
                        </h2>
                    </div>
                </div>
            )}

            {/* PR List */}
            {prs.length > 0 && (
                <div style={styles.prList}>
                    <h3 style={styles.sectionTitle}>
                        Pull Requests ({prs.length})
                    </h3>

                    {prs.map((pr) => (
                        <div
                            key={pr.number}
                            style={styles.prCard}
                        >
                            {/* PR Header */}
                            <div style={styles.prHeader}>
                                <div style={styles.prLeft}>
                                    <span style={{
                                        ...styles.prNumber,
                                        backgroundColor:
                                            getStateColor(
                                                pr.state,
                                                pr.merged
                                            ) + "20",
                                        color: getStateColor(
                                            pr.state,
                                            pr.merged
                                        )
                                    }}>
                                        #{pr.number}
                                    </span>

                                    <div>
                                        <h4 style={
                                            styles.prTitle
                                        }>
                                            {pr.title}
                                        </h4>
                                        <p style={
                                            styles.prMeta
                                        }>
                                            👤 {pr.author}
                                            {" · "}
                                            📅 {formatDate(
                                                pr.created_at
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div style={styles.prRight}>
                                    {/* State Badge */}
                                    <span style={{
                                        ...styles.badge,
                                        backgroundColor:
                                            getStateColor(
                                                pr.state,
                                                pr.merged
                                            ) + "20",
                                        color: getStateColor(
                                            pr.state,
                                            pr.merged
                                        ),
                                        border: `1px solid ${
                                            getStateColor(
                                                pr.state,
                                                pr.merged
                                            )
                                        }`
                                    }}>
                                        {getStateLabel(
                                            pr.state,
                                            pr.merged
                                        )}
                                    </span>

                                    {/* Review Badge */}
                                    <span style={{
                                        ...styles.badge,
                                        backgroundColor:
                                            getReviewColor(
                                                pr.review_status
                                            ) + "20",
                                        color: getReviewColor(
                                            pr.review_status
                                        ),
                                        border: `1px solid ${
                                            getReviewColor(
                                                pr.review_status
                                            )
                                        }`
                                    }}>
                                        {getReviewLabel(
                                            pr.review_status
                                        )}
                                    </span>

                                    {/* AI Quality Score */}
                                    <span style={{
                                        ...styles.badge,
                                        backgroundColor:
                                            getScoreColor(
                                                pr.analysis
                                                .quality_score
                                            ) + "20",
                                        color: getScoreColor(
                                            pr.analysis
                                            .quality_score
                                        ),
                                        border: `1px solid ${
                                            getScoreColor(
                                                pr.analysis
                                                .quality_score
                                            )
                                        }`
                                    }}>
                                        🤖 {pr.analysis
                                            .quality_score}/100
                                    </span>
                                </div>
                            </div>

                            {/* PR Stats */}
                            <div style={styles.prStats}>
                                <span style={styles.prStat}>
                                    ➕ {pr.additions} additions
                                </span>
                                <span style={styles.prStat}>
                                    ➖ {pr.deletions} deletions
                                </span>
                                <span style={styles.prStat}>
                                    📁 {pr.changed_files} files
                                </span>
                                <span style={styles.prStat}>
                                    💬 {pr.comments} comments
                                </span>
                            </div>

                            {/* Expand Button */}
                            <button
                                style={styles.expandBtn}
                                onClick={() =>
                                    setExpandedPR(
                                        expandedPR === pr.number
                                            ? null
                                            : pr.number
                                    )
                                }
                            >
                                {expandedPR === pr.number
                                    ? "▲ Hide Details"
                                    : "▼ Show AI Analysis"
                                }
                            </button>

                            {/* Expanded Analysis */}
                            {expandedPR === pr.number && (
                                <div style={styles.analysis}>
                                    <p style={
                                        styles.analysisTitle
                                    }>
                                        🤖 AI Quality Analysis
                                    </p>
                                    <p style={{
                                        ...styles.recommendation,
                                        color: getScoreColor(
                                            pr.analysis
                                            .quality_score
                                        )
                                    }}>
                                        {pr.analysis
                                            .recommendation}
                                    </p>
                                    <div style={
                                        styles.feedbackList
                                    }>
                                        {pr.analysis.feedback
                                            .map((f, i) => (
                                            <p
                                                key={i}
                                                style={
                                                    styles
                                                    .feedbackItem
                                                }
                                            >
                                                {f}
                                            </p>
                                        ))}
                                    </div>

                                    
                                        href={pr.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={styles.viewLink}
                                    <a>
                                        View on GitHub →
                                    </a>
                                </div>
                            )}

                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && prs.length === 0
                && statistics && (
                <div style={styles.emptyState}>
                    <p>No pull requests found.</p>
                    <p>Create a PR on GitHub to see it here.</p>
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
    filterRow: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr auto",
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
    error: {
        color: "#dc2626",
        fontWeight: "bold",
        margin: 0,
    },
    loadingText: {
        color: "#888",
        margin: 0,
    },
    statsRow: {
        display: "grid",
        gridTemplateColumns: "repeat(6, 1fr)",
        gap: "12px",
    },
    statCard: {
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "16px",
        textAlign: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    },
    statLabel: {
        margin: "0 0 8px 0",
        fontSize: "12px",
        color: "#888",
        fontWeight: "600",
    },
    statNum: {
        margin: 0,
        fontSize: "28px",
        fontWeight: "bold",
        color: "#1a1a2e",
    },
    prList: {
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "28px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    prCard: {
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        padding: "20px",
        backgroundColor: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    prHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "16px",
    },
    prLeft: {
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        flex: 1,
    },
    prNumber: {
        padding: "4px 10px",
        borderRadius: "6px",
        fontSize: "13px",
        fontWeight: "bold",
        flexShrink: 0,
    },
    prTitle: {
        margin: "0 0 4px 0",
        fontSize: "15px",
        color: "#1a1a2e",
        fontWeight: "bold",
    },
    prMeta: {
        margin: 0,
        fontSize: "12px",
        color: "#888",
    },
    prRight: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap",
        flexShrink: 0,
    },
    badge: {
        padding: "4px 10px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "bold",
    },
    prStats: {
        display: "flex",
        gap: "16px",
        flexWrap: "wrap",
    },
    prStat: {
        fontSize: "12px",
        color: "#888",
        backgroundColor: "white",
        padding: "4px 10px",
        borderRadius: "6px",
        border: "1px solid #e2e8f0",
    },
    expandBtn: {
        padding: "6px 14px",
        backgroundColor: "#f0f4f8",
        color: "#4f46e5",
        border: "1px solid #e2e8f0",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: "bold",
        alignSelf: "flex-start",
    },
    analysis: {
        backgroundColor: "white",
        borderRadius: "8px",
        padding: "16px",
        border: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    analysisTitle: {
        margin: 0,
        fontSize: "14px",
        fontWeight: "bold",
        color: "#1a1a2e",
    },
    recommendation: {
        margin: 0,
        fontSize: "16px",
        fontWeight: "bold",
    },
    feedbackList: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
    },
    feedbackItem: {
        margin: 0,
        fontSize: "13px",
        color: "#444",
    },
    viewLink: {
        color: "#4f46e5",
        fontWeight: "bold",
        fontSize: "13px",
        textDecoration: "none",
        alignSelf: "flex-start",
    },
    emptyState: {
        textAlign: "center",
        padding: "40px",
        backgroundColor: "white",
        borderRadius: "12px",
        color: "#888",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    },
};

export default PRAnalysis;