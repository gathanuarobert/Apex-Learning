import { loginUser } from "../Api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function AuthModal({ show, onClose, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await loginUser({
        email,
        password,
        recaptcha: "bypass",
      });

      onLoginSuccess(response.data.user);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div
      onClick={onClose} // ✅ close on background click
      style={{
        minHeight: 380,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "var(--border-radius-lg)",
        padding: "24px",
        position: "fixed",
        inset: 0,
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()} // ✅ prevent closing when clicking inside
        style={{
          background: "#111827",
          borderRadius: "16px",
          padding: "32px 28px",
          width: "100%",
          maxWidth: 380,
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <p
          style={{
            fontSize: 18,
            fontWeight: 600,
            marginBottom: 8,
            color: "#fff",
          }}
        >
          Sign in to continue
        </p>

        <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 24 }}>
          Please log in or create an account to download resources.
        </p>

        {error && (
          <p style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>
            {error}
          </p>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ ...inputStyle, marginTop: 10 }}
        />

        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              ...primaryBtn,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in..." : "Log in"}
          </button>

          <button
            onClick={() => {
              onClose();
              navigate("/register");
            }}
            style={secondaryBtn}
          >
            Sign up
          </button>
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: 16,
            fontSize: 13,
            color: "#6b7280",
            background: "none",
            border: "none",
            cursor: "pointer",
            width: "100%",
          }}
        >
          Continue browsing as guest
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff",
  fontSize: 14,
  boxSizing: "border-box",
  outline: "none",
};

const primaryBtn = {
  flex: 1,
  padding: "10px 0",
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  background: "#2563eb",
  color: "#fff",
  border: "none",
  cursor: "pointer",
};

const secondaryBtn = {
  flex: 1,
  padding: "10px 0",
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  background: "none",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.2)",
  cursor: "pointer",
};