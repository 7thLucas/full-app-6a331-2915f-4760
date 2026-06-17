import { useCallback, useRef, useState } from "react";
import { useConfigurables } from "~/modules/configurables";

interface UploadScreenProps {
  onFileReady: (file: File) => void;
}

const ACCEPTED_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/mp3",
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

const ACCEPTED_EXTENSIONS = ".mp3,.wav,.ogg,.mp4,.mov,.webm";

export function UploadScreen({ onFileReady }: UploadScreenProps) {
  const { config, loading } = useConfigurables();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const appName = config?.appName ?? "FUTURE";
  const tagline = config?.tagline ?? "DROP YOUR MUSIC. WATCH THE WORLD REACT.";
  const uploadSubtitle = config?.uploadSubtitle ?? "Supports MP3, WAV, OGG, MP4, MOV, WebM";
  const primaryColor = config?.brandColor?.primary ?? "#00FFFF";
  const secondaryColor = config?.brandColor?.secondary ?? "#7B2FBE";
  const accentColor = config?.brandColor?.accent ?? "#FF006E";

  const validateFile = (file: File): boolean => {
    const isValidType =
      ACCEPTED_TYPES.includes(file.type) ||
      /\.(mp3|wav|ogg|mp4|mov|webm)$/i.test(file.name);
    if (!isValidType) {
      setError("Unsupported format. Use MP3, WAV, OGG, MP4, MOV, or WebM.");
      return false;
    }
    if (file.size > 200 * 1024 * 1024) {
      setError("File too large. Max 200MB.");
      return false;
    }
    setError(null);
    return true;
  };

  const handleFile = useCallback(
    (file: File) => {
      if (validateFile(file)) {
        onFileReady(file);
      }
    },
    [onFileReady]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  if (loading) return null;

  return (
    <div
      className="upload-screen"
      style={{
        minHeight: "100vh",
        background: "#080810",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Orbitron', 'Space Grotesk', sans-serif",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(${config?.sceneColors?.grid ?? "#1A1A3E"} 1px, transparent 1px),
            linear-gradient(90deg, ${config?.sceneColors?.grid ?? "#1A1A3E"} 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          opacity: 0.35,
          pointerEvents: "none",
        }}
      />

      {/* Radial glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 70% 50% at 50% 60%, ${secondaryColor}22 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* App name */}
      <div style={{ position: "relative", textAlign: "center", marginBottom: "48px" }}>
        <h1
          style={{
            fontSize: "clamp(3rem, 10vw, 7rem)",
            fontWeight: 900,
            letterSpacing: "0.18em",
            color: primaryColor,
            margin: 0,
            textShadow: `0 0 40px ${primaryColor}99, 0 0 80px ${primaryColor}55`,
            fontFamily: "'Orbitron', monospace",
          }}
        >
          {appName}
        </h1>
        <p
          style={{
            color: "#7ECFCF",
            fontSize: "clamp(0.65rem, 2vw, 0.85rem)",
            letterSpacing: "0.35em",
            margin: "8px 0 0",
            textTransform: "uppercase",
          }}
        >
          Music-Reactive 3D Skateboarding
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "480px",
          padding: "48px 32px",
          border: `2px dashed ${isDragging ? accentColor : primaryColor}`,
          borderRadius: "8px",
          cursor: "pointer",
          textAlign: "center",
          background: isDragging ? `${accentColor}0d` : "rgba(8, 8, 16, 0.7)",
          backdropFilter: "blur(16px)",
          boxShadow: isDragging
            ? `0 0 30px ${accentColor}66, inset 0 0 30px ${accentColor}11`
            : `0 0 20px ${primaryColor}33, 0 0 60px ${primaryColor}11`,
          transition: "all 0.2s ease",
          animation: "borderPulse 3s ease-in-out infinite",
        }}
      >
        {/* Upload icon */}
        <svg
          width="56"
          height="56"
          viewBox="0 0 56 56"
          fill="none"
          style={{
            margin: "0 auto 20px",
            display: "block",
            filter: `drop-shadow(0 0 12px ${primaryColor})`,
          }}
        >
          <circle cx="28" cy="28" r="27" stroke={primaryColor} strokeWidth="1.5" opacity="0.4" />
          <path
            d="M28 36V20M28 20L21 27M28 20L35 27"
            stroke={primaryColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18 38H38"
            stroke={primaryColor}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>

        <p
          style={{
            color: "#FFFFFF",
            fontSize: "clamp(0.9rem, 3vw, 1.1rem)",
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            margin: "0 0 12px",
            textShadow: `0 0 20px ${primaryColor}88`,
          }}
        >
          {tagline}
        </p>

        <p
          style={{
            color: "#7ECFCF",
            fontSize: "0.78rem",
            letterSpacing: "0.08em",
            margin: "0 0 20px",
          }}
        >
          {uploadSubtitle}
        </p>

        <button
          type="button"
          style={{
            display: "inline-block",
            padding: "10px 28px",
            border: `1.5px solid ${primaryColor}`,
            borderRadius: "4px",
            background: "transparent",
            color: primaryColor,
            fontSize: "0.8rem",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            cursor: "pointer",
            fontFamily: "'Orbitron', monospace",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.background = primaryColor;
            (e.target as HTMLElement).style.color = "#080810";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.background = "transparent";
            (e.target as HTMLElement).style.color = primaryColor;
          }}
        >
          Browse File
        </button>
      </div>

      {/* Error message */}
      {error && (
        <p
          style={{
            color: accentColor,
            fontSize: "0.82rem",
            marginTop: "16px",
            letterSpacing: "0.08em",
            textShadow: `0 0 10px ${accentColor}88`,
          }}
        >
          {error}
        </p>
      )}

      {/* Footer hint */}
      <p
        style={{
          position: "absolute",
          bottom: "24px",
          color: "#2a2a5a",
          fontSize: "0.7rem",
          letterSpacing: "0.12em",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        FULLY CLIENT-SIDE · NO DATA STORED
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        onChange={handleInputChange}
        style={{ display: "none" }}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=JetBrains+Mono:wght@400;700&display=swap');

        @keyframes borderPulse {
          0%, 100% { border-color: ${primaryColor}; }
          50% { border-color: ${secondaryColor}; }
        }
      `}</style>
    </div>
  );
}
