import { useState } from "react";
import axios from "axios";
import Dashboard from "./components/Dashboard";

const API = "http://127.0.0.1:8000";

function App() {
  const [screen, setScreen] = useState(
    localStorage.getItem("token") ? "dashboard" : "login"
  );

  return (
    <div>
      {screen === "login" && <LoginPage setScreen={setScreen} />}
      {screen === "register" && <RegisterPage setScreen={setScreen} />}
      {screen === "dashboard" && <Dashboard />}
    </div>
  );
}

function LoginPage({ setScreen }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      setMessage("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const response = await axios.post(`${API}/login`, {
        email: email,
        password: password,
      });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      setMessage("Login successful! Redirecting...");
      setTimeout(() => setScreen("dashboard"), 1000);
    } catch (error) {
      setMessage(error.response?.data?.detail || "Login failed. Try again.");
    }
    setLoading(false);
  }

  return (
    <div style={styles.page}>
      <div style={styles.box}>
        <h1 style={styles.title}>TaskFlow</h1>
        <p style={styles.subtitle}>Project Management Platform</p>
        <input
          style={styles.input}
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          style={loading ? styles.buttonDisabled : styles.button}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        {message && (
          <p style={message.includes("successful") ? styles.success : styles.error}>
            {message}
          </p>
        )}
        <p style={styles.switchText}>
          Don't have an account?{" "}
          <span style={styles.link} onClick={() => setScreen("register")}>
            Register here
          </span>
        </p>
      </div>
    </div>
  );
}

function RegisterPage({ setScreen }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name || !email || !password) {
      setMessage("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await axios.post(`${API}/register`, {
        name: name,
        email: email,
        password: password,
        role: role,
      });
      setMessage("Registration successful! Please login.");
      setTimeout(() => setScreen("login"), 1500);
    } catch (error) {
      setMessage(error.response?.data?.detail || "Registration failed. Try again.");
    }
    setLoading(false);
  }

  return (
    <div style={styles.page}>
      <div style={styles.box}>
        <h1 style={styles.title}>TaskFlow</h1>
        <p style={styles.subtitle}>Create your account</p>
        <input
          style={styles.input}
          type="text"
          placeholder="Enter your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          style={styles.input}
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <select
          style={styles.input}
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="employee">Employee</option>
          <option value="team_leader">Team Leader</option>
        </select>
        <button
          style={loading ? styles.buttonDisabled : styles.button}
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </button>
        {message && (
          <p style={message.includes("successful") ? styles.success : styles.error}>
            {message}
          </p>
        )}
        <p style={styles.switchText}>
          Already have an account?{" "}
          <span style={styles.link} onClick={() => setScreen("login")}>
            Login here
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f4f8",
  },
  box: {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    width: "360px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  title: {
    margin: 0,
    fontSize: "28px",
    color: "#1a1a2e",
    textAlign: "center",
    fontWeight: "bold",
  },
  subtitle: {
    margin: 0,
    fontSize: "14px",
    color: "#888",
    textAlign: "center",
  },
  input: {
    padding: "12px",
    fontSize: "15px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  button: {
    padding: "12px",
    fontSize: "16px",
    backgroundColor: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  buttonDisabled: {
    padding: "12px",
    fontSize: "16px",
    backgroundColor: "#a5b4fc",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "not-allowed",
    fontWeight: "bold",
  },
  success: {
    textAlign: "center",
    color: "#16a34a",
    fontWeight: "bold",
    margin: 0,
  },
  error: {
    textAlign: "center",
    color: "#dc2626",
    fontWeight: "bold",
    margin: 0,
  },
  switchText: {
    textAlign: "center",
    fontSize: "13px",
    color: "#666",
    margin: 0,
  },
  link: {
    color: "#4f46e5",
    cursor: "pointer",
    fontWeight: "bold",
  },
};

export default App;