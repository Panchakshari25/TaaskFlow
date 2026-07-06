
  
function Navbar({ user }) {

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  }

  return (
    <div style={styles.navbar}>

      {/* Left side - page title */}
      <div style={styles.left}>
        <h2 style={styles.title}>Welcome back, {user?.name}! 👋</h2>
        <p style={styles.subtitle}>
          {user?.role === "team_leader" ? "Team Leader" : "Employee"} Account
        </p>
      </div>

      {/* Right side - user info and logout */}
      <div style={styles.right}>
        <div style={styles.userBadge}>
          <div style={styles.avatar}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={styles.userName}>{user?.name}</p>
            <p style={styles.userEmail}>{user?.email}</p>
          </div>
        </div>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>

    </div>
  );
}

const styles = {
  navbar: {
    height: "70px",
    backgroundColor: "white",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 30px",
    position: "fixed",
    top: 0,
    left: "240px",
    right: 0,
    zIndex: 100,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  left: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  title: {
    margin: 0,
    fontSize: "18px",
    color: "#1a1a2e",
    fontWeight: "bold",
  },
  subtitle: {
    margin: 0,
    fontSize: "12px",
    color: "#888",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  userBadge: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  avatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    backgroundColor: "#4f46e5",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "16px",
  },
  userName: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "bold",
    color: "#1a1a2e",
  },
  userEmail: {
    margin: 0,
    fontSize: "12px",
    color: "#888",
  },
  logoutBtn: {
    padding: "8px 18px",
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  },
};

export default Navbar;