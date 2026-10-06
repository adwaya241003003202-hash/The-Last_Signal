import React from 'react';
import type { SignalParameters, SignalTelemetry, SignalMode } from '../types/signal';
import { sound } from '../lib/soundEngine';

interface SignalControlsProps {
  params: SignalParameters;
  telemetry: SignalTelemetry;
  onChange: (params: Partial<SignalParameters>) => void;
  mode: SignalMode;
  onModeChange: (mode: SignalMode) => void;
}

export const SignalControls: React.FC<SignalControlsProps> = ({
  params,
  telemetry,
  onChange,
  mode,
  onModeChange,
}) => {
  const handleFreqChange = (newFreq: number) => {
    sound.playDialTick();
    const clamped = Math.max(21.0, Math.min(26.0, Number(newFreq.toFixed(3))));
    onChange({ frequency: clamped });
    sound.updateLockTone(Math.abs(clamped - 23.7));
  };

  const handleFineStep = (delta: number) => {
    sound.playClick(900);
    handleFreqChange(params.frequency + delta);
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-[#090C0D] border border-[#151B1C] tech-border">
      {/* Mode Selector Tabs */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center text-[9px] text-[#66706B] tracking-[0.2em] uppercase">
          <span>INSTRUMENT MODE</span>
          <span>DISP_01</span>
        </div>
        <div className="grid grid-cols-3 gap-1 bg-[#050607] p-1 border border-[#151B1C]">
          {(['WAVEFORM', 'SPECTRUM', 'SPECTROGRAM'] as SignalMode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                sound.playClick(1000);
                onModeChange(m);
              }}
              className={`py-1.5 text-[10px] tracking-wider font-mono uppercase transition-all ${
                mode === m
                  ? 'bg-[#151B1C] text-[#D7FF63] font-semibold shadow-[0_0_8px_rgba(215,255,99,0.2)] border-b-2 border-[#D7FF63]'
                  : 'text-[#66706B] hover:text-[#D8DEDA]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Main Rotary / Scrubber Frequency Dial */}
      <div className="flex flex-col gap-2 pt-2 border-t border-[#151B1C]">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-[#8FAF8F] tracking-[0.2em] uppercase font-mono">
            VFO FREQUENCY TUNER
          </span>
          <span className="text-[9px] text-[#66706B]">BAND: HF / 13M</span>
        </div>

        {/* Big Digital Readout */}
        <div className="bg-[#050607] border border-[#1E2729] p-3 text-center relative overflow-hidden">
          <div className="text-3xl sm:text-4xl font-mono tracking-widest text-[#D8DEDA] flex items-center justify-center gap-1">
            <span className={telemetry.isLocked ? 'text-[#D7FF63] font-bold' : ''}>
              {params.frequency.toFixed(3)}
            </span>
            <span className="text-xs text-[#66706B] font-normal">MHz</span>
          </div>

          {/* Lock Status indicator */}
          <div className="mt-1 flex items-center justify-center gap-2 text-[9px] tracking-[0.2em]">
            <span
              className={`w-2 h-2 rounded-full ${
                telemetry.isLocked
                  ? 'bg-[#D7FF63] shadow-[0_0_8px_#D7FF63]'
                  : 'bg-[#3B4441]'
              }`}
            ></span>
            <span className={telemetry.isLocked ? 'text-[#D7FF63]' : 'text-[#66706B]'}>
              {telemetry.isLocked ? 'CARRIER SYNCHRONIZED' : 'UNLOCKED / DRIFT'}
            </span>
          </div>

          {/* Lock stability gauge */}
          {telemetry.isLocked && !telemetry.anomalyTriggered && (
            <div className="mt-2 w-full bg-[#151B1C] h-1.5 overflow-hidden">
              <div
                className="bg-[#D7FF63] h-full transition-all duration-150"
                style={{ width: `${Math.round(telemetry.lockProgress * 100)}%` }}
              ></div>
            </div>
          )}
        </div>

        {/* Continuous Slider Tuner */}
        <div className="space-y-1.5 mt-1">
          <input
            type="range"
            min="21.000"
            max="26.000"
            step="0.005"
            value={params.frequency}
            onChange={(e) => handleFreqChange(parseFloat(e.target.value))}
            className="tech-slider"
          />

          <div className="flex justify-between text-[8px] text-[#3B4441] font-mono px-1">
            <span>21.000</span>
            <span>22.000</span>
            <span className="text-[#8FAF8F]">23.700*</span>
            <span>25.000</span>
            <span>26.000</span>
          </div>
        </div>

        {/* Fine Stepper Buttons */}
        <div className="grid grid-cols-4 gap-1.5 mt-1">
          <button
            onClick={() => handleFineStep(-0.1)}
            className="tech-btn text-[9px] py-1 px-1"
          >
            -0.100
          </button>
          <button
            onClick={() => handleFineStep(-0.005)}
            className="tech-btn text-[9px] py-1 px-1"
          >
            -0.005
          </button>
          <button
            onClick={() => handleFineStep(0.005)}
            className="tech-btn text-[9px] py-1 px-1"
          >
            +0.005
          </button>
          <button
            onClick={() => handleFineStep(0.1)}
            className="tech-btn text-[9px] py-1 px-1"
          >
            +0.100
          </button>
        </div>
      </div>

      {/* Analog Gain & Noise Controls */}
      <div className="flex flex-col gap-3 pt-3 border-t border-[#151B1C]">
        {/* Amplitude Gain */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[9px] text-[#66706B] font-mono">
            <span>IF GAIN / AMPLITUDE</span>
            <span className="text-[#D8DEDA]">{(params.amplitude * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="2.0"
            step="0.05"
            value={params.amplitude}
            onChange={(e) => {
              sound.playDialTick();
              onChange({ amplitude: parseFloat(e.target.value) });
            }}
            className="tech-slider"
          />
        </div>

        {/* Cosmic Noise Level */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[9px] text-[#66706B] font-mono">
            <span>COSMIC NOISE SQUELCH</span>
            <span className="text-[#D8DEDA]">{(params.noise * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="1.0"
            step="0.02"
            value={params.noise}
            onChange={(e) => {
              sound.playDialTick();
              onChange({ noise: parseFloat(e.target.value) });
            }}
            className="tech-slider"
          />
        </div>

        {/* Time Sweep / Harmonics */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="flex flex-col gap-1">
            <span className="text-[8px] text-[#66706B]">HARMONIC FILTER</span>
            <button
              onClick={() => {
                sound.playClick(750);
                onChange({ harmonics: (params.harmonics % 5) + 1 });
              }}
              className="tech-btn text-[9px] py-1"
            >
              ORDER: 0{params.harmonics}
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[8px] text-[#66706B]">SWEEP SPEED</span>
            <button
              onClick={() => {
                sound.playClick(850);
                const next = params.timeScale === 1.0 ? 2.0 : params.timeScale === 2.0 ? 0.5 : 1.0;
                onChange({ timeScale: next });
              }}
              className="tech-btn text-[9px] py-1"
            >
              RATE: {params.timeScale}x
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
