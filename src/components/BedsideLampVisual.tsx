import React from 'react';
import { Power } from 'lucide-react';
import { motion } from 'framer-motion';
import { hapticFeedback } from '../services/haptics';

interface BedsideLampVisualProps {
  isOn: boolean;
  onTogglePower: () => void;
  title: string;
  subtitle: string;
  color?: string; // e.g. '#F8E5A5' or '#38BDF8'
  brightness?: number; // 0 to 100
  isDarkMode?: boolean;
}

export const BedsideLampVisual: React.FC<BedsideLampVisualProps> = ({
  isOn,
  onTogglePower,
  title,
  subtitle,
  color = '#F8E5A5',
  brightness = 75,
  isDarkMode = true,
}) => {
  const handlePowerClick = () => {
    hapticFeedback.heavy();
    onTogglePower();
  };

  const glowOpacity = isOn ? Math.max(0.2, (brightness / 100) * 0.85) : 0;

  return (
    <div className="relative flex flex-col items-center justify-center w-full py-4 select-none">
      {/* Soft Ambient Radial Wall Glow (Image 2) */}
      <motion.div
        animate={{
          opacity: glowOpacity,
          scale: isOn ? 1 : 0.85,
        }}
        transition={{ duration: 0.35 }}
        className="absolute top-6 w-[260px] h-[220px] rounded-full pointer-events-none blur-3xl -z-10"
        style={{
          background: `radial-gradient(circle, ${color} 10%, ${color}70 45%, transparent 75%)`,
        }}
      />

      {/* Bedside Night Lamp Model (Matching Image 2: Three O Touch Bedside Night Light) */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Lamp Body Container */}
        <div className="relative flex flex-col items-center">
          {/* Top Frosted Translucent Dome Cover */}
          <div
            className="w-32 h-36 rounded-t-[44px] rounded-b-none relative flex flex-col items-center justify-start pt-2 transition-all duration-300 shadow-2xl overflow-hidden border border-white/20"
            style={{
              background: isOn
                ? `linear-gradient(180deg, #FFFFFF 0%, ${color} 45%, ${color}CC 100%)`
                : isDarkMode
                ? 'linear-gradient(180deg, #3F3F46 0%, #27272A 100%)'
                : 'linear-gradient(180deg, #F1F5F9 0%, #CBD5E1 100%)',
              boxShadow: isOn
                ? `0 0 45px 8px ${color}60, inset 0 0 25px rgba(255,255,255,0.7)`
                : '0 8px 24px rgba(0,0,0,0.2)',
            }}
          >
            {/* Top Touch Sensor Ring (Image 2) */}
            <div
              onClick={handlePowerClick}
              className={`w-10 h-3 rounded-full cursor-pointer transition-all border flex items-center justify-center ${
                isOn
                  ? 'bg-black/30 border-white/40 shadow-inner'
                  : isDarkMode
                  ? 'bg-[#18181B] border-zinc-700'
                  : 'bg-slate-300 border-slate-400'
              }`}
              title="Tap to toggle power"
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isOn ? 'bg-white drop-shadow-[0_0_4px_#FFF]' : 'bg-zinc-600'
                }`}
              />
            </div>

            {/* Inner Soft Filament / LED Core Glow */}
            <div
              className="w-20 h-20 rounded-full mt-4 blur-md opacity-80"
              style={{
                backgroundColor: isOn ? '#FFFFFF' : 'transparent',
              }}
            />
          </div>

          {/* Lower Base Ring (Image 2: Soft Light Grey/Blue Base) */}
          <div
            className={`w-32 h-10 rounded-b-2xl border-t transition-colors shadow-lg ${
              isDarkMode
                ? 'bg-[#18181C] border-white/10'
                : 'bg-slate-200 border-slate-300'
            }`}
          />
        </div>

        {/* Floating Center Power Button */}
        <div className="mt-4 flex flex-col items-center">
          <button
            onClick={handlePowerClick}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl active:scale-90 border ${
              isOn
                ? 'bg-[#18181B] text-white border-white/20'
                : isDarkMode
                ? 'bg-[#1A1A1E] text-zinc-600 border-zinc-800'
                : 'bg-white text-slate-400 border-slate-200'
            }`}
            style={{
              boxShadow: isOn
                ? `0 0 20px -2px ${color}80, 0 8px 16px rgba(0,0,0,0.4)`
                : '0 4px 12px rgba(0,0,0,0.1)',
            }}
            aria-label="Toggle Night Lamp Power"
          >
            <Power
              size={20}
              strokeWidth={2.5}
              className={isOn ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : ''}
            />
          </button>
        </div>
      </div>

      {/* Title & Subtitle */}
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
