import type { SignalParameters, SignalTelemetry } from '../types/signal';

export const TARGET_FREQUENCY = 23.700; // Target in MHz
export const LOCK_TOLERANCE = 0.045;   // MHz window for locking
export const SAMPLES_COUNT = 512;

export interface SignalSample {
  waveform: Float32Array;   // -1.0 to +1.0 normalized
  spectrum: Float32Array;   // 0.0 to 1.0 magnitude per bin
  telemetry: SignalTelemetry;
}

/**
 * Procedural deep-space mathematical signal engine.
 * Synthesizes carrier waves, cosmic background white/pink noise, harmonic resonance,
 * and deterministic real-time instrumentation telemetry (cryo temp, azimuth, elevation, jitter, noise floor).
 */
export class SignalEngine {
  private targetFreq = TARGET_FREQUENCY;
  private phase = 0;
  private pulsePhase = 0;
  private waveformBuffer = new Float32Array(SAMPLES_COUNT);
  private spectrumBuffer = new Float32Array(128);
  private lockHoldTime = 0;
  private totalElapsedSeconds = 0;

  constructor() {}

  public process(
    params: SignalParameters,
    deltaTimeMs: number
  ): SignalSample {
    const { frequency, amplitude, noise, harmonics, isIsolated } = params;
    this.totalElapsedSeconds += deltaTimeMs / 1000;

    const freqDelta = Math.abs(frequency - this.targetFreq);
    const isLocked = freqDelta <= LOCK_TOLERANCE;

    if (isLocked) {
      this.lockHoldTime += deltaTimeMs;
    } else {
      this.lockHoldTime = Math.max(0, this.lockHoldTime - deltaTimeMs * 1.5);
    }

    // 0 to 1 lock progress after staying ~2400ms in frequency range
    const lockProgress = Math.min(1.0, this.lockHoldTime / 2400);
    const anomalyTriggered = lockProgress >= 1.0;

    // Resonant proximity factor (1 at 23.700 MHz, drops sharply outwards)
    const proximity = Math.exp(-Math.pow(freqDelta / 0.16, 2));

    // Time advancement
    const dt = (deltaTimeMs / 1000) * params.timeScale;
    this.phase += (frequency * 0.4 + 1.2) * dt * Math.PI * 2;
    this.pulsePhase += dt * 4.2;

    // Noise scaling: reduced when locked and isolated
    const effectiveNoiseLevel = isIsolated 
      ? noise * 0.08 
      : isLocked 
        ? noise * (0.8 - proximity * 0.5) 
        : noise;

    // Generate waveform samples
    const baseWaveform = this.waveformBuffer;
    const baseFreqNormalized = (frequency / 23.7) * 4.0;

    for (let i = 0; i < SAMPLES_COUNT; i++) {
      const t = (i / SAMPLES_COUNT) * Math.PI * 8;
      
      // 1. Cosmic noise component
      const n1 = (Math.random() * 2 - 1) + (Math.random() * 2 - 1);
      const noiseVal = (n1 * 0.5) * effectiveNoiseLevel;

      // 2. Fundamental carrier
      let val = Math.sin(t * baseFreqNormalized + this.phase);

      // 3. Harmonics
      for (let h = 2; h <= Math.min(5, harmonics); h++) {
        val += (1 / h) * Math.sin(t * baseFreqNormalized * h + this.phase * (h * 0.7));
      }

      // 4. Anomaly transmission modulation (when tuning near 23.700 MHz)
      if (proximity > 0.04) {
        // Structured telemetry burst
        const burstMod = Math.sin(this.pulsePhase * 2.5) * Math.sin(this.pulsePhase * 7.1);
        const structuredPulse = Math.sin(t * 12.0 + this.pulsePhase * 4.0) * (burstMod > 0 ? burstMod : 0);
        
        // Digital FSK artifact
        const chirp = Math.sin(t * (18.0 + Math.sin(this.pulsePhase * 5) * 6));

        const signalEnergy = proximity * (isIsolated ? 1.6 : 1.05);
        val = val * (1 - proximity * 0.35) + (structuredPulse * 0.85 + chirp * 0.45) * signalEnergy;
      }

      baseWaveform[i] = Math.max(-1.0, Math.min(1.0, (val * amplitude * 0.65 + noiseVal)));
    }

    // Generate frequency spectrum (128 bins)
    const bins = this.spectrumBuffer;
    const binCount = bins.length;
    const activeBinCenter = Math.floor(((frequency - 21.0) / 5.0) * binCount);

    for (let b = 0; b < binCount; b++) {
      let mag = (Math.random() * 0.12 + 0.02) * effectiveNoiseLevel;

      // Carrier peak
      const distFromCarrier = Math.abs(b - activeBinCenter);
      if (distFromCarrier < 7) {
        const peakShape = Math.exp(-Math.pow(distFromCarrier / 2.2, 2));
        mag += peakShape * 0.78 * amplitude;
      }

      // Harmonic peak
      const distFromHarmonic = Math.abs(b - (activeBinCenter + 18));
      if (distFromHarmonic < 5 && harmonics >= 2) {
        const hShape = Math.exp(-Math.pow(distFromHarmonic / 1.8, 2));
        mag += hShape * 0.32 * amplitude;
      }

      // Secret anomalous signal peak (bin 69 = 23.700 MHz)
      const targetBin = Math.floor(((this.targetFreq - 21.0) / 5.0) * binCount);
      const distFromTarget = Math.abs(b - targetBin);
      if (distFromTarget < 4) {
        const anomalyPeak = Math.exp(-Math.pow(distFromTarget / 1.5, 2)) * proximity;
        mag += anomalyPeak * (isIsolated ? 1.0 : 0.62);
      }

      bins[b] = bins[b] * 0.65 + Math.min(1.0, mag) * 0.35;
    }

    // Realistic scientific telemetry with micro-fluctuations
    const snrDb = Math.max(1.2, isIsolated ? 42.1 : (14.2 + proximity * 21.5 - effectiveNoiseLevel * 12.0));
    const peakMagnitude = Math.min(100, Math.round(proximity * 88 + (isIsolated ? 12 : 5)));
    const coherence = Math.min(100, Math.round((proximity * 0.75 + (1 - effectiveNoiseLevel) * 0.25) * 100));
    const bandwidthKhz = Math.round((11.2 + (1 - proximity) * 88.0));

    // Dynamic environmental telemetry
    const cryoJitter = Math.sin(this.totalElapsedSeconds * 0.4) * 0.003;
    const cryoTempKelvin = Number((2.721 + cryoJitter + (1 - proximity) * 0.012).toFixed(3));
    
    // Antenna tracking coordinates (moves slowly with Earth orbit)
    const antennaAzimuth = Number((184.2 + Math.sin(this.totalElapsedSeconds * 0.05) * 0.4).toFixed(1));
    const antennaElevation = Number((42.8 + Math.cos(this.totalElapsedSeconds * 0.04) * 0.3).toFixed(1));
    const jitterPs = Number((1.2 + (1 - proximity) * 3.4 + Math.random() * 0.4).toFixed(1));
    const noiseFloorDbm = Math.round(-115 + effectiveNoiseLevel * 24);
    const propagationDelayMs = Number((49.02 + Math.sin(this.totalElapsedSeconds * 0.1) * 0.08).toFixed(2));

    const telemetry: SignalTelemetry = {
      targetFreq: this.targetFreq,
      currentFreq: frequency,
      freqDelta,
      snrDb: Number(snrDb.toFixed(1)),
      peakMagnitude,
      coherence,
      bandwidthKhz,
      isLocked,
      lockProgress,
      anomalyTriggered,
      isolated: isIsolated,
      cryoTempKelvin,
      antennaAzimuth,
      antennaElevation,
      samplingRateGsps: 2.4,
      fftSize: 4096,
      jitterPs,
      noiseFloorDbm,
      propagationDelayMs,
    };

    return {
      waveform: this.waveformBuffer,
      spectrum: this.spectrumBuffer,
      telemetry
    };
  }
}
