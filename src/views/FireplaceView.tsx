import React, { useState } from 'react';
import { ArrowLeft, Power, Wind, Clock, Sparkles, Zap } from 'lucide-react';
import { FireplaceFlameVisual } from '../components/FireplaceFlameVisual';
import { IrKeyFinderModal } from '../components/IrKeyFinderModal';
import { FIREPLACE_CODES, getSavedFireplacePowerCode } from '../data/fireplaceCodes';
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
  const [showKeyHunter, setShowKeyHunter] = useState(false);
  const [confirmedPowerCode, setConfirmedPowerCode] = useState(getSavedFireplacePowerCode());

  // Button 1: ON / OFF (Top-Left)
  const handleTogglePower = () => {
    hapticFeedback.click();
    const next = !state.isOn;
    onUpdateState({ isOn: next });
    irBlaster.sendNec(confirmedPowerCode, next ? 'Power ON' : 'Power OFF', 'Fireplace');
  };

  // Button 2: Switch fog light effect (Top-Right) -> 0xC2E29867 (Confirmed working!)
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
    irBlaster.sendNec(FIREPLACE_CODES.candidates[3].hex, `Timer: ${nextTimer}`, 'Fireplace');
  };

  // Button 4: Toggle fireplace light effect (Bottom-Right) -> 0xC2E238C7 (Confirmed working!)
  const handleCycleFlameEffect = (targetColor?: typeof FIREPLACE_FLAME_COLORS[0]) => {
    hapticFeedback.click();
    if (targetColor) {
      onUpdateState({ flameColorName: targetColor.name, flameColor: targetColor.color, isOn: true });
    } else {
      const curIdx = FIREPLACE_FLAME_COLORS.findIndex((c) => c.name === state.flameColorName);
      const next = FIREPLACE_FLAME_COLORS[(curIdx + 1) % FIREPLACE_FLAME_COLORS.length];
      onUpdateState({ flameColorName: next.name, flameColor: next.color, isOn: true });
    }
    // Verified 0xC2E238C7 wakes the lamp from an off state and changes colors
    irBlaster.sendNec(FIREPLACE_CODES.changeColor.hex, 'Toggle Light Effect', 'Fireplace');
  };

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden select-none max-w-md mx-auto relative">
      {/* 1. Persistent Top Navigation Bar (Stays completely frozen in place) */}
      <header
        className={`shrink-0 z-30 pt-12 pb-3 px-5 backdrop-blur-xl border-b transition-colors flex items-center justify-between ${
          isDarkMode ? 'bg-[#121214]/85 border-white/5 text-white' : 'bg-white/85 border-slate-200 text-slate-900'
        }`}
      >
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
          aria-label="Back to Dashboard"
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
          <h2 className="text-base font-extrabold tracking-tight">Flame Humidifier</h2>
        </div>

        {/* Key Hunter Button for 0xC2E2 */}
        <button
          onClick={() => {
            hapticFeedback.tick();
            setShowKeyHunter(true);
          }}
          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all active:scale-90 ${
            isDarkMode
              ? 'bg-amber-400/10 border-amber-400/30 text-amber-400 hover:bg-amber-400/20'
              : 'bg-amber-50 border-amber-300 text-amber-600 shadow-sm'
          }`}
          title="Key Hunter (Test Power Candidates)"
        >
          <Zap size={18} />
        </button>
      </header>

      {/* 2. Scrollable Body Content (Scrolls smoothly underneath the persistent nav bar) */}
      <main className="flex-1 overflow-y-auto px-5 pt-3 pb-36 space-y-4 overscroll-contain">
        {/* Realistic Fireplace Visual Box */}
        <FireplaceFlameVisual
          isOn={state.isOn}
          isSmokeOn={state.isSmokeOn}
          flameColor={state.flameColor}
          flameColorName={state.flameColorName}
          onTogglePower={handleTogglePower}
          isDarkMode={isDarkMode}
        />

        {/* Physical Matte Black Pebble Remote */}
        <div className="flex flex-col items-center py-2">
          <div
            className="w-56 h-[300px] rounded-[44px] p-5 shadow-2xl flex flex-col justify-between items-center border border-white/10 select-none relative"
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
                title={`ON / OFF (0x${confirmedPowerCode})`}
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
                title="Toggle fireplace light effect (0xC2E238C7 - Wakes from off)"
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

        {/* 6 Authentic Flame Color Presets */}
        <div className="flex flex-col items-center gap-2 pt-1">
          <span
            className={`text-[10px] font-semibold tracking-wider uppercase ${
              isDarkMode ? 'text-accent-muted' : 'text-slate-500'
            }`}
          >
            Flame Color Modes (0xC2E238C7 • Wakes from off)
          </span>

          <div className="grid grid-cols-6 gap-2 w-full">
            {FIREPLACE_FLAME_COLORS.map((item) => {
              const isSelected = state.flameColorName === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => handleCycleFlameEffect(item)}
                  className={`h-11 rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-md border ${
                    isSelected ? 'ring-2 ring-white scale-105' : 'border-white/10'
                  }`}
                  style={{
                    backgroundColor: item.color,
                    boxShadow: `0 4px 12px ${item.color}40`,
                  }}
                  title={item.name}
                >
                  {isSelected && <span className="w-2 h-2 rounded-full bg-white drop-shadow-md" />}
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Interactive Key Hunter Modal for Address 0xC2E2 */}
      <IrKeyFinderModal
        isOpen={showKeyHunter}
        onClose={() => setShowKeyHunter(false)}
        targetDevice="fireplace"
        isDarkMode={isDarkMode}
        onCodeSaved={(newPowerCode) => setConfirmedPowerCode(newPowerCode)}
      />
    </div>
  );
};
