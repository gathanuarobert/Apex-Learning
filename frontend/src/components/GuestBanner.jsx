import { useAuth } from "../hooks/useAuth";

export function GuestBanner() {
  const { isGuest } = useAuth();
  if (!isGuest) return null;

  return (
    <div style={{
      padding: "6px 16px", fontSize: 13,
      background: "var(--color-background-secondary)",
      borderBottom: "1px solid var(--color-border-tertiary)",
      color: "var(--color-text-secondary)",
      display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <span>Browsing as guest — some features require an account</span>
      <a href="/login" style={{ color: "var(--color-text-info)", fontWeight: 500, textDecoration: "none" }}>
        Sign in
      </a>
    </div>
  );
}