import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, CheckCircle2, RotateCcw, Zap, HelpCircle } from 'lucide-react';
import { irBlaster } from '../services/irBlaster';
import { hapticFeedback } from '../services/haptics';
import { FIREPLACE_CANDIDATES, saveFireplacePowerCode, getSavedFireplacePowerCode } from '../data/fireplaceCodes';
import { SUNSET_POWER_CANDIDATES, saveSunsetOffCode, getSavedSunsetOffCode } from '../data/rgbLedCodes';

interface IrKeyFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDevice: 'sunset' | 'fireplace';
  isDarkMode?: boolean;
  onCodeSaved?: (hex: string) => void;
}

export const IrKeyFinderModal: React.FC<IrKeyFinderModalProps> = ({
  isOpen,
  onClose,
  targetDevice,
  isDarkMode = true,
  onCodeSaved,
}) => {
  const candidates = targetDevice === 'fireplace' ? FIREPLACE_CANDIDATES : SUNSET_POWER_CANDIDATES;
  const initialSavedCode = targetDevice === 'fireplace' ? getSavedFireplacePowerCode() : getSavedSunsetOffCode();

  const [activeCode, setActiveCode] = useState<string>(initialSavedCode);
  const [testedCodes, setTestedCodes] = useState<Set<string>>(new Set([initialSavedCode]));
  const [isScanning, setIsScanning] = useState(false);
  const [scanIndex, setScanIndex] = useState(0);
  const scanTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const deviceTitle = targetDevice === 'fireplace' ? 'Fireplace Humidifier' : 'Sunset Lamp';
  const targetAction = targetDevice === 'fireplace' ? 'Power ON / OFF' : 'Power OFF / Toggle';

  const handleTestCode = (hex: string) => {
    hapticFeedback.click();
    setActiveCode(hex);
    setTestedCodes((prev) => new Set(prev).add(hex));
    irBlaster.sendNec(hex, `Test ${targetAction}`, deviceTitle);
  };

  const handleSaveCode = (hex: string) => {
    hapticFeedback.heavy();
    if (targetDevice === 'fireplace') {
      saveFireplacePowerCode(hex);
    } else {
      saveSunsetOffCode(hex);
    }
    if (onCodeSaved) onCodeSaved(hex);
    onClose();
  };

  const handleToggleAutoScan = () => {
    if (isScanning) {
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
      setIsScanning(false);
    } else {
      setIsScanning(true);
      let idx = 0;
      handleTestCode(candidates[0].hex);
      setScanIndex(0);

      scanTimerRef.current = setInterval(() => {
        idx = (idx + 1) % candidates.length;
        setScanIndex(idx);
        handleTestCode(candidates[idx].hex);
      }, 1600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div
        className={`relative w-full max-w-md rounded-3xl p-6 border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
          isDarkMode ? 'bg-[#18181B] border-surface-border text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center">
              <Zap size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Key Hunter</h3>
              <p className={`text-xs ${isDarkMode ? 'text-accent-muted' : 'text-slate-500'}`}>
                Find exact {targetAction} for {deviceTitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isDarkMode ? 'hover:bg-white/10 text-white/70' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Instructions */}
        <div className="py-3 text-xs leading-relaxed text-accent-muted flex items-start gap-2">
          <HelpCircle size={15} className="shrink-0 mt-0.5 text-sky-400" />
          <span>
            Point your phone directly at the {deviceTitle}. Tap any code below. When your device responds, tap{' '}
            <strong className="text-amber-400">"Save as Power Key"</strong>!
          </span>
        </div>

        {/* Auto Scanner Bar */}
        <div
          className={`p-3 rounded-2xl border flex items-center justify-between mb-4 ${
            isDarkMode ? 'bg-[#121214] border-surface-border' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">Auto-Scan All Keys</span>
            {isScanning && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
          </div>

          <button
            onClick={handleToggleAutoScan}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              isScanning
                ? 'bg-rose-500 text-white shadow-md'
                : 'bg-amber-400 text-black hover:bg-amber-300 shadow-sm'
            }`}
          >
            {isScanning ? (
              <>
                <Pause size={14} /> Pause ({scanIndex + 1}/{candidates.length})
              </>
            ) : (
              <>
                <Play size={14} /> Start Auto-Scan
              </>
            )}
          </button>
        </div>

        {/* Candidates Grid */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 max-h-[320px] scrollbar-thin">
          {candidates.map((cand) => {
            const isSelected = activeCode === cand.hex;
            const isTested = testedCodes.has(cand.hex);
            return (
              <div
                key={cand.hex}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                  isSelected
                    ? 'border-amber-400 bg-amber-400/10 shadow-glow-amber'
                    : isDarkMode
                    ? 'border-surface-border bg-[#141416] hover:border-white/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400">0x{cand.hex}</span>
                    {isTested && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/70">
                        Tested
                      </span>
                    )}
                  </div>
                  <span className={`text-[11px] mt-0.5 ${isDarkMode ? 'text-accent-muted' : 'text-slate-500'}`}>
                    {cand.label} • {cand.description}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleTestCode(cand.hex)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-500 text-black active:scale-95 transition-all hover:bg-sky-400"
                  >
                    Test
                  </button>

                  {isSelected && (
                    <button
                      onClick={() => handleSaveCode(cand.hex)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-400 text-black active:scale-95 transition-all shadow-md flex items-center gap-1 hover:bg-amber-300"
                    >
                      <CheckCircle2 size={13} /> Save
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-accent-muted font-mono">Active: 0x{activeCode}</span>
          <button
            onClick={() => handleSaveCode(activeCode)}
            className="px-4 py-2 rounded-xl font-bold bg-amber-400 text-black hover:bg-amber-300 shadow-md transition-all active:scale-95"
          >
            Confirm & Use This Code
          </button>
        </div>
      </div>
    </div>
  );
};
