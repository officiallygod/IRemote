import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Flame, Sun, Lightbulb, Fan } from 'lucide-react';
import { hapticFeedback } from '../services/haptics';

export type ActiveView = 'dashboard' | 'sunset-lamp' | 'bedside-lamp' | 'smart-fan' | 'fireplace';

interface FloatingNavDockProps {
  activeView: ActiveView;
  onChangeView: (view: ActiveView) => void;
  isDarkMode?: boolean;
}

interface NavItem {
  id: ActiveView;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accentGlow: string;
}

export const FloatingNavDock: React.FC<FloatingNavDockProps> = ({
  activeView,
  onChangeView,
  isDarkMode = true,
}) => {
  const items: NavItem[] = [
    { id: 'dashboard', label: 'Home', icon: Home, accentGlow: 'rgba(255,255,255,0.25)' },
    { id: 'sunset-lamp', label: 'Sunset', icon: Sun, accentGlow: 'rgba(251,146,60,0.35)' },
    { id: 'bedside-lamp', label: 'Bedside', icon: Lightbulb, accentGlow: 'rgba(251,191,36,0.35)' },
    { id: 'smart-fan', label: 'Fan', icon: Fan, accentGlow: 'rgba(56,189,248,0.35)' },
    { id: 'fireplace', label: 'Flame', icon: Flame, accentGlow: 'rgba(249,115,22,0.4)' },
  ];

  return (
    <nav
      aria-label="App Navigation Dock"
      className="fixed bottom-6 inset-x-0 z-40 flex justify-center pointer-events-none px-4 select-none pb-[env(safe-area-inset-bottom)]"
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className={`pointer-events-auto relative flex items-center gap-1 p-1.5 rounded-full border shadow-2xl backdrop-blur-2xl transition-colors duration-300 ${
          isDarkMode
            ? 'bg-[#181A1D]/90 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)]'
            : 'bg-white/90 border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.12)]'
        }`}
      >
        {items.map((item) => {
          const isActive = activeView === item.id;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.id}
              layout
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              onClick={() => {
                hapticFeedback.click();
                onChangeView(item.id);
              }}
              whileTap={{ scale: 0.92 }}
              className={`relative flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-full z-10 transition-colors duration-200 outline-none focus:outline-none ${
                isActive
                  ? isDarkMode
                    ? 'text-black font-semibold'
                    : 'text-white font-semibold'
                  : isDarkMode
                  ? 'text-zinc-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title={item.label}
              aria-label={item.label}
            >
              {/* Fluid sliding pill background with layoutId spring physics */}
              {isActive && (
                <motion.div
                  layoutId="active-nav-pill"
                  className={`absolute inset-0 rounded-full ${
                    isDarkMode ? 'bg-white' : 'bg-slate-900'
                  }`}
                  style={{
                    boxShadow: isDarkMode
                      ? `0 4px 20px ${item.accentGlow}, 0 2px 6px rgba(0,0,0,0.4)`
                      : '0 4px 15px rgba(0,0,0,0.2)',
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 380,
                    damping: 30,
                  }}
                />
              )}

              {/* Icon */}
              <div className="relative z-10 flex items-center justify-center">
                <Icon size={18} />
              </div>

              {/* Fluid animated label expansion */}
              <AnimatePresence initial={false}>
                {isActive && (
                  <motion.span
                    key={`label-${item.id}`}
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 30,
                      opacity: { duration: 0.15 },
                    }}
                    className="relative z-10 text-xs tracking-tight whitespace-nowrap overflow-hidden pr-0.5"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </motion.div>
    </nav>
  );
};
