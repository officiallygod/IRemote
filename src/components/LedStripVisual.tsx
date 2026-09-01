import React from 'react';
import { Power } from 'lucide-react';
import { motion } from 'framer-motion';
import { hapticFeedback } from '../services/haptics';

interface LedStripVisualProps {
  isOn: boolean;
  onTogglePower: () => void;
  title: string;
  subtitle: string;
  color?: string;
  brightness?: number;
  isDarkMode?: boolean;
}

export const LedStripVisual: React.FC<LedStripVisualProps> = ({
  isOn,
  onTogglePower,
  title,
  subtitle,
  color = '#38BDF8',
  brightness = 75,
  isDarkMode = true,
}) => {
  const handlePowerClick = () => {
    hapticFeedback.heavy();
    onTogglePower();
  };

  const glowOpacity = isOn ? Math.max(0.15, (brightness / 100) * 0.8) : 0;

  return (
    <div className="relative flex flex-col items-center justify-center w-full py-6 select-none">
      {/* Dynamic Ambient Wall Back-Glow */}
      <motion.div
        animate={{
          opacity: glowOpacity,
          scale: isOn ? 1 : 0.9,
        }}
        transition={{ duration: 0.3 }}
        className="absolute top-10 w-[280px] h-[100px] rounded-full pointer-events-none blur-3xl -z-10"
        style={{
          backgroundColor: color,
        }}
      />

      {/* Floating Modern LED Aluminum Profile Bar */}
      <div
        className={`w-64 h-7 rounded-2xl flex items-center justify-between px-3 relative border transition-all duration-300 shadow-xl ${
          isDarkMode
            ? 'bg-[#1E1E22] border-zinc-800'
            : 'bg-white border-slate-200'
        }`}
        style={{
          boxShadow: isOn
            ? `0 0 25px 5px ${color}50, 0 10px 20px rgba(0,0,0,0.3)`
            : '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        {/* Glowing Optical Diffuser Strip */}
        <div
          className="flex-1 h-2 rounded-full transition-all duration-300 mr-3"
          style={{
            backgroundColor: isOn ? color : isDarkMode ? '#27272A' : '#E2E8F0',
            boxShadow: isOn ? `0 0 12px 2px ${color}` : 'none',
          }}
        />

        {/* Integrated Power Switch */}
        <button
          onClick={handlePowerClick}
          className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${
            isOn
              ? 'bg-white text-black shadow-sm'
              : isDarkMode
              ? 'bg-zinc-800 text-zinc-500'
              : 'bg-slate-200 text-slate-500'
          }`}
          aria-label="Toggle Strip Power"
        >
          <Power size={11} strokeWidth={2.5} />
        </button>
      </div>

      {/* Floating Center Power Button */}
      <div className="mt-6 flex flex-col items-center">
        <button
          onClick={handlePowerClick}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl active:scale-90 border ${
            isOn
              ? 'bg-[#18181B] text-white border-white/20'
              : isDarkMode
              ? 'bg-[#1A1A1E] text-zinc-600 border-zinc-800'
              : 'bg-white text-slate-400 border-slate-200'
          }`}
          style={{
            boxShadow: isOn
              ? `0 0 25px -2px ${color}80, 0 8px 16px rgba(0,0,0,0.4)`
              : '0 4px 12px rgba(0,0,0,0.1)',
          }}
          aria-label="Toggle LED Strip Power"
        >
          <Power
            size={24}
            strokeWidth={2.5}
            className={isOn ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : ''}
          />
        </button>
      </div>

      {/* Title & Subtitle */}
      <div className="flex flex-col items-center mt-4 text-center z-10">
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
