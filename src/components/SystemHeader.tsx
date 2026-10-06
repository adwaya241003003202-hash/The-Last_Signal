import React, { useState } from 'react';
import type { SignalTelemetry } from '../types/signal';

interface SystemHeaderProps {
  telemetry: SignalTelemetry;
  isMuted: boolean;
  onToggleMute: () => void;
  onEmergencyReset: () => void;
  onEasterEggTrigger?: () => void;
}

export const SystemHeader: React.FC<SystemHeaderProps> = ({
  telemetry,
  isMuted,
  onToggleMute,
  onEmergencyReset,
  onEasterEggTrigger,
}) => {
  const [clickCount, setClickCount] = useState(0);

  const handleStationClick = () => {
    const next = clickCount + 1;
    setClickCount(next);
    if (next >= 4 && onEasterEggTrigger) {
      onEasterEggTrigger();
      setClickCount(0);
    }
  };

  return (
    <header className="w-full bg-[#090C0D] border-b border-[#151B1C] px-4 py-2 flex flex-wrap justify-between items-center z-20 text-xs font-mono select-none">
      {/* Brand & Station identifier */}
      <div className="flex items-center gap-4">
        <div
          onClick={handleStationClick}
          className="flex items-center gap-2 cursor-pointer group"
          title="Station 07 Zenith Receiver (Click for telemetry diagnostics)"
        >
          <span className="w-2.5 h-2.5 bg-[#D7FF63] inline-block shadow-[0_0_8px_#D7FF63] group-hover:scale-125 transition-transform"></span>
          <span className="font-bold text-sm tracking-[0.25em] text-[#D8DEDA] uppercase group-hover:text-[#D7FF63] transition-colors">
            THE LAST SIGNAL
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[10px] text-[#66706B] tracking-widest pl-3 border-l border-[#151B1C]">
          <span>ORBITAL RESEARCH NETWORK</span>
          <span className="text-[#3B4441]">/</span>
          <span className="text-[#8FAF8F] font-semibold">STATION 07</span>
        </div>
      </div>

      {/* Real-time telemetry badges */}
      <div className="flex items-center gap-3 sm:gap-6 mt-1 sm:mt-0 text-[10px]">
        {/* Frequency & Lock Status */}
        <div className="flex items-center gap-2 bg-[#050607] px-2.5 py-1 border border-[#151B1C]">
          <span className="text-[#66706B]">VFO:</span>
          <span className={`font-bold ${telemetry.isLocked ? 'text-[#D7FF63]' : 'text-[#D8DEDA]'}`}>
            {telemetry.currentFreq.toFixed(3)} MHz
          </span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              telemetry.isLocked ? 'bg-[#D7FF63] animate-ping' : 'bg-[#3B4441]'
            }`}
          ></span>
        </div>

        {/* SNR Telemetry */}
        <div className="hidden md:flex items-center gap-2 bg-[#050607] px-2.5 py-1 border border-[#151B1C]">
          <span className="text-[#66706B]">SNR:</span>
          <span className="text-[#8FAF8F]">{telemetry.snrDb} dB</span>
        </div>

        {/* Antenna Coordinates */}
        <div className="hidden lg:flex items-center gap-2 bg-[#050607] px-2.5 py-1 border border-[#151B1C]">
          <span className="text-[#66706B]">ZENITH:</span>
          <span className="text-[#D8DEDA]">{telemetry.antennaAzimuth}° / {telemetry.antennaElevation}°</span>
        </div>

        {/* Sound toggle & Reset buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMute}
            className="hover:text-[#D7FF63] text-[#8FAF8F] bg-[#050607] border border-[#151B1C] px-2.5 py-1 text-[9px] tracking-wider uppercase cursor-pointer transition-colors"
          >
            {isMuted ? 'MUTE' : 'AUDIO'}
          </button>
          <button
            onClick={onEmergencyReset}
            title="Re-boot instrumentation"
            className="text-[#66706B] hover:text-[#D96B6B] bg-[#050607] border border-[#151B1C] px-2.5 py-1 text-[9px] tracking-wider uppercase cursor-pointer transition-colors"
          >
            REBOOT
          </button>
        </div>
      </div>
    </header>
  );
};
