/**
 * AudioEngine — Web Audio API analysis layer.
 * Extracts bass, mid, treble bands, amplitude, beat detection, and BPM estimates.
 * Fully client-side, no server dependency.
 */

export interface AudioData {
  bass: number;       // 0–1, sub-bass + bass (20–250 Hz)
  mid: number;        // 0–1, midrange (250–4000 Hz)
  treble: number;     // 0–1, treble (4000–20000 Hz)
  amplitude: number;  // 0–1, overall RMS energy
  bpm: number;        // estimated BPM
  isBeat: boolean;    // true for one frame on beat onset
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawFrequencies: Uint8Array<any>; // full FFT buffer for waveform display
}

const FFT_SIZE = 2048;
const BEAT_THRESHOLD_MULTIPLIER = 1.35;
const BEAT_MIN_INTERVAL_MS = 200; // ~300 BPM max
const BPM_HISTORY_SIZE = 16;

export class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: AudioBufferSourceNode | MediaElementAudioSourceNode | null = null;
  private frequencyData: Uint8Array<ArrayBuffer> = new Uint8Array(0) as Uint8Array<ArrayBuffer>;
  private timeData: Uint8Array<ArrayBuffer> = new Uint8Array(0) as Uint8Array<ArrayBuffer>;

  // Beat detection state
  private beatHistory: number[] = [];
  private lastBeatTime = 0;
  private beatIntervals: number[] = [];
  private _isBeat = false;

  // BPM state
  private estimatedBpm = 128;

  isPlaying = false;
  duration = 0;
  currentTime = 0;

  async loadFile(file: File): Promise<void> {
    this.dispose();

    this.audioCtx = new AudioContext();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = FFT_SIZE;
    this.analyser.smoothingTimeConstant = 0.75;

    const buffer = await file.arrayBuffer();

    if (file.type.startsWith("video/")) {
      // For video files, create a hidden video element and extract audio
      const blob = new Blob([buffer], { type: file.type });
      const url = URL.createObjectURL(blob);
      const video = document.createElement("video");
      video.src = url;
      video.muted = false;
      video.volume = 1;
      document.body.appendChild(video);
      video.style.position = "fixed";
      video.style.opacity = "0";
      video.style.pointerEvents = "none";
      video.style.width = "1px";
      video.style.height = "1px";

      await new Promise<void>((resolve, reject) => {
        video.oncanplay = () => resolve();
        video.onerror = reject;
        video.load();
      });

      const mediaSource = this.audioCtx.createMediaElementSource(video);
      mediaSource.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);
      this.source = mediaSource;
      this.duration = video.duration;

      video.play();
      this.isPlaying = true;
    } else {
      // Audio file — decode directly
      const audioBuffer = await this.audioCtx.decodeAudioData(buffer);
      this.duration = audioBuffer.duration;

      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);
      this.source = source;

      source.start(0);
      this.isPlaying = true;

      source.onended = () => {
        this.isPlaying = false;
      };
    }

    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
    this.timeData = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
  }

  analyze(): AudioData {
    if (!this.analyser || !this.audioCtx) {
      return this._emptyData();
    }

    this.analyser.getByteFrequencyData(this.frequencyData);
    this.analyser.getByteTimeDomainData(this.timeData);

    const binCount = this.analyser.frequencyBinCount;
    const sampleRate = this.audioCtx.sampleRate;
    const nyquist = sampleRate / 2;
    const hzPerBin = nyquist / binCount;

    // Frequency band boundaries (bin indices)
    const bassEnd = Math.floor(250 / hzPerBin);
    const midEnd = Math.floor(4000 / hzPerBin);

    const bass = this._bandEnergy(0, bassEnd);
    const mid = this._bandEnergy(bassEnd, midEnd);
    const treble = this._bandEnergy(midEnd, binCount);
    const amplitude = this._rmsAmplitude();

    // Beat detection on bass energy
    const now = performance.now();
    this._isBeat = false;

    if (this.beatHistory.length < 43) {
      this.beatHistory.push(bass);
    } else {
      this.beatHistory.shift();
      this.beatHistory.push(bass);
    }

    const avgBass = this.beatHistory.reduce((a, b) => a + b, 0) / this.beatHistory.length;
    const beatDetected =
      bass > avgBass * BEAT_THRESHOLD_MULTIPLIER &&
      bass > 0.2 &&
      now - this.lastBeatTime > BEAT_MIN_INTERVAL_MS;

    if (beatDetected) {
      const interval = now - this.lastBeatTime;
      if (interval < 2000 && interval > 100) {
        this.beatIntervals.push(interval);
        if (this.beatIntervals.length > BPM_HISTORY_SIZE) {
          this.beatIntervals.shift();
        }
        if (this.beatIntervals.length > 3) {
          const avgInterval =
            this.beatIntervals.reduce((a, b) => a + b, 0) / this.beatIntervals.length;
          const rawBpm = 60000 / avgInterval;
          // Normalize to 60–200 BPM range
          let bpm = rawBpm;
          while (bpm < 60) bpm *= 2;
          while (bpm > 200) bpm /= 2;
          this.estimatedBpm = Math.round(bpm);
        }
      }
      this.lastBeatTime = now;
      this._isBeat = true;
    }

    this.currentTime = this.audioCtx.currentTime;

    return {
      bass,
      mid,
      treble,
      amplitude,
      bpm: this.estimatedBpm,
      isBeat: this._isBeat,
      rawFrequencies: new Uint8Array(this.frequencyData),
    };
  }

  private _bandEnergy(startBin: number, endBin: number): number {
    let sum = 0;
    const count = endBin - startBin;
    if (count <= 0) return 0;
    for (let i = startBin; i < endBin; i++) {
      sum += this.frequencyData[i] / 255;
    }
    return sum / count;
  }

  private _rmsAmplitude(): number {
    let sum = 0;
    for (let i = 0; i < this.timeData.length; i++) {
      const val = (this.timeData[i] - 128) / 128;
      sum += val * val;
    }
    return Math.sqrt(sum / this.timeData.length);
  }

  private _emptyData(): AudioData {
    return {
      bass: 0,
      mid: 0,
      treble: 0,
      amplitude: 0,
      bpm: 128,
      isBeat: false,
      rawFrequencies: new Uint8Array(FFT_SIZE / 2),
    };
  }

  dispose(): void {
    this.isPlaying = false;
    if (this.source && "stop" in this.source) {
      try {
        (this.source as AudioBufferSourceNode).stop();
      } catch (_) {}
    }
    this.audioCtx?.close();
    this.audioCtx = null;
    this.analyser = null;
    this.source = null;
    this.beatHistory = [];
    this.beatIntervals = [];
    this.lastBeatTime = 0;
    this.estimatedBpm = 128;
  }
}
