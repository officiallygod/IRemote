import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Palette, Sparkles, Sliders, Check } from 'lucide-react';
import { RGB_LED_COLORS, SUNSET_LAMP_PRESETS, RgbColorKey } from '../data/rgbLedCodes';
import { irBlaster } from '../services/irBlaster';
import { hapticFeedback } from '../services/haptics';

interface AestheticColorPickerProps {
  selectedColor: string;
  onSelectColor: (colorHex: string, irCode?: string) => void;
  accentColor?: string;
  isDarkMode?: boolean;
}

type PickerTab = 'sunset' | 'wheel' | 'matrix';

export const AestheticColorPicker: React.FC<AestheticColorPickerProps> = ({
  selectedColor,
  onSelectColor,
  isDarkMode = true,
}) => {
  // Remember tab selection
  const [activeTab, setActiveTab] = useState<PickerTab>(() => {
    return (localStorage.getItem('iremote_picker_tab') as PickerTab) || 'sunset';
  });

  // Local drag preview color (updates fluidly without blasting IR on every micro-drag)
  const [dragColor, setDragColor] = useState<string>(selectedColor);
  const [isDraggingWheel, setIsDraggingWheel] = useState(false);
  const wheelRef = useRef<HTMLDivElement | null>(null);
  const pendingIrRef = useRef<{ hex: string; name: string } | null>(null);

  useEffect(() => {
    localStorage.setItem('iremote_picker_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!isDraggingWheel) {
      setDragColor(selectedColor);
    }
  }, [selectedColor, isDraggingWheel]);

  const handleSelectPreset = (preset: typeof SUNSET_LAMP_PRESETS[0]) => {
    hapticFeedback.click();
    onSelectColor(preset.colorHex, preset.irHex);
    irBlaster.sendNec(preset.irHex, preset.name, 'Sunset Lamp');
  };

  const handleSelectLedKey = (key: RgbColorKey) => {
    hapticFeedback.click();
    onSelectColor(key.displayColor, key.hexCode);
    irBlaster.sendNec(key.hexCode, key.name, 'RGB Light');
  };

  // Dragging on the wheel: ONLY updates visual preview, does NOT send IR repeatedly
  const updateWheelColorFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!wheelRef.current) return;
      const rect = wheelRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const x = clientX - centerX;
      const y = clientY - centerY;

      const dist = Math.sqrt(x * x + y * y);
      const maxRadius = rect.width / 2;
      if (dist > maxRadius) return;

      let angle = (Math.atan2(y, x) * 180) / Math.PI + 90;
      if (angle < 0) angle += 360;

      const sat = Math.min(100, Math.round((dist / maxRadius) * 100));
      const rgb = hslToHex(Math.round(angle), sat, 55);

      const closestKey = findClosestNecColor(angle);
      setDragColor(rgb);
      pendingIrRef.current = { hex: closestKey.hexCode, name: closestKey.name };
    },
    []
  );

  const handleWheelPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingWheel(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateWheelColorFromPointer(e.clientX, e.clientY);
  };

  const handleWheelPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingWheel) {
      updateWheelColorFromPointer(e.clientX, e.clientY);
    }
  };

  // On pointer up (release): Commit ONE clean selection and blast IR ONCE
  const handleWheelPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingWheel) {
      setIsDraggingWheel(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignored
      }

      if (pendingIrRef.current) {
        hapticFeedback.tick();
        onSelectColor(dragColor, pendingIrRef.current.hex);
        irBlaster.sendNec(pendingIrRef.current.hex, pendingIrRef.current.name, 'RGB Light');
      }
    }
  };

  return (
    <div
      className={`w-full flex flex-col rounded-3xl p-4 sm:p-5 border transition-all ${
        isDarkMode
          ? 'bg-[#18181B] border-surface-border text-white shadow-2xl'
          : 'bg-white border-slate-200 text-slate-900 shadow-xl'
      }`}
    >
      {/* Tab Switcher */}
      <div
        className={`flex items-center justify-between p-1 rounded-2xl mb-4 border ${
          isDarkMode ? 'bg-[#121214] border-surface-border/60' : 'bg-slate-100 border-slate-200'
        }`}
      >
        <button
          onClick={() => {
            hapticFeedback.tick();
            setActiveTab('sunset');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'sunset'
              ? isDarkMode
                ? 'bg-surface text-white shadow-sm border border-surface-border'
                : 'bg-white text-slate-900 shadow-sm border border-slate-200'
              : isDarkMode
              ? 'text-accent-muted hover:text-white'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sparkles size={14} className="text-amber-400" />
          Sunset Moods
        </button>

        <button
          onClick={() => {
            hapticFeedback.tick();
            setActiveTab('wheel');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'wheel'
              ? isDarkMode
                ? 'bg-surface text-white shadow-sm border border-surface-border'
                : 'bg-white text-slate-900 shadow-sm border border-slate-200'
              : isDarkMode
              ? 'text-accent-muted hover:text-white'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Palette size={14} className="text-sky-400" />
          Color Wheel
        </button>

        <button
          onClick={() => {
            hapticFeedback.tick();
            setActiveTab('matrix');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'matrix'
              ? isDarkMode
                ? 'bg-surface text-white shadow-sm border border-surface-border'
                : 'bg-white text-slate-900 shadow-sm border border-slate-200'
              : isDarkMode
              ? 'text-accent-muted hover:text-white'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sliders size={14} />
          24-Key Remote
        </button>
      </div>

      {/* Tab Content 1: Sunset Lamp Presets */}
      {activeTab === 'sunset' && (
        <div className="grid grid-cols-1 gap-2.5">
          {SUNSET_LAMP_PRESETS.map((preset) => {
            const isSelected = selectedColor.toLowerCase() === preset.colorHex.toLowerCase();
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`relative flex items-center justify-between p-3.5 rounded-2xl transition-all duration-200 text-left border ${
                  isSelected
                    ? isDarkMode
                      ? 'bg-surface border-amber-400/60 shadow-glow-amber'
                      : 'bg-amber-50/90 border-amber-400 shadow-md'
                    : isDarkMode
                    ? 'bg-[#141416] border-surface-border hover:bg-surface/50'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-tr ${preset.gradient} shadow-lg flex items-center justify-center`}
                  >
                    {isSelected && <Check size={16} className="text-white drop-shadow-md" />}
                  </div>
                  <div>
                    <div
                      className={`text-sm font-bold ${
                        isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {preset.name}
                    </div>
                    <div
                      className={`text-xs ${
                        isDarkMode ? 'text-accent-muted' : 'text-slate-500'
                      }`}
                    >
                      {preset.subtitle}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border ${
                    isDarkMode
                      ? 'bg-surface text-accent-muted border-surface-border'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  0x{preset.irHex}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Tab Content 2: Radial Color Wheel (Zero toast spam on drag) */}
      {activeTab === 'wheel' && (
        <div className="flex flex-col items-center justify-center py-3">
          <div
            ref={wheelRef}
            onPointerDown={handleWheelPointerDown}
            onPointerMove={handleWheelPointerMove}
            onPointerUp={handleWheelPointerUp}
            className="relative w-52 h-52 rounded-full cursor-crosshair shadow-2xl p-1.5 touch-none flex items-center justify-center select-none"
            style={{
              background:
                'conic-gradient(from 0deg, #FF0000, #FFA500, #FFFF00, #00FF00, #00FFFF, #0000FF, #FF00FF, #FF0000)',
            }}
          >
            <div
              className={`w-24 h-24 rounded-full border-2 flex flex-col items-center justify-center shadow-inner pointer-events-none ${
                isDarkMode ? 'bg-[#121214] border-surface-border' : 'bg-white border-slate-200'
              }`}
            >
              <div
                className="w-10 h-10 rounded-full mb-1 shadow-md transition-colors duration-150"
                style={{
                  backgroundColor: dragColor,
                  boxShadow: `0 0 16px ${dragColor}80`,
                }}
              />
              <span
                className={`text-[11px] font-mono font-bold tracking-wider ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                {dragColor.toUpperCase()}
              </span>
            </div>
          </div>
          <p
            className={`text-xs mt-3.5 text-center ${
              isDarkMode ? 'text-accent-muted' : 'text-slate-500'
            }`}
          >
            Drag to preview hue • Releases 1 clean signal on touch release
          </p>
        </div>
      )}

      {/* Tab Content 3: Standard 24-Key Remote Matrix */}
      {activeTab === 'matrix' && (
        <div className="flex flex-col">
          <div className="grid grid-cols-4 gap-2.5">
            {RGB_LED_COLORS.map((key) => {
              const isModeKey = !!key.label;
              return (
                <button
                  key={key.id}
                  onClick={() => handleSelectLedKey(key)}
                  className={`h-11 rounded-xl flex flex-col items-center justify-center transition-all duration-150 active:scale-95 shadow-md border ${
                    isModeKey
                      ? isDarkMode
                        ? 'bg-surface hover:bg-surface-hover border-surface-border text-white text-[10px] font-bold tracking-wider'
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800 text-[10px] font-bold tracking-wider'
                      : 'border-white/20 hover:brightness-110'
                  }`}
                  style={{
                    backgroundColor: isModeKey ? undefined : key.displayColor,
                    boxShadow: !isModeKey ? `0 2px 8px ${key.displayColor}33` : undefined,
                  }}
                  title={`${key.name} (0x${key.hexCode})`}
                >
                  {isModeKey ? (
                    <span>{key.label}</span>
                  ) : (
                    <span className="text-[10px] font-bold text-black/80 drop-shadow-sm font-mono">
                      {key.name.slice(0, 3)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div
            className={`mt-3.5 text-[11px] text-center flex items-center justify-center gap-2 ${
              isDarkMode ? 'text-accent-muted' : 'text-slate-500'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Standard 24-Key RGB infrared mapping
          </div>
        </div>
      )}
    </div>
  );
};

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function findClosestNecColor(hue: number): RgbColorKey {
  if (hue < 20 || hue >= 340) return RGB_LED_COLORS[0];
  if (hue < 45) return RGB_LED_COLORS[4];
  if (hue < 75) return RGB_LED_COLORS[12];
  if (hue < 150) return RGB_LED_COLORS[1];
  if (hue < 195) return RGB_LED_COLORS[9];
  if (hue < 255) return RGB_LED_COLORS[2];
  if (hue < 300) return RGB_LED_COLORS[10];
  return RGB_LED_COLORS[14];
}
