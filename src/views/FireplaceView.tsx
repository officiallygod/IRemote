import React, { useState } from 'react';
import { ArrowLeft, Power, Wind, Clock, Sparkles } from 'lucide-react';
import { FireplaceFlameVisual } from '../components/FireplaceFlameVisual';
import { FIREPLACE_CODES, getSavedFireplacePowerCode, getSavedFireplaceTimerCode } from '../data/fireplaceCodes';
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

const TIMER_STEPS = ['Off', '1h', '3h', '5h', 'ON'];

export const FireplaceView: React.FC<FireplaceViewProps> = ({
  onBack,
  state,
  onUpdateState,
  isDarkMode = true,
}) => {
  const [confirmedPowerCode] = useState(getSavedFireplacePowerCode());
  const [confirmedTimerCode] = useState(getSavedFireplaceTimerCode());

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
    irBlaster.sendNec(confirmedTimerCode, `Timer: ${nextTimer}`, 'Fireplace');
  };

  // Button 4: Toggle fireplace light effect (Bottom-Right) -> 0xC2E238C7 (Confirmed working!)
  const handleToggleFlameEffect = () => {
    hapticFeedback.click();
    onUpdateState({ isOn: true });
    // Verified 0xC2E238C7 wakes the lamp from an off state and toggles light effect
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

        <div className="w-10 h-10" />
      </header>

      {/* 2. Scrollable Body Content (Scrolls smoothly underneath the persistent nav bar) */}
      <main className="flex-1 overflow-y-auto px-5 pt-3 pb-36 space-y-4 overscroll-contain">
        {/* Realistic Fireplace Visual Box */}
        <FireplaceFlameVisual
          isOn={state.isOn}
          isSmokeOn={state.isSmokeOn}
          flameColor={state.flameColor}
          flameColorName={state.flameColorName}
          timer={state.timer}
          onTogglePower={handleTogglePower}
          isDarkMode={isDarkMode}
        />

        {/* Physical Remote Control Container (1:1 with user's hardware remote with Light & Dark Modes) */}
        <div className="flex justify-center w-full py-2">
          <div
            className={`w-[216px] h-[290px] rounded-[44px] py-5 px-5 shadow-2xl flex flex-col justify-between items-center border select-none relative transition-all ${
              isDarkMode
                ? 'border-white/10'
                : 'border-slate-200/90'
            }`}
            style={{
              background: isDarkMode
                ? 'linear-gradient(155deg, #2D3239 0%, #17191D 100%)'
                : 'linear-gradient(155deg, #FFFFFF 0%, #EDF2F7 100%)',
              boxShadow: isDarkMode
                ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 2px 3px rgba(255, 255, 255, 0.12)'
                : '0 25px 50px -12px rgba(0, 0, 0, 0.12), inset 0 2px 3px rgba(255, 255, 255, 0.9)',
            }}
          >
            {/* Top IR Emitter / Recessed Notch */}
            <div
              className={`w-12 h-1.5 rounded-full shrink-0 ${
                isDarkMode ? 'bg-zinc-700/80' : 'bg-slate-300'
              }`}
            />

            {/* 4 Round Rubberized Buttons Grid - Perfectly Symmetrical & Centered */}
            <div className="grid grid-cols-2 gap-4 place-items-center justify-center my-auto">
              {/* Button 1: ON / OFF (Top-Left) */}
              <button
                onClick={handleTogglePower}
                className={`w-[66px] h-[66px] rounded-full flex flex-col items-center justify-center active:scale-90 transition-all shadow-xl border ${
                  state.isOn
                    ? isDarkMode
                      ? 'bg-white text-black border-white shadow-glow-amber'
                      : 'bg-slate-900 text-white border-slate-900 shadow-md'
                    : isDarkMode
                    ? 'bg-[#22252A] text-zinc-300 border-zinc-700/80 hover:text-white'
                    : 'bg-slate-100 text-slate-700 border-slate-200/90 hover:text-slate-900 hover:bg-slate-200 shadow-sm'
                }`}
                title={`ON / OFF (0x${confirmedPowerCode})`}
              >
                <Power size={22} strokeWidth={2.5} />
              </button>

              {/* Button 2: Switch fog light effect (Top-Right) -> 0xC2E29867 */}
              <button
                onClick={handleToggleFog}
                className={`w-[66px] h-[66px] rounded-full flex flex-col items-center justify-center active:scale-90 transition-all shadow-xl border ${
                  state.isSmokeOn
                    ? 'bg-sky-400 text-black border-sky-300 shadow-glow-cyan'
                    : isDarkMode
                    ? 'bg-[#22252A] text-zinc-300 border-zinc-700/80 hover:text-white'
                    : 'bg-slate-100 text-slate-700 border-slate-200/90 hover:text-slate-900 hover:bg-slate-200 shadow-sm'
                }`}
                title="Switch fog light effect (0xC2E29867)"
              >
                <Wind size={22} strokeWidth={2.5} />
              </button>

              {/* Button 3: Timing 4 Timer (Bottom-Left) */}
              <button
                onClick={handleCycleTimer}
                className={`w-[66px] h-[66px] rounded-full flex flex-col items-center justify-center active:scale-90 transition-all shadow-xl border ${
                  isDarkMode
                    ? 'bg-[#22252A] text-zinc-300 border-zinc-700/80 hover:text-white'
                    : 'bg-slate-100 text-slate-700 border-slate-200/90 hover:text-slate-900 hover:bg-slate-200 shadow-sm'
                }`}
                title="Timing 4 Timer (1h / 3h / 5h / ON)"
              >
                <Clock size={20} strokeWidth={2.5} />
                <span className="text-[9px] font-bold mt-0.5">{state.timer}</span>
              </button>

              {/* Button 4: Toggle fireplace light effect (Bottom-Right) -> 0xC2E238C7 */}
              <button
                onClick={handleToggleFlameEffect}
                className={`w-[66px] h-[66px] rounded-full flex flex-col items-center justify-center active:scale-90 transition-all shadow-xl border ${
                  isDarkMode
                    ? 'bg-[#22252A] text-amber-400 border-zinc-700/80 hover:border-amber-400'
                    : 'bg-slate-100 text-amber-500 border-slate-200/90 hover:border-amber-400 shadow-sm'
                }`}
                title="Toggle fireplace light effect (0xC2E238C7 - Wakes from off)"
              >
                <Sparkles size={22} strokeWidth={2.5} />
              </button>
            </div>

            {/* Bottom Grip Branding */}
            <span
              className={`text-[9px] uppercase tracking-widest font-mono font-semibold shrink-0 ${
                isDarkMode ? 'text-zinc-500' : 'text-slate-400'
              }`}
            >
              Flame Remote
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};
