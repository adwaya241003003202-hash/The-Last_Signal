import React, { useRef, useEffect } from 'react';
import type { SignalParameters, SignalTelemetry } from '../types/signal';

interface WaveformProps {
  waveform: Float32Array;
  telemetry: SignalTelemetry;
  params: SignalParameters;
}

export const Waveform: React.FC<WaveformProps> = ({ waveform, telemetry, params }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanPosRef = useRef(0);

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

      // Phosphor persistence trail
      ctx.fillStyle = 'rgba(5, 6, 7, 0.28)';
      ctx.fillRect(0, 0, width, height);

      // 1. Oscilloscope Reticle Grid
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(21, 27, 28, 0.85)';

      const stepX = width / 10;
      const stepY = height / 8;

      ctx.beginPath();
      for (let x = stepX; x < width; x += stepX) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = stepY; y < height; y += stepY) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Center crosshairs with subdivision tick marks
      ctx.strokeStyle = 'rgba(30, 39, 41, 0.9)';
      const midX = width / 2;
      const midY = height / 2;

      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.moveTo(midX, 0);
      ctx.lineTo(midX, height);
      ctx.stroke();

      // Subdivision ticks on axes
      ctx.strokeStyle = 'rgba(60, 75, 75, 0.7)';
      ctx.beginPath();
      for (let x = 0; x < width; x += 15) {
        const tickH = x % 75 === 0 ? 6 : 3;
        ctx.moveTo(x, midY - tickH);
        ctx.lineTo(x, midY + tickH);
      }
      for (let y = 0; y < height; y += 15) {
        const tickW = y % 75 === 0 ? 6 : 3;
        ctx.moveTo(midX - tickW, y);
        ctx.lineTo(midX + tickW, y);
      }
      ctx.stroke();

      // 2. Animated Scan Cursor line sweeping left to right
      scanPosRef.current = (scanPosRef.current + 2.5 * params.timeScale) % width;
      const scanX = scanPosRef.current;
      
      const grad = ctx.createLinearGradient(scanX - 40, 0, scanX, 0);
      grad.addColorStop(0, 'rgba(215, 255, 99, 0)');
      grad.addColorStop(1, 'rgba(215, 255, 99, 0.15)');
      ctx.fillStyle = grad;
      ctx.fillRect(scanX - 40, 0, 40, height);

      ctx.strokeStyle = 'rgba(215, 255, 99, 0.4)';
      ctx.beginPath();
      ctx.moveTo(scanX, 0);
      ctx.lineTo(scanX, height);
      ctx.stroke();

      // 3. Draw Oscilloscope Waveform Trace
      if (waveform.length > 0) {
        const isLocked = telemetry.isLocked;
        const isAnomaly = telemetry.anomalyTriggered;
        const isIsolated = telemetry.isolated;

        ctx.save();
        ctx.shadowBlur = isLocked ? 16 : 6;
        ctx.shadowColor = isAnomaly ? '#E5A84B' : '#D7FF63';

        ctx.lineWidth = isLocked ? 2.4 : 1.6;
        ctx.strokeStyle = isAnomaly 
          ? '#E5A84B' 
          : isIsolated 
            ? '#D7FF63' 
            : isLocked 
              ? '#D7FF63' 
              : 'rgba(143, 175, 143, 0.85)';

        ctx.beginPath();
        const sliceWidth = width / waveform.length;
        let curX = 0;

        for (let i = 0; i < waveform.length; i++) {
          const sample = waveform[i];
          const curY = midY - sample * (height * 0.42);

          if (i === 0) {
            ctx.moveTo(curX, curY);
          } else {
            ctx.lineTo(curX, curY);
          }
          curX += sliceWidth;
        }
        ctx.stroke();
        ctx.restore();

        // Secondary Ghost / Persistence Trace
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(215, 255, 99, 0.18)';
        ctx.beginPath();
        curX = 0;
        for (let i = 0; i < waveform.length; i++) {
          const sample = waveform[i] * 0.94;
          const curY = midY - sample * (height * 0.42);
          if (i === 0) ctx.moveTo(curX, curY);
          else ctx.lineTo(curX, curY);
          curX += sliceWidth;
        }
        ctx.stroke();
      }

      // 4. Detailed Scientific Telemetry Overlay Rulers
      ctx.font = '9px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#66706B';
      ctx.fillText(`CH1: 50mV / DIV`, 16, 22);
      ctx.fillText(`TIME: 10µs / DIV`, 16, 34);
      ctx.fillText(`RATE: ${telemetry.samplingRateGsps} GS/s`, 16, 46);
      ctx.fillText(`JITTER: ±${telemetry.jitterPs} ps`, 16, 58);

      ctx.fillText(`TRIG: AUTO [${telemetry.targetFreq.toFixed(2)} MHz]`, width - 190, 22);
      ctx.fillText(`COUPLING: DC 50Ω`, width - 190, 34);
      ctx.fillText(`CRYO: ${telemetry.cryoTempKelvin} K`, width - 190, 46);
      ctx.fillText(`NOISE FL: ${telemetry.noiseFloorDbm} dBm`, width - 190, 58);

      // Voltage reference markers
      ctx.fillStyle = '#3B4441';
      ctx.fillText('+1.0V', 8, midY - (height * 0.4) + 10);
      ctx.fillText(' 0.0V', 8, midY - 4);
      ctx.fillText('-1.0V', 8, midY + (height * 0.4) - 2);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animId);
  }, [waveform, telemetry, params]);

  return (
    <div className="relative w-full h-full bg-[#050607] overflow-hidden flex flex-col">
      {/* Scope Corner brackets */}
      <div className="absolute top-2 left-2 text-[9px] text-[#8FAF8F] font-mono tracking-widest uppercase z-10 flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-[#D7FF63] rounded-full inline-block"></span>
        OSCILLOSCOPE // REAL-TIME ANALOG TRACE
      </div>
      <div className="absolute top-2 right-2 text-[9px] text-[#66706B] font-mono z-10 flex gap-4">
        <span>DELAY: {telemetry.propagationDelayMs} ms</span>
        <span>RATE: 2.4 GS/s</span>
      </div>

      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

      {/* Scope Footer readout */}
      <div className="absolute bottom-2 left-4 right-4 flex justify-between text-[9px] text-[#66706B] font-mono border-t border-[#151B1C] pt-1.5 z-10">
        <span>V_P-P: {(telemetry.peakMagnitude * 0.024).toFixed(2)} V</span>
        <span>FREQ: {telemetry.currentFreq.toFixed(3)} MHz</span>
        <span>AZ: {telemetry.antennaAzimuth}° / EL: {telemetry.antennaElevation}°</span>
        <span className={telemetry.isLocked ? 'text-[#D7FF63] font-bold' : ''}>
          STATUS: {telemetry.isLocked ? 'TRIGGER LOCKED' : 'SEARCHING...'}
        </span>
      </div>
    </div>
  );
};
