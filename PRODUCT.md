# Future — Music-Reactive 3D Skateboarding Experience

## Product Vision
Future is a mind-blowing, music-reactive 3D skateboarding experience that transforms audio into a living, breathing world. Users upload a video or audio file of themselves (or any music), and a custom skater character rips through a procedurally generated neon landscape that pulses, warps, and explodes with color in real time — all driven by the audio.

## Core User Journey
1. User lands on a stunning dark, neon-lit splash screen
2. User uploads a video (MP4, MOV, WebM) or audio file (MP3, WAV, OGG)
3. Audio is extracted from the video (or used directly if audio file)
4. The 3D skateboarding scene launches — terrain, physics, and visuals all react live to the music
5. User watches/interacts as the skater shreds through a world built entirely by sound

## Audio Analysis Features (Web Audio API)
- Real-time FFT frequency analysis (split into bass, mid, treble bands)
- Beat detection via amplitude thresholding and onset detection
- BPM estimation to sync skater speed and trick timing
- Amplitude envelope tracking for overall energy
- Bass frequency → terrain deformation magnitude
- High frequencies (treble) → color shifting and particle bursts
- Tempo / BPM → skater speed, jump height, trick frequency

## 3D Skateboarding World (Three.js)
- Dark background (near-black) as the canvas for neon visuals
- Procedurally generated terrain mesh that updates its vertex heights in real time driven by bass/sub-bass FFT data — creates rolling hills, sudden drops, massive ramps
- Neon electric color palette: deep purple (#7B2FBE), cyan (#00FFFF), electric blue (#0047FF), hot pink (#FF006E), acid green (#39FF14)
- Grid-lined ground plane (synthwave/cyberpunk aesthetic)
- Floating neon obstacles (rails, ramps, half-pipes) that spawn and move based on audio energy
- Post-processing bloom/glow effects for neon light bleeding
- Dynamic fog that thickens/thins with audio intensity
- Particle system bursts on beat hits

## Custom Skater Character (Original, Not Copyrighted)
- Fully original low-poly geometric skater — angular, futuristic humanoid silhouette
- Neon-accented limbs and skateboard deck glowing with audio-reactive color
- Procedural animation: leans into turns, crouches on bass hits, launches into tricks on beat peaks
- Tricks: kickflips, 360s, grinds — triggered by audio beat events
- Skateboard deck emits neon trail/streak as speed increases

## Physics System
- Custom physics: gravity, velocity, momentum
- Gravity strength modulated by audio amplitude (low energy = floaty, high energy = heavy)
- Speed increases with BPM / tempo
- Ramp launches on beat drops → big air tricks
- Collision with procedural terrain — skater rides the surface
- No external physics library required (custom integration)

## UX & Design
- Upload screen: large drag-and-drop zone, dark bg, neon animated border, tagline "Drop your music. Watch the world react."
- Loading/processing state with animated waveform visualization
- Scene UI: minimal — just a thin audio waveform bar at the bottom, current BPM readout
- Responsive: works on desktop (primary), degrades gracefully on mobile
- No login, no backend — fully client-side

## Brand & Tone
- Name: Future
- Tone: Crazy, futuristic, mind-blowing, visceral
- Anti-references: No Bart Simpson, no copyrighted characters, no cartoonish/childish aesthetics
- Inspired by: Tron, synthwave aesthetic, Tony Hawk's Pro Skater neon fever dream
- Primary audience: music producers, skate culture enthusiasts, creative tech lovers

## Strategic Principles
- Pure client-side — no server, no data storage, privacy-first
- Performance-first: 60fps target using efficient Three.js draw calls
- Immediate wow factor — the first 3 seconds after upload must be stunning
