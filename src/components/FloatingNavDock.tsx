import React from 'react';
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
  icon: React.ReactNode;
}

export const FloatingNavDock: React.FC<FloatingNavDockProps> = ({
  activeView,
  onChangeView,
  isDarkMode = true,
}) => {
  const items: NavItem[] = [
    { id: 'dashboard', label: 'Home', icon: <Home size={18} /> },
    { id: 'sunset-lamp', label: 'Sunset', icon: <Sun size={18} /> },
    { id: 'bedside-lamp', label: 'Bedside', icon: <Lightbulb size={18} /> },
    { id: 'smart-fan', label: 'Fan', icon: <Fan size={18} /> },
    { id: 'fireplace', label: 'Flame', icon: <Flame size={18} /> },
  ];

  return (
    <nav
      aria-label="App Navigation Dock"
      className="fixed bottom-5 inset-x-0 z-40 flex justify-center pointer-events-none px-4 select-none"
    >
      <div
        className={`pointer-events-auto flex items-center gap-1 p-1.5 rounded-full border shadow-2xl backdrop-blur-2xl transition-all duration-300 ${
          isDarkMode
            ? 'bg-[#181A1D]/90 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)]'
            : 'bg-white/90 border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.12)]'
        }`}
      >
        {items.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                hapticFeedback.click();
                onChangeView(item.id);
              }}
              className={`relative flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-full transition-all duration-300 active:scale-90 ${
                isActive
                  ? isDarkMode
                    ? 'bg-white text-black shadow-md font-bold'
                    : 'bg-slate-900 text-white shadow-md font-bold'
                  : isDarkMode
                  ? 'text-zinc-400 hover:text-white hover:bg-white/5'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={item.label}
              aria-label={item.label}
            >
              {item.icon}
              {isActive && (
                <span className="text-xs tracking-tight animate-fade-in pr-0.5">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
