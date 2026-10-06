import React, { useRef, useEffect } from 'react';
import type { SignalTelemetry } from '../types/signal';

interface SpectrumProps {
  spectrum: Float32Array;
  telemetry: SignalTelemetry;
}

export const Spectrum: React.FC<SpectrumProps> = ({ spectrum, telemetry }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const peakHoldRef = useRef<Float32Array | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.fillStyle = '#050607';
      ctx.fillRect(0, 0, width, height);

      // Peak Hold Buffer
      if (!peakHoldRef.current || peakHoldRef.current.length !== spectrum.length) {
        peakHoldRef.current = new Float32Array(spectrum.length);
      }
      const peakHold = peakHoldRef.current;

      // 1. Decibel Frequency Grid Lines
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#151B1C';

      // Horizontal dB lines (-10 dB to -90 dB)
      for (let i = 1; i <= 8; i++) {
        const y = (height / 9) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        ctx.font = '9px "IBM Plex Mono", monospace';
        ctx.fillStyle = '#3B4441';
        ctx.fillText(`-${i * 12} dBm`, 8, y - 3);
      }

      // Vertical Frequency bins (21 MHz to 26 MHz)
      const freqs = ['21.0', '22.0', '23.0', '23.7*', '24.0', '25.0', '26.0'];
      for (let i = 0; i < freqs.length; i++) {
        const x = (width / (freqs.length - 1)) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        ctx.font = '9px "IBM Plex Mono", monospace';
        ctx.fillStyle = freqs[i].includes('*') ? '#D7FF63' : '#66706B';
        ctx.fillText(`${freqs[i]} MHz`, Math.max(4, Math.min(width - 55, x - 20)), height - 8);
      }

      // 2. Render Spectrum Bins
      const binCount = spectrum.length;
      const barWidth = width / binCount;

      ctx.beginPath();
      ctx.moveTo(0, height - 24);

      for (let b = 0; b < binCount; b++) {
        const mag = spectrum[b];
        const barH = mag * (height - 35);
        const x = b * barWidth;
        const y = height - 24 - barH;

        if (mag > peakHold[b]) {
          peakHold[b] = mag;
        } else {
          peakHold[b] = Math.max(0, peakHold[b] - 0.004);
        }

        const isTargetZone = Math.abs(b - Math.floor(((23.7 - 21.0) / 5.0) * binCount)) < 4;
        
        ctx.fillStyle = isTargetZone && telemetry.isLocked
          ? '#D7FF63'
          : `rgba(143, 175, 143, ${0.4 + mag * 0.6})`;

        ctx.fillRect(x, y, Math.max(1, barWidth - 1), barH);

        // Peak Hold Marker
        const peakY = height - 24 - peakHold[b] * (height - 35);
        ctx.fillStyle = isTargetZone ? '#D7FF63' : '#8FAF8F';
        ctx.fillRect(x, peakY, Math.max(1, barWidth - 1), 1.5);
      }

      // 3. Highlight 23.700 MHz Target Vector Reticle
      const targetX = ((23.700 - 21.0) / 5.0) * width;
      ctx.strokeStyle = 'rgba(215, 255, 99, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(targetX, 0);
      ctx.lineTo(targetX, height - 24);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#090C0D';
      ctx.fillRect(targetX - 35, 14, 70, 16);
      ctx.strokeStyle = '#D7FF63';
      ctx.strokeRect(targetX - 35, 14, 70, 16);
      ctx.fillStyle = '#D7FF63';
      ctx.font = '9px "IBM Plex Mono", monospace';
      ctx.fillText('TARGET: 23.70', targetX - 31, 25);

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
        SPECTRUM ANALYZER // FFT POWER DENSITY
      </div>
      <div className="absolute top-2 right-2 text-[9px] text-[#66706B] font-mono z-10 flex gap-4">
        <span>FFT: {telemetry.fftSize} BINS</span>
        <span>RBW: 10 kHz</span>
        <span>SPAN: 5.0 MHz</span>
      </div>

      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Metric Overlay */}
      <div className="absolute bottom-6 left-4 right-4 flex justify-between text-[9px] text-[#66706B] font-mono pointer-events-none">
        <span>PEAK: -{Math.max(12, Math.round(90 - telemetry.peakMagnitude * 0.78))} dBm</span>
        <span>SNR: {telemetry.snrDb} dB</span>
        <span>BW: {telemetry.bandwidthKhz} kHz</span>
        <span>FLOOR: {telemetry.noiseFloorDbm} dBm</span>
        <span className={telemetry.isLocked ? 'text-[#D7FF63] font-bold' : 'text-[#66706B]'}>
          CARRIER LOCK: {telemetry.isLocked ? 'SYNCHRONIZED' : 'UNRESOLVED'}
        </span>
      </div>
    </div>
  );
};
