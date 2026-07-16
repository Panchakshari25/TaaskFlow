function Sidebar({ activePage, setActivePage, role }) {

  // Menu items for Team Leader
 const leaderMenu = [
  { id: "home",       icon: "📊", label: "Dashboard"   },
  { id: "projects",   icon: "📁", label: "Projects"    },
  { id: "tasks",      icon: "✅", label: "All Tasks"   },
  { id: "team",       icon: "👥", label: "Team"        },
  { id: "workload",   icon: "📈", label: "Workload"    },
  { id: "discussion", icon: "💬", label: "Discussion"  },
  { id: "github",     icon: "🔗", label: "GitHub"      },
  { id: "pr", icon: "🔀", label: "PR Analysis" },
  { id: "sprint", icon: "🏃", label: "Sprint Planning" },
  { id: "scrum", icon: "🤖", label: "Scrum Master" },
  { id: "release", icon: "🚀", label: "Release Manager" },
];
  // Menu items for Employee
  const employeeMenu = [
  { id: "home",       icon: "📊", label: "Dashboard"  },
  { id: "projects",   icon: "📁", label: "Projects"   },
  { id: "tasks",      icon: "✅", label: "My Tasks"   },
  { id: "discussion", icon: "💬", label: "Discussion" },
  { id: "workload",   icon: "📈", label: "Workload"   },
];
  const menu = role === "team_leader" ? leaderMenu : employeeMenu;

  return (
    <div style={styles.sidebar}>

      {/* Logo */}
      <div style={styles.logo}>
        <span style={styles.logoText}>TaskFlow</span>
      </div>

      {/* Menu Items */}
      <nav>
        {menu.map((item) => (
          <div
            key={item.id}
            style={
              activePage === item.id
                ? { ...styles.menuItem, ...styles.menuItemActive }
                : styles.menuItem
            }
            onClick={() => setActivePage(item.id)}
          >
            <span style={styles.menuIcon}>{item.icon}</span>
            <span style={styles.menuLabel}>{item.label}</span>
          </div>
        ))}
      </nav>

    </div>
  );
}

const styles = {
  sidebar: {
    width: "240px",
    minHeight: "100vh",
    backgroundColor: "#1a1a2e",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
  },
  logo: {
    padding: "24px 20px",
    borderBottom: "1px solid #2d2d44",
  },
  logoText: {
    color: "white",
    fontSize: "22px",
    fontWeight: "bold",
    letterSpacing: "1px",
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 20px",
    cursor: "pointer",
    color: "#a0a0b0",
    fontSize: "15px",
    transition: "all 0.2s",
    borderLeft: "3px solid transparent",
  },
  menuItemActive: {
    backgroundColor: "#2d2d44",
    color: "white",
    borderLeft: "3px solid #4f46e5",
  },
  menuIcon: {
    fontSize: "18px",
  },
  menuLabel: {
    fontWeight: "500",
  },
};

export default Sidebar;