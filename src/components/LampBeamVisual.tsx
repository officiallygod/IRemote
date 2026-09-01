import React from 'react';
import { Power } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { hapticFeedback } from '../services/haptics';

interface LampBeamVisualProps {
  isOn: boolean;
  onTogglePower: () => void;
  title: string;
  subtitle: string;
  color?: string; // e.g. '#F8E5A5' or '#C5F5FA'
  brightness?: number; // 0 to 100
}

export const LampBeamVisual: React.FC<LampBeamVisualProps> = ({
  isOn,
  onTogglePower,
  title,
  subtitle,
  color = '#F8E5A5',
  brightness = 75,
}) => {
  const handlePowerClick = () => {
    hapticFeedback.heavy();
    onTogglePower();
  };

  const beamOpacity = isOn ? (brightness / 100) * 0.45 : 0;

  return (
    <div className="relative flex flex-col items-center justify-center w-full pt-4 pb-2 select-none">
      {/* Hanging Cord */}
      <div className="w-[1.5px] h-10 bg-[#3F3F46]" />

      {/* Pendant Wooden Cone Lamp Shade */}
      <div className="relative z-20 flex flex-col items-center">
        {/* Lamp Shade Body */}
        <div
          className="w-28 h-16 transition-all duration-300 relative shadow-2xl"
          style={{
            clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)',
            background: 'linear-gradient(180deg, #A88665 0%, #7E5F43 65%, #563E2A 100%)',
          }}
        >
          {/* Subtle wood texture / shine lines */}
          <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-transparent via-white to-transparent" />
        </div>

        {/* Lamp Shade Rim & Inner Bulb Glow */}
        <div
          className="w-28 h-5 -mt-2 rounded-[50%] transition-all duration-500 relative flex items-center justify-center border-t border-[#463121]"
          style={{
            backgroundColor: isOn ? color : '#2E2218',
            boxShadow: isOn
              ? `0 0 25px 6px ${color}, inset 0 0 12px #FFFFFF`
              : 'none',
          }}
        />
      </div>

      {/* Downward Conical Light Beam */}
      <div className="relative w-full flex flex-col items-center pointer-events-none -mt-3">
        <motion.div
          animate={{
            opacity: beamOpacity,
            scale: isOn ? 1 : 0.95,
          }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-[320px] h-[190px] transition-all duration-500 origin-top"
          style={{
            clipPath: 'polygon(41% 0%, 59% 0%, 100% 100%, 0% 100%)',
            background: `radial-gradient(ellipse at 50% 0%, ${color} 0%, rgba(24,24,27,0) 80%)`,
            filter: 'blur(8px)',
          }}
        />

        {/* Floor Ambient Reflection Pool */}
        <motion.div
          animate={{
            opacity: isOn ? (brightness / 100) * 0.35 : 0,
          }}
          transition={{ duration: 0.4 }}
          className="absolute bottom-0 w-[260px] h-12 rounded-[50%] -z-10"
          style={{
            background: `radial-gradient(ellipse, ${color} 0%, transparent 70%)`,
            filter: 'blur(16px)',
          }}
        />
      </div>

      {/* Floating Center Power Button */}
      <div className="absolute top-[125px] z-30 flex flex-col items-center pointer-events-auto">
        <button
          onClick={handlePowerClick}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl active:scale-90 ${
            isOn
              ? 'bg-[#18181B]/90 border border-white/20 text-white'
              : 'bg-[#1E1E22]/80 border border-white/5 text-[#71717A]'
          }`}
          style={{
            boxShadow: isOn
              ? `0 0 20px -2px ${color}80, 0 8px 16px rgba(0,0,0,0.5)`
              : '0 4px 12px rgba(0,0,0,0.3)',
          }}
          aria-label="Toggle Power"
        >
          <Power
            size={24}
            strokeWidth={2.5}
            className={`transition-all duration-300 ${
              isOn ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'text-[#71717A]'
            }`}
          />
        </button>
      </div>

      {/* Device Name & Zone Labels */}
      <div className="flex flex-col items-center mt-6 text-center z-10">
        <span className="text-xs uppercase tracking-widest text-[#8E8E93] font-medium mb-1">
          {subtitle}
        </span>
        <h2 className="text-xl font-bold tracking-tight text-[#FCFCFC]">
          {title}
        </h2>
      </div>
    </div>
  );
};
