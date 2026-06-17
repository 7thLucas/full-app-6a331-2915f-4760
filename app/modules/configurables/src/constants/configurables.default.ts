/*
 * Default Configurable Data — seeded into Mongo on first boot.
 *
 * BEFORE EDITING: read ./RULES.md (especially R5: schema and defaults must
 * stay in sync) and ./configurables.schema.ts. For per-type schema and
 * default-value samples, see RULES.md §5 "Field Type Reference".
 */

export type TBrandColor = {
  primary: string;
  secondary: string;
  accent: string;
};

export type TSceneColors = {
  background: string;
  grid: string;
  bassColor: string;
  trebleColor: string;
  beatFlash: string;
  skaterGlow: string;
};

export type TDefaultConfigurableData = {
  appName: string;
  logoUrl: string;
  brandColor: TBrandColor;
  tagline: string;
  uploadSubtitle: string;
  sceneColors: TSceneColors;
  skaterName: string;
  bloomStrength: number;
  terrainSegments: number;
  showBpmDisplay: boolean;
  showWaveform: boolean;
};

export const defaultConfigurablesData: TDefaultConfigurableData = {
  appName: "FUTURE",
  logoUrl: "FILL_LOGO_URL_HERE",
  brandColor: {
    primary: "#00FFFF",
    secondary: "#7B2FBE",
    accent: "#FF006E",
  },
  tagline: "DROP YOUR MUSIC. WATCH THE WORLD REACT.",
  uploadSubtitle: "Supports MP3, WAV, OGG, MP4, MOV, WebM",
  sceneColors: {
    background: "#080810",
    grid: "#1A1A3E",
    bassColor: "#7B2FBE",
    trebleColor: "#00FFFF",
    beatFlash: "#FF006E",
    skaterGlow: "#00FFFF",
  },
  skaterName: "AXON",
  bloomStrength: 1.5,
  terrainSegments: 64,
  showBpmDisplay: true,
  showWaveform: true,
};
