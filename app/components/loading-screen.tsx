import { useConfigurables } from "~/modules/configurables";

interface LoadingScreenProps {
  fileName: string;
}

export function LoadingScreen({ fileName }: LoadingScreenProps) {
  const { config } = useConfigurables();
  const primaryColor = config?.brandColor?.primary ?? "#00FFFF";
  const secondaryColor = config?.brandColor?.secondary ?? "#7B2FBE";
  const accentColor = config?.brandColor?.accent ?? "#FF006E";
  const colors = [primaryColor, secondaryColor, accentColor, "#39FF14", "#0047FF"];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080810",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Orbitron', monospace",
        gap: "32px",
      }}
    >
      {/* Equalizer bars */}
      <div style={{ display: "flex", gap: "6px", alignItems: "flex-end", height: "64px" }}>
        {colors.map((color, i) => (
          <div
            key={i}
            style={{
              width: "10px",
              borderRadius: "2px",
              background: color,
              boxShadow: `0 0 12px ${color}`,
              animation: `eqBar 0.8s ease-in-out ${i * 0.12}s infinite alternate`,
            }}
          />
        ))}
      </div>

      <div style={{ textAlign: "center" }}>
        <p
          style={{
            color: primaryColor,
            fontSize: "clamp(0.9rem, 3vw, 1.2rem)",
            letterSpacing: "0.35em",
            fontWeight: 700,
            textShadow: `0 0 20px ${primaryColor}`,
            margin: "0 0 12px",
          }}
        >
          ANALYZING AUDIO...
        </p>
        <p
          style={{
            color: "#7ECFCF",
            fontSize: "0.72rem",
            letterSpacing: "0.15em",
            fontFamily: "'JetBrains Mono', monospace",
            maxWidth: "280px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {fileName}
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=JetBrains+Mono&display=swap');

        @keyframes eqBar {
          0% { height: 8px; }
          100% { height: 56px; }
        }
      `}</style>
    </div>
  );
}
