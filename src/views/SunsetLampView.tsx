import React, { useState } from 'react';
import { ArrowLeft, Sparkles, SunMedium, ChevronDown, ChevronUp } from 'lucide-react';
import { SunsetProjectorVisual } from '../components/SunsetProjectorVisual';
import { ArcSlider } from '../components/ArcSlider';
import { AestheticColorPicker } from '../components/AestheticColorPicker';
import { RGB_LED_CONTROLS } from '../data/rgbLedCodes';
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
  onUpdateState: (newState: Partial<SunsetLampViewProps['state']>) => void;
  isDarkMode?: boolean;
}

export const SunsetLampView: React.FC<SunsetLampViewProps> = ({
  onBack,
  state,
  onUpdateState,
  isDarkMode = true,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleTogglePower = () => {
    const next = !state.isOn;
    onUpdateState({ isOn: next });
    const code = next ? RGB_LED_CONTROLS.powerOn.hex : RGB_LED_CONTROLS.powerOff.hex;
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
              Tabletop Projector
            </span>
            <h2
              className={`text-base font-extrabold tracking-tight ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Sunset Lamp
            </h2>
          </div>

          <div className="w-10" />
        </div>

        {/* Authentic Sunset Projector Lamp Model with Circular Wall Halo (Image 5) */}
        <SunsetProjectorVisual
          isOn={state.isOn}
          onTogglePower={handleTogglePower}
          title={state.moodName}
          subtitle="Halo Projection"
          color={state.color}
          brightness={state.brightness}
          isDarkMode={isDarkMode}
        />

        {/* Quick Mood Pills (Warm Sunset, Golden Hour, Romantic) */}
        <div className="flex items-center justify-center gap-3 my-4">
          <button
            onClick={() => handleSelectMood('Golden Hour', '#F8E5A5', '00F708F7')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
              state.moodName === 'Golden Hour'
                ? 'bg-amber-400 text-black border-amber-400 shadow-glow-amber scale-105'
                : isDarkMode
                ? 'bg-surface text-accent-muted border-surface-border'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            Golden Hour
          </button>

          <button
            onClick={() => handleSelectMood('Deep Sunset', '#FF5733', '00F710EF')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
              state.moodName === 'Deep Sunset'
                ? 'bg-rose-500 text-white border-rose-500 shadow-md scale-105'
                : isDarkMode
                ? 'bg-surface text-accent-muted border-surface-border'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            Deep Sunset
          </button>

          <button
            onClick={() => handleSelectMood('Twilight Violet', '#A855F7', '00F7708F')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
              state.moodName === 'Twilight Violet'
                ? 'bg-purple-500 text-white border-purple-500 shadow-md scale-105'
                : isDarkMode
                ? 'bg-surface text-accent-muted border-surface-border'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            Twilight
          </button>
        </div>

        {/* Upward ArcSlider (∩ shape, no overlap) */}
        <div className="my-2">
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
        <div className="mt-3">
          <button
            onClick={() => {
              hapticFeedback.click();
              setShowColorPicker(!showColorPicker);
            }}
            className={`w-full py-2.5 px-4 rounded-2xl border flex items-center justify-between text-xs font-bold transition-colors ${
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
                  onUpdateState({ color: colorHex, moodName: 'Custom Hue' });
                  if (irCode) {
                    irBlaster.sendNec(irCode, 'Color Shift', 'Sunset Lamp');
                  }
                }}
                isDarkMode={isDarkMode}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
