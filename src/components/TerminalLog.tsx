import React, { useRef, useEffect } from 'react';
import type { TerminalEntry } from '../types/signal';

interface TerminalLogProps {
  entries: TerminalEntry[];
}

const resolveLogCategory = (entry: TerminalEntry) => {
  const message = `${entry.text} ${entry.source}`.toUpperCase();

  if (entry.type === 'alert' || entry.type === 'warn' || /WARNING|ERROR|ALERT|CRITICAL|ANOMALY|FAIL|DROP/.test(message)) {
    return {
      label: 'WARNING',
      badgeClassName: 'border border-[#E5A84B]/30 bg-[#E5A84B]/5 text-[#E5A84B]',
      textClassName: 'text-[#E5A84B] font-semibold',
    };
  }

  if (/VECTOR|TRAJECTORY|BEARING|INTERSECTION|COORDINATE|AZIMUTH|ELEVATION|SOLVE|TRIANG|ORBIT/.test(message)) {
    return {
      label: 'VECTOR',
      badgeClassName: 'border border-[#D7FF63]/25 bg-[#D7FF63]/5 text-[#D7FF63]',
      textClassName: 'text-[#D7FF63] font-semibold',
    };
  }

  if (/SIGNAL|FREQUENCY|PHASE|CARRIER|BANDWIDTH|SNR|AMPLITUDE|LOCK|DECODE|MODULATION|BURST|RESONANCE/.test(message)) {
    return {
      label: 'SIGNAL',
      badgeClassName: 'border border-[#8FAF8F]/25 bg-[#8FAF8F]/5 text-[#8FAF8F]',
      textClassName: 'text-[#B7D2B7]',
    };
  }

  if (/LOG|SYSTEM|STATUS|BUFFER|READY|SYNC|NETWORK|COHERENT|INITIALIZ|STATION|LINK|ARRAY/.test(message)) {
    return {
      label: 'LOG',
      badgeClassName: 'border border-[#3B4441] bg-[#090C0D] text-[#D8DEDA]',
      textClassName: 'text-[#D8DEDA]',
    };
  }

  return {
    label: 'INFO',
    badgeClassName: 'border border-[#151B1C] bg-[#050607] text-[#8FAF8F]',
    textClassName: 'text-[#66706B]',
  };
};

export const TerminalLog: React.FC<TerminalLogProps> = ({ entries }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  return (
    <div className="flex flex-col h-full bg-[#090C0D] border border-[#151B1C] tech-border overflow-hidden">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#151B1C] bg-[#050607]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#8FAF8F] rounded-full"></span>
          <span className="text-[9px] text-[#8FAF8F] font-mono tracking-[0.2em] uppercase">
            DIAGNOSTIC TELEMETRY LOG
          </span>
        </div>
        <span className="text-[8px] text-[#3B4441] font-mono">BUFFER: {entries.length}/256</span>
      </div>

      {/* Log scroll area */}
      <div className="flex-1 p-2.5 overflow-y-auto space-y-1 font-mono text-[10px] leading-relaxed select-text">
        {entries.map((entry) => {
          const category = resolveLogCategory(entry);

          return (
            <div key={entry.id} className="flex items-start gap-2 hover:bg-[#151B1C]/40 px-1 py-0.5 rounded-sm">
              <span className="text-[#3B4441] select-none text-[8px] pt-0.5">{entry.timestamp}</span>
              <span className="text-[#8FAF8F] select-none text-[9px] font-bold">[{entry.source}]</span>
              <span className={`inline-flex items-center justify-center min-w-[3.5rem] px-1 py-0.5 border text-[7px] font-mono tracking-[0.2em] uppercase ${category.badgeClassName}`}>
                {category.label}
              </span>
              <span className={`${category.textClassName} flex-1 break-words`}>{entry.text}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
