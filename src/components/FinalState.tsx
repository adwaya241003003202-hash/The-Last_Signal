import React, { useState, useEffect } from 'react';
import { sound } from '../lib/soundEngine';

interface FinalStateProps {
  onRestart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const FinalState: React.FC<FinalStateProps> = ({
  onRestart,
  isMuted,
  onToggleMute,
}) => {
  const [delayedLineIndex, setDelayedLineIndex] = useState<number>(0);

  useEffect(() => {
    // Silence ambient hum for cinematic eerie stillness
    sound.stopContinuousSounds();

    // After several seconds of silence, introduce one tiny telemetry line
    const t1 = setTimeout(() => {
      setDelayedLineIndex(1);
      sound.playIncomingChannelPulse();
    }, 4500);

    const t2 = setTimeout(() => {
      setDelayedLineIndex(2);
      sound.playIncomingChannelPulse();
    }, 8500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="relative z-20 w-full h-full flex flex-col justify-between p-6 sm:p-12 md:p-16 max-w-5xl mx-auto animate-fadeIn select-none">
      {/* Top minimal status */}
      <div className="flex justify-between items-center text-[10px] tracking-[0.25em] text-[#66706B] border-b border-[#151B1C] pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#D7FF63] animate-pulse"></span>
          <span>TERMINAL DEEP-SLEEP // STATION 07</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleMute}
            className="hover:text-[#D7FF63] transition-colors cursor-pointer"
          >
            {isMuted ? 'AUDIO: [MUTED]' : 'AUDIO: [LIVE]'}
          </button>
          <span>UTC 04:18:02</span>
        </div>
      </div>

      {/* Center Minimal Payload with high contrast cinematic card */}
      <div className="my-auto text-center max-w-2xl mx-auto space-y-7 bg-[#090C0D]/85 border border-[#151B1C] p-8 sm:p-12 tech-border backdrop-blur-md shadow-2xl relative">
        {/* Pulsing signal beacon dot */}
        <div className="flex justify-center mb-4">
          <div className="relative flex items-center justify-center">
            <span className="absolute w-16 h-16 rounded-full bg-[#D7FF63]/15 animate-ping"></span>
            <span className="w-4 h-4 rounded-full bg-[#D7FF63] shadow-[0_0_25px_#D7FF63]"></span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xl sm:text-2xl md:text-3xl font-mono tracking-[0.3em] text-[#D8DEDA] uppercase font-bold">
            TRANSMISSION COMPLETE
          </div>

          <div className="text-xs sm:text-sm font-mono tracking-[0.25em] text-[#8FAF8F] uppercase">
            SOURCE: UNKNOWN // ORIGIN: EARTH
          </div>

          <div className="text-xs sm:text-sm font-mono tracking-[0.25em] text-[#D7FF63] font-bold uppercase">
            CONNECTION: ACTIVE
          </div>
        </div>

        {/* Minimal quote echo */}
        <div className="pt-6 border-t border-[#151B1C] text-sm sm:text-base font-mono text-[#D7FF63] tracking-widest max-w-md mx-auto leading-relaxed font-semibold">
          "IF YOU CAN HEAR THIS,<br />
          YOU ARE ALREADY PART OF THE SIGNAL."
        </div>

        {/* Delayed eerie terminal lines appearing in silence */}
        <div className="min-h-[45px] font-mono text-[10px] tracking-[0.25em] text-[#E5A84B] flex flex-col items-center justify-center gap-1">
          {delayedLineIndex >= 1 && (
            <div className="animate-fadeIn">› INCOMING SIGNAL DETECTED</div>
          )}
          {delayedLineIndex >= 2 && (
            <div className="animate-fadeIn text-[#D7FF63] font-bold">› CHANNEL OPEN</div>
          )}
        </div>

        {/* Subtle diagnostic reset */}
        <div className="pt-4">
          <button
            onClick={() => {
              sound.playClick(800);
              onRestart();
            }}
            className="text-[10px] text-[#66706B] hover:text-[#D7FF63] tracking-[0.3em] uppercase transition-colors font-mono cursor-pointer border border-[#1E2729] hover:border-[#D7FF63] px-5 py-2 bg-[#050607]"
          >
            [ REINITIALIZE ARRAY SCAN ]
          </button>
        </div>
      </div>

      {/* Bottom telemetry coordinates */}
      <div className="flex justify-between items-center text-[9px] text-[#3B4441] tracking-[0.2em] border-t border-[#151B1C] pt-3">
        <span>FREQ: 23.700 MHz // PHASE: SYNCHRONIZED</span>
        <span>ARRAY STATUS: PERSISTENT LISTENING // AZ 184.2° EL 42.8°</span>
      </div>
    </div>
  );
};
