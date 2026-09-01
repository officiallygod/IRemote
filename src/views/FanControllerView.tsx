import React, { useState } from 'react';
import { ArrowLeft, Fan, Power, Wind, Compass, Clock, Code2 } from 'lucide-react';
import { ArcSlider } from '../components/ArcSlider';
import { FAN_CODES } from '../data/fanCodes';
import { irBlaster } from '../services/irBlaster';
import { hapticFeedback } from '../services/haptics';

interface FanControllerViewProps {
  onBack: () => void;
  state: {
    isOn: boolean;
    speed: number;
    isSwinging: boolean;
    timer: string;
    mode: string;
  };
  onUpdateState: (newState: Partial<FanControllerViewProps['state']>) => void;
  isDarkMode?: boolean;
}

const TIMER_STEPS = ['Off', '1h', '2h', '4h', '8h'];
const WIND_MODES = ['Normal', 'Breeze', 'Sleep'];

export const FanControllerView: React.FC<FanControllerViewProps> = ({
  onBack,
  state,
  onUpdateState,
  isDarkMode = true,
}) => {
  const [showCodes, setShowCodes] = useState(false);

  const handleTogglePower = () => {
    const next = !state.isOn;
    onUpdateState({ isOn: next });
    irBlaster.sendNec(FAN_CODES.power.hex, next ? 'Power ON' : 'Power OFF', 'Smart Fan');
  };

  const handleSpeedChange = (newSpeed: number) => {
    onUpdateState({ speed: newSpeed });
    irBlaster.sendNec(FAN_CODES.speed.hex, `Speed ${newSpeed}`, 'Smart Fan');
  };

  const handleToggleSwing = () => {
    const nextSwing = !state.isSwinging;
    onUpdateState({ isSwinging: nextSwing });
    irBlaster.sendNec(FAN_CODES.swing.hex, nextSwing ? 'Swing ON' : 'Swing OFF', 'Smart Fan');
  };

  const handleCycleTimer = () => {
    const idx = TIMER_STEPS.indexOf(state.timer);
    const nextTimer = TIMER_STEPS[(idx + 1) % TIMER_STEPS.length];
    onUpdateState({ timer: nextTimer });
    irBlaster.sendNec(FAN_CODES.timer.hex, `Timer: ${nextTimer}`, 'Smart Fan');
  };

  const handleCycleMode = () => {
    const idx = WIND_MODES.indexOf(state.mode);
    const nextMode = WIND_MODES[(idx + 1) % WIND_MODES.length];
    onUpdateState({ mode: nextMode });
    irBlaster.sendNec(FAN_CODES.mode.hex, `Mode: ${nextMode}`, 'Smart Fan');
  };

  const animationDuration = state.isOn ? `${Math.max(0.4, 2.5 - state.speed * 0.45)}s` : '0s';

  return (
    <div className="flex flex-col w-full min-h-screen pb-24 px-5 pt-14 sm:pt-16 select-none max-w-md mx-auto justify-between">
      <div>
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-5">
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
              Smart Fan
            </h2>
          </div>

          <button
            onClick={() => {
              hapticFeedback.tick();
              setShowCodes(!showCodes);
            }}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
              showCodes
                ? 'bg-sky-400 text-black border-sky-400 shadow-sm'
                : isDarkMode
                ? 'bg-surface border-surface-border text-accent-muted hover:text-white'
                : 'bg-white border-slate-200 text-slate-600 shadow-sm'
            }`}
            title="Show NEC Codes"
          >
            <Code2 size={18} />
          </button>
        </div>

        {/* Fan Hub Visual */}
        <div className="relative flex flex-col items-center justify-center py-4">
          <div
            className={`w-48 h-48 rounded-full border flex items-center justify-center transition-all duration-700 relative ${
              state.isOn
                ? isDarkMode
                  ? 'shadow-[0_0_40px_rgba(197,245,250,0.15)] bg-surface/30 border-surface-border'
                  : 'shadow-lg bg-sky-50/60 border-sky-200'
                : isDarkMode
                ? 'bg-surface/10 opacity-50 border-surface-border'
                : 'bg-slate-100 opacity-60 border-slate-200'
            }`}
          >
            {/* Spinning Fan Blade */}
            <div
              className="w-36 h-36 flex items-center justify-center transition-transform"
              style={{
                animation: state.isOn ? `spin ${animationDuration} linear infinite` : 'none',
              }}
            >
              <Fan
                size={100}
                className={state.isOn ? 'text-sky-400' : isDarkMode ? 'text-zinc-600' : 'text-slate-400'}
              />
            </div>

            {/* Center Power Button */}
            <button
              onClick={handleTogglePower}
              className={`absolute z-20 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 shadow-xl border ${
                state.isOn
                  ? 'bg-white text-black border-white shadow-glow-cyan'
                  : isDarkMode
                  ? 'bg-[#18181B] text-zinc-500 border-surface-border'
                  : 'bg-slate-200 text-slate-500 border-slate-300'
              }`}
              aria-label="Toggle Fan Power"
            >
              <Power size={22} strokeWidth={2.5} />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                state.isOn ? 'bg-sky-400 animate-pulse' : 'bg-zinc-500'
              }`}
            />
            <span
              className={`text-xs font-bold tracking-wide uppercase ${
                isDarkMode ? 'text-white/80' : 'text-slate-700'
              }`}
            >
              {state.isOn ? `Speed ${state.speed} • ${state.mode}` : 'Powered Off'}
            </span>
          </div>
        </div>

        {/* Upward ArcSlider (3 speeds: 1, 2, 3) */}
        <div className="my-2">
          <ArcSlider
            value={state.speed}
            onChange={handleSpeedChange}
            label="Wind Speed"
            unit=""
            min={1}
            max={3}
            step={1}
            accentColor="#38BDF8"
            displayValueOverride={`Speed ${state.speed}`}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Control Buttons Grid (From Image 1 codes) */}
        <div className="grid grid-cols-3 gap-2.5 mt-3">
          {/* Swing Control */}
          <button
            onClick={handleToggleSwing}
            className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 ${
              state.isSwinging
                ? 'bg-sky-400 text-black border-sky-400 shadow-sm'
                : isDarkMode
                ? 'bg-surface text-white border-surface-border hover:bg-surface-hover'
                : 'bg-white text-slate-800 border-slate-200 shadow-sm'
            }`}
          >
            <Compass size={18} className={state.isSwinging ? 'animate-pulse' : ''} />
            <span className="text-xs font-bold">Swing</span>
            <span className="text-[10px] opacity-80">{state.isSwinging ? 'ON' : 'OFF'}</span>
          </button>

          {/* Wind Mode Control */}
          <button
            onClick={handleCycleMode}
            className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all ${
              isDarkMode
                ? 'bg-surface border-surface-border text-white hover:bg-surface-hover'
                : 'bg-white border-slate-200 text-slate-800 shadow-sm'
            }`}
          >
            <Wind size={18} className="text-sky-400" />
            <span className="text-xs font-bold">Mode</span>
            <span className={`text-[10px] ${isDarkMode ? 'text-accent-muted' : 'text-slate-500'}`}>
              {state.mode}
            </span>
          </button>

          {/* Timer Control */}
          <button
            onClick={handleCycleTimer}
            className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all ${
              isDarkMode
                ? 'bg-surface border-surface-border text-white hover:bg-surface-hover'
                : 'bg-white border-slate-200 text-slate-800 shadow-sm'
            }`}
          >
            <Clock size={18} className="text-amber-400" />
            <span className="text-xs font-bold">Timer</span>
            <span className={`text-[10px] ${isDarkMode ? 'text-accent-muted' : 'text-slate-500'}`}>
              {state.timer}
            </span>
          </button>
        </div>

        {/* Captured NEC Codes from Image 1 */}
        {showCodes && (
          <div
            className={`mt-4 p-4 rounded-2xl border ${
              isDarkMode ? 'bg-[#18181B] border-surface-border' : 'bg-slate-100 border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Captured Fan NEC Codes
              </span>
              <span className="text-[10px] font-mono text-sky-400">38 kHz</span>
            </div>
            <div className="space-y-1 text-xs font-mono">
              {Object.values(FAN_CODES).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between py-1 border-b border-black/5 dark:border-white/5 last:border-0"
                >
                  <span className={isDarkMode ? 'text-zinc-400' : 'text-slate-600'}>{c.name}</span>
                  <span className="text-amber-500 font-bold">0x{c.hex}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
