import React from 'react';
import { Power, Lightbulb, Fan, Flame, Sun, ArrowUpRight } from 'lucide-react';
import { hapticFeedback } from '../services/haptics';

interface DeviceCardProps {
  id: string;
  deviceIndexLabel: string; // e.g. "Device 1"
  name: string; // e.g. "Sunset Lamp"
  type: 'light' | 'fan' | 'sunset' | 'strip' | 'fireplace';
  isOn: boolean;
  onTogglePower: (e: React.MouseEvent) => void;
  onClick: () => void;
  badgeText?: string;
  accentColor?: string;
  isDarkMode?: boolean;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  deviceIndexLabel,
  name,
  type,
  isOn,
  onTogglePower,
  onClick,
  badgeText,
  accentColor = '#C5F5FA',
  isDarkMode = true,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'fan':
        return <Fan size={18} className={isOn ? 'animate-spin' : ''} style={{ animationDuration: '3s' }} />;
      case 'sunset':
        return <Sun size={18} />;
      case 'fireplace':
        return <Flame size={18} className={isOn ? 'text-amber-600 animate-pulse' : ''} />;
      default:
        return <Lightbulb size={18} />;
    }
  };

  const handlePowerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticFeedback.heavy();
    onTogglePower(e);
  };

  return (
    <div
      onClick={() => {
        hapticFeedback.click();
        onClick();
      }}
      className={`relative p-4 rounded-3xl cursor-pointer transition-all duration-300 flex flex-col justify-between border ${
        isOn && type === 'fireplace'
          ? 'bg-[#FED7AA] text-[#121214] border-[#FDBA74] shadow-glow-amber'
          : isOn && type === 'sunset'
          ? 'bg-[#F8E5A5] text-[#121214] border-[#F8E5A5] shadow-glow-amber'
          : isOn && (type === 'light' || type === 'strip')
          ? 'bg-[#C5F5FA] text-[#121214] border-[#C5F5FA] shadow-glow-cyan'
          : isOn && type === 'fan'
          ? 'bg-[#E0F2FE] text-[#121214] border-[#BAE6FD] shadow-md'
          : isDarkMode
          ? 'bg-surface text-white border-surface-border hover:border-white/20'
          : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 shadow-sm'
      }`}
    >
      {/* Header: Icon + Power Toggle */}
      <div className="flex items-center justify-between mb-5">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
            isOn
              ? 'bg-black/15 text-black'
              : isDarkMode
              ? 'bg-[#18181B] text-accent-muted'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          {getIcon()}
        </div>

        {/* Circular Power Button */}
        <button
          onClick={handlePowerClick}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${
            isOn
              ? 'bg-[#121214] text-white shadow-md'
              : isDarkMode
              ? 'bg-[#18181B] text-accent-muted hover:text-white border border-surface-border'
              : 'bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200'
          }`}
          aria-label={`Toggle ${name}`}
        >
          <Power size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* Footer: Device Label, Name, and optional badge */}
      <div>
        <div
          className={`text-[11px] font-semibold tracking-wide uppercase mb-0.5 ${
            isOn ? 'text-black/60' : isDarkMode ? 'text-accent-muted' : 'text-slate-500'
          }`}
        >
          {deviceIndexLabel}
        </div>
        <div className="flex items-center justify-between">
          <h4
            className={`font-bold text-sm tracking-tight truncate ${
              isOn ? 'text-black' : isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            {name}
          </h4>
          <ArrowUpRight
            size={14}
            className={`opacity-50 transition-opacity ${
              isOn ? 'text-black' : isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          />
        </div>

        {badgeText && (
          <div
            className={`mt-2 text-[10px] font-semibold px-2.5 py-0.5 rounded-full inline-block ${
              isOn
                ? 'bg-black/10 text-black'
                : isDarkMode
                ? 'bg-[#18181B] text-accent-muted border border-surface-border'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {badgeText}
          </div>
        )}
      </div>
    </div>
  );
};
