import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Home from "./Home";
import Projects from "./Projects";
import Workload from "./Workload";
import GitHubTracker from "./GitHubTracker";
import PRAnalysis from "./PRAnalysis";
import SprintPlanning from "./SprintPlanning";

function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [activePage, setActivePage] = useState("home");

  function renderPage() {
    switch (activePage) {
      case "home":
        return <Home user={user} />;
      case "projects":
        return <Projects />;
      case "tasks":
        return <ComingSoon title="✅ Tasks" desc="All your tasks will appear here." />;
      case "team":
        return <ComingSoon title="👥 Team" desc="Manage your team members here." />;
     case "workload":
       return <Workload />;
     case "discussion":
      return <ComingSoonDiscussion />;
      default:
        return <Home user={user} />;
      case "github":
     return <GitHubTracker />;
     case "pr":
      return <PRAnalysis />;
      case "sprint":
      return <SprintPlanning />;
    }
  }

  return (
    <div style={styles.layout}>
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        role={user?.role}
      />
      <div style={styles.main}>
        <Navbar user={user} />
        <div style={styles.content}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
function ComingSoonDiscussion() {
  return (
    <div style={styles.comingSoon}>
      <h2 style={styles.comingTitle}>💬 Discussion</h2>
      <p style={styles.comingDesc}>
        Open any task from Projects page and click
        the Discussion button to chat with your team!
      </p>
    </div>
  );
}
function ComingSoon({ title, desc }) {
  return (
    <div style={styles.comingSoon}>
      <h2 style={styles.comingTitle}>{title}</h2>
      <p style={styles.comingDesc}>{desc}</p>
      <div style={styles.comingBadge}>🚀 Coming in next step</div>
    </div>
  );
}

const styles = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f0f4f8",
  },
  main: {
    marginLeft: "240px",
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  content: {
    marginTop: "70px",
    padding: "30px",
    flex: 1,
  },
  comingSoon: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "60px",
    textAlign: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  comingTitle: {
    fontSize: "28px",
    color: "#1a1a2e",
    marginBottom: "12px",
  },
  comingDesc: {
    fontSize: "16px",
    color: "#888",
    marginBottom: "24px",
  },
  comingBadge: {
    display: "inline-block",
    backgroundColor: "#eff6ff",
    color: "#4f46e5",
    padding: "8px 20px",
    borderRadius: "20px",
    fontWeight: "bold",
    fontSize: "14px",
  },
};

export default Dashboard;