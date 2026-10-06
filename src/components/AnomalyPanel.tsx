import { useEffect, useState } from 'react';
import type { SignalTelemetry } from '../types/signal';
import { sound } from '../lib/soundEngine';

interface AnomalyPanelProps {
  telemetry: SignalTelemetry;
  onIsolateSignal: () => void;
}

const HYPOTHESES = [
  { name: 'COSMIC NOISE', status: 'REJECTED', reason: 'COHERENCE > 94%' },
  { name: 'PULSAR FLUX', status: 'REJECTED', reason: 'DISPERSION NULL' },
  { name: 'ORBITAL SATELLITE', status: 'REJECTED', reason: 'DOPPLER VELOCITY STATIC' },
  { name: 'TERRESTRIAL REFLECTION', status: 'REJECTED', reason: 'POLARIZATION ASYMMETRIC' },
  { name: 'ARTIFICIAL EMISSION', status: 'CONFIRMED', reason: 'STRUCTURED HARMONICS DETECTED', active: true },
];

export const AnomalyPanel: React.FC<AnomalyPanelProps> = ({
  telemetry,
  onIsolateSignal,
}) => {
  const [analyzedIndex, setAnalyzedIndex] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  useEffect(() => {
    sound.playAnomalyAlert();

    // Step through competing hypotheses
    HYPOTHESES.forEach((_, idx) => {
      setTimeout(() => {
        setAnalyzedIndex(idx + 1);
        sound.playClick(720 + idx * 60);
        if (idx === HYPOTHESES.length - 1) {
          setAnalysisComplete(true);
        }
      }, (idx + 1) * 450);
    });
  }, []);

  return (
    <div className="absolute inset-0 z-40 bg-[#050607]/85 backdrop-blur-md flex items-center justify-center p-4 screen-glitch">
      <div className="max-w-2xl w-full border border-[#E5A84B] bg-[#090C0D] p-6 sm:p-8 tech-border shadow-[0_0_60px_rgba(229,168,75,0.3)] relative overflow-hidden">
        {/* Warning Hazard Stripe Header */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#E5A84B] via-[#090C0D] to-[#E5A84B] mb-6"></div>

        {/* Header alert */}
        <div className="flex items-center justify-between border-b border-[#151B1C] pb-4 mb-4">
          <div className="flex items-center gap-3 text-[#E5A84B]">
            <span className="text-2xl animate-bounce">⚠</span>
            <div>
              <div className="text-base sm:text-lg font-bold tracking-[0.25em] uppercase font-mono">
                ANOMALY CLASSIFICATION
              </div>
              <div className="text-[10px] text-[#8FAF8F] tracking-[0.18em]">
                DEEP-SPACE SPECTRAL ARTIFACT // AUTOMATED ANALYSIS
              </div>
            </div>
          </div>
          <div className="text-right font-mono text-[9px] text-[#66706B]">
            <div>UTC: 04:17:38</div>
            <div className="text-[#E5A84B] font-bold">CONFIDENCE: 96.2%</div>
          </div>
        </div>

        {/* Classification Summary Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border border-[#151B1C] bg-[#050607] p-3 text-[10px] font-mono mb-4">
          <div>
            <span className="text-[#66706B] block text-[8px] uppercase">Signal Type</span>
            <span className="text-[#D7FF63] font-bold">UNKNOWN</span>
          </div>
          <div>
            <span className="text-[#66706B] block text-[8px] uppercase">Carrier</span>
            <span className="text-[#D8DEDA]">{telemetry.targetFreq.toFixed(3)} MHz</span>
          </div>
          <div>
            <span className="text-[#66706B] block text-[8px] uppercase">Modulation</span>
            <span className="text-[#8FAF8F]">NONSTANDARD</span>
          </div>
          <div>
            <span className="text-[#66706B] block text-[8px] uppercase">Harmonics</span>
            <span className="text-[#D8DEDA]">7 ORDERS</span>
          </div>
        </div>

        {/* Competing Scientific Hypotheses Elimination */}
        <div className="mb-5 bg-[#050607] border border-[#151B1C] p-3 font-mono text-[10px]">
          <div className="text-[9px] text-[#66706B] uppercase tracking-wider mb-2 pb-1 border-b border-[#151B1C] flex justify-between">
            <span>HYPOTHESIS ELIMINATION ANALYSIS</span>
            <span>STATUS</span>
          </div>
          <div className="space-y-1.5">
            {HYPOTHESES.slice(0, analyzedIndex).map((h, i) => (
              <div key={i} className="flex justify-between items-center text-[10px]">
                <span className={h.active ? 'text-[#D7FF63] font-bold' : 'text-[#D8DEDA]'}>
                  {h.name} <span className="text-[8px] text-[#66706B]">({h.reason})</span>
                </span>
                <span
                  className={`px-1.5 py-0.5 text-[8px] font-bold tracking-wider ${
                    h.status === 'CONFIRMED'
                      ? 'bg-[#D7FF63]/20 text-[#D7FF63] border border-[#D7FF63]'
                      : 'text-[#D96B6B]'
                  }`}
                >
                  {h.status}
                </span>
              </div>
            ))}
            {!analysisComplete && (
              <div className="text-[#8FAF8F] text-[9px] pt-1">
                COMPUTING BAYESIAN PROBABILITY... <span className="inline-block w-2 h-3 bg-[#E5A84B] blink-cursor"></span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-[#151B1C]">
          <span className="text-[10px] text-[#66706B] tracking-[0.15em] font-mono">
            {analysisComplete ? 'ANOMALY CONFIRMED: READY TO ISOLATE' : 'ANALYZING SUB-BAND RESIDUALS...'}
          </span>

          <button
            onClick={() => {
              sound.playIsolationEngaged();
              onIsolateSignal();
            }}
            disabled={!analysisComplete}
            className={`w-full sm:w-auto px-6 py-3 font-bold text-xs tracking-[0.25em] uppercase transition-all shadow-[0_0_20px_rgba(229,168,75,0.4)] cursor-pointer flex items-center justify-center gap-2 ${
              analysisComplete
                ? 'bg-[#E5A84B] hover:bg-[#F2B961] text-[#050607]'
                : 'bg-[#151B1C] text-[#66706B] cursor-not-allowed opacity-50'
            }`}
          >
            <span>[ ISOLATE SIGNAL ]</span>
            <span>›</span>
          </button>
        </div>
      </div>
    </div>
  );
};
