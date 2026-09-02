import React, { useState } from 'react';
import { Power, SunMedium, Sun, Sparkles } from 'lucide-react';
import { irBlaster } from '../services/irBlaster';
import { hapticFeedback } from '../services/haptics';

interface PhysicalOvalRemoteProps {
  deviceName?: string;
  isDarkMode?: boolean;
  onColorChange?: (colorHex: string) => void;
}

// Support the 4 major address families for this oval remote
export type RemoteAddressFamily = '00EF' | '00F7' | 'FF00' | 'EF00';

interface RemoteKeyDef {
  id: string;
  name: string;
  // Commands for each address family:
  // 00EF: Extended NEC (00EF + CMD + ~CMD) with standard commands 0x00..0x17
  // 00F7: Standard RGB (00F7 + CMD + ~CMD) with standard 24-key matrix
  // FF00: Generic RGB (00FF + CMD + ~CMD)
  // EF00: Raw reversed address
  cmdEF: number; // e.g. 0x03 for ON
  cmdF7: number; // e.g. 0xC0 for ON
  cmdFF: number; // e.g. 0x02 for ON
  colorHex?: string;
}

export const PhysicalOvalRemote: React.FC<PhysicalOvalRemoteProps> = ({
  deviceName = 'Sunset Lamp',
  isDarkMode = true,
  onColorChange,
}) => {
  const [addressFamily, setAddressFamily] = useState<RemoteAddressFamily>(() => {
    return (localStorage.getItem('iremote_oval_address') as RemoteAddressFamily) || '00EF';
  });

  const handleSetAddress = (family: RemoteAddressFamily) => {
    hapticFeedback.tick();
    setAddressFamily(family);
    localStorage.setItem('iremote_oval_address', family);
  };

  // Helper to build 32-bit NEC hex code from address and command
  const getHexCode = (cmdEF: number, cmdF7: number, cmdFF: number): string => {
    let addr = '00EF';
    let cmd = cmdEF;

    if (addressFamily === '00F7') {
      addr = '00F7';
      cmd = cmdF7;
    } else if (addressFamily === 'FF00') {
      addr = '00FF';
      cmd = cmdFF;
    } else if (addressFamily === 'EF00') {
      addr = 'EF00';
      cmd = cmdEF;
    }

    const inv = (~cmd) & 0xff;
    return `${addr}${cmd.toString(16).padStart(2, '0').toUpperCase()}${inv.toString(16).padStart(2, '0').toUpperCase()}`;
  };

  const transmitKey = (name: string, cmdEF: number, cmdF7: number, cmdFF: number, colorHex?: string) => {
    hapticFeedback.click();
    const hex = getHexCode(cmdEF, cmdF7, cmdFF);
    irBlaster.sendNec(hex, name, deviceName);
    if (colorHex && onColorChange) {
      onColorChange(colorHex);
    }
  };

  // 12 Bottom colors (3 columns x 4 rows) exactly matching user's photo
  const COLOR_GRID: Array<{ name: string; color: string; cmdEF: number; cmdF7: number; cmdFF: number }> = [
    // Row 1
    { name: 'Red-Orange', color: '#F97316', cmdEF: 0x08, cmdF7: 0x10, cmdFF: 0x08 },
    { name: 'Light Green', color: '#34D399', cmdEF: 0x09, cmdF7: 0x90, cmdFF: 0x09 },
    { name: 'Deep Blue', color: '#1D4ED8', cmdEF: 0x0A, cmdF7: 0x50, cmdFF: 0x0A },

    // Row 2
    { name: 'Orange', color: '#FB923C', cmdEF: 0x0C, cmdF7: 0x30, cmdFF: 0x0C },
    { name: 'Cyan Aqua', color: '#06B6D4', cmdEF: 0x0D, cmdF7: 0xB0, cmdFF: 0x0D },
    { name: 'Indigo Purple', color: '#6366F1', cmdEF: 0x0E, cmdF7: 0x70, cmdFF: 0x0E },

    // Row 3
    { name: 'Amber Glow', color: '#FBBF24', cmdEF: 0x10, cmdF7: 0x08, cmdFF: 0x10 },
    { name: 'Sky Blue', color: '#38BDF8', cmdEF: 0x11, cmdF7: 0x88, cmdFF: 0x11 },
    { name: 'Violet', color: '#8B5CF6', cmdEF: 0x12, cmdF7: 0x48, cmdFF: 0x12 },

    // Row 4
    { name: 'Warm Yellow', color: '#FACC15', cmdEF: 0x14, cmdF7: 0x28, cmdFF: 0x14 },
    { name: 'Ocean Aqua', color: '#0EA5E9', cmdEF: 0x15, cmdF7: 0xA8, cmdFF: 0x15 },
    { name: 'Magenta Pink', color: '#EC4899', cmdEF: 0x16, cmdF7: 0x68, cmdFF: 0x16 },
  ];

  // 4 Modes on the far right
  const MODES = [
    { name: 'FLASH', cmdEF: 0x0B, cmdF7: 0xD0, cmdFF: 0x0B },
    { name: 'STROBE', cmdEF: 0x0F, cmdF7: 0xF0, cmdFF: 0x0F },
    { name: 'FADE', cmdEF: 0x13, cmdF7: 0xC8, cmdFF: 0x13 },
    { name: 'SMOOTH', cmdEF: 0x17, cmdF7: 0xE8, cmdFF: 0x17 },
  ];

  return (
    <div className="flex flex-col items-center w-full select-none">
      {/* Address Family Selector with Helper Info */}
      <div className="w-full mb-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-between px-1">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider ${
              isDarkMode ? 'text-accent-muted' : 'text-slate-500'
            }`}
          >
            IR Address Protocol:
          </span>
          <span className="text-[10px] font-mono text-cyan-400">
            {addressFamily === '00EF' ? 'Default Extended (0x00EF)' : `0x${addressFamily}`}
          </span>
        </div>

        <div
          className={`grid grid-cols-4 gap-1 p-1 rounded-2xl border text-xs ${
            isDarkMode ? 'bg-[#121214] border-surface-border' : 'bg-slate-100 border-slate-200'
          }`}
        >
          {(['00EF', '00F7', 'FF00', 'EF00'] as RemoteAddressFamily[]).map((fam) => (
            <button
              key={fam}
              onClick={() => handleSetAddress(fam)}
              className={`py-1.5 rounded-xl font-mono text-[11px] font-extrabold transition-all ${
                addressFamily === fam
                  ? 'bg-amber-400 text-black shadow-md scale-102'
                  : isDarkMode
                  ? 'text-zinc-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              0x{fam}
            </button>
          ))}
        </div>
      </div>

      {/* Photorealistic Oval Remote Shell (Matching Image 1) */}
      <div
        className="w-full max-w-[280px] rounded-[52px] p-5 shadow-2xl border flex flex-col items-center relative transition-all"
        style={{
          background: isDarkMode
            ? 'linear-gradient(175deg, #2A2D35 0%, #1A1C22 100%)'
            : 'linear-gradient(175deg, #FFFFFF 0%, #F1F5F9 100%)',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
          boxShadow: isDarkMode
            ? '0 25px 60px -15px rgba(0, 0, 0, 0.8), inset 0 2px 3px rgba(255, 255, 255, 0.1)'
            : '0 25px 60px -15px rgba(0, 0, 0, 0.15), inset 0 2px 3px rgba(255, 255, 255, 0.8)',
        }}
      >
        {/* Top IR Window Notch */}
        <div className="w-12 h-1.5 rounded-full bg-zinc-700/60 mb-3" />

        {/* TOP SECTION: Power OFF (Red), Bright+, Bright-, Power ON (Green) */}
        <div className="flex items-center justify-between w-full px-2 mb-4">
          {/* RED Power Button (Power OFF) */}
          <button
            onClick={() => transmitKey('Power OFF', 0x02, 0x40, 0x03)}
            className="w-11 h-11 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg border border-red-400 active:scale-90 transition-all hover:bg-red-600"
            title="Power OFF (Red Button)"
          >
            <Power size={18} strokeWidth={2.5} />
          </button>

          {/* Center Column: Brightness Up & Brightness Down */}
          <div className="flex flex-col items-center gap-1.5">
            {/* Brightness UP */}
            <button
              onClick={() => transmitKey('Brightness +', 0x00, 0x00, 0x00)}
              className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md border active:scale-90 transition-all ${
                isDarkMode
                  ? 'bg-zinc-700/80 text-white border-white/10'
                  : 'bg-white text-slate-800 border-slate-200'
              }`}
              title="Brightness +"
            >
              <Sun size={15} strokeWidth={2.5} />
            </button>

            {/* Brightness DOWN */}
            <button
              onClick={() => transmitKey('Brightness -', 0x01, 0x80, 0x01)}
              className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md border active:scale-90 transition-all ${
                isDarkMode
                  ? 'bg-zinc-700/80 text-white border-white/10'
                  : 'bg-white text-slate-800 border-slate-200'
              }`}
              title="Brightness -"
            >
              <SunMedium size={14} strokeWidth={2} />
            </button>
          </div>

          {/* GREEN Power Button (Power ON) */}
          <button
            onClick={() => transmitKey('Power ON', 0x03, 0xC0, 0x02)}
            className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border border-emerald-400 active:scale-90 transition-all hover:bg-emerald-600"
            title="Power ON (Green Button)"
          >
            <Power size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* MIDDLE SECTION: Large Circular Black Wheel with R, G, B, W Quadrants */}
        <div className="relative w-44 h-44 rounded-full bg-zinc-900 border-4 border-zinc-800 shadow-2xl flex items-center justify-center mb-5 select-none">
          {/* Top: GREEN Button */}
          <button
            onClick={() => transmitKey('Green (Primary)', 0x05, 0xA0, 0x05, '#10B981')}
            className="absolute top-2 w-11 h-11 rounded-full bg-emerald-500 text-white font-black text-sm flex items-center justify-center shadow-md border-2 border-white/20 active:scale-90 transition-all hover:scale-105"
            title="Green"
          >
            G
          </button>

          {/* Left: RED Button */}
          <button
            onClick={() => transmitKey('Red (Primary)', 0x04, 0x20, 0x04, '#EF4444')}
            className="absolute left-2 w-11 h-11 rounded-full bg-red-500 text-white font-black text-sm flex items-center justify-center shadow-md border-2 border-white/20 active:scale-90 transition-all hover:scale-105"
            title="Red"
          >
            R
          </button>

          {/* Right: BLUE Button */}
          <button
            onClick={() => transmitKey('Blue (Primary)', 0x06, 0x60, 0x06, '#2563EB')}
            className="absolute right-2 w-11 h-11 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md border-2 border-white/20 active:scale-90 transition-all hover:scale-105"
            title="Blue"
          >
            B
          </button>

          {/* Bottom: WHITE Button */}
          <button
            onClick={() => transmitKey('White (Primary)', 0x07, 0xE0, 0x07, '#F8FAFC')}
            className="absolute bottom-2 w-11 h-11 rounded-full bg-white text-zinc-900 font-black text-sm flex items-center justify-center shadow-md border-2 border-zinc-300 active:scale-90 transition-all hover:scale-105"
            title="White"
          >
            W
          </button>

          {/* Center Circular Touch Hole */}
          <div className="w-10 h-10 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow-inner">
            <span className="w-4 h-4 rounded-full bg-white/20" />
          </div>
        </div>

        {/* BOTTOM SECTION: 3 Columns of Color Buttons + 1 Column of 4 Modes */}
        <div className="grid grid-cols-4 gap-2.5 w-full px-1">
          {/* Column 1: Reds / Oranges / Yellows */}
          <div className="flex flex-col gap-2.5">
            {COLOR_GRID.filter((_, idx) => idx % 3 === 0).map((btn) => (
              <button
                key={btn.name}
                onClick={() => transmitKey(btn.name, btn.cmdEF, btn.cmdF7, btn.cmdFF, btn.color)}
                className="w-10 h-10 rounded-full shadow-md border border-white/20 active:scale-90 transition-all"
                style={{ backgroundColor: btn.color, boxShadow: `0 3px 10px ${btn.color}50` }}
                title={btn.name}
              />
            ))}
          </div>

          {/* Column 2: Greens / Cyans / Teals */}
          <div className="flex flex-col gap-2.5">
            {COLOR_GRID.filter((_, idx) => idx % 3 === 1).map((btn) => (
              <button
                key={btn.name}
                onClick={() => transmitKey(btn.name, btn.cmdEF, btn.cmdF7, btn.cmdFF, btn.color)}
                className="w-10 h-10 rounded-full shadow-md border border-white/20 active:scale-90 transition-all"
                style={{ backgroundColor: btn.color, boxShadow: `0 3px 10px ${btn.color}50` }}
                title={btn.name}
              />
            ))}
          </div>

          {/* Column 3: Blues / Purples / Pinks */}
          <div className="flex flex-col gap-2.5">
            {COLOR_GRID.filter((_, idx) => idx % 3 === 2).map((btn) => (
              <button
                key={btn.name}
                onClick={() => transmitKey(btn.name, btn.cmdEF, btn.cmdF7, btn.cmdFF, btn.color)}
                className="w-10 h-10 rounded-full shadow-md border border-white/20 active:scale-90 transition-all"
                style={{ backgroundColor: btn.color, boxShadow: `0 3px 10px ${btn.color}50` }}
                title={btn.name}
              />
            ))}
          </div>

          {/* Column 4: 4 Dynamic Modes (FLASH, STROBE, FADE, SMOOTH) */}
          <div className="flex flex-col gap-2.5">
            {MODES.map((mode) => (
              <button
                key={mode.name}
                onClick={() => transmitKey(mode.name, mode.cmdEF, mode.cmdF7, mode.cmdFF)}
                className={`w-10 h-10 rounded-full text-[9px] font-black tracking-tighter flex items-center justify-center border shadow-md active:scale-90 transition-all ${
                  isDarkMode
                    ? 'bg-zinc-800 text-zinc-200 border-white/15 hover:text-white hover:bg-zinc-700'
                    : 'bg-slate-200 text-slate-800 border-slate-300 hover:bg-slate-300'
                }`}
                title={mode.name}
              >
                {mode.name}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Remote Label */}
        <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono font-bold mt-4">
          Oval RGBW Controller
        </span>
      </div>
    </div>
  );
};
