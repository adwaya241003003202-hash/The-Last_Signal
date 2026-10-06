import React, { useRef, useEffect } from 'react';
import type { SignalTelemetry } from '../types/signal';

interface SpectrogramProps {
  spectrum: Float32Array;
  telemetry: SignalTelemetry;
}

export const Spectrogram: React.FC<SpectrogramProps> = ({ spectrum, telemetry }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!historyCanvasRef.current) {
      historyCanvasRef.current = document.createElement('canvas');
      historyCanvasRef.current.width = 512;
      historyCanvasRef.current.height = 300;
      const hCtx = historyCanvasRef.current.getContext('2d');
      if (hCtx) {
        hCtx.fillStyle = '#050607';
        hCtx.fillRect(0, 0, 512, 300);
      }
    }
    const hCanvas = historyCanvasRef.current;
    const hCtx = hCanvas.getContext('2d');
    if (!hCtx) return;

    let animId: number;

    const render = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      // Shift rolling buffer DOWN
      hCtx.drawImage(hCanvas, 0, 0, hCanvas.width, hCanvas.height - 1, 0, 1, hCanvas.width, hCanvas.height - 1);

      // Draw newest row
      const binCount = spectrum.length;
      const colStep = hCanvas.width / binCount;

      for (let b = 0; b < binCount; b++) {
        const val = spectrum[b];

        let r = 5, g = 6, bCol = 7;

        if (val < 0.25) {
          const t = val / 0.25;
          r = Math.floor(5 + t * (21 - 5));
          g = Math.floor(6 + t * (27 - 6));
          bCol = Math.floor(7 + t * (28 - 7));
        } else if (val < 0.65) {
          const t = (val - 0.25) / 0.4;
          r = Math.floor(21 + t * (143 - 21));
          g = Math.floor(27 + t * (175 - 27));
          bCol = Math.floor(28 + t * (143 - 28));
        } else {
          const t = (val - 0.65) / 0.35;
          r = Math.floor(143 + t * (215 - 143));
          g = Math.floor(175 + t * (255 - 175));
          bCol = Math.floor(143 + t * (99 - 143));
        }

        hCtx.fillStyle = `rgb(${r},${g},${bCol})`;
        hCtx.fillRect(b * colStep, 0, Math.ceil(colStep), 1);
      }

      ctx.drawImage(hCanvas, 0, 0, width, height);

      // Waterfall Time ticks on left
      ctx.strokeStyle = '#151B1C';
      ctx.lineWidth = 1;

      ctx.font = '9px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#66706B';

      for (let t = 1; t <= 5; t++) {
        const y = (height / 6) * t;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        ctx.fillText(`-${t * 3}s`, 8, y - 4);
      }

      // Target frequency tracking line
      const targetBinX = ((23.700 - 21.0) / 5.0) * width;
      ctx.strokeStyle = telemetry.isLocked ? 'rgba(215, 255, 99, 0.6)' : 'rgba(215, 255, 99, 0.2)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(targetBinX, 0);
      ctx.lineTo(targetBinX, height);
      ctx.stroke();
      ctx.setLineDash([]);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animId);
  }, [spectrum, telemetry]);

  return (
    <div className="relative w-full h-full bg-[#050607] overflow-hidden flex flex-col">
      {/* Top Header telemetry */}
      <div className="absolute top-2 left-2 text-[9px] text-[#8FAF8F] font-mono tracking-widest uppercase z-10 flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-[#D7FF63] rounded-full inline-block"></span>
        SPECTROGRAM // WATERFALL TIME ACCUMULATOR
      </div>
      <div className="absolute top-2 right-2 text-[9px] text-[#66706B] font-mono z-10 flex gap-4">
        <span>HISTORY: 18.0s</span>
        <span>INTEGRATION: 33ms</span>
        <span>COHERENCE: {telemetry.coherence}%</span>
      </div>

      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Frequency legend strip at bottom */}
      <div className="absolute bottom-2 left-4 right-4 flex justify-between text-[9px] text-[#66706B] font-mono border-t border-[#151B1C] pt-1 z-10 pointer-events-none">
        <span>21.0 MHz</span>
        <span>22.0 MHz</span>
        <span>23.0 MHz</span>
        <span className="text-[#D7FF63] font-semibold">23.700 MHz [TARGET]</span>
        <span>25.0 MHz</span>
        <span>26.0 MHz</span>
      </div>
    </div>
  );
};
