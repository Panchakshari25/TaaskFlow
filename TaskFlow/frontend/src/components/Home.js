function Home({ user }) {
  return (
    <div style={styles.container}>

      {/* Summary Cards */}
      <div style={styles.cardRow}>

        <div style={{ ...styles.card, borderTop: "4px solid #4f46e5" }}>
          <p style={styles.cardLabel}>Total Tasks</p>
          <h2 style={styles.cardNumber}>0</h2>
          <p style={styles.cardSub}>No tasks yet</p>
        </div>

        <div style={{ ...styles.card, borderTop: "4px solid #f59e0b" }}>
          <p style={styles.cardLabel}>In Progress</p>
          <h2 style={styles.cardNumber}>0</h2>
          <p style={styles.cardSub}>Tasks running</p>
        </div>

        <div style={{ ...styles.card, borderTop: "4px solid #16a34a" }}>
          <p style={styles.cardLabel}>Completed</p>
          <h2 style={styles.cardNumber}>0</h2>
          <p style={styles.cardSub}>Tasks done</p>
        </div>

        <div style={{ ...styles.card, borderTop: "4px solid #dc2626" }}>
          <p style={styles.cardLabel}>Overdue</p>
          <h2 style={styles.cardNumber}>0</h2>
          <p style={styles.cardSub}>Past deadline</p>
        </div>

      </div>

      {/* Quick Info */}
      <div style={styles.infoRow}>

        <div style={styles.infoBox}>
          <h3 style={styles.infoTitle}>📋 Recent Activity</h3>
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No activity yet.</p>
            <p style={styles.emptyText}>
              Upload a project agreement to get started!
            </p>
          </div>
        </div>

        <div style={styles.infoBox}>
          <h3 style={styles.infoTitle}>🎯 My Tasks Today</h3>
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No tasks assigned yet.</p>
            <p style={styles.emptyText}>
              Tasks will appear here once created.
            </p>
          </div>
        </div>

      </div>

      {/* Role based message */}
      {user?.role === "team_leader" && (
        <div style={styles.tipBox}>
          <p style={styles.tipText}>
            💡 <strong>Tip:</strong> Go to <strong>Projects</strong> in the
            sidebar to upload your client agreement file. TaskFlow AI will
            automatically split it into modules, tasks and subtasks for your
            team!
          </p>
        </div>
      )}

      {user?.role === "employee" && (
        <div style={styles.tipBox}>
          <p style={styles.tipText}>
            💡 <strong>Tip:</strong> Go to <strong>My Tasks</strong> in the
            sidebar to see tasks assigned to you and update their status.
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
  cardRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  cardLabel: {
    margin: "0 0 8px 0",
    fontSize: "13px",
    color: "#888",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  cardNumber: {
    margin: "0 0 4px 0",
    fontSize: "36px",
    fontWeight: "bold",
    color: "#1a1a2e",
  },
  cardSub: {
    margin: 0,
    fontSize: "12px",
    color: "#aaa",
  },
  infoRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },
  infoBox: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  infoTitle: {
    margin: "0 0 16px 0",
    fontSize: "16px",
    color: "#1a1a2e",
    fontWeight: "bold",
  },
  emptyState: {
    padding: "24px",
    textAlign: "center",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "2px dashed #e2e8f0",
  },
  emptyText: {
    margin: "4px 0",
    fontSize: "13px",
    color: "#aaa",
  },
  tipBox: {
    backgroundColor: "#eff6ff",
    borderRadius: "12px",
    padding: "16px 20px",
    border: "1px solid #bfdbfe",
  },
  tipText: {
    margin: 0,
    fontSize: "14px",
    color: "#1e40af",
    lineHeight: "1.6",
  },
};

export default Home;