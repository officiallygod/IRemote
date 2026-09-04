import React from 'react';
import { Power } from 'lucide-react';
import { motion } from 'framer-motion';
import { hapticFeedback } from '../services/haptics';

interface SunsetProjectorVisualProps {
  isOn: boolean;
  onTogglePower: () => void;
  title: string;
  subtitle: string;
  color?: string; // e.g. '#FB923C' or '#F8E5A5'
  brightness?: number; // 0 to 100
  isDarkMode?: boolean;
}

function getSunsetGradients(hexColor: string) {
  let c = hexColor.replace('#', '');
  if (c.length === 3) c = c.split('').map((ch) => ch + ch).join('');
  const num = parseInt(c, 16) || 0xfb923c;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;

  // Luminous white-tinted center core
  const coreR = Math.min(255, Math.round(r * 0.35 + 255 * 0.65));
  const coreG = Math.min(255, Math.round(g * 0.35 + 255 * 0.65));
  const coreB = Math.min(255, Math.round(b * 0.35 + 255 * 0.65));
  const core = `rgb(${coreR}, ${coreG}, ${coreB})`;

  // Inner vibrant glow
  const innerR = Math.min(255, Math.round(r * 0.85 + 255 * 0.15));
  const innerG = Math.min(255, Math.round(g * 0.85 + 255 * 0.15));
  const innerB = Math.min(255, Math.round(b * 0.85 + 255 * 0.15));
  const inner = `rgb(${innerR}, ${innerG}, ${innerB})`;

  // Primary selected color
  const main = `rgb(${r}, ${g}, ${b})`;

  // Chromatic outer ring (optical dispersion)
  const outerR = Math.min(255, Math.max(0, Math.round(r * 0.65 + b * 0.35)));
  const outerG = Math.min(255, Math.max(0, Math.round(g * 0.55 + r * 0.35)));
  const outerB = Math.min(255, Math.max(0, Math.round(b * 0.75 + g * 0.25)));
  const outer = `rgb(${outerR}, ${outerG}, ${outerB})`;

  const rim = `rgba(${r}, ${g}, ${b}, 0.35)`;
  const glow = `rgba(${r}, ${g}, ${b}, 0.55)`;

  return { core, inner, main, outer, rim, glow };
}

export const SunsetProjectorVisual: React.FC<SunsetProjectorVisualProps> = ({
  isOn,
  onTogglePower,
  title,
  subtitle,
  color = '#FB923C',
  brightness = 85,
  isDarkMode = true,
}) => {
  const handlePowerClick = () => {
    hapticFeedback.heavy();
    onTogglePower();
  };

  const grad = getSunsetGradients(color);
  const haloOpacity = isOn ? Math.max(0.3, (brightness / 100) * 0.98) : 0;
  const haloScale = isOn ? 0.9 + (brightness / 100) * 0.2 : 0.75;

  return (
    <div className="relative flex flex-col items-center justify-center w-full py-4 select-none overflow-visible">
      {/* 1. Luminous Circular Sun Projection Disc with Multi-Shade Chromatic Dispersion */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-[310px] h-[310px] pointer-events-none -z-10 flex items-center justify-center">
        <motion.div
          animate={{
            opacity: haloOpacity,
            scale: haloScale,
          }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full h-full rounded-full transition-all duration-500 origin-center"
          style={{
            background: `radial-gradient(circle, ${grad.core} 0%, ${grad.inner} 25%, ${grad.main} 55%, ${grad.outer} 78%, ${grad.rim} 90%, transparent 99%)`,
            filter: 'blur(10px)',
            boxShadow: isOn ? `0 0 80px 28px ${grad.glow}` : 'none',
          }}
        />

        {/* Ambient Wall Light Spill */}
        {isOn && (
          <div
            className="absolute inset-0 rounded-full blur-3xl opacity-60 pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${grad.main} 20%, ${grad.outer} 60%, transparent 80%)`,
            }}
          />
        )}
      </div>

      {/* 2. Stand Projector Lamp (Matching Image 1: Tabletop stand with circular head) */}
      <div className="relative z-10 flex flex-col items-center mt-6">
        {/* Projector Head with Optical Convex Lens */}
        <div className="relative flex items-center justify-center">
          {/* Black Outer Casing */}
          <div
            className={`w-20 h-20 rounded-full border-2 transition-all duration-300 flex items-center justify-center shadow-2xl relative ${
              isOn
                ? 'border-white/30 bg-[#18181B]'
                : isDarkMode
                ? 'border-zinc-800 bg-[#121214]'
                : 'border-slate-300 bg-white'
            }`}
            style={{
              boxShadow: isOn
                ? `0 0 35px 5px ${grad.glow}, inset 0 0 15px rgba(255,255,255,0.4)`
                : '0 8px 20px rgba(0,0,0,0.3)',
            }}
          >
            {/* Convex Crystal Lens */}
            <div
              className="w-16 h-16 rounded-full transition-all duration-300 flex items-center justify-center relative overflow-hidden"
              style={{
                background: isOn
                  ? `radial-gradient(circle at 40% 40%, ${grad.core} 0%, ${grad.main} 55%, ${grad.outer} 90%)`
                  : isDarkMode
                  ? 'radial-gradient(circle at 40% 40%, #3F3F46 0%, #18181B 80%)'
                  : 'radial-gradient(circle at 40% 40%, #E2E8F0 0%, #94A3B8 80%)',
              }}
            >
              {/* Glass Reflection Highlight */}
              <div className="absolute top-1.5 left-2.5 w-4 h-2 rounded-full bg-white/60 blur-[1px] rotate-[-25deg]" />

              {/* Centered Minimal Power Toggle Button on Lens */}
              <button
                onClick={handlePowerClick}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-85 shadow-lg ${
                  isOn
                    ? 'bg-black/60 text-white border border-white/40 backdrop-blur-sm'
                    : isDarkMode
                    ? 'bg-[#18181B] text-zinc-500 border border-zinc-700'
                    : 'bg-white text-slate-400 border border-slate-200'
                }`}
                aria-label="Toggle Sunset Lamp Power"
              >
                <Power
                  size={18}
                  strokeWidth={2.5}
                  className={isOn ? 'text-white drop-shadow-[0_0_6px_#FFF]' : ''}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Pivot Joint */}
        <div className="w-3.5 h-2.5 bg-gradient-to-b from-[#71717A] to-[#27272A] rounded-sm -mt-0.5" />

        {/* Chrome Extension Rod (Image 1) */}
        <div
          className="w-2.5 h-16 shadow-md"
          style={{
            background: 'linear-gradient(90deg, #27272A 0%, #E4E4E7 45%, #FFFFFF 55%, #3F3F46 100%)',
          }}
        />

        {/* Circular Weighted Base (Image 1) */}
        <div
          className={`w-28 h-5 rounded-full shadow-2xl transition-colors border ${
            isDarkMode
              ? 'bg-gradient-to-b from-[#27272A] to-[#09090B] border-zinc-800'
              : 'bg-gradient-to-b from-slate-200 to-slate-400 border-slate-300'
          }`}
        />
      </div>

      {/* Device Title & Mood Subtitle */}
      <div className="flex flex-col items-center mt-3 text-center z-10">
        <span
          className={`text-[11px] uppercase tracking-widest font-semibold mb-0.5 ${
            isDarkMode ? 'text-accent-muted' : 'text-slate-500'
          }`}
        >
          {subtitle}
        </span>
        <h2
          className={`text-xl font-bold tracking-tight ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}
        >
          {title}
        </h2>
      </div>
    </div>
  );
};
