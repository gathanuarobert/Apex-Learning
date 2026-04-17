import { useAuth } from "../hooks/useAuth";

export function GuestBanner({ onSignIn }) {
  const { isGuest } = useAuth();
  if (!isGuest) return null;

  return (
    <div style={{
      padding: "6px 16px",
      fontSize: 13,
      marginBottom: 16,
      background: "rgba(255,255,255,0.03)",
      borderRadius: 10,
      border: "1px solid rgba(255,255,255,0.07)",
      color: "#94a3b8",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}>
      <span>Browsing as guest — downloads require an account</span>
      <button
        onClick={onSignIn}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#60a5fa", fontWeight: 600, fontSize: 13,
        }}
      >
        Sign in
      </button>
    </div>
  );
}