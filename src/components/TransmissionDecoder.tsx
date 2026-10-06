import React, { useState } from 'react';
import { sound } from '../lib/soundEngine';

interface TransmissionDecoderProps {
  onDecodeComplete: () => void;
}

const BURST_METRICS = [
  { index: 1, freq: 23.701, phase: '0.00°', binary: '01001001 01000110', label: 'BURST 01 — ACQUIRED' },
  { index: 2, freq: 23.702, phase: '45.12°', binary: '01011001 01001111', label: 'BURST 02 — ACQUIRED' },
  { index: 3, freq: 23.700, phase: '90.00°', binary: '01010101 00100000', label: 'BURST 03 — ACQUIRED' },
  { index: 4, freq: 23.699, phase: '135.24°', binary: '01000011 01000001', label: 'BURST 04 — ACQUIRED' },
  { index: 5, freq: 23.700, phase: '180.00°', binary: '01001110 00100000', label: 'BURST 05 — ACQUIRED' },
];

const SECRET_MESSAGE_LINE_1 = "IF YOU CAN HEAR THIS,";
const SECRET_MESSAGE_LINE_2 = "YOU ARE ALREADY PART OF THE SIGNAL.";

export const TransmissionDecoder: React.FC<TransmissionDecoderProps> = ({
  onDecodeComplete,
}) => {
  const [isDecoding, setIsDecoding] = useState(false);
  const [activeBurstIndex, setActiveBurstIndex] = useState(-1);
  const [phaseStep, setPhaseStep] = useState<string>('ISOLATION COMPLETE // READY FOR DEMODULATION');
  const [revealedLine1, setRevealedLine1] = useState<string>('');
  const [revealedLine2, setRevealedLine2] = useState<string>('');
  const [isDone, setIsDone] = useState(false);
  const [symbolRecovery, setSymbolRecovery] = useState<number>(0);

  const startDecoding = () => {
    setIsDecoding(true);
    setPhaseStep('DEMODULATION: IN PROGRESS...');
    sound.playClick(1000);

    // Sequence the 5 bursts
    BURST_METRICS.forEach((burst, idx) => {
      setTimeout(() => {
        setActiveBurstIndex(idx);
        setPhaseStep(`DEMODULATION: ${burst.label}`);
        setSymbolRecovery(Math.round(((idx + 1) / 5) * 87));
        sound.playDecodeBurst(idx);
      }, (idx + 1) * 600);
    });

    setTimeout(() => {
      setPhaseStep('ERROR CORRECTION: ACTIVE [REED-SOLOMON SYNC]');
      sound.playClick(1100);
    }, 3800);

    setTimeout(() => {
      setPhaseStep('PATTERN RECONSTRUCTION: ACTIVE // SYMBOL RECOVERY: 87%');
      sound.playClick(1200);
    }, 5000);

    // Progressive glyph typewriter reveal with random character scrambling
    setTimeout(() => {
      setPhaseStep('TRANSLATION IN PROGRESS:');
      let charIdx = 0;
      
      const typeInterval = setInterval(() => {
        if (charIdx <= SECRET_MESSAGE_LINE_1.length) {
          setRevealedLine1(SECRET_MESSAGE_LINE_1.slice(0, charIdx));
          sound.playCharTick();
          charIdx++;
        } else {
          clearInterval(typeInterval);
          
          // Dramatic pause between line 1 and line 2
          setTimeout(() => {
            let charIdx2 = 0;
            const typeInterval2 = setInterval(() => {
              if (charIdx2 <= SECRET_MESSAGE_LINE_2.length) {
                setRevealedLine2(SECRET_MESSAGE_LINE_2.slice(0, charIdx2));
                sound.playCharTick();
                charIdx2++;
              } else {
                clearInterval(typeInterval2);
                setIsDone(true);
                sound.playFinalLock();
                setPhaseStep('DECRYPTION COMPLETE // PROCEED TO TRIANGULATION');
              }
            }, 55);
          }, 1200);
        }
      }, 50);
    }, 6200);
  };

  return (
    <div className="absolute inset-0 z-30 bg-[#050607]/95 backdrop-blur-md flex flex-col justify-center items-center p-4 sm:p-8">
      <div className="max-w-2xl w-full border border-[#1E2729] bg-[#090C0D] p-6 sm:p-8 tech-border shadow-2xl relative">
        {/* Decorative corner brackets */}
        <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#D7FF63]"></div>
        <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#D7FF63]"></div>
        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#D7FF63]"></div>
        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#D7FF63]"></div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#151B1C] pb-3 mb-6">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D7FF63] animate-pulse shadow-[0_0_8px_#D7FF63]"></span>
            <span className="text-xs sm:text-sm font-mono tracking-[0.25em] text-[#D8DEDA] uppercase font-bold">
              TRANSMISSION DECODER
            </span>
          </div>
          <span className="text-[10px] text-[#8FAF8F] font-mono tracking-wider">
            PATTERN CONFIDENCE: 94.8%
          </span>
        </div>

        {/* 5 Burst indicators */}
        <div className="mb-6">
          <div className="flex justify-between items-center text-[10px] text-[#66706B] font-mono mb-2 uppercase tracking-wider">
            <span>BURSTS DETECTED: 05</span>
            <span>POLARITY: DUAL-L</span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {BURST_METRICS.map((burst, i) => {
              const isActive = i <= activeBurstIndex;
              return (
                <div
                  key={burst.index}
                  className={`border p-2.5 text-center transition-all duration-300 ${
                    isActive
                      ? 'border-[#D7FF63] bg-[#D7FF63]/10 text-[#D7FF63] shadow-[0_0_12px_rgba(215,255,99,0.15)]'
                      : 'border-[#151B1C] bg-[#050607] text-[#3B4441]'
                  }`}
                >
                  <div className="text-[9px] font-mono tracking-wider font-semibold">
                    BURST 0{burst.index}
                  </div>
                  <div className="text-[8px] font-mono mt-1 text-[#8FAF8F]">
                    {isActive ? 'ACQUIRED' : 'PENDING'}
                  </div>
                  <div className="mt-2 h-1.5 bg-[#151B1C] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isActive ? 'bg-[#D7FF63] w-full' : 'w-0'
                      }`}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Diagnostics sub-bar */}
        <div className="grid grid-cols-3 gap-2 text-[9px] font-mono bg-[#050607] border border-[#151B1C] p-2 mb-4 text-[#66706B]">
          <div>DEMODULATION: <span className={isDecoding ? 'text-[#D7FF63]' : ''}>{isDecoding ? 'COMPLETE' : 'STANDBY'}</span></div>
          <div>ERROR CORRECTION: <span className={isDecoding ? 'text-[#8FAF8F]' : ''}>{isDecoding ? 'ACTIVE' : 'IDLE'}</span></div>
          <div>SYMBOL RECOVERY: <span className="text-[#D8DEDA]">{symbolRecovery}%</span></div>
        </div>

        {/* Phase step banner */}
        <div className="text-[11px] font-mono text-[#8FAF8F] tracking-[0.2em] py-2 px-3 border border-[#151B1C] bg-[#050607] mb-6 flex justify-between items-center">
          <span className={isDecoding ? 'text-[#D7FF63]' : ''}>{phaseStep}</span>
          {isDecoding && !isDone && (
            <span className="w-2 h-2 bg-[#D7FF63] rounded-full animate-ping"></span>
          )}
        </div>

        {/* Decoded Output Box */}
        {(revealedLine1.length > 0 || revealedLine2.length > 0) && (
          <div className="p-6 border border-[#D7FF63]/60 bg-[#050607] relative my-4 shadow-[0_0_30px_rgba(215,255,99,0.15)] min-h-[110px] flex flex-col justify-center">
            <div className="absolute top-2 right-3 text-[8px] text-[#8FAF8F] tracking-[0.2em] uppercase">
              DECRYPTED PAYLOAD // RECOVERED
            </div>
            <div className="font-mono text-base sm:text-lg md:text-xl text-[#D7FF63] font-bold tracking-widest leading-relaxed">
              {revealedLine1}
              {revealedLine2.length === 0 && !isDone && <span className="inline-block w-2.5 h-5 bg-[#D7FF63] ml-1 blink-cursor"></span>}
            </div>
            {revealedLine2.length > 0 && (
              <div className="font-mono text-base sm:text-lg md:text-xl text-[#E8FFA6] font-bold tracking-widest leading-relaxed mt-2">
                {revealedLine2}
                {!isDone && <span className="inline-block w-2.5 h-5 bg-[#D7FF63] ml-1 blink-cursor"></span>}
              </div>
            )}
          </div>
        )}

        {/* Start button or Proceed to Triangulation button */}
        {!isDecoding && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#151B1C]">
            <span className="text-[10px] text-[#66706B] tracking-[0.15em] font-mono">
              READY FOR COHERENT DECRYPT SEQUENCE
            </span>

            <button
              onClick={startDecoding}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#D7FF63] hover:bg-[#E8FFA6] text-[#050607] font-bold text-xs tracking-[0.25em] uppercase transition-all shadow-[0_0_20px_rgba(215,255,99,0.4)] cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <span>[ DECODE TRANSMISSION ]</span>
              <span className="text-base leading-none">›</span>
            </button>
          </div>
        )}

        {isDone && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#151B1C] animate-fadeIn">
            <span className="text-[10px] text-[#D7FF63] tracking-[0.18em] font-mono font-semibold">
              ORIGIN VECTORS IDENTIFIED ACROSS ORBITAL ARRAY
            </span>

            <button
              onClick={() => {
                sound.playClick(1100);
                onDecodeComplete();
              }}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#D7FF63] hover:bg-[#E8FFA6] text-[#050607] font-bold text-xs tracking-[0.25em] uppercase transition-all shadow-[0_0_20px_rgba(215,255,99,0.4)] cursor-pointer flex items-center justify-center gap-2"
            >
              <span>[ BEGIN SOURCE TRIANGULATION ]</span>
              <span className="text-base leading-none">›</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
