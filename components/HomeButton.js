import { useRouter } from "next/router";

export default function HomeButton({ style = {} }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/")}
      style={{
        padding: "8px 16px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.05)",
        color: "white",
        fontWeight: 600,
        fontSize: 12,
        backdropFilter: "blur(8px)",
        ...style
      }}
    >
      🏠 Home
    </button>
  );
}