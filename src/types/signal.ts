export type AppState = 
  | 'BOOT'
  | 'SEARCH'
  | 'ANALYSIS'
  | 'RESONANCE_LOCK'
  | 'ANOMALY'
  | 'ISOLATION'
  | 'DECODING'
  | 'TRIANGULATION'
  | 'ORIGIN_REVEAL'
  | 'COMPLETE';

export type SignalMode = 'WAVEFORM' | 'SPECTRUM' | 'SPECTROGRAM';

export interface SignalParameters {
  frequency: number;       // Current dial frequency in MHz (e.g. 23.700 target)
  amplitude: number;       // Gain 0.0 - 2.0 (default 1.0)
  noise: number;           // Noise level 0.0 - 1.0 (default 0.45)
  harmonics: number;       // Harmonic resonance count 1 - 5
  timeScale: number;       // Sweep speed (default 1.0)
  isIsolated: boolean;     // Whether signal isolation filter is active
  isDecoding: boolean;     // Decoding mode active
}

export interface SignalTelemetry {
  targetFreq: number;       // Fixed at 23.700 MHz
  currentFreq: number;
  freqDelta: number;        // Math.abs(current - target)
  snrDb: number;            // Signal-to-noise ratio in dB
  peakMagnitude: number;    // 0 - 100%
  coherence: number;        // Phase coherence 0 - 100%
  bandwidthKhz: number;     // Bandwidth in kHz
  isLocked: boolean;        // Frequency close enough (< 0.04 MHz)
  lockProgress: number;     // 0 - 1.0 lock stability counter
  anomalyTriggered: boolean;
  isolated: boolean;
  
  // Real scientific instrumentation telemetry
  cryoTempKelvin: number;   // e.g. 2.721 K
  antennaAzimuth: number;   // 184.2°
  antennaElevation: number; // 42.8°
  samplingRateGsps: number; // 2.4 GS/s
  fftSize: number;          // 4096 bins
  jitterPs: number;         // 1.4 ps
  noiseFloorDbm: number;    // -112 dBm
  propagationDelayMs: number; // 49.02 ms
}

export interface TerminalEntry {
  id: string;
  timestamp: string;
  source: 'SYS' | 'REC' | 'ARRAY' | 'DSP' | 'DECODER' | 'TRIANGULATION' | 'CLASSIFIED';
  text: string;
  type?: 'info' | 'warn' | 'success' | 'alert';
}

export interface TriangulationStation {
  id: string;
  name: string;
  location: string;
  azimuth: number;
  elevation: number;
  delayMs: number;
  signalStrength: number;
  isLocked: boolean;
}

export interface CelestialCoordinates {
  rightAscension: string;
  declination: string;
  distanceLightYears: number;
  confidence: number;
  estimatedAgeYears: number;
  classification: string;
  origin: string;
}
