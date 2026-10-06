import React, { useState, useEffect, useRef } from 'react';
import type { TriangulationStation, CelestialCoordinates } from '../types/signal';
import { sound } from '../lib/soundEngine';

interface SourceTriangulationProps {
  onTriangulationComplete: () => void;
}

const STATIONS: TriangulationStation[] = [
  {
    id: '07',
    name: 'STATION 07',
    location: 'GEO-SYNC ORBIT // ZENITH ARRAY',
    azimuth: 184.2,
    elevation: 42.8,
    delayMs: 49.02,
    signalStrength: 98,
    isLocked: false,
  },
  {
    id: '12',
    name: 'STATION 12',
    location: 'LUNAR LAGRANGE L2 // DEEP ARRAY',
    azimuth: 218.7,
    elevation: 19.4,
    delayMs: 64.18,
    signalStrength: 94,
    isLocked: false,
  },
  {
    id: '19',
    name: 'STATION 19',
    location: 'ARES POLAR ORBIT // SUB-SECTOR 4',
    azimuth: 142.1,
    elevation: 58.6,
    delayMs: 112.45,
    signalStrength: 91,
    isLocked: false,
  },
];

const CELESTIAL_DATA: CelestialCoordinates = {
  rightAscension: '07h 41m 13.7s',
  declination: '−23° 41′ 08.2″',
  distanceLightYears: 14.7,
  confidence: 99.97,
  estimatedAgeYears: 14.7,
  classification: 'UNKNOWN ARTIFICIAL',
  origin: 'EARTH',
};

const TRIANGULATION_PHASES = [
  'STATION ACQUISITION',
  'LOCK 07',
  'LOCK 12',
  'LOCK 19',
  'VECTOR INTERSECTION',
  'SOURCE COORDINATES',
];

export const SourceTriangulation: React.FC<SourceTriangulationProps> = ({
  onTriangulationComplete,
}) => {
  const [stationStates, setStationStates] = useState<TriangulationStation[]>(STATIONS);
  const [step, setStep] = useState<number>(0);
  const [showCoordinates, setShowCoordinates] = useState<boolean>(false);
  const [revealedTwist, setRevealedTwist] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // 1. Lock Station 07
    const timer1 = setTimeout(() => {
      setStationStates((prev) =>
        prev.map((s, idx) => (idx === 0 ? { ...s, isLocked: true } : s))
      );
      setStep(1);
      sound.playTriangulationStationPing(0);
    }, 800);

    // 2. Lock Station 12
    const timer2 = setTimeout(() => {
      setStationStates((prev) =>
        prev.map((s, idx) => (idx <= 1 ? { ...s, isLocked: true } : s))
      );
      setStep(2);
      sound.playTriangulationStationPing(1);
    }, 2200);

    // 3. Lock Station 19
    const timer3 = setTimeout(() => {
      setStationStates((prev) => prev.map((s) => ({ ...s, isLocked: true })));
      setStep(3);
      sound.playTriangulationStationPing(2);
    }, 3600);

    // 4. Vector Intersection Calculating
    const timer4 = setTimeout(() => {
      setStep(4);
      sound.playVectorIntersection();
    }, 5000);

    // 5. Source Coordinates Acquired
    const timer5 = setTimeout(() => {
      setShowCoordinates(true);
      setStep(5);
      sound.playClick(1400);
    }, 6800);

    // 6. THE TWIST REVEAL: "SIGNAL ORIGIN: EARTH"
    const timer6 = setTimeout(() => {
      setRevealedTwist(true);
      sound.playEarthTwistReveal();
    }, 9400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
      clearTimeout(timer6);
    };
  }, []);

  // Astronomical coordinate plane canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const render = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.fillStyle = '#050607';
      ctx.fillRect(0, 0, width, height);

      const midX = width / 2;
      const midY = height / 2;

      // Coordinate rings (celestial sphere projection)
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#151B1C';
      [40, 90, 140, 190, 240].forEach((r) => {
        ctx.beginPath();
        ctx.arc(midX, midY, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Axis crosshairs
      ctx.beginPath();
      ctx.moveTo(midX, 0);
      ctx.lineTo(midX, height);
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();

      // Station positions on celestial map
      const s07 = { x: midX - 110, y: midY + 70 };
      const s12 = { x: midX + 130, y: midY + 80 };
      const s19 = { x: midX - 10, y: midY - 140 };
      const focalPoint = { x: midX + 25, y: midY - 35 };

      const stationCoords = [s07, s12, s19];

      // Draw Stations
      stationCoords.forEach((st, i) => {
        const isLocked = stationStates[i].isLocked;
        ctx.fillStyle = isLocked ? '#D7FF63' : '#3B4441';
        ctx.beginPath();
        ctx.arc(st.x, st.y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '9px "IBM Plex Mono", monospace';
        ctx.fillStyle = isLocked ? '#D8DEDA' : '#66706B';
        ctx.fillText(STATIONS[i].name, st.x + 8, st.y + 3);

        // Vector line to focal point if locked
        if (isLocked) {
          ctx.strokeStyle = step >= 4 ? 'rgba(215, 255, 99, 0.7)' : 'rgba(143, 175, 143, 0.4)';
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(st.x, st.y);
          ctx.lineTo(focalPoint.x, focalPoint.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      // Luminous source marker in deep space
      if (step >= 4) {
        const pulse = Math.sin(t * 4) * 4;
        ctx.strokeStyle = '#D7FF63';
        ctx.lineWidth = 1.5;

        // Rotating target reticle
        ctx.save();
        ctx.translate(focalPoint.x, focalPoint.y);
        ctx.rotate(t * 0.8);
        ctx.strokeRect(-12 - pulse, -12 - pulse, 24 + pulse * 2, 24 + pulse * 2);
        ctx.restore();

        // Glowing center node
        ctx.fillStyle = '#D7FF63';
        ctx.beginPath();
        ctx.arc(focalPoint.x, focalPoint.y, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '10px "IBM Plex Mono", monospace';
        ctx.fillStyle = revealedTwist ? '#E5A84B' : '#D7FF63';
        ctx.fillText(
          revealedTwist ? 'SOURCE: EARTH [CONFIRMED]' : 'VECTOR INTERSECTION',
          focalPoint.x + 18,
          focalPoint.y - 8
        );
      }

      t += 0.03;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [stationStates, step, revealedTwist]);

  return (
    <div className="absolute inset-0 z-30 bg-[#050607]/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-8 overflow-y-auto">
      {/* Top Banner */}
      <div className="flex justify-between items-center border-b border-[#151B1C] pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D7FF63] animate-pulse"></span>
          <span className="text-xs sm:text-sm font-mono tracking-[0.25em] text-[#D8DEDA] uppercase font-bold">
            DEEP-SPACE SOURCE TRIANGULATION // CELESTIAL SOLVER
          </span>
        </div>
        <div className="text-[10px] text-[#8FAF8F] font-mono tracking-wider">
          NETWORK STATUS: {step >= 3 ? 'ARRAY COHERENT' : 'SOLVING BASELINE'}
        </div>
      </div>

      {/* Main Grid: Celestial Projection + Station Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 my-4 flex-1 min-h-[360px]">
        {/* Celestial Vector Map */}
        <div className="lg:col-span-7 border border-[#151B1C] bg-[#090C0D] p-3 tech-border relative flex flex-col min-h-[280px]">
          <div className="absolute top-3 left-3 text-[9px] text-[#8FAF8F] font-mono tracking-widest uppercase z-10 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#D7FF63] rounded-full inline-block"></span>
            CELESTIAL BEARING PROJECTION // 3-NODE ARRAY
          </div>
          <canvas ref={canvasRef} className="w-full h-full block flex-1" />
        </div>

        {/* Stations List & Telemetry Calculation */}
        <div className="lg:col-span-5 flex flex-col gap-3 justify-between">
          <div className="border border-[#151B1C] bg-[#050607] p-2.5 font-mono">
            <div className="flex items-center justify-between gap-2 text-[8px] uppercase tracking-[0.2em] text-[#8FAF8F]">
              <span>TRIANGULATION PHASE</span>
              <span className="text-[#D7FF63]">{Math.min(step, TRIANGULATION_PHASES.length - 1)}/{TRIANGULATION_PHASES.length - 1}</span>
            </div>
            <div className="mt-2 h-1.5 w-full bg-[#0B0F10] border border-[#151B1C] overflow-hidden">
              <div
                className="h-full bg-[#D7FF63] transition-all duration-500 ease-out shadow-[0_0_10px_rgba(215,255,99,0.45)]"
                style={{
                  width: `${(Math.min(step, TRIANGULATION_PHASES.length - 1) / (TRIANGULATION_PHASES.length - 1)) * 100}%`,
                }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 text-[8px] uppercase tracking-[0.18em] text-[#D8DEDA]">
              <span className="text-[#D7FF63]">{TRIANGULATION_PHASES[Math.min(step, TRIANGULATION_PHASES.length - 1)]}</span>
              <span className="text-[#66706B]">{step >= 5 ? 'SOURCE LOCKED' : 'SOLVING'}</span>
            </div>
            <div className="mt-2 grid grid-cols-6 gap-1 text-[7px] uppercase tracking-[0.12em] text-[#66706B]">
              {TRIANGULATION_PHASES.map((phase, idx) => {
                const isActive = step === idx;
                const isComplete = step > idx;

                return (
                  <div
                    key={phase}
                    className={`flex items-center justify-center border px-1 py-1 transition-colors duration-300 ${
                      isActive
                        ? 'border-[#D7FF63] bg-[#D7FF63]/10 text-[#D7FF63]'
                        : isComplete
                          ? 'border-[#2A332E] bg-[#0D110F] text-[#8FAF8F]'
                          : 'border-[#151B1C] bg-[#050607] text-[#4E5A57]'
                    }`}
                  >
                    {idx + 1}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            {stationStates.map((st) => (
              <div
                key={st.id}
                className={`border p-3 font-mono text-[10px] transition-all duration-300 ${
                  st.isLocked
                    ? 'border-[#D7FF63]/60 bg-[#090C0D] text-[#D8DEDA] shadow-[0_0_12px_rgba(215,255,99,0.08)]'
                    : 'border-[#151B1C] bg-[#050607] text-[#3B4441]'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-[#D7FF63] tracking-wider">{st.name}</span>
                  <span
                    className={`text-[8px] px-1.5 py-0.5 border ${
                      st.isLocked
                        ? 'border-[#D7FF63] text-[#D7FF63] bg-[#D7FF63]/10'
                        : 'border-[#151B1C] text-[#3B4441]'
                    }`}
                  >
                    {st.isLocked ? 'LOCKED' : 'CALIBRATING'}
                  </span>
                </div>
                <div className="text-[8px] text-[#66706B] truncate">{st.location}</div>
                <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-[#151B1C] text-[8px] text-[#8FAF8F]">
                  <div>AZ: {st.azimuth}°</div>
                  <div>EL: {st.elevation}°</div>
                  <div>DELAY: {st.delayMs} ms</div>
                </div>
              </div>
            ))}
          </div>

          {/* Astronomical Coordinates Card */}
          {showCoordinates && (
            <div className="border border-[#D7FF63] bg-[#090C0D] p-4 tech-border shadow-xl animate-fadeIn">
              <div className="text-[9px] text-[#8FAF8F] uppercase tracking-[0.2em] mb-2 font-mono flex justify-between">
                <span>SOURCE COORDINATES ACQUIRED</span>
                <span className="text-[#D7FF63]">CONFIDENCE: 99.97%</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <div className="text-[8px] text-[#66706B] uppercase">Right Ascension</div>
                  <div className="text-[#D8DEDA] font-bold">{CELESTIAL_DATA.rightAscension}</div>
                </div>
                <div>
                  <div className="text-[8px] text-[#66706B] uppercase">Declination</div>
                  <div className="text-[#D8DEDA] font-bold">{CELESTIAL_DATA.declination}</div>
                </div>
                <div>
                  <div className="text-[8px] text-[#66706B] uppercase">Propagation Distance</div>
                  <div className="text-[#D8DEDA] font-bold">{CELESTIAL_DATA.distanceLightYears} LIGHT YEARS</div>
                </div>
                <div>
                  <div className="text-[8px] text-[#66706B] uppercase">Signal Age</div>
                  <div className="text-[#D8DEDA] font-bold">{CELESTIAL_DATA.estimatedAgeYears} YEARS</div>
                </div>
              </div>

              {/* The Dramatic Earth Twist */}
              {revealedTwist && (
                <div className="mt-4 pt-3 border-t border-[#1E2729] animate-fadeIn">
                  <div className="text-[9px] text-[#E5A84B] font-mono tracking-widest uppercase mb-1">
                    ORIGIN CLASSIFICATION ANALYSIS
                  </div>
                  <div className="text-base sm:text-lg font-mono font-bold tracking-[0.2em] text-[#E5A84B] bg-[#E5A84B]/10 p-2.5 border border-[#E5A84B] flex items-center justify-between">
                    <span>SIGNAL ORIGIN: EARTH</span>
                    <span className="text-xs text-[#D8DEDA] font-normal tracking-normal">PROPAGATION: CONFIRMED</span>
                  </div>
                  <p className="text-[9px] text-[#8FAF8F] font-mono mt-2 leading-relaxed">
                    Vector trajectory curves back through orbital gravitational lensing. The transmission is returning home.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Proceed Action Button */}
      <div className="flex flex-col sm:flex-row justify-between items-center border-t border-[#151B1C] pt-3 gap-3">
        <div className="text-[9px] text-[#66706B] font-mono tracking-wider">
          {revealedTwist ? 'CONNECTION STATUS: ACTIVE // TRANSMISSION COMPLETE' : 'AWAITING VECTOR TRIANGULATION STABILITY...'}
        </div>

        {revealedTwist && (
          <button
            onClick={() => {
              sound.playClick(1200);
              onTriangulationComplete();
            }}
            className="w-full sm:w-auto px-8 py-3 bg-[#D7FF63] hover:bg-[#E8FFA6] text-[#050607] font-bold text-xs tracking-[0.25em] uppercase transition-all shadow-[0_0_20px_rgba(215,255,99,0.4)] cursor-pointer flex items-center justify-center gap-2"
          >
            <span>[ CONCLUDE TRANSMISSION ]</span>
            <span className="text-base leading-none">›</span>
          </button>
        )}
      </div>
    </div>
  );
};
