import React, { useState, useEffect } from 'react';
import { sound } from '../lib/soundEngine';

interface BootSequenceProps {
  onBootComplete: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

const BOOT_LOGS = [
  { text: 'ORBITAL RESEARCH NETWORK', delay: 400 },
  { text: 'STATION 07 // DEEP SECTOR SECTOR-9X', delay: 900 },
  { text: 'PRIMARY BUS VOLTAGE: 28.4 V [NOMINAL]', delay: 1400 },
  { text: 'RECEIVER INITIALIZING...', delay: 1900 },
  { text: 'CALIBRATING ARRAY POLARIZATION...', delay: 2500 },
  { text: 'THERMAL SYSTEMS NOMINAL [2.7 K]', delay: 3000 },
  { text: 'SCANNING FREQUENCY BAND 20.000 - 30.000 MHz...', delay: 3600 },
  { text: 'SIGNAL FOUND IN SECTOR 7-ALPHA', delay: 4200 },
  { text: 'ANOMALOUS SIGNAL DETECTED', delay: 4800, highlight: true },
];

export const BootSequence: React.FC<BootSequenceProps> = ({
  onBootComplete,
  isMuted,
  onToggleMute,
}) => {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [showTargetData, setShowTargetData] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Sequence of terminal lines appearing with authentic timing
    BOOT_LOGS.forEach((item, index) => {
      setTimeout(() => {
        setCurrentLineIndex(index + 1);
        sound.playClick(600 + index * 40);
      }, item.delay);
    });

    const targetTimer = setTimeout(() => {
      setShowTargetData(true);
      sound.playClick(960);
    }, 5500);

    const readyTimer = setTimeout(() => {
      setIsReady(true);
      sound.playClick(1200);
    }, 6400);

    return () => {
      clearTimeout(targetTimer);
      clearTimeout(readyTimer);
    };
  }, []);

  const handleBegin = () => {
    sound.setMuted(isMuted);
    sound.startAmbientHum();
    sound.playClick(1320);
    onBootComplete();
  };

  return (
    <div className="relative z-10 w-full h-full flex flex-col justify-between p-6 sm:p-12 md:p-16 max-w-6xl mx-auto">
      {/* Top micro status bar */}
      <div className="flex justify-between items-center text-[10px] tracking-[0.25em] text-[#66706B] border-b border-[#151B1C] pb-3">
        <div className="flex items-center gap-3">
          <span className="inline-block w-2 h-2 rounded-full bg-[#D7FF63] animate-pulse"></span>
          <span>SYS_INITIALIZE_REV_4.19</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleMute}
            className="hover:text-[#D7FF63] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>AUDIO:</span>
            <span className={isMuted ? 'text-[#D96B6B]' : 'text-[#D7FF63]'}>
              {isMuted ? '[MUTED]' : '[ACTIVE]'}
            </span>
          </button>
          <span>UTC 04:17:12</span>
        </div>
      </div>

      {/* Main Terminal diagnostics container */}
      <div className="my-auto py-8">
        <div className="border border-[#151B1C] bg-[#090C0D]/85 p-6 md:p-10 tech-border backdrop-blur-md max-w-3xl shadow-2xl">
          {/* Header Badge */}
          <div className="flex items-center justify-between border-b border-[#151B1C] pb-4 mb-6">
            <span className="text-[11px] tracking-[0.2em] text-[#8FAF8F] uppercase font-semibold">
              Deep Space Reception Subsystem // Node 07
            </span>
            <span className="text-[9px] text-[#3B4441] tracking-[0.3em]">SEC: 09X-ARCHIVE</span>
          </div>

          {/* Sequential boot logs */}
          <div className="space-y-2 font-mono text-[12px] sm:text-[13px] tracking-wider min-h-[220px]">
            {BOOT_LOGS.slice(0, currentLineIndex).map((item, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 transition-opacity duration-200 ${
                  item.highlight
                    ? 'text-[#D7FF63] font-bold tracking-widest pl-2 border-l-2 border-[#D7FF63]'
                    : 'text-[#D8DEDA]'
                }`}
              >
                <span className="text-[#3B4441] select-none text-[10px] pt-0.5">
                  {(idx + 1).toString().padStart(2, '0')}
                </span>
                <span>{item.text}</span>
              </div>
            ))}
            {currentLineIndex < BOOT_LOGS.length && (
              <span className="inline-block w-2.5 h-4 bg-[#D7FF63] blink-cursor"></span>
            )}
          </div>

          {/* Target Frequency Reveal */}
          {showTargetData && (
            <div className="mt-8 pt-6 border-t border-[#1E2729] animate-fadeIn transition-all">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-left">
                <div className="border border-[#151B1C] p-3 bg-[#050607]/60">
                  <div className="text-[9px] text-[#66706B] tracking-[0.2em] uppercase">Target Vector</div>
                  <div className="text-xl sm:text-2xl text-[#D7FF63] font-mono tracking-wider mt-1">
                    23.700 <span className="text-xs text-[#8FAF8F]">MHz</span>
                  </div>
                </div>

                <div className="border border-[#151B1C] p-3 bg-[#050607]/60">
                  <div className="text-[9px] text-[#66706B] tracking-[0.2em] uppercase">Origin Vector</div>
                  <div className="text-sm sm:text-base text-[#D8DEDA] font-mono tracking-wider mt-1">
                    UNKNOWN SOURCE
                  </div>
                </div>

                <div className="border border-[#151B1C] p-3 bg-[#050607]/60">
                  <div className="text-[9px] text-[#66706B] tracking-[0.2em] uppercase">Estimated Age</div>
                  <div className="text-sm sm:text-base text-[#D8DEDA] font-mono tracking-wider mt-1">
                    UNKNOWN AGE
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {isReady && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#151B1C]/60">
                  <span className="text-[10px] text-[#66706B] tracking-[0.18em]">
                    AWAITING OPERATOR HANDSHAKE...
                  </span>

                  <button
                    onClick={handleBegin}
                    className="w-full sm:w-auto px-8 py-3.5 bg-[#D7FF63] hover:bg-[#E8FFA6] text-[#050607] font-bold text-xs sm:text-sm tracking-[0.25em] uppercase transition-all duration-200 transform hover:scale-[1.02] shadow-[0_0_20px_rgba(215,255,99,0.3)] active:scale-[0.99] flex items-center justify-center gap-3 cursor-pointer"
                  >
                    <span>BEGIN ANALYSIS</span>
                    <span className="text-base leading-none">›</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Micro Footer */}
      <div className="flex flex-col sm:flex-row justify-between items-center text-[9px] text-[#3B4441] tracking-[0.2em] border-t border-[#151B1C] pt-3 gap-2">
        <span>SECURITY LEVEL: TOP SECRET // COMPARTMENT 07-OMEGA</span>
        <span>LAT: ORBITAL GEO-SYNC +35,786 KM</span>
      </div>
    </div>
  );
};
