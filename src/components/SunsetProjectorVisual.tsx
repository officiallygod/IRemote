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

  const haloOpacity = isOn ? Math.max(0.3, (brightness / 100) * 0.98) : 0;
  const haloScale = isOn ? 0.9 + (brightness / 100) * 0.2 : 0.75;

  return (
    <div className="relative flex flex-col items-center justify-center w-full py-4 select-none overflow-visible">
      {/* 1. Luminous Circular Sun Projection Disc (Matching Image 1) */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-[310px] h-[310px] pointer-events-none -z-10 flex items-center justify-center">
        <motion.div
          animate={{
            opacity: haloOpacity,
            scale: haloScale,
          }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full h-full rounded-full transition-all duration-500 origin-center"
          style={{
            background: `radial-gradient(circle, #EF4444 0%, #F97316 35%, #FBBF24 70%, #FDE047 88%, transparent 98%)`,
            filter: 'blur(10px)',
            boxShadow: isOn ? `0 0 70px 25px rgba(249, 115, 22, 0.45)` : 'none',
          }}
        />

        {/* Ambient Wall Light Spill */}
        {isOn && (
          <div
            className="absolute inset-0 rounded-full blur-3xl opacity-60 pointer-events-none"
            style={{
              background: `radial-gradient(circle, #F97316 20%, #EF4444 60%, transparent 80%)`,
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
                ? `0 0 35px 5px rgba(249, 115, 22, 0.7), inset 0 0 15px rgba(255,255,255,0.4)`
                : '0 8px 20px rgba(0,0,0,0.3)',
            }}
          >
            {/* Convex Crystal Lens */}
            <div
              className="w-16 h-16 rounded-full transition-all duration-300 flex items-center justify-center relative overflow-hidden"
              style={{
                background: isOn
                  ? `radial-gradient(circle at 40% 40%, #FEF08A 0%, #F97316 55%, #DC2626 90%)`
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
