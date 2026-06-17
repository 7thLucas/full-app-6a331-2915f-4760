"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConfigurables } from "~/modules/configurables";
import { AudioEngine } from "~/lib/audio-engine";
import type { AudioData } from "~/lib/audio-engine";
import { ThreeScene } from "~/lib/three-scene";
import { SceneHud } from "./scene-hud";

interface SkateSceneProps {
  file: File;
  onBack: () => void;
}

const EMPTY_AUDIO_DATA: AudioData = {
  bass: 0,
  mid: 0,
  treble: 0,
  amplitude: 0,
  bpm: 128,
  isBeat: false,
  rawFrequencies: new Uint8Array(512),
};

export function SkateScene({ file, onBack }: SkateSceneProps) {
  const { config } = useConfigurables();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<ThreeScene | null>(null);
  const engineRef = useRef<AudioEngine | null>(null);
  const rafRef = useRef<number>(0);
  const [audioData, setAudioData] = useState<AudioData>(EMPTY_AUDIO_DATA);
  const [error, setError] = useState<string | null>(null);

  const primaryColor = config?.brandColor?.primary ?? "#00FFFF";
  const secondaryColor = config?.brandColor?.secondary ?? "#7B2FBE";
  const accentColor = config?.brandColor?.accent ?? "#FF006E";

  const getSceneConfig = useCallback(() => ({
    backgroundColor: config?.sceneColors?.background ?? "#080810",
    gridColor: config?.sceneColors?.grid ?? "#1A1A3E",
    bassColor: config?.sceneColors?.bassColor ?? "#7B2FBE",
    trebleColor: config?.sceneColors?.trebleColor ?? "#00FFFF",
    beatFlashColor: config?.sceneColors?.beatFlash ?? "#FF006E",
    skaterGlowColor: config?.sceneColors?.skaterGlow ?? "#00FFFF",
    bloomStrength: config?.bloomStrength ?? 1.5,
    terrainSegments: config?.terrainSegments ?? 64,
  }), [config]);

  // Initialize Three.js and Audio engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create Three.js scene
    const threeScene = new ThreeScene(canvas, getSceneConfig());
    sceneRef.current = threeScene;

    // Create Audio engine
    const engine = new AudioEngine();
    engineRef.current = engine;

    let mounted = true;

    // Load audio file
    engine
      .loadFile(file)
      .then(() => {
        if (!mounted) return;

        // Start animation loop
        const loop = () => {
          if (!mounted) return;
          rafRef.current = requestAnimationFrame(loop);

          const data = engine.analyze();
          setAudioData({ ...data });
          threeScene.update(data);
        };

        rafRef.current = requestAnimationFrame(loop);
      })
      .catch((err) => {
        console.error("Audio load error:", err);
        if (mounted) {
          setError("Could not decode audio. Try a different file.");
        }
      });

    // Resize handler
    const handleResize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      threeScene.resize(w, h);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      mounted = false;
      cancelAnimationFrame(rafRef.current);
      engine.dispose();
      threeScene.dispose();
      window.removeEventListener("resize", handleResize);
      engineRef.current = null;
      sceneRef.current = null;
    };
  }, [file]);

  if (error) {
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
          gap: "24px",
        }}
      >
        <p style={{ color: accentColor, fontSize: "1.1rem", letterSpacing: "0.12em" }}>
          {error}
        </p>
        <button
          onClick={onBack}
          style={{
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
          }}
        >
          Try Another File
        </button>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap');`}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        background: config?.sceneColors?.background ?? "#080810",
        overflow: "hidden",
      }}
    >
      {/* Canvas must fill the container */}
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          filter: `brightness(1.05) saturate(1.3)`,
        }}
      />

      {/* Bloom overlay — CSS-based glow on top of canvas */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          mixBlendMode: "screen",
          background: `radial-gradient(ellipse 60% 40% at 50% 40%, ${secondaryColor}08 0%, transparent 70%)`,
        }}
      />

      {/* HUD overlay */}
      <SceneHud audioData={audioData} onBack={onBack} />
    </div>
  );
}
