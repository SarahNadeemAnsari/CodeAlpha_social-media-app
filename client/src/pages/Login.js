import { useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("/users/login", form);
      localStorage.setItem("token", res.data.token);
      navigate("/feed");
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.brand}>Connectly</h1>
        <p style={styles.tagline}>Share your world.</p>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            style={styles.input}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            style={styles.input}
            required
          />
          <button type="submit" style={styles.btn}>Log in</button>
        </form>

        <div style={styles.dividerRow}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>OR</span>
          <div style={styles.dividerLine} />
        </div>

        <p style={styles.switchText}>
          Don't have an account?{" "}
          <span onClick={() => navigate("/register")} style={styles.link}>
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  card: {
    background: "#111",
    border: "1px solid #262626",
    borderRadius: 12,
    padding: "40px 40px",
    width: "100%",
    maxWidth: 360,
    textAlign: "center",
  },
  brand: {
    color: "#fff",
    fontSize: 32,
    fontWeight: 700,
    letterSpacing: -1,
    marginBottom: 4,
  },
  tagline: {
    color: "#555",
    fontSize: 14,
    marginBottom: 28,
  },
  error: {
    color: "#ed4956",
    fontSize: 13,
    marginBottom: 12,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  input: {
    background: "#1a1a1a",
    border: "1px solid #262626",
    borderRadius: 8,
    padding: "12px 14px",
    color: "#fff",
    fontSize: 14,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  btn: {
    background: "#0095f6",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "12px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 4,
  },
  dividerRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "24px 0",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: "#262626",
  },
  dividerText: {
    color: "#555",
    fontSize: 12,
    fontWeight: 600,
  },
  switchText: {
    color: "#aaa",
    fontSize: 14,
  },
  link: {
    color: "#0095f6",
    cursor: "pointer",
    fontWeight: 600,
  },
};

export default Login;