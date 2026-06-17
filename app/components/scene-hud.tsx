import { useEffect, useRef } from "react";
import { useConfigurables } from "~/modules/configurables";
import type { AudioData } from "~/lib/audio-engine";

interface SceneHudProps {
  audioData: AudioData;
  onBack: () => void;
}

export function SceneHud({ audioData, onBack }: SceneHudProps) {
  const { config } = useConfigurables();
  const waveformRef = useRef<HTMLCanvasElement>(null);

  const primaryColor = config?.brandColor?.primary ?? "#00FFFF";
  const accentColor = config?.brandColor?.accent ?? "#FF006E";
  const showBpm = config?.showBpmDisplay ?? true;
  const showWaveform = config?.showWaveform ?? true;

  // Draw waveform
  useEffect(() => {
    const canvas = waveformRef.current;
    if (!canvas || !showWaveform) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const data = audioData.rawFrequencies;
    const sliceWidth = w / data.length;
    let x = 0;

    ctx.beginPath();
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 8;
    ctx.shadowColor = primaryColor;

    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 255.0;
      const y = h - v * h;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }
    ctx.stroke();
  }, [audioData, primaryColor, showWaveform]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        fontFamily: "'Orbitron', monospace",
        zIndex: 10,
      }}
    >
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          pointerEvents: "all",
          padding: "8px 18px",
          border: `1.5px solid ${primaryColor}`,
          borderRadius: "4px",
          background: "rgba(8,8,16,0.7)",
          color: primaryColor,
          fontSize: "0.7rem",
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          cursor: "pointer",
          fontFamily: "'Orbitron', monospace",
          backdropFilter: "blur(8px)",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLElement).style.background = primaryColor;
          (e.target as HTMLElement).style.color = "#080810";
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLElement).style.background = "rgba(8,8,16,0.7)";
          (e.target as HTMLElement).style.color = primaryColor;
        }}
      >
        ← Back
      </button>

      {/* BPM display */}
      {showBpm && (
        <div
          style={{
            position: "absolute",
            bottom: showWaveform ? "84px" : "20px",
            left: "20px",
            background: "rgba(8,8,16,0.75)",
            backdropFilter: "blur(12px)",
            border: `1px solid ${primaryColor}44`,
            borderRadius: "4px",
            padding: "6px 14px",
            boxShadow: `0 0 12px ${primaryColor}22`,
          }}
        >
          <span
            style={{
              color: "#39FF14",
              fontSize: "1.4rem",
              fontWeight: 900,
              letterSpacing: "0.05em",
              fontFamily: "'JetBrains Mono', monospace",
              textShadow: "0 0 16px #39FF14",
            }}
          >
            {audioData.bpm}
          </span>
          <span
            style={{
              color: "#7ECFCF",
              fontSize: "0.6rem",
              letterSpacing: "0.15em",
              display: "block",
              marginTop: "-2px",
            }}
          >
            BPM
          </span>
        </div>
      )}

      {/* Audio bands indicator */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          display: "flex",
          gap: "6px",
          alignItems: "flex-end",
          background: "rgba(8,8,16,0.7)",
          backdropFilter: "blur(12px)",
          border: `1px solid ${primaryColor}33`,
          borderRadius: "4px",
          padding: "8px 12px",
        }}
      >
        {[
          { label: "BASS", value: audioData.bass, color: config?.brandColor?.secondary ?? "#7B2FBE" },
          { label: "MID", value: audioData.mid, color: primaryColor },
          { label: "HI", value: audioData.treble, color: "#39FF14" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
            <div
              style={{
                width: "8px",
                height: `${Math.max(4, value * 40)}px`,
                background: color,
                borderRadius: "2px",
                boxShadow: `0 0 6px ${color}`,
                transition: "height 0.05s ease",
                minHeight: "4px",
              }}
            />
            <span style={{ color: "#7ECFCF", fontSize: "0.5rem", letterSpacing: "0.05em" }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Beat flash indicator */}
      {audioData.isBeat && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: accentColor,
            boxShadow: `0 0 20px ${accentColor}, 0 0 40px ${accentColor}`,
            animation: "beatFlash 0.1s ease-out forwards",
          }}
        />
      )}

      {/* Waveform bar */}
      {showWaveform && (
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(8,8,16,0.75)",
            backdropFilter: "blur(12px)",
            border: `1px solid ${primaryColor}33`,
            borderRadius: "4px",
            padding: "4px 8px",
            width: "min(480px, 90vw)",
          }}
        >
          <canvas
            ref={waveformRef}
            width={400}
            height={40}
            style={{ display: "block", width: "100%", height: "40px" }}
          />
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=JetBrains+Mono:wght@400;700&display=swap');

        @keyframes beatFlash {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
