import React, { useState } from 'react';
import { ArrowLeft, Sun, Palette, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { LampBeamVisual } from '../components/LampBeamVisual';
import { ArcSlider } from '../components/ArcSlider';
import { AestheticColorPicker } from '../components/AestheticColorPicker';
import { hapticFeedback } from '../services/haptics';
import { irBlaster } from '../services/irBlaster';
import { RGB_LED_CONTROLS } from '../data/rgbLedCodes';

interface LightControllerViewProps {
  onBack: () => void;
  activeDeviceId: 'device-1' | 'device-2';
  onChangeDevice: (deviceId: 'device-1' | 'device-2') => void;
  state: {
    isOn: boolean;
    brightness: number;
    color: string;
  };
  onUpdateState: (newState: Partial<{ isOn: boolean; brightness: number; color: string }>) => void;
}

type LightMode = 'warm' | 'color' | 'romantic';

export const LightControllerView: React.FC<LightControllerViewProps> = ({
  onBack,
  activeDeviceId,
  onChangeDevice,
  state,
  onUpdateState,
}) => {
  const [activeMode, setActiveMode] = useState<LightMode>('warm');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const deviceTitle = activeDeviceId === 'device-1' ? 'Degrees Pendant Light' : 'Lauters Ikea';

  const handleTogglePower = () => {
    const nextPower = !state.isOn;
    onUpdateState({ isOn: nextPower });
    const code = nextPower ? RGB_LED_CONTROLS.powerOn.hex : RGB_LED_CONTROLS.powerOff.hex;
    irBlaster.sendNec(code, nextPower ? 'Turn ON' : 'Turn OFF', deviceTitle);
  };

  const handleBrightnessChange = (val: number) => {
    onUpdateState({ brightness: val });
    // Emit brightness command periodically
    if (val > state.brightness) {
      irBlaster.sendNec(RGB_LED_CONTROLS.brightUp.hex, 'Brightness +', deviceTitle);
    } else if (val < state.brightness) {
      irBlaster.sendNec(RGB_LED_CONTROLS.brightDown.hex, 'Brightness -', deviceTitle);
    }
  };

  const handleSelectMode = (mode: LightMode) => {
    hapticFeedback.click();
    setActiveMode(mode);

    if (mode === 'warm') {
      onUpdateState({ color: '#F8E5A5' });
      irBlaster.sendNec('00F708F7', 'Warm Mode', deviceTitle);
      setShowColorPicker(false);
    } else if (mode === 'romantic') {
      onUpdateState({ color: '#FF3366' });
      irBlaster.sendNec('00F76897', 'Romantic Mode', deviceTitle);
      setShowColorPicker(false);
    } else if (mode === 'color') {
      setShowColorPicker(true);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen pb-20 px-5 pt-6 select-none max-w-md mx-auto">
      {/* Top Bar (Screenshot 2: Back arrow + Device 1 / Device 2 tabs) */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => {
            hapticFeedback.click();
            onBack();
          }}
          className="w-10 h-10 rounded-full bg-surface border border-surface-border flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition-transform"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Device Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#18181B] rounded-full border border-surface-border">
          <button
            onClick={() => {
              hapticFeedback.tick();
              onChangeDevice('device-1');
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeDeviceId === 'device-1'
                ? 'bg-white text-[#121214] shadow-md'
                : 'text-accent-muted hover:text-white'
            }`}
          >
            Device 1
          </button>
          <button
            onClick={() => {
              hapticFeedback.tick();
              onChangeDevice('device-2');
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeDeviceId === 'device-2'
                ? 'bg-white text-[#121214] shadow-md'
                : 'text-accent-muted hover:text-white'
            }`}
          >
            Device 2
          </button>
        </div>

        <div className="w-10" />
      </div>

      {/* Hero Lamp Cone Visual */}
      <LampBeamVisual
        isOn={state.isOn}
        onTogglePower={handleTogglePower}
        title={deviceTitle}
        subtitle="Living Room"
        color={state.color}
        brightness={state.brightness}
      />

      {/* Mode Selector Buttons (Screenshot 2: Warm Mode, Color Mode, Romantic) */}
      <div className="flex items-center justify-center gap-6 my-6">
        {/* Warm Mode */}
        <button
          onClick={() => handleSelectMode('warm')}
          className="flex flex-col items-center gap-1.5 group"
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 border ${
              activeMode === 'warm'
                ? 'bg-[#F8E5A5] text-[#121214] border-[#F8E5A5] shadow-glow-amber scale-105'
                : 'bg-surface text-accent-muted border-surface-border group-hover:text-white'
            }`}
          >
            <Sun size={20} />
          </div>
          <span
            className={`text-[11px] font-semibold tracking-tight ${
              activeMode === 'warm' ? 'text-white' : 'text-accent-muted'
            }`}
          >
            Warm Mode
          </span>
        </button>

        {/* Color Mode */}
        <button
          onClick={() => handleSelectMode('color')}
          className="flex flex-col items-center gap-1.5 group"
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 border ${
              activeMode === 'color'
                ? 'bg-accent-cyan text-[#121214] border-accent-cyan shadow-glow-cyan scale-105'
                : 'bg-surface text-accent-muted border-surface-border group-hover:text-white'
            }`}
          >
            <Palette size={20} />
          </div>
          <span
            className={`text-[11px] font-semibold tracking-tight ${
              activeMode === 'color' ? 'text-white' : 'text-accent-muted'
            }`}
          >
            Color Mode
          </span>
        </button>

        {/* Romantic Mode */}
        <button
          onClick={() => handleSelectMode('romantic')}
          className="flex flex-col items-center gap-1.5 group"
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 border ${
              activeMode === 'romantic'
                ? 'bg-[#FF3366] text-white border-[#FF3366] shadow-[0_0_20px_rgba(255,51,102,0.4)] scale-105'
                : 'bg-surface text-accent-muted border-surface-border group-hover:text-white'
            }`}
          >
            <Heart size={20} />
          </div>
          <span
            className={`text-[11px] font-semibold tracking-tight ${
              activeMode === 'romantic' ? 'text-white' : 'text-accent-muted'
            }`}
          >
            Romantic
          </span>
        </button>
      </div>

      {/* Signature Arc Slider (Screenshot 2: Intensive 75%) */}
      <div className="mt-2 mb-4">
        <ArcSlider
          value={state.brightness}
          onChange={handleBrightnessChange}
          label="Intensive"
          unit="%"
          min={0}
          max={100}
          step={1}
          accentColor={state.color || '#F8E5A5'}
        />
      </div>

      {/* Aesthetic Color Picker Drawer / Accordion */}
      <div className="mt-2">
        <button
          onClick={() => {
            hapticFeedback.click();
            setShowColorPicker(!showColorPicker);
          }}
          className="w-full py-2.5 px-4 rounded-2xl bg-surface border border-surface-border flex items-center justify-between text-xs font-semibold text-white/80 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: state.color }}
            />
            <span>Aesthetic Color Palette & China LED Grid</span>
          </div>
          {showColorPicker ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showColorPicker && (
          <div className="mt-3">
            <AestheticColorPicker
              selectedColor={state.color}
              onSelectColor={(hex) => onUpdateState({ color: hex })}
            />
          </div>
        )}
      </div>
    </div>
  );
};
