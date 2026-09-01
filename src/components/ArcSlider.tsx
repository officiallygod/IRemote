import React, { useRef, useState, useCallback } from 'react';
import { Minus, Plus } from 'lucide-react';
import { hapticFeedback } from '../services/haptics';

interface ArcSliderProps {
  value: number; // 0 to 100
  onChange: (value: number) => void;
  label?: string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  accentColor?: string; // e.g. '#F8E5A5' or '#C5F5FA'
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
  accentColor = '#F8E5A5',
  displayValueOverride,
  isDarkMode = true,
}) => {
  const containerRef = useRef<SVGSVGElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastHapticValue = useRef(value);

  // Geometry: Upward Dome Arch (∩)
  // Left is 180 degrees, Top is 90 degrees, Right is 0 degrees
  const width = 280;
  const height = 145;
  const cx = width / 2; // 140
  const cy = 130;
  const r = 105;

  const percentage = Math.max(0, Math.min(1, (value - min) / (max - min)));
  
  // In standard math radians:
  // Angle starts at PI (180 deg, left) and goes clockwise to 0 (right) in screen coords:
  // theta = PI - percentage * PI
  const currentTheta = Math.PI - percentage * Math.PI;

  const getPoint = (theta: number) => ({
    x: cx + r * Math.cos(theta),
    y: cy - r * Math.sin(theta),
  });

  // Describe the upward arc path from start (180 deg) to angle theta
  const describeArc = (toTheta: number) => {
    const start = getPoint(Math.PI);
    const end = getPoint(toTheta);
    return `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`;
  };

  const trackPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const activePath = describeArc(Math.max(0, Math.min(Math.PI - 0.001, currentTheta)));
  const knobPos = getPoint(currentTheta);

  // Pointer drag logic
  const handlePointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left - cx;
      const y = cy - (clientY - rect.top); // upward positive

      // Angle in radians from 0 to PI
      let angle = Math.atan2(y, -x); // 0 at left (-x), PI at right (+x)
      if (angle < 0) {
        angle = x > 0 ? Math.PI : 0;
      }

      let ratio = angle / Math.PI;
      ratio = Math.max(0, Math.min(1, ratio));

      let rawVal = min + ratio * (max - min);
      let steppedVal = Math.round(rawVal / step) * step;
      steppedVal = Math.max(min, Math.min(max, steppedVal));

      if (steppedVal !== value) {
        if (Math.abs(steppedVal - lastHapticValue.current) >= 5 || steppedVal === min || steppedVal === max) {
          hapticFeedback.tick();
          lastHapticValue.current = steppedVal;
        }
        onChange(steppedVal);
      }
    },
    [cx, cy, max, min, onChange, step, value]
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
    const next = Math.max(min, value - step * (max > 10 ? 5 : 1));
    hapticFeedback.tick();
    onChange(next);
  };

  const handleIncrement = () => {
    const next = Math.min(max, value + step * (max > 10 ? 5 : 1));
    hapticFeedback.tick();
    onChange(next);
  };

  return (
    <div className="relative flex flex-col items-center select-none py-1 w-full max-w-[300px] mx-auto">
      <svg
        ref={containerRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto touch-none cursor-pointer overflow-visible"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <defs>
          <linearGradient id={`arcGrad-${accentColor}`} x1="0%" y1="100%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4A4A52" />
            <stop offset="40%" stopColor={accentColor} />
            <stop offset="100%" stopColor={accentColor} />
          </linearGradient>
          <filter id="knobGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={accentColor} floodOpacity="0.8" />
          </filter>
        </defs>

        {/* Background Track (Upward Dome Arch ∩) */}
        <path
          d={trackPath}
          fill="none"
          stroke={isDarkMode ? '#27272A' : '#E2E8F0'}
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Active Progress Arc */}
        {percentage > 0.01 && (
          <path
            d={activePath}
            fill="none"
            stroke={`url(#arcGrad-${accentColor})`}
            strokeWidth="6"
            strokeLinecap="round"
            className="transition-all duration-75"
          />
        )}

        {/* Draggable Knob */}
        <g transform={`translate(${knobPos.x}, ${knobPos.y})`}>
          <circle
            r="11"
            fill={isDarkMode ? '#121214' : '#FFFFFF'}
            stroke={accentColor}
            strokeWidth="3"
            filter="url(#knobGlow)"
            className="transition-transform active:scale-125"
          />
          <circle r="4" fill={accentColor} />
        </g>
      </svg>

      {/* Center Readout & Flanking Buttons Inside the Upward Arch */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-8 pointer-events-none">
        <span
          className={`text-[11px] font-medium tracking-wide mb-0.5 ${
            isDarkMode ? 'text-[#8E8E93]' : 'text-slate-500'
          }`}
        >
          {label}
        </span>

        <div className="flex items-center justify-between w-[220px] px-1 pointer-events-auto">
          {/* Decrement Button */}
          <button
            onClick={handleDecrement}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-md active:scale-90 border ${
              isDarkMode
                ? 'bg-surface/90 hover:bg-surface-hover border-surface-border text-white'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
            }`}
            aria-label="Decrease"
          >
            <Minus size={16} strokeWidth={2.5} />
          </button>

          {/* Big Bold Value */}
          <div
            className={`text-3xl font-extrabold tracking-tight select-none ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            {displayValueOverride !== undefined ? displayValueOverride : `${value}${unit}`}
          </div>

          {/* Increment Button */}
          <button
            onClick={handleIncrement}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-md active:scale-90 border ${
              isDarkMode
                ? 'bg-surface/90 hover:bg-surface-hover border-surface-border text-white'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
            }`}
            aria-label="Increase"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};
