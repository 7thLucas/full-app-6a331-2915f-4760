import { useState, useEffect, lazy, Suspense } from "react";
import { UploadScreen } from "~/components/upload-screen";
import { LoadingScreen } from "~/components/loading-screen";

// Lazy-load the heavy 3D scene (splits Three.js bundle)
const SkateScene = lazy(() =>
  import("~/components/skate-scene").then((m) => ({ default: m.SkateScene }))
);

type AppState = "upload" | "loading" | "scene";

export default function IndexPage() {
  const [appState, setAppState] = useState<AppState>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Prevent SSR hydration mismatch for client-only Three.js
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleFileReady = (file: File) => {
    setSelectedFile(file);
    setAppState("loading");

    // Brief loading state, then launch scene
    setTimeout(() => {
      setAppState("scene");
    }, 1200);
  };

  const handleBack = () => {
    setSelectedFile(null);
    setAppState("upload");
  };

  if (!isClient) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#080810",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
    );
  }

  return (
    <>
      {appState === "upload" && <UploadScreen onFileReady={handleFileReady} />}

      {appState === "loading" && selectedFile && (
        <LoadingScreen fileName={selectedFile.name} />
      )}

      {appState === "scene" && selectedFile && (
        <Suspense fallback={<LoadingScreen fileName={selectedFile.name} />}>
          <SkateScene file={selectedFile} onBack={handleBack} />
        </Suspense>
      )}
    </>
  );
}
