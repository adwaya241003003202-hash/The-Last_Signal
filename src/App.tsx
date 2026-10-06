import { useState, useEffect, useRef, useCallback } from 'react';
import type { AppState, SignalMode, SignalParameters, SignalTelemetry, TerminalEntry } from './types/signal';
import { SignalEngine, TARGET_FREQUENCY } from './lib/signalGenerator';
import { sound } from './lib/soundEngine';
import { ObservatoryBackground } from './components/ObservatoryBackground';
import { BootSequence } from './components/BootSequence';
import { SystemHeader } from './components/SystemHeader';
import { Waveform } from './components/Waveform';
import { Spectrum } from './components/Spectrum';
import { Spectrogram } from './components/Spectrogram';
import { SignalControls } from './components/SignalControls';
import { AnomalyPanel } from './components/AnomalyPanel';
import { TransmissionDecoder } from './components/TransmissionDecoder';
import { SourceTriangulation } from './components/SourceTriangulation';
import { TerminalLog } from './components/TerminalLog';
import { FinalState } from './components/FinalState';

export function App() {
  const [appState, setAppState] = useState<AppState>('BOOT');
  const [signalMode, setSignalMode] = useState<SignalMode>('WAVEFORM');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isResonanceLockEvent, setIsResonanceLockEvent] = useState<boolean>(false);

  // Core parameters
  const [params, setParams] = useState<SignalParameters>({
    frequency: 22.450,
    amplitude: 1.0,
    noise: 0.45,
    harmonics: 2,
    timeScale: 1.0,
    isIsolated: false,
    isDecoding: false,
  });

  // Telemetry state
  const [telemetry, setTelemetry] = useState<SignalTelemetry>({
    targetFreq: TARGET_FREQUENCY,
    currentFreq: 22.450,
    freqDelta: 1.25,
    snrDb: 14.2,
    peakMagnitude: 20,
    coherence: 35,
    bandwidthKhz: 75,
    isLocked: false,
    lockProgress: 0,
    anomalyTriggered: false,
    isolated: false,
    cryoTempKelvin: 2.721,
    antennaAzimuth: 184.2,
    antennaElevation: 42.8,
    samplingRateGsps: 2.4,
    fftSize: 4096,
    jitterPs: 1.4,
    noiseFloorDbm: -112,
    propagationDelayMs: 49.02,
  });

  const [waveformBuffer, setWaveformBuffer] = useState<Float32Array>(() => new Float32Array(512));
  const [spectrumBuffer, setSpectrumBuffer] = useState<Float32Array>(() => new Float32Array(128));

  const [terminalLogs, setTerminalLogs] = useState<TerminalEntry[]>([
    {
      id: '1',
      timestamp: '04:16:55',
      source: 'SYS',
      text: 'Kernel initialized. Sub-reflector antenna locked to orbital zenith.',
      type: 'info',
    },
    {
      id: '2',
      timestamp: '04:17:02',
      source: 'REC',
      text: 'Cryogenic LNA amplifier active at 2.721 K. Background cosmic radiation floor -112 dBm.',
      type: 'info',
    },
  ]);

  const addLog = useCallback((source: TerminalEntry['source'], text: string, type?: TerminalEntry['type']) => {
    const now = new Date();
    const ts = now.toTimeString().split(' ')[0];
    const newEntry: TerminalEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: ts,
      source,
      text,
      type,
    };
    setTerminalLogs((prev) => [...prev.slice(-40), newEntry]);
  }, []);

  const engineRef = useRef<SignalEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new SignalEngine();
  }

  const lastTimeRef = useRef<number>(performance.now());
  const resonanceLockTriggeredRef = useRef(false);

  useEffect(() => {
    let animId: number;

    const loop = (currentTime: number) => {
      const dt = Math.min(100, currentTime - lastTimeRef.current);
      lastTimeRef.current = currentTime;

      if (engineRef.current && appState !== 'BOOT') {
        const sample = engineRef.current.process(params, dt);
        setWaveformBuffer(sample.waveform);
        setSpectrumBuffer(sample.spectrum);
        setTelemetry(sample.telemetry);

        // FULL-SCREEN SPECTRAL EVENT: Trigger Resonance Lock event when locked for ~2.4 seconds
        if (
          appState === 'ANALYSIS' &&
          sample.telemetry.anomalyTriggered &&
          !resonanceLockTriggeredRef.current
        ) {
          resonanceLockTriggeredRef.current = true;
          setIsResonanceLockEvent(true);
          sound.playResonanceLock();
          addLog('ARRAY', 'RESONANCE LOCK ACHIEVED. Phase coherent across 23.700 MHz.', 'alert');

          // 1.5 second cinematic resonance event before transitioning into ANOMALY investigation
          setTimeout(() => {
            setIsResonanceLockEvent(false);
            setAppState('ANOMALY');
          }, 1500);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [appState, params, addLog]);

  const handleParamsChange = (newValues: Partial<SignalParameters>) => {
    setParams((prev) => {
      const next = { ...prev, ...newValues };
      if (newValues.frequency !== undefined) {
        if (Math.abs(newValues.frequency - TARGET_FREQUENCY) < 0.045) {
          addLog('REC', `Carrier resonance match detected at ${newValues.frequency.toFixed(3)} MHz`, 'success');
        } else if (newValues.frequency === TARGET_FREQUENCY) {
          addLog('CLASSIFIED', 'Direct manual input match: Vector target 23.700 MHz', 'warn');
        }
      }
      return next;
    });
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    addLog('SYS', `Audio output ${muted ? 'MUTED' : 'UNMUTED'}.`, 'info');
  };

  const handleBootComplete = () => {
    setAppState('ANALYSIS');
    addLog('SYS', 'Operator authorization acknowledged. Scientific analyzer active.', 'success');
    addLog('REC', 'Tune VFO around 23.700 MHz to acquire carrier lock.', 'info');
  };

  const handleIsolateSignal = () => {
    setAppState('ISOLATION');
    setParams((prev) => ({
      ...prev,
      frequency: 23.700,
      noise: 0.1,
      isIsolated: true,
    }));
    addLog('DSP', 'Narrowband filter engaged: 23.700 MHz ± 250 Hz.', 'success');
    addLog('DSP', 'TRANSMISSION PATTERN IDENTIFIED. 5 Sub-bursts acquired.', 'alert');

    setTimeout(() => {
      setAppState('DECODING');
    }, 1000);
  };

  const handleDecodeComplete = () => {
    setAppState('TRIANGULATION');
    addLog('DECODER', 'TRANSMISSION DECODED. Commencing celestial baseline solve.', 'success');
    addLog('TRIANGULATION', 'Linking Stations 07, 12, 19 for astronomical vectoring.', 'alert');
  };

  const handleTriangulationComplete = () => {
    setAppState('COMPLETE');
    addLog('TRIANGULATION', 'VECTOR SOLVE TERMINATED. SIGNAL ORIGIN: EARTH.', 'alert');
    addLog('SYS', 'CONNECTION PERSISTENT. Deep space transceiver online.', 'info');
  };

  const handleEasterEgg = () => {
    sound.playClick(1500);
    addLog('CLASSIFIED', 'PROJECT PROMETHEUS ARCHIVE DECLASSIFIED // CLEARANCE LEVEL: OMEGA', 'warn');
    addLog('CLASSIFIED', 'Transmission was broadcast in 2012. Returned via gravitational lensing.', 'alert');
  };

  const handleRestart = () => {
    resonanceLockTriggeredRef.current = false;
    setIsResonanceLockEvent(false);
    setParams({
      frequency: 22.450,
      amplitude: 1.0,
      noise: 0.45,
      harmonics: 2,
      timeScale: 1.0,
      isIsolated: false,
      isDecoding: false,
    });
    setAppState('BOOT');
    setTerminalLogs([
      {
        id: '1',
        timestamp: '04:18:10',
        source: 'SYS',
        text: 'Array reinitialized. Standing by for orbital pass.',
        type: 'info',
      },
    ]);
  };

  return (
    <div className={`relative w-screen h-screen bg-[#050607] text-[#D8DEDA] overflow-hidden flex flex-col font-mono select-none ${
      isResonanceLockEvent ? 'screen-glitch' : ''
    }`}>
      {/* 3D Observatory Environment Canvas */}
      <ObservatoryBackground
        isAnomaly={appState === 'ANOMALY'}
        isIsolated={appState === 'ISOLATION' || appState === 'DECODING'}
        isResonanceLock={isResonanceLockEvent}
        isTriangulation={appState === 'TRIANGULATION'}
        isEarthOrigin={appState === 'TRIANGULATION' || appState === 'COMPLETE'}
        isComplete={appState === 'COMPLETE'}
        signalStrength={telemetry.peakMagnitude / 100}
      />

      {/* CRT Scanline & Phosphor Overlay */}
      <div className="crt-overlay" />
      <div className="crt-vignette" />

      {/* Resonance Lock Flash Banner */}
      {isResonanceLockEvent && (
        <div className="absolute inset-0 z-50 pointer-events-none flex flex-col items-center justify-center bg-[#D7FF63]/15 backdrop-blur-sm animate-pulse">
          <div className="border-2 border-[#D7FF63] bg-[#050607] p-8 text-center shadow-[0_0_80px_#D7FF63]">
            <div className="text-3xl sm:text-5xl font-mono font-bold tracking-[0.3em] text-[#D7FF63] uppercase">
              RESONANCE LOCK
            </div>
            <div className="text-xs sm:text-sm font-mono tracking-[0.25em] text-[#D8DEDA] mt-3">
              CARRIER FREQUENCY: 23.700 MHz // PHASE COHERENT
            </div>
          </div>
        </div>
      )}

      {/* 1. BOOT SEQUENCE */}
      {appState === 'BOOT' && (
        <BootSequence
          onBootComplete={handleBootComplete}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* 2. MAIN SCIENTIFIC INSTRUMENT INTERFACE */}
      {appState !== 'BOOT' && appState !== 'COMPLETE' && (
        <div className="relative z-10 w-full h-full flex flex-col justify-between overflow-hidden">
          {/* Top System Header */}
          <SystemHeader
            telemetry={telemetry}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onEmergencyReset={handleRestart}
            onEasterEggTrigger={handleEasterEgg}
          />

          {/* Central Instrumentation Workspace */}
          <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 p-2 sm:p-3 overflow-hidden min-h-0">
            {/* Left Dominant Visualizer (8 cols) */}
            <div className="lg:col-span-8 flex flex-col border border-[#151B1C] bg-[#090C0D]/90 tech-border min-h-[300px] overflow-hidden relative shadow-lg">
              {signalMode === 'WAVEFORM' && (
                <Waveform
                  waveform={waveformBuffer}
                  telemetry={telemetry}
                  params={params}
                />
              )}
              {signalMode === 'SPECTRUM' && (
                <Spectrum
                  spectrum={spectrumBuffer}
                  telemetry={telemetry}
                />
              )}
              {signalMode === 'SPECTROGRAM' && (
                <Spectrogram
                  spectrum={spectrumBuffer}
                  telemetry={telemetry}
                />
              )}

              {/* Anomaly Modal Overlay */}
              {appState === 'ANOMALY' && (
                <AnomalyPanel
                  telemetry={telemetry}
                  onIsolateSignal={handleIsolateSignal}
                />
              )}

              {/* Transmission Decoder Overlay */}
              {(appState === 'ISOLATION' || appState === 'DECODING') && (
                <TransmissionDecoder onDecodeComplete={handleDecodeComplete} />
              )}

              {/* Deep-Space Source Triangulation Overlay */}
              {appState === 'TRIANGULATION' && (
                <SourceTriangulation onTriangulationComplete={handleTriangulationComplete} />
              )}
            </div>

            {/* Right Instrumentation Column (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-2 sm:gap-3 overflow-y-auto min-h-0">
              <SignalControls
                params={params}
                telemetry={telemetry}
                onChange={handleParamsChange}
                mode={signalMode}
                onModeChange={setSignalMode}
              />

              <div className="flex-1 min-h-[160px]">
                <TerminalLog entries={terminalLogs} />
              </div>
            </div>
          </main>

          {/* Bottom Technical Status Bar */}
          <footer className="w-full bg-[#090C0D] border-t border-[#151B1C] px-3 py-1.5 flex flex-wrap justify-between items-center text-[9px] text-[#66706B] tracking-wider z-20">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF63]"></span>
                <span>REC_ARRAY: ONLINE</span>
              </span>
              <span className="hidden sm:inline text-[#3B4441]">|</span>
              <span className="hidden sm:inline">CRYO: {telemetry.cryoTempKelvin} K</span>
              <span className="hidden md:inline text-[#3B4441]">|</span>
              <span className="hidden md:inline">BW: {telemetry.bandwidthKhz} kHz</span>
              <span className="hidden lg:inline text-[#3B4441]">|</span>
              <span className="hidden lg:inline">JITTER: ±{telemetry.jitterPs} ps</span>
            </div>

            <div className="flex items-center gap-4">
              <span>LOCK CONFIDENCE: {telemetry.isLocked ? 'HIGH (96.2%)' : 'DRIFTING (0.4%)'}</span>
              <span className="text-[#8FAF8F]">STATION 07 // DEEP SECTOR</span>
            </div>
          </footer>
        </div>
      )}

      {/* 3. FINAL MINIMAL STATE */}
      {appState === 'COMPLETE' && (
        <FinalState
          onRestart={handleRestart}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}
    </div>
  );
}

export default App;
