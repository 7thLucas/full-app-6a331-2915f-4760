# Future — Design System

## Visual Identity
- **Aesthetic**: Synthwave / Cyberpunk / Tron-inspired
- **Mood**: Dark, electric, mind-bending, high-energy
- **Core metaphor**: Music made visible as a living neon world

## Color Palette
| Role | Color | Hex |
|---|---|---|
| Background | Near-black void | `#080810` |
| Grid lines | Deep indigo | `#1A1A3E` |
| Primary accent | Electric cyan | `#00FFFF` |
| Secondary accent | Deep purple | `#7B2FBE` |
| Tertiary accent | Electric blue | `#0047FF` |
| Beat flash | Hot pink | `#FF006E` |
| Energy burst | Acid green | `#39FF14` |
| Text primary | White | `#FFFFFF` |
| Text secondary | Muted cyan | `#7ECFCF` |

## Typography
- **Display / Hero**: Space Grotesk or Orbitron (bold, futuristic, geometric)
- **Body / UI**: Inter or DM Sans (clean, readable)
- **Monospace / Data**: JetBrains Mono (BPM readout, frequency numbers)
- All text on dark backgrounds, white or neon-colored
- Letter-spacing: generous on headings (0.08em–0.15em), tight on body

## Elevation & Depth
- Glassmorphism for UI panels: `background: rgba(8, 8, 16, 0.7); backdrop-filter: blur(16px);`
- Neon glow shadows: `box-shadow: 0 0 20px #00FFFF40, 0 0 60px #00FFFF20;`
- Layering: dark void → grid terrain → 3D world → skater → particle FX → UI overlay
- No hard drop shadows — only bloom/glow blur

## Components

### Upload Drop Zone
- Full-screen centered card, max-width 480px
- Animated dashed neon border (cyan, animates dash-offset)
- Icon: glowing upload arrow
- Tagline: "DROP YOUR MUSIC. WATCH THE WORLD REACT."
- Secondary text: "Supports MP3, WAV, OGG, MP4, MOV, WebM"
- On drag-over: border pulses hot pink, background flashes

### HUD (In-Scene UI)
- Bottom-center waveform bar: thin canvas strip showing live FFT
- Bottom-left: BPM counter in Orbitron font, neon green
- All HUD elements use glassmorphism panels
- Fade-in on scene start, minimal footprint

### Loading State
- Centered animated equalizer bars (5 bars, all neon colors)
- Text: "ANALYZING AUDIO..." in Orbitron, tracked out

### Buttons
- No fill / outline style with neon border
- Hover: fill with neon color, text inverts to black
- Active: brief glow flash
- Border-radius: 4px (sharp, angular)

## 3D Scene Visual Rules
- **Terrain mesh**: flat-shaded low-poly for aesthetic clarity; vertex colors shift with frequency
- **Bloom post-processing**: `UnrealBloomPass` or equivalent — threshold 0.4, strength 1.5, radius 0.4
- **Grid overlay**: infinite scrolling perspective grid on ground plane
- **Neon trails**: additive blending for skater trail and particle effects
- **Color transitions**: smooth lerp between color states; never hard-cut
- **Beat flash**: full-scene color temperature shift on detected beat (very brief, ~100ms)

## Motion & Animation Principles
- Everything reacts to audio — nothing is static when music plays
- Easing: ease-out for energy release, ease-in for build-up
- Terrain updates: smooth vertex interpolation each frame (lerp factor ~0.1)
- Skater lean: smooth quaternion slerp
- Camera: slight lag/spring follow behind skater, auto-tilts on jumps
- Transitions between states: fade-through-black, 300ms

## Responsive Breakpoints
- Desktop (primary): full 3D experience, all effects on
- Tablet: reduce particle count, maintain 3D
- Mobile: simplified terrain, reduced bloom, warn user about performance
