import React, { useState } from 'react';
import { ArrowLeft, Palette, ChevronDown, ChevronUp } from 'lucide-react';
import { SunsetProjectorVisual } from '../components/SunsetProjectorVisual';
import { ArcSlider } from '../components/ArcSlider';
import { AestheticColorPicker } from '../components/AestheticColorPicker';
import { RGB_LED_CONTROLS, SUNSET_LAMP_PRESETS, getSavedSunsetOffCode } from '../data/rgbLedCodes';
import { irBlaster } from '../services/irBlaster';
import { hapticFeedback } from '../services/haptics';

interface SunsetLampViewProps {
  onBack: () => void;
  state: {
    isOn: boolean;
    brightness: number;
    color: string;
    moodName: string;
  };
  onUpdateState: (update: Partial<SunsetLampViewProps['state']>) => void;
  isDarkMode?: boolean;
}

export const SunsetLampView: React.FC<SunsetLampViewProps> = ({
  onBack,
  state,
  onUpdateState,
  isDarkMode = true,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(true);
  const [confirmedOffCode] = useState(getSavedSunsetOffCode());

  const handleTogglePower = () => {
    hapticFeedback.click();
    const next = !state.isOn;
    onUpdateState({ isOn: next });
    const code = next ? RGB_LED_CONTROLS.powerOn.hex : confirmedOffCode;
    irBlaster.sendNec(code, next ? 'Power ON' : 'Power OFF', 'Sunset Lamp');
  };

  const handleBrightnessChange = (val: number) => {
    onUpdateState({ brightness: val });
    if (val > state.brightness) {
      irBlaster.sendNec(RGB_LED_CONTROLS.brightUp.hex, 'Brightness +', 'Sunset Lamp');
    } else {
      irBlaster.sendNec(RGB_LED_CONTROLS.brightDown.hex, 'Brightness -', 'Sunset Lamp');
    }
  };

  const handleSelectMood = (moodName: string, colorHex: string, irCode: string) => {
    hapticFeedback.click();
    onUpdateState({ moodName, color: colorHex });
    irBlaster.sendNec(irCode, moodName, 'Sunset Lamp');
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
          <h2 className="text-base font-extrabold tracking-tight">Sunset Lamp</h2>
        </div>

        {/* Color Palette Toggle Button */}
        <button
          onClick={() => {
            hapticFeedback.tick();
            setShowColorPicker(!showColorPicker);
          }}
          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all active:scale-90 ${
            showColorPicker
              ? 'bg-amber-400 text-black border-amber-400 shadow-sm'
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
        {/* Authentic Sunset Projector Lamp Model with Circular Wall Halo */}
        <SunsetProjectorVisual
          isOn={state.isOn}
          onTogglePower={handleTogglePower}
          title={state.moodName}
          subtitle="Halo Projection"
          color={state.color}
          brightness={state.brightness}
          isDarkMode={isDarkMode}
        />

        {/* Quick Mood Pills */}
        <div className="flex items-center justify-center gap-2 py-1 overflow-x-auto scrollbar-none">
          {SUNSET_LAMP_PRESETS.map((preset) => {
            const isSelected = state.moodName === preset.name;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectMood(preset.name, preset.colorHex, preset.irHex)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all border ${
                  isSelected
                    ? 'bg-amber-400 text-black border-amber-400 shadow-glow-amber scale-105'
                    : isDarkMode
                    ? 'bg-surface text-accent-muted border-surface-border'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>

        {/* Upward ArcSlider (∩ shape, zero overlap) */}
        <div className="py-2">
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

        {/* 24-Key Remote & Color Matrix Drawer */}
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
              <span>Full 24-Key Physical Remote & Palettes</span>
            </div>
            {showColorPicker ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showColorPicker && (
            <div className="mt-3">
              <AestheticColorPicker
                selectedColor={state.color}
                onSelectColor={(hex, irCode) => {
                  onUpdateState({ color: hex });
                  if (irCode) {
                    irBlaster.sendNec(irCode, 'Set Color', 'Sunset Lamp');
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
