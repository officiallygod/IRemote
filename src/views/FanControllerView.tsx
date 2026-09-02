import React, { useState } from 'react';
import { ArrowLeft, Power, Wind, Clock, Compass, Code } from 'lucide-react';
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
  onUpdateState: (update: Partial<FanControllerViewProps['state']>) => void;
  isDarkMode?: boolean;
}

const TIMER_STEPS = ['Off', '1h', '2h', '4h', '8h'];
const WIND_MODES = ['Normal', 'Natural', 'Sleep'];

export const FanControllerView: React.FC<FanControllerViewProps> = ({
  onBack,
  state,
  onUpdateState,
  isDarkMode = true,
}) => {
  const [showCodes, setShowCodes] = useState(false);

  const handleTogglePower = () => {
    hapticFeedback.click();
    const next = !state.isOn;
    onUpdateState({ isOn: next });
    irBlaster.sendNec(FAN_CODES.power.hex, next ? 'Power ON' : 'Power OFF', 'Smart Fan');
  };

  const handleSpeedChange = (newSpeed: number) => {
    onUpdateState({ speed: newSpeed });
    irBlaster.sendNec(FAN_CODES.speed.hex, `Speed ${newSpeed}`, 'Smart Fan');
  };

  const handleToggleSwing = () => {
    hapticFeedback.click();
    const nextSwing = !state.isSwinging;
    onUpdateState({ isSwinging: nextSwing });
    irBlaster.sendNec(FAN_CODES.swing.hex, nextSwing ? 'Swing ON' : 'Swing OFF', 'Smart Fan');
  };

  const handleCycleTimer = () => {
    hapticFeedback.click();
    const idx = TIMER_STEPS.indexOf(state.timer);
    const nextTimer = TIMER_STEPS[(idx + 1) % TIMER_STEPS.length];
    onUpdateState({ timer: nextTimer });
    irBlaster.sendNec(FAN_CODES.timer.hex, `Timer: ${nextTimer}`, 'Smart Fan');
  };

  const handleCycleMode = () => {
    hapticFeedback.click();
    const idx = WIND_MODES.indexOf(state.mode);
    const nextMode = WIND_MODES[(idx + 1) % WIND_MODES.length];
    onUpdateState({ mode: nextMode });
    irBlaster.sendNec(FAN_CODES.mode.hex, `Mode: ${nextMode}`, 'Smart Fan');
  };

  // Speed-dependent animation duration
  const animationDuration =
    state.speed === 1 ? '1.8s' : state.speed === 2 ? '1.0s' : '0.5s';

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
          <h2 className="text-base font-extrabold tracking-tight">Smart Fan</h2>
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
          title="IR Codes Inspector"
        >
          <Code size={18} />
        </button>
      </header>

      {/* 2. Scrollable Body Content (Scrolls smoothly underneath the persistent nav bar) */}
      <main className="flex-1 overflow-y-auto px-5 pt-3 pb-36 space-y-4 overscroll-contain">
        {/* Fan Hub Visual */}
        <div className="relative flex flex-col items-center justify-center py-2">
          <div
            className={`w-40 h-40 sm:w-44 sm:h-44 rounded-full border flex items-center justify-center transition-all duration-700 relative ${
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
              className="w-32 h-32 flex items-center justify-center transition-transform"
              style={{
                animation: state.isOn ? `spin ${animationDuration} linear infinite` : 'none',
              }}
            >
              <svg viewBox="0 0 100 100" className="w-24 h-24 text-sky-400 fill-current">
                {/* 3 aerodynamic curved blades */}
                <path d="M50 50 C45 35 30 20 50 10 C65 20 55 35 50 50 Z" />
                <path d="M50 50 C65 55 80 70 90 50 C80 35 65 45 50 50 Z" />
                <path d="M50 50 C35 65 20 80 10 50 C20 35 35 45 50 50 Z" />
                <circle cx="50" cy="50" r="12" fill="#0284C7" />
              </svg>
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

          <div className="mt-2.5 flex items-center gap-2">
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
        <div className="py-1">
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
        <div className="grid grid-cols-3 gap-2.5 pt-2">
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

        {/* IR Codes Drawer */}
        {showCodes && (
          <div
            className={`mt-4 p-4 rounded-3xl border text-xs shadow-xl ${
              isDarkMode ? 'bg-surface border-surface-border text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="font-bold mb-2 flex items-center justify-between">
              <span>Verified Hardware IR Codes (NEC MSB)</span>
              <span className="text-[10px] text-accent-muted font-mono">Poco X7 Pro</span>
            </div>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between p-1.5 rounded-lg bg-black/20">
                <span className="text-accent-muted">Switch On/Off:</span>
                <span className="text-amber-400">0x00FF58A7</span>
              </div>
              <div className="flex justify-between p-1.5 rounded-lg bg-black/20">
                <span className="text-accent-muted">Wind Speed:</span>
                <span className="text-sky-400">0xC03FC03F</span>
              </div>
              <div className="flex justify-between p-1.5 rounded-lg bg-black/20">
                <span className="text-accent-muted">Timer:</span>
                <span className="text-emerald-400">0x00FF906F</span>
              </div>
              <div className="flex justify-between p-1.5 rounded-lg bg-black/20">
                <span className="text-accent-muted">Swing:</span>
                <span className="text-purple-400">0x926DE01F</span>
              </div>
              <div className="flex justify-between p-1.5 rounded-lg bg-black/20">
                <span className="text-accent-muted">Wind Mode:</span>
                <span className="text-rose-400">0x5D05807F</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
