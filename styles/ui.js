export const ui = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color: "white",
    fontFamily: "Inter, sans-serif"
  },

  card: {
    background: "rgba(30,41,59,0.6)",
    backdropFilter: "blur(14px)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 16,
    transition: "0.25s",
  },

  cardHover: {
    transform: "translateY(-4px)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
  },

  button: {
    padding: "8px 14px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
    transition: "0.2s"
  },

  primary: {
    background: "#7c3aed",
    color: "white"
  },

  success: {
    background: "#10b981",
    color: "white"
  },

  danger: {
    background: "#ef4444",
    color: "white"
  },

  input: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#020617",
    color: "white",
    outline: "none"
  }
};