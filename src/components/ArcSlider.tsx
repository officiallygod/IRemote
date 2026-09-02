import React, { useRef, useState, useCallback } from 'react';
import { Minus, Plus } from 'lucide-react';
import { hapticFeedback } from '../services/haptics';

interface ArcSliderProps {
  value: number; // e.g. 1 to 3 or 0 to 100
  onChange: (value: number) => void;
  label?: string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  accentColor?: string; // e.g. '#38BDF8' or '#FB923C'
  displayValueOverride?: string;
  isDarkMode?: boolean;
}

export const ArcSlider: React.FC<ArcSliderProps> = ({
  value,
  onChange,
  label = 'Intensive',
  unit = '%',
  min = 0,
  max = 100,
  step = 1,
  accentColor = '#38BDF8',
  displayValueOverride,
  isDarkMode = true,
}) => {
  const containerRef = useRef<SVGSVGElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastHapticValue = useRef(value);

  // Upward Dome Arch (∩) Geometry
  // Left is 180 degrees, Top is 90 degrees, Right is 0 degrees
  const width = 280;
  const height = 135;
  const cx = width / 2; // 140
  const cy = 125;
  const r = 95;

  const percentage = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const currentTheta = Math.PI - percentage * Math.PI;

  const getPoint = (theta: number) => ({
    x: cx + r * Math.cos(theta),
    y: cy - r * Math.sin(theta),
  });

  const describeArc = (toTheta: number) => {
    const start = getPoint(Math.PI);
    const end = getPoint(toTheta);
    return `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`;
  };

  const trackPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const activePath = describeArc(Math.max(0, Math.min(Math.PI - 0.001, currentTheta)));
  const knobPos = getPoint(currentTheta);

  const handlePointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left - cx;
      const y = cy - (clientY - rect.top);

      let angle = Math.atan2(y, -x);
      if (angle < 0) {
        angle = x > 0 ? Math.PI : 0;
      }

      let ratio = angle / Math.PI;
      ratio = Math.max(0, Math.min(1, ratio));

      let rawVal = min + ratio * (max - min);
      let steppedVal = Math.round(rawVal / step) * step;
      steppedVal = Math.max(min, Math.min(max, steppedVal));

      if (steppedVal !== lastHapticValue.current) {
        hapticFeedback.tick();
        lastHapticValue.current = steppedVal;
      }

      onChange(steppedVal);
    },
    [min, max, step, onChange, cx, cy]
  );

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    handlePointer(e.clientX, e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isDragging) {
      handlePointer(e.clientX, e.clientY);
    }
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  const handleDecrement = () => {
    const delta = max <= 5 ? 1 : step * 5;
    const next = Math.max(min, value - delta);
    hapticFeedback.tick();
    onChange(next);
  };

  const handleIncrement = () => {
    const delta = max <= 5 ? 1 : step * 5;
    const next = Math.min(max, value + delta);
    hapticFeedback.tick();
    onChange(next);
  };

  return (
    <div className="relative flex flex-col items-center select-none w-full max-w-[280px] mx-auto">
      {/* Arch SVG Area */}
      <div className="relative w-full h-[135px] flex items-center justify-center">
        <svg
          ref={containerRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full touch-none cursor-pointer overflow-visible"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <defs>
            <linearGradient id={`arcGrad-${accentColor}`} x1="0%" y1="100%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3F3F46" />
              <stop offset="50%" stopColor={accentColor} />
              <stop offset="100%" stopColor={accentColor} />
            </linearGradient>
            <filter id="knobGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={accentColor} floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Background Track */}
          <path
            d={trackPath}
            fill="none"
            stroke={isDarkMode ? '#27272A' : '#E2E8F0'}
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* Active Progress Arc */}
          {percentage > 0.01 && (
            <path
              d={activePath}
              fill="none"
              stroke={`url(#arcGrad-${accentColor})`}
              strokeWidth="7"
              strokeLinecap="round"
              className="transition-all duration-75"
            />
          )}

          {/* Draggable Knob */}
          <g transform={`translate(${knobPos.x}, ${knobPos.y})`}>
            <circle
              r="12"
              fill={isDarkMode ? '#121214' : '#FFFFFF'}
              stroke={accentColor}
              strokeWidth="3.5"
              filter="url(#knobGlow)"
              className="transition-transform active:scale-125"
            />
            <circle r="4.5" fill={accentColor} />
          </g>
        </svg>

        {/* Center Readout (NO BUTTONS HERE - Absolutely zero overlap with the knob!) */}
        <div className="absolute inset-x-0 bottom-3 flex flex-col items-center justify-center pointer-events-none">
          <span
            className={`text-[11px] font-semibold tracking-wider uppercase mb-0.5 ${
              isDarkMode ? 'text-accent-muted' : 'text-slate-500'
            }`}
          >
            {label}
          </span>
          <div
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight select-none ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            {displayValueOverride !== undefined ? displayValueOverride : `${value}${unit}`}
          </div>
        </div>
      </div>

      {/* Stepper Controls Positioned Cleanly BELOW the Arc */}
      <div className="flex items-center justify-between w-full px-2 mt-3 z-10">
        {/* Decrement Button */}
        <button
          onClick={handleDecrement}
          disabled={value <= min}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-md active:scale-90 border ${
            value <= min
              ? isDarkMode
                ? 'opacity-30 cursor-not-allowed bg-surface/40 border-surface-border text-zinc-600'
                : 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
              : isDarkMode
              ? 'bg-surface hover:bg-surface-hover border-surface-border text-white'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
          }`}
          aria-label="Decrease"
        >
          <Minus size={16} strokeWidth={2.5} />
        </button>

        {/* Stepper Pills / Mini Progress Indicator */}
        {max <= 5 ? (
          <div className="flex items-center gap-2">
            {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((stepVal) => {
              const isCurrent = value === stepVal;
              return (
                <button
                  key={stepVal}
                  onClick={() => {
                    hapticFeedback.tick();
                    onChange(stepVal);
                  }}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    isCurrent ? 'w-7 shadow-sm' : 'w-2.5 opacity-40 hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: isCurrent
                      ? accentColor
                      : isDarkMode
                      ? '#52525B'
                      : '#CBD5E1',
                  }}
                  title={`Level ${stepVal}`}
                />
              );
            })}
          </div>
        ) : (
          <div
            className={`w-28 h-2 rounded-full overflow-hidden border ${
              isDarkMode ? 'bg-zinc-800 border-surface-border' : 'bg-slate-200 border-slate-300'
            }`}
          >
            <div
              className="h-full rounded-full transition-all duration-150"
              style={{
                width: `${percentage * 100}%`,
                backgroundColor: accentColor,
              }}
            />
          </div>
        )}

        {/* Increment Button */}
        <button
          onClick={handleIncrement}
          disabled={value >= max}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-md active:scale-90 border ${
            value >= max
              ? isDarkMode
                ? 'opacity-30 cursor-not-allowed bg-surface/40 border-surface-border text-zinc-600'
                : 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
              : isDarkMode
              ? 'bg-surface hover:bg-surface-hover border-surface-border text-white'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
          }`}
          aria-label="Increase"
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};
