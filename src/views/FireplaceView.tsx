import React, { useState } from 'react';
import { ArrowLeft, Power, Wind, Clock, Sparkles, HelpCircle, Check } from 'lucide-react';
import { FireplaceFlameVisual } from '../components/FireplaceFlameVisual';
import { FIREPLACE_CODES } from '../data/fireplaceCodes';
import { irBlaster } from '../services/irBlaster';
import { hapticFeedback } from '../services/haptics';

export interface FireplaceState {
  isOn: boolean;
  isSmokeOn: boolean;
  flameColor: string;
  flameColorName: string;
  timer: string;
}

interface FireplaceViewProps {
  onBack: () => void;
  state: FireplaceState;
  onUpdateState: (newState: Partial<FireplaceState>) => void;
  isDarkMode?: boolean;
}

// 6 authentic flame colors from product photo
export const FIREPLACE_FLAME_COLORS = [
  { name: 'Crimson Flame', color: '#EF4444', label: 'Red' },
  { name: 'Golden Amber', color: '#F59E0B', label: 'Gold' },
  { name: 'Emerald Fire', color: '#10B981', label: 'Green' },
  { name: 'Glacier Aqua', color: '#06B6D4', label: 'Cyan' },
  { name: 'Cobalt Blue', color: '#2563EB', label: 'Blue' },
  { name: 'Amethyst Violet', color: '#9333EA', label: 'Purple' },
];

const TIMER_STEPS = ['Off', '1h', '3h', '5h', 'ON'];

export const FireplaceView: React.FC<FireplaceViewProps> = ({
  onBack,
  state,
  onUpdateState,
  isDarkMode = true,
}) => {
  const [selectedPowerCandidate, setSelectedPowerCandidate] = useState(
    FIREPLACE_CODES.powerCandidates[0].hex
  );
  const [showTester, setShowTester] = useState(false);

  // Button 1: ON / OFF (Top-Left)
  const handleTogglePower = () => {
    hapticFeedback.click();
    const next = !state.isOn;
    onUpdateState({ isOn: next });
    irBlaster.sendNec(selectedPowerCandidate, next ? 'Power ON' : 'Power OFF', 'Fireplace');
  };

  // Button 2: Switch fog light effect (Top-Right) -> 0xC2E29867
  const handleToggleFog = () => {
    hapticFeedback.click();
    const nextSmoke = !state.isSmokeOn;
    onUpdateState({ isSmokeOn: nextSmoke });
    irBlaster.sendNec(FIREPLACE_CODES.addSmoke.hex, 'Switch Fog Effect', 'Fireplace');
  };

  // Button 3: Timing 4 Timer (Bottom-Left)
  const handleCycleTimer = () => {
    hapticFeedback.click();
    const curIdx = TIMER_STEPS.indexOf(state.timer);
    const nextTimer = TIMER_STEPS[(curIdx + 1) % TIMER_STEPS.length];
    onUpdateState({ timer: nextTimer });
    irBlaster.sendNec(FIREPLACE_CODES.timerCandidates[0].hex, `Timer: ${nextTimer}`, 'Fireplace');
  };

  // Button 4: Toggle fireplace light effect (Bottom-Right) -> 0xC2E238C7
  const handleCycleFlameEffect = (targetColor?: typeof FIREPLACE_FLAME_COLORS[0]) => {
    hapticFeedback.click();
    if (targetColor) {
      onUpdateState({ flameColorName: targetColor.name, flameColor: targetColor.color });
    } else {
      const curIdx = FIREPLACE_FLAME_COLORS.findIndex((c) => c.name === state.flameColorName);
      const next = FIREPLACE_FLAME_COLORS[(curIdx + 1) % FIREPLACE_FLAME_COLORS.length];
      onUpdateState({ flameColorName: next.name, flameColor: next.color });
    }
    irBlaster.sendNec(FIREPLACE_CODES.changeColor.hex, 'Toggle Light Effect', 'Fireplace');
  };

  return (
    <div className="flex flex-col w-full min-h-screen pb-24 px-5 pt-14 sm:pt-16 select-none max-w-md mx-auto justify-between">
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              hapticFeedback.click();
              onBack();
            }}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all active:scale-90 ${
              isDarkMode
                ? 'bg-surface border-surface-border text-white/80 hover:text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm'
            }`}
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="text-center">
            <span
              className={`text-[10px] font-semibold tracking-widest uppercase block ${
                isDarkMode ? 'text-accent-muted' : 'text-slate-500'
              }`}
            >
              Dorm Room
            </span>
            <h2
              className={`text-base font-extrabold tracking-tight ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Flame Humidifier
            </h2>
          </div>

          <button
            onClick={() => {
              hapticFeedback.tick();
              setShowTester(!showTester);
            }}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
              showTester
                ? 'bg-amber-400 text-black border-amber-400 shadow-sm'
                : isDarkMode
                ? 'bg-surface border-surface-border text-accent-muted hover:text-white'
                : 'bg-white border-slate-200 text-slate-600 shadow-sm'
            }`}
            title="Fireplace Code Tester"
          >
            <HelpCircle size={18} />
          </button>
        </div>

        {/* Realistic Fireplace Visual Box */}
        <FireplaceFlameVisual
          isOn={state.isOn}
          isSmokeOn={state.isSmokeOn}
          flameColor={state.flameColor}
          flameColorName={state.flameColorName}
          onTogglePower={handleTogglePower}
          isDarkMode={isDarkMode}
        />

        {/* Physical Matte Black Pebble Remote (Exact layout from user's photo) */}
        <div className="flex flex-col items-center my-4">
          <div
            className="w-56 h-[310px] rounded-[44px] p-5 shadow-2xl flex flex-col justify-between items-center border border-white/10 select-none relative"
            style={{
              background: 'linear-gradient(155deg, #32373E 0%, #1A1C20 100%)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 2px 3px rgba(255, 255, 255, 0.12)',
            }}
          >
            {/* Top IR Emitter / Recessed Notch */}
            <div className="w-10 h-1.5 bg-zinc-700 rounded-full" />

            {/* 4 Round Rubberized Buttons Grid */}
            <div className="grid grid-cols-2 gap-5 w-full max-w-[184px] my-auto">
              {/* Button 1: ON / OFF (Top-Left) */}
              <button
                onClick={handleTogglePower}
                className={`w-16 h-16 rounded-full flex flex-col items-center justify-center active:scale-90 transition-all shadow-xl border ${
                  state.isOn
                    ? 'bg-white text-black border-white shadow-glow-amber'
                    : 'bg-[#22252A] text-zinc-300 border-zinc-700/80 hover:text-white'
                }`}
                title="ON / OFF"
              >
                <Power size={22} strokeWidth={2.5} />
              </button>

              {/* Button 2: Switch fog light effect (Top-Right) -> 0xC2E29867 */}
              <button
                onClick={handleToggleFog}
                className={`w-16 h-16 rounded-full flex flex-col items-center justify-center active:scale-90 transition-all shadow-xl border ${
                  state.isSmokeOn
                    ? 'bg-sky-400 text-black border-sky-300 shadow-glow-cyan'
                    : 'bg-[#22252A] text-zinc-300 border-zinc-700/80 hover:text-white'
                }`}
                title="Switch fog light effect (0xC2E29867)"
              >
                <Wind size={22} strokeWidth={2.5} />
              </button>

              {/* Button 3: Timing 4 Timer (Bottom-Left) */}
              <button
                onClick={handleCycleTimer}
                className="w-16 h-16 rounded-full flex flex-col items-center justify-center active:scale-90 transition-all shadow-xl border bg-[#22252A] text-zinc-300 border-zinc-700/80 hover:text-white"
                title="Timing 4 Timer (1h / 3h / 5h / ON)"
              >
                <Clock size={20} strokeWidth={2.5} />
                <span className="text-[9px] font-bold mt-0.5">{state.timer}</span>
              </button>

              {/* Button 4: Toggle fireplace light effect (Bottom-Right) -> 0xC2E238C7 */}
              <button
                onClick={() => handleCycleFlameEffect()}
                className="w-16 h-16 rounded-full flex flex-col items-center justify-center active:scale-90 transition-all shadow-xl border bg-[#22252A] text-amber-400 border-zinc-700/80 hover:border-amber-400"
                title="Toggle fireplace light effect (0xC2E238C7)"
              >
                <Sparkles size={22} strokeWidth={2.5} />
              </button>
            </div>

            {/* Bottom Grip Branding */}
            <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono font-semibold">
              Flame Remote
            </span>
          </div>
        </div>

        {/* 6 Authentic Flame Color Presets (from product image) */}
        <div className="flex flex-col items-center gap-2 mt-2">
          <span
            className={`text-[10px] font-semibold tracking-wider uppercase ${
              isDarkMode ? 'text-accent-muted' : 'text-slate-500'
            }`}
          >
            Flame Color Palette (0xC2E238C7)
          </span>

          <div className="grid grid-cols-6 gap-2 w-full">
            {FIREPLACE_FLAME_COLORS.map((item) => {
              const isSelected = state.flameColorName === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => handleCycleFlameEffect(item)}
                  className={`h-11 rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-md border ${
                    isSelected ? 'ring-2 ring-white scale-105' : 'border-white/10'
                  }`}
                  style={{
                    backgroundColor: item.color,
                    boxShadow: `0 4px 12px ${item.color}40`,
                  }}
                  title={item.name}
                >
                  {isSelected && <Check size={14} className="text-white drop-shadow-md" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Candidate Code Tester Drawer for Power */}
        {showTester && (
          <div
            className={`mt-4 p-4 rounded-3xl border text-xs shadow-xl ${
              isDarkMode ? 'bg-surface border-surface-border text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="font-bold mb-1.5 flex items-center justify-between">
              <span>Test Power Candidates (0xC2E2 Address)</span>
              <span className="text-[10px] text-sky-400">Tap to test</span>
            </div>
            <p className={`text-[11px] mb-3 ${isDarkMode ? 'text-accent-muted' : 'text-slate-500'}`}>
              Both Fog (0xC2E29867) and Light (0xC2E238C7) are verified. Tap any button below to test which code turns your fireplace ON/OFF:
            </p>

            <div className="grid grid-cols-2 gap-2">
              {FIREPLACE_CODES.powerCandidates.map((cand) => (
                <button
                  key={cand.hex}
                  onClick={() => {
                    hapticFeedback.tick();
                    setSelectedPowerCandidate(cand.hex);
                    irBlaster.sendNec(cand.hex, `Test Power ${cand.label}`, 'Fireplace');
                  }}
                  className={`p-2.5 rounded-xl text-left font-mono border transition-all ${
                    selectedPowerCandidate === cand.hex
                      ? 'border-amber-400 bg-amber-400/15 text-amber-400 font-bold'
                      : isDarkMode
                      ? 'border-surface-border bg-[#141416] text-white/80'
                      : 'border-slate-200 bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="text-[10px] text-accent-muted">{cand.label}</div>
                  <div className="font-bold">0x{cand.hex}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
