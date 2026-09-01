import React, { useState } from 'react';
import { ArrowLeft, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { LedStripVisual } from '../components/LedStripVisual';
import { ArcSlider } from '../components/ArcSlider';
import { AestheticColorPicker } from '../components/AestheticColorPicker';
import { RGB_LED_CONTROLS } from '../data/rgbLedCodes';
import { irBlaster } from '../services/irBlaster';
import { hapticFeedback } from '../services/haptics';

interface LedStripViewProps {
  onBack: () => void;
  state: {
    isOn: boolean;
    brightness: number;
    color: string;
  };
  onUpdateState: (newState: Partial<LedStripViewProps['state']>) => void;
  isDarkMode?: boolean;
}

export const LedStripView: React.FC<LedStripViewProps> = ({
  onBack,
  state,
  onUpdateState,
  isDarkMode = true,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(true);

  const handleTogglePower = () => {
    const next = !state.isOn;
    onUpdateState({ isOn: next });
    const code = next ? RGB_LED_CONTROLS.powerOn.hex : RGB_LED_CONTROLS.powerOff.hex;
    irBlaster.sendNec(code, next ? 'Power ON' : 'Power OFF', 'China RGB LED');
  };

  const handleBrightnessChange = (val: number) => {
    onUpdateState({ brightness: val });
    if (val > state.brightness) {
      irBlaster.sendNec(RGB_LED_CONTROLS.brightUp.hex, 'Brightness +', 'China RGB LED');
    } else {
      irBlaster.sendNec(RGB_LED_CONTROLS.brightDown.hex, 'Brightness -', 'China RGB LED');
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen pb-20 px-4 sm:px-6 pt-5 select-none max-w-md mx-auto justify-between">
      <div>
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-3">
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
              Living Room
            </span>
            <h2
              className={`text-base font-extrabold tracking-tight ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              China RGB LED Strip
            </h2>
          </div>

          <div className="w-10" />
        </div>

        {/* LED Strip Visual */}
        <LedStripVisual
          isOn={state.isOn}
          onTogglePower={handleTogglePower}
          title="China LED Strip"
          subtitle="Ambient Ribbon"
          color={state.color}
          brightness={state.brightness}
          isDarkMode={isDarkMode}
        />

        {/* Upward ArcSlider (∩ shape) */}
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
              <span>Color Wheel & 24-Key Remote Matrix</span>
            </div>
            {showColorPicker ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showColorPicker && (
            <div className="mt-3">
              <AestheticColorPicker
                selectedColor={state.color}
                onSelectColor={(colorHex, irCode) => {
                  onUpdateState({ color: colorHex });
                  if (irCode) {
                    irBlaster.sendNec(irCode, 'Color Shift', 'China RGB LED');
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
