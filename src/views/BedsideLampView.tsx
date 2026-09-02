import React, { useState } from 'react';
import { ArrowLeft, Sun, Palette, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { BedsideLampVisual } from '../components/BedsideLampVisual';
import { ArcSlider } from '../components/ArcSlider';
import { AestheticColorPicker } from '../components/AestheticColorPicker';
import { RGB_LED_CONTROLS } from '../data/rgbLedCodes';
import { irBlaster } from '../services/irBlaster';
import { hapticFeedback } from '../services/haptics';

interface BedsideLampViewProps {
  onBack: () => void;
  state: {
    isOn: boolean;
    brightness: number;
    color: string;
    modeName: string;
  };
  onUpdateState: (newState: Partial<BedsideLampViewProps['state']>) => void;
  isDarkMode?: boolean;
}

export const BedsideLampView: React.FC<BedsideLampViewProps> = ({
  onBack,
  state,
  onUpdateState,
  isDarkMode = true,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleTogglePower = () => {
    hapticFeedback.click();
    const next = !state.isOn;
    onUpdateState({ isOn: next });
    const code = next ? RGB_LED_CONTROLS.powerOn.hex : RGB_LED_CONTROLS.powerOff.hex;
    irBlaster.sendNec(code, next ? 'Power ON' : 'Power OFF', 'Bedside Night Lamp');
  };

  const handleBrightnessChange = (val: number) => {
    onUpdateState({ brightness: val });
    if (val > state.brightness) {
      irBlaster.sendNec(RGB_LED_CONTROLS.brightUp.hex, 'Brightness +', 'Bedside Night Lamp');
    } else {
      irBlaster.sendNec(RGB_LED_CONTROLS.brightDown.hex, 'Brightness -', 'Bedside Night Lamp');
    }
  };

  const handleSelectMode = (modeName: string, colorHex: string, irCode: string) => {
    hapticFeedback.click();
    onUpdateState({ modeName, color: colorHex });
    irBlaster.sendNec(irCode, modeName, 'Bedside Night Lamp');
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
            Bedside Nightstand
          </span>
          <h2 className="text-base font-extrabold tracking-tight">Three O Night Lamp</h2>
        </div>

        <button
          onClick={() => {
            hapticFeedback.tick();
            setShowColorPicker(!showColorPicker);
          }}
          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all active:scale-90 ${
            showColorPicker
              ? 'bg-sky-400 text-black border-sky-400 shadow-sm'
              : isDarkMode
              ? 'bg-surface border-surface-border text-accent-muted hover:text-white'
              : 'bg-white border-slate-200 text-slate-600 shadow-sm'
          }`}
          title="Color Palette"
        >
          <Palette size={18} />
        </button>
      </header>

      {/* 2. Scrollable Body Content (Scrolls smoothly underneath the persistent nav bar) */}
      <main className="flex-1 overflow-y-auto px-5 pt-3 pb-36 space-y-4 overscroll-contain">
        {/* Hero Bedside Lamp Visual */}
        <BedsideLampVisual
          isOn={state.isOn}
          onTogglePower={handleTogglePower}
          title={state.modeName}
          subtitle="Touch Night Light"
          color={state.color}
          brightness={state.brightness}
          isDarkMode={isDarkMode}
        />

        {/* Quick Mode Buttons (Warm Mode, Color Mode, Romantic) */}
        <div className="flex items-center justify-center gap-5 my-2">
          {/* Warm 2700K */}
          <button
            onClick={() => handleSelectMode('Warm 2700K', '#F8E5A5', '00F708F7')}
            className="flex flex-col items-center gap-1 group"
          >
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 border ${
                state.modeName === 'Warm 2700K'
                  ? 'bg-amber-300 text-black border-amber-400 shadow-glow-amber scale-105'
                  : isDarkMode
                  ? 'bg-surface text-accent-muted border-surface-border group-hover:text-white'
                  : 'bg-white text-slate-500 border-slate-200'
              }`}
            >
              <Sun size={18} />
            </div>
            <span
              className={`text-[10px] font-semibold ${
                state.modeName === 'Warm 2700K'
                  ? isDarkMode
                    ? 'text-white'
                    : 'text-slate-900'
                  : 'text-slate-500'
              }`}
            >
              Warm 2700K
            </span>
          </button>

          {/* Color Mode */}
          <button
            onClick={() => {
              hapticFeedback.click();
              setShowColorPicker(true);
            }}
            className="flex flex-col items-center gap-1 group"
          >
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 border ${
                showColorPicker
                  ? 'bg-sky-400 text-black border-sky-400 shadow-glow-cyan scale-105'
                  : isDarkMode
                  ? 'bg-surface text-accent-muted border-surface-border group-hover:text-white'
                  : 'bg-white text-slate-500 border-slate-200'
              }`}
            >
              <Palette size={18} />
            </div>
            <span
              className={`text-[10px] font-semibold ${
                showColorPicker ? (isDarkMode ? 'text-white' : 'text-slate-900') : 'text-slate-500'
              }`}
            >
              Color Mode
            </span>
          </button>

          {/* Romantic Rose */}
          <button
            onClick={() => handleSelectMode('Romantic Rose', '#FF3366', '00F76897')}
            className="flex flex-col items-center gap-1 group"
          >
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 border ${
                state.modeName === 'Romantic Rose'
                  ? 'bg-rose-500 text-white border-rose-500 shadow-md scale-105'
                  : isDarkMode
                  ? 'bg-surface text-accent-muted border-surface-border group-hover:text-white'
                  : 'bg-white text-slate-500 border-slate-200'
              }`}
            >
              <Heart size={18} />
            </div>
            <span
              className={`text-[10px] font-semibold ${
                state.modeName === 'Romantic Rose'
                  ? isDarkMode
                    ? 'text-white'
                    : 'text-slate-900'
                  : 'text-slate-500'
              }`}
            >
              Romantic
            </span>
          </button>
        </div>

        {/* Upward ArcSlider */}
        <div className="py-1">
          <ArcSlider
            value={state.brightness}
            onChange={handleBrightnessChange}
            label="Intensive"
            unit="%"
            min={0}
            max={100}
            step={5}
            accentColor={state.color}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Aesthetic Color Palette Drawer */}
        <div className="pt-2">
          <button
            onClick={() => {
              hapticFeedback.click();
              setShowColorPicker(!showColorPicker);
            }}
            className={`w-full py-3 px-4 rounded-2xl border flex items-center justify-between text-xs font-bold transition-colors ${
              isDarkMode
                ? 'bg-surface border-surface-border text-white hover:bg-surface-hover'
                : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="w-3.5 h-3.5 rounded-full shadow-sm"
                style={{ backgroundColor: state.color }}
              />
              <span>Color Palette & 24-Key Remote</span>
            </div>
            {showColorPicker ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showColorPicker && (
            <div className="mt-3">
              <AestheticColorPicker
                selectedColor={state.color}
                onSelectColor={(colorHex, irCode) => {
                  onUpdateState({ color: colorHex, modeName: 'Color Mode' });
                  if (irCode) {
                    irBlaster.sendNec(irCode, 'Color Shift', 'Bedside Night Lamp');
                  }
                }}
                isDarkMode={isDarkMode}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
