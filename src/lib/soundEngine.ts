// Award-winning synthesized procedural UI sound engine using Web Audio API

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private humOsc: OscillatorNode | null = null;
  private humGain: GainNode | null = null;
  private lockToneOsc: OscillatorNode | null = null;
  private lockToneGain: GainNode | null = null;

  constructor() {}

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopContinuousSounds();
    } else {
      this.initContext();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  // Deep orbital station ambient hum (low frequency chamber resonance)
  public startAmbientHum() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || this.humOsc) return;

    try {
      this.humOsc = this.ctx.createOscillator();
      this.humGain = this.ctx.createGain();

      this.humOsc.type = 'sawtooth';
      this.humOsc.frequency.setValueAtTime(43.65, this.ctx.currentTime); // Low F1

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(95, this.ctx.currentTime);
      filter.Q.setValueAtTime(4.0, this.ctx.currentTime);

      this.humGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.humGain.gain.exponentialRampToValueAtTime(0.04, this.ctx.currentTime + 2.5);

      this.humOsc.connect(filter);
      filter.connect(this.humGain);
      this.humGain.connect(this.ctx.destination);

      this.humOsc.start();
    } catch {}
  }

  public stopContinuousSounds() {
    if (this.humOsc) {
      try {
        this.humOsc.stop();
        this.humOsc.disconnect();
      } catch {}
      this.humOsc = null;
    }
    if (this.lockToneOsc) {
      try {
        this.lockToneOsc.stop();
        this.lockToneOsc.disconnect();
      } catch {}
      this.lockToneOsc = null;
    }
  }

  // Mechanical relay click / scientific keyboard clack
  public playClick(pitch: number = 880) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.35, this.ctx.currentTime + 0.035);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {}
  }

  // Rotary tuner frequency dial tick
  public playDialTick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280 + Math.random() * 90, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.035, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.02);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.025);
    } catch {}
  }

  // Frequency resonance feedback tone based on proximity to 23.700 MHz
  public updateLockTone(freqDelta: number) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const proximity = Math.max(0, 1 - freqDelta / 1.6); // 0 outside range, 1 at exact lock

    if (proximity <= 0.03) {
      if (this.lockToneGain) {
        this.lockToneGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
      return;
    }

    try {
      if (!this.lockToneOsc) {
        this.lockToneOsc = this.ctx.createOscillator();
        this.lockToneGain = this.ctx.createGain();

        this.lockToneOsc.type = 'sine';
        this.lockToneOsc.frequency.setValueAtTime(440, this.ctx.currentTime);
        this.lockToneGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

        this.lockToneOsc.connect(this.lockToneGain);
        this.lockToneGain.connect(this.ctx.destination);
        this.lockToneOsc.start();
      }

      // Smoothly pitch toward pure harmonic 592.5 Hz (23.7 * 25)
      const targetPitch = 280 + (1 - Math.min(1, freqDelta)) * 340;
      this.lockToneOsc.frequency.setTargetAtTime(targetPitch, this.ctx.currentTime, 0.05);

      const targetGain = proximity * 0.08;
      this.lockToneGain?.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    } catch {}
  }

  // Resonance Lock flash explosion + mechanical clamp
  public playResonanceLock() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      
      // 1. High harmonic lock chime
      [880, 1174.66, 1760, 2349.32].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0.09, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.8);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.85);
      });

      // 2. Heavy sub-bass lock clamp
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(110, now);
      sub.frequency.exponentialRampToValueAtTime(32, now + 0.6);
      subGain.gain.setValueAtTime(0.25, now);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
      sub.connect(subGain);
      subGain.connect(this.ctx.destination);
      sub.start(now);
      sub.stop(now + 0.7);
    } catch {}
  }

  // Anomaly alarm - dual dissonant alarm tone
  public playAnomalyAlert() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [740, 880, 1040].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        const filter = this.ctx!.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(freq, now + idx * 0.12);
        filter.Q.setValueAtTime(8, now);

        gain.gain.setValueAtTime(0.001, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.09, now + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.45);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.46);
      });
    } catch {}
  }

  // Signal isolation pulse (sub-bass drop + high chime)
  public playIsolationEngaged() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(140, now);
      sub.frequency.exponentialRampToValueAtTime(35, now + 0.8);
      subGain.gain.setValueAtTime(0.18, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      sub.connect(subGain);
      subGain.connect(this.ctx.destination);
      sub.start(now);
      sub.stop(now + 0.82);

      const chime = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(1174.66, now + 0.15);
      chimeGain.gain.setValueAtTime(0.08, now + 0.15);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      chime.connect(chimeGain);
      chimeGain.connect(this.ctx.destination);
      chime.start(now + 0.15);
      chime.stop(now + 1.25);
    } catch {}
  }

  // Radio burst chirp for decoding steps
  public playDecodeBurst(index: number) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const pitches = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      const freq = pitches[index % pitches.length];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.18);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.23);
    } catch {}
  }

  // Triangulation station ping (spatial sonar pulse)
  public playTriangulationStationPing(stationIndex: number) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const baseFreqs = [440, 554.37, 659.25]; // Triad chord (A, C#, E)
      const freq = baseFreqs[stationIndex % baseFreqs.length];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.9, now + 0.7);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.72);
    } catch {}
  }

  // Triangulation vector convergence whoosh + deep space lock
  public playVectorIntersection() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(587.33, now + 1.2); // D5

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.16, now + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.85);
    } catch {}
  }

  // The dramatic reveal chime: "SIGNAL ORIGIN: EARTH"
  public playEarthTwistReveal() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      
      // Eerie glass-harmonic chord
      [220, 277.18, 329.63, 440, 622.25].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.6);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8 + idx * 0.3);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now);
        osc.stop(now + 4.2 + idx * 0.3);
      });
    } catch {}
  }

  // Teletype / character reveal tick
  public playCharTick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400 + Math.random() * 400, now);

      gain.gain.setValueAtTime(0.025, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.02);
    } catch {}
  }

  // Final transmission lock boom
  public playFinalLock() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 2.5);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 2.7);
    } catch {}
  }

  // Delayed incoming signal chime in final silence
  public playIncomingChannelPulse() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.4);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.25);
    } catch {}
  }
}

export const sound = new SoundEngine();
