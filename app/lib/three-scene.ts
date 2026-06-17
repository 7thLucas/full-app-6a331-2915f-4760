/**
 * ThreeScene — Three.js music-reactive 3D skateboarding world.
 * Procedural terrain, custom skater character, particle system, bloom glow.
 * All rendering is driven by AudioData passed each frame via update().
 */

import * as THREE from "three";
import type { AudioData } from "./audio-engine";

export interface SceneConfig {
  backgroundColor: string;
  gridColor: string;
  bassColor: string;
  trebleColor: string;
  beatFlashColor: string;
  skaterGlowColor: string;
  bloomStrength: number;
  terrainSegments: number;
}

const DEFAULT_CONFIG: SceneConfig = {
  backgroundColor: "#080810",
  gridColor: "#1A1A3E",
  bassColor: "#7B2FBE",
  trebleColor: "#00FFFF",
  beatFlashColor: "#FF006E",
  skaterGlowColor: "#00FFFF",
  bloomStrength: 1.5,
  terrainSegments: 64,
};

// ─── Lerp helpers ────────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0, g: 1, b: 1 };
}

export class ThreeScene {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();

  // Terrain
  private terrain!: THREE.Mesh;
  private terrainGeo!: THREE.PlaneGeometry;
  private terrainVertexHeights: Float32Array = new Float32Array(0);
  private terrainTargetHeights: Float32Array = new Float32Array(0);
  private terrainWidth = 120;
  private terrainDepth = 300;

  // Grid
  private gridHelper!: THREE.GridHelper;

  // Skater
  private skater!: THREE.Group;
  private skateboard!: THREE.Group;
  private skaterVelocityY = 0;
  private skaterY = 0;
  private skaterTargetX = 0;
  private skaterX = 0;
  private trickTimer = 0;
  private isInAir = false;
  private skaterGlowMeshes: THREE.Mesh[] = [];

  // Trail
  private trailPoints: THREE.Vector3[] = [];
  private trailLine!: THREE.Line;
  private trailMaxPoints = 80;

  // Particles
  private particles!: THREE.Points;
  private particlePositions!: Float32Array;
  private particleVelocities: THREE.Vector3[] = [];
  private particleCount = 200;
  private activeParticles = 0;

  // Obstacles
  private obstacles: THREE.Mesh[] = [];
  private obstacleZ = -40;

  // Fog
  private fog!: THREE.FogExp2;

  // Post-process bloom overlay (CSS-based glow, no postprocessing lib needed)
  private canvas!: HTMLCanvasElement;

  // State
  private beatFlashTimer = 0;
  private config: SceneConfig;
  private frameCount = 0;
  private disposed = false;

  // Current color state for lerping
  private currentBassColor = new THREE.Color("#7B2FBE");
  private currentTrebleColor = new THREE.Color("#00FFFF");

  constructor(canvas: HTMLCanvasElement, config: Partial<SceneConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.canvas = canvas;
    this._initRenderer(canvas);
    this._initScene();
    this._initCamera();
    this._initTerrain();
    this._initGrid();
    this._initSkater();
    this._initTrail();
    this._initParticles();
    this._initObstacles();
    this._initLights();
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  private _initRenderer(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.4;
  }

  private _initScene() {
    this.scene = new THREE.Scene();
    const bg = new THREE.Color(this.config.backgroundColor);
    this.scene.background = bg;
    this.fog = new THREE.FogExp2(this.config.backgroundColor, 0.012);
    this.scene.fog = this.fog;
  }

  private _initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      65,
      this.canvas.clientWidth / this.canvas.clientHeight,
      0.1,
      600
    );
    this.camera.position.set(0, 12, 28);
    this.camera.lookAt(0, 0, -10);
  }

  private _initTerrain() {
    const segs = this.config.terrainSegments;
    this.terrainGeo = new THREE.PlaneGeometry(
      this.terrainWidth,
      this.terrainDepth,
      segs,
      segs * 3
    );
    this.terrainGeo.rotateX(-Math.PI / 2);

    const vertCount = this.terrainGeo.attributes.position.count;
    this.terrainVertexHeights = new Float32Array(vertCount).fill(0);
    this.terrainTargetHeights = new Float32Array(vertCount).fill(0);

    const terrainMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.config.bassColor),
      wireframe: false,
      roughness: 0.85,
      metalness: 0.3,
      vertexColors: true,
      side: THREE.DoubleSide,
    });

    // Init vertex colors
    const colors = new Float32Array(vertCount * 3);
    const baseColor = new THREE.Color(this.config.bassColor);
    for (let i = 0; i < vertCount; i++) {
      colors[i * 3] = baseColor.r * 0.4;
      colors[i * 3 + 1] = baseColor.g * 0.4;
      colors[i * 3 + 2] = baseColor.b * 0.4;
    }
    this.terrainGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    this.terrainGeo.attributes.color.needsUpdate = true;

    this.terrain = new THREE.Mesh(this.terrainGeo, terrainMat);
    this.terrain.receiveShadow = true;
    this.scene.add(this.terrain);
  }

  private _initGrid() {
    this.gridHelper = new THREE.GridHelper(
      this.terrainWidth,
      this.config.terrainSegments,
      new THREE.Color(this.config.gridColor),
      new THREE.Color(this.config.gridColor)
    );
    this.gridHelper.position.y = 0.05;
    this.scene.add(this.gridHelper);
  }

  private _initSkater() {
    this.skater = new THREE.Group();

    // Torso — angular box
    const torsoGeo = new THREE.BoxGeometry(0.6, 0.85, 0.35);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#1a1a3a"),
      roughness: 0.4,
      metalness: 0.8,
    });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 1.05;
    torso.castShadow = true;
    this.skater.add(torso);

    // Head — angular octahedron-ish
    const headGeo = new THREE.OctahedronGeometry(0.28, 0);
    const headMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#0a0a1e"),
      roughness: 0.3,
      metalness: 0.9,
      emissive: new THREE.Color(this.config.skaterGlowColor),
      emissiveIntensity: 0.4,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.72;
    head.castShadow = true;
    this.skater.add(head);
    this.skaterGlowMeshes.push(head);

    // Arms
    const armGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.6, 5);
    const armMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#1a1a3a"),
      roughness: 0.4,
      metalness: 0.8,
      emissive: new THREE.Color(this.config.skaterGlowColor),
      emissiveIntensity: 0.2,
    });
    const leftArm = new THREE.Mesh(armGeo, armMat.clone());
    leftArm.rotation.z = Math.PI / 5;
    leftArm.position.set(-0.52, 1.1, 0);
    this.skater.add(leftArm);
    this.skaterGlowMeshes.push(leftArm);

    const rightArm = new THREE.Mesh(armGeo, armMat.clone());
    rightArm.rotation.z = -Math.PI / 5;
    rightArm.position.set(0.52, 1.1, 0);
    this.skater.add(rightArm);
    this.skaterGlowMeshes.push(rightArm);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.65, 5);
    const legMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#101030"),
      roughness: 0.5,
      metalness: 0.6,
    });
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.18, 0.45, 0);
    this.skater.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeo, legMat.clone());
    rightLeg.position.set(0.18, 0.45, 0);
    this.skater.add(rightLeg);

    // Skateboard deck
    this.skateboard = new THREE.Group();
    const deckGeo = new THREE.BoxGeometry(0.9, 0.05, 0.28);
    const deckMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.config.skaterGlowColor),
      roughness: 0.3,
      metalness: 0.7,
      emissive: new THREE.Color(this.config.skaterGlowColor),
      emissiveIntensity: 0.8,
    });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    this.skateboard.add(deck);
    this.skaterGlowMeshes.push(deck);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.07, 8);
    const wheelMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#00FFFF"),
      emissive: new THREE.Color("#00FFFF"),
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.8,
    });
    const wheelPositions = [
      [-0.32, -0.07, 0.14],
      [0.32, -0.07, 0.14],
      [-0.32, -0.07, -0.14],
      [0.32, -0.07, -0.14],
    ];
    for (const [wx, wy, wz] of wheelPositions) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat.clone());
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(wx, wy, wz);
      this.skateboard.add(wheel);
    }

    this.skateboard.position.y = 0.08;
    this.skater.add(this.skateboard);
    this.skater.position.set(0, 0, 0);

    // Skater glow point light
    const skaterLight = new THREE.PointLight(new THREE.Color(this.config.skaterGlowColor), 3, 8);
    skaterLight.position.set(0, 1.2, 0);
    this.skater.add(skaterLight);

    this.scene.add(this.skater);
  }

  private _initTrail() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.trailMaxPoints * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setDrawRange(0, 0);

    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(this.config.skaterGlowColor),
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.trailLine = new THREE.Line(geo, mat);
    this.scene.add(this.trailLine);
  }

  private _initParticles() {
    this.particlePositions = new Float32Array(this.particleCount * 3);
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(this.particlePositions, 3)
    );
    particleGeo.setDrawRange(0, 0);

    const particleMat = new THREE.PointsMaterial({
      color: new THREE.Color(this.config.beatFlashColor),
      size: 0.25,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.particles = new THREE.Points(particleGeo, particleMat);
    this.scene.add(this.particles);

    // Init velocities
    for (let i = 0; i < this.particleCount; i++) {
      this.particleVelocities.push(new THREE.Vector3(0, 0, 0));
    }
  }

  private _initObstacles() {
    const colors = [this.config.trebleColor, this.config.bassColor, this.config.beatFlashColor];
    for (let i = 0; i < 6; i++) {
      const type = i % 3;
      let geo: THREE.BufferGeometry;

      if (type === 0) {
        // Rail
        geo = new THREE.BoxGeometry(0.12, 0.12, 4);
      } else if (type === 1) {
        // Ramp wedge
        geo = new THREE.ConeGeometry(1.2, 2.5, 4);
      } else {
        // Halfpipe box
        geo = new THREE.BoxGeometry(3, 1.5, 1.2);
      }

      const color = colors[i % colors.length];
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.6,
        roughness: 0.3,
        metalness: 0.8,
        transparent: true,
        opacity: 0.85,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 14,
        type === 1 ? 1.25 : type === 2 ? 0.75 : 0.6,
        -60 - i * 30
      );
      mesh.castShadow = true;
      this.scene.add(mesh);
      this.obstacles.push(mesh);
    }
  }

  private _initLights() {
    const ambient = new THREE.AmbientLight(0x0a0a1e, 2.0);
    this.scene.add(ambient);

    const directional = new THREE.DirectionalLight(0x4040ff, 1.5);
    directional.position.set(10, 20, 10);
    directional.castShadow = true;
    directional.shadow.mapSize.set(1024, 1024);
    this.scene.add(directional);

    // Neon floor lights
    const leftLight = new THREE.PointLight(new THREE.Color(this.config.bassColor), 2, 30);
    leftLight.position.set(-8, 2, -5);
    this.scene.add(leftLight);

    const rightLight = new THREE.PointLight(new THREE.Color(this.config.trebleColor), 2, 30);
    rightLight.position.set(8, 2, -5);
    this.scene.add(rightLight);
  }

  // ── Update (called every frame) ───────────────────────────────────────────

  update(audioData: AudioData): void {
    if (this.disposed) return;

    const delta = this.clock.getDelta();
    const time = this.clock.elapsedTime;
    this.frameCount++;

    const { bass, mid, treble, amplitude, bpm, isBeat } = audioData;

    // ── Terrain ──
    this._updateTerrain(bass, mid, treble, time, delta);

    // ── Skater physics ──
    this._updateSkater(bass, mid, treble, amplitude, bpm, isBeat, delta, time);

    // ── Trail ──
    this._updateTrail();

    // ── Particles ──
    if (isBeat) this._spawnParticles();
    this._updateParticles(delta);

    // ── Obstacles ──
    this._updateObstacles(bpm, delta, bass);

    // ── Grid scroll ──
    this.gridHelper.position.z = (time * 8) % (this.terrainWidth / this.config.terrainSegments);

    // ── Beat flash ──
    if (isBeat) this.beatFlashTimer = 0.12;
    if (this.beatFlashTimer > 0) {
      this.beatFlashTimer -= delta;
      const flashIntensity = Math.max(0, this.beatFlashTimer / 0.12);
      const flashColor = new THREE.Color(this.config.beatFlashColor);
      this.scene.background = new THREE.Color(this.config.backgroundColor).lerp(
        flashColor,
        flashIntensity * 0.18
      );
    } else {
      this.scene.background = new THREE.Color(this.config.backgroundColor);
    }

    // ── Fog ──
    const targetFogDensity = 0.008 + amplitude * 0.022;
    this.fog.density = lerp(this.fog.density, targetFogDensity, 0.05);

    // ── Camera ──
    this._updateCamera(delta);

    // ── Skater glow ──
    const glowIntensity = 0.4 + bass * 1.2;
    const targetGlowColor = new THREE.Color(this.config.skaterGlowColor).lerp(
      new THREE.Color(this.config.beatFlashColor),
      isBeat ? 1 : 0
    );
    for (const mesh of this.skaterGlowMeshes) {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = lerp(mat.emissiveIntensity, glowIntensity, 0.1);
      mat.emissive.lerp(targetGlowColor, 0.1);
    }

    this.renderer.render(this.scene, this.camera);
  }

  private _updateTerrain(
    bass: number,
    mid: number,
    treble: number,
    time: number,
    _delta: number
  ) {
    const pos = this.terrainGeo.attributes.position as THREE.BufferAttribute;
    const colors = this.terrainGeo.attributes.color as THREE.BufferAttribute;
    const vertCount = pos.count;

    const bassColor = new THREE.Color(this.config.bassColor);
    const trebleColor = new THREE.Color(this.config.trebleColor);
    const gridColor = new THREE.Color(this.config.gridColor);

    for (let i = 0; i < vertCount; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Target height from noise + audio
      const wave1 = Math.sin(x * 0.15 + time * 0.8) * Math.cos(z * 0.08 + time * 0.5);
      const wave2 = Math.sin(x * 0.3 + time * 1.2) * 0.5;
      const bassWave = bass * 6 * Math.sin(x * 0.2 + z * 0.1 + time * 2);
      const midWave = mid * 2 * Math.cos(x * 0.4 + time * 1.5);
      const target = (wave1 + wave2) * 1.5 + bassWave + midWave;

      this.terrainTargetHeights[i] = target;

      // Lerp current toward target
      this.terrainVertexHeights[i] = lerp(
        this.terrainVertexHeights[i],
        this.terrainTargetHeights[i],
        0.08
      );

      pos.setY(i, this.terrainVertexHeights[i]);

      // Vertex colors
      const heightNorm = Math.max(0, Math.min(1, (this.terrainVertexHeights[i] + 3) / 8));
      const blendColor = gridColor.clone().lerp(bassColor, bass * 0.7).lerp(trebleColor, treble * 0.5);
      const finalColor = gridColor.clone().lerp(blendColor, heightNorm * 0.8 + 0.2);
      colors.setXYZ(i, finalColor.r, finalColor.g, finalColor.b);
    }

    pos.needsUpdate = true;
    colors.needsUpdate = true;
    this.terrainGeo.computeVertexNormals();
  }

  private _updateSkater(
    bass: number,
    _mid: number,
    treble: number,
    amplitude: number,
    bpm: number,
    isBeat: boolean,
    delta: number,
    time: number
  ) {
    // Speed from BPM
    const baseSpeed = 0.5 + (bpm / 60) * 0.4;
    const speedMultiplier = 1 + amplitude * 2;

    // Gravity from amplitude
    const gravity = -(4 + amplitude * 8);

    // Horizontal drift (react to treble)
    this.skaterTargetX = Math.sin(time * 0.7) * 3 + (treble - 0.5) * 4;
    this.skaterX = lerp(this.skaterX, this.skaterTargetX, 0.03 * baseSpeed);

    // Jump on beat
    if (isBeat && !this.isInAir && bass > 0.35) {
      this.skaterVelocityY = 3 + bass * 5;
      this.isInAir = true;
      this.trickTimer = 0;
    }

    // Physics
    if (this.isInAir) {
      this.skaterVelocityY += gravity * delta;
      this.skaterY += this.skaterVelocityY * delta;
      this.trickTimer += delta;

      if (this.skaterY <= 0) {
        this.skaterY = 0;
        this.skaterVelocityY = 0;
        this.isInAir = false;
        this.trickTimer = 0;
      }
    } else {
      this.skaterY = lerp(this.skaterY, 0, 0.15);
    }

    this.skater.position.set(this.skaterX, this.skaterY, 0);

    // Lean based on movement
    const leanZ = (this.skaterTargetX - this.skaterX) * -0.15;
    this.skater.rotation.z = lerp(this.skater.rotation.z, leanZ, 0.1);

    // Trick rotation in air
    if (this.isInAir && this.trickTimer < 0.6) {
      this.skater.rotation.y += delta * Math.PI * 4;
    } else {
      this.skater.rotation.y = lerp(this.skater.rotation.y, 0, 0.1);
    }

    // Crouch on bass
    const crouchY = 1 - bass * 0.35;
    const torso = this.skater.children[0] as THREE.Mesh;
    torso.position.y = lerp(torso.position.y, crouchY, 0.1);

    // Board speed tilt
    const speedTilt = Math.min(amplitude * speedMultiplier * 0.3, 0.4);
    this.skateboard.rotation.z = lerp(this.skateboard.rotation.z, speedTilt * leanZ * 2, 0.1);
  }

  private _updateTrail() {
    const worldPos = new THREE.Vector3();
    this.skater.getWorldPosition(worldPos);
    worldPos.y += 0.1;
    worldPos.z += 0.4;

    this.trailPoints.unshift(worldPos.clone());
    if (this.trailPoints.length > this.trailMaxPoints) {
      this.trailPoints.pop();
    }

    const posAttr = this.trailLine.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    for (let i = 0; i < this.trailPoints.length; i++) {
      arr[i * 3] = this.trailPoints[i].x;
      arr[i * 3 + 1] = this.trailPoints[i].y;
      arr[i * 3 + 2] = this.trailPoints[i].z;
    }
    posAttr.needsUpdate = true;
    this.trailLine.geometry.setDrawRange(0, this.trailPoints.length);
  }

  private _spawnParticles() {
    const skaterPos = new THREE.Vector3();
    this.skater.getWorldPosition(skaterPos);

    const toSpawn = Math.min(20, this.particleCount - this.activeParticles);
    for (let i = 0; i < toSpawn; i++) {
      const idx = (this.activeParticles + i) % this.particleCount;
      this.particlePositions[idx * 3] = skaterPos.x + (Math.random() - 0.5) * 2;
      this.particlePositions[idx * 3 + 1] = skaterPos.y + Math.random() * 2;
      this.particlePositions[idx * 3 + 2] = skaterPos.z + (Math.random() - 0.5) * 2;

      this.particleVelocities[idx].set(
        (Math.random() - 0.5) * 4,
        Math.random() * 5 + 1,
        (Math.random() - 0.5) * 4
      );
    }
    this.activeParticles = Math.min(this.activeParticles + toSpawn, this.particleCount);
    (this.particles.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    this.particles.geometry.setDrawRange(0, this.activeParticles);
  }

  private _updateParticles(delta: number) {
    if (this.activeParticles === 0) return;

    for (let i = 0; i < this.activeParticles; i++) {
      this.particlePositions[i * 3] += this.particleVelocities[i].x * delta;
      this.particlePositions[i * 3 + 1] += (this.particleVelocities[i].y - 5 * delta) * delta;
      this.particlePositions[i * 3 + 2] += this.particleVelocities[i].z * delta;
      this.particleVelocities[i].y -= 9 * delta;

      // Fade out particles that fall below ground
      if (this.particlePositions[i * 3 + 1] < -1) {
        // Recycle this particle to the back
        const last = this.activeParticles - 1;
        this.particlePositions[i * 3] = this.particlePositions[last * 3];
        this.particlePositions[i * 3 + 1] = this.particlePositions[last * 3 + 1];
        this.particlePositions[i * 3 + 2] = this.particlePositions[last * 3 + 2];
        this.particleVelocities[i].copy(this.particleVelocities[last]);
        this.activeParticles--;
        i--;
      }
    }

    (this.particles.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    this.particles.geometry.setDrawRange(0, this.activeParticles);
  }

  private _updateObstacles(bpm: number, delta: number, bass: number) {
    const speed = (3 + (bpm / 60) * 2 + bass * 4) * delta;
    for (const obs of this.obstacles) {
      obs.position.z += speed;
      if (obs.position.z > 20) {
        obs.position.z -= this.obstacles.length * 28 + 40;
        obs.position.x = (Math.random() - 0.5) * 14;
      }
      // Rotate obstacles slightly
      obs.rotation.y += delta * 0.5;
      const mat = obs.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.5 + bass * 1.5;
    }
  }

  private _updateCamera(delta: number) {
    const targetCamX = this.skater.position.x * 0.3;
    const targetCamY = 10 + this.skater.position.y * 0.5;
    const targetCamZ = 26 + this.skater.position.y * 0.3;

    this.camera.position.x = lerp(this.camera.position.x, targetCamX, 2 * delta);
    this.camera.position.y = lerp(this.camera.position.y, targetCamY, 2 * delta);
    this.camera.position.z = lerp(this.camera.position.z, targetCamZ, 2 * delta);

    this.camera.lookAt(this.skater.position.x * 0.2, 1, -12);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  updateConfig(config: Partial<SceneConfig>): void {
    Object.assign(this.config, config);
  }

  dispose(): void {
    this.disposed = true;
    this.renderer.dispose();
    this.terrainGeo.dispose();
  }
}
