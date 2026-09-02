import React, { useState } from 'react';
import { SunMedium, SunDim, Power } from 'lucide-react';
import { irBlaster } from '../services/irBlaster';
import { hapticFeedback } from '../services/haptics';

interface PhysicalWhiteRemoteProps {
  onSelectColor?: (hexColor: string) => void;
  isDarkMode?: boolean;
}

interface RemoteBtn {
  id: string;
  name: string;
  cmd: string; // 2 hex digits command
  bg: string;
  textColor?: string;
  label?: string;
  isRound?: boolean;
}

export const PhysicalWhiteRemote: React.FC<PhysicalWhiteRemoteProps> = ({
  onSelectColor,
  isDarkMode = true,
}) => {
  // Address selector (00F7 is standard, 00EF and FF00 are common clones)
  const [addressPrefix, setAddressPrefix] = useState<'00F7' | '00EF' | 'FF00'>('00F7');

  const sendButton = (btn: RemoteBtn) => {
    hapticFeedback.click();
    // Build full 32-bit hex: Address (16 bit) + Command (8 bit) + ~Command (8 bit)
    const cmdByte = parseInt(btn.cmd, 16);
    const invCmdByte = (~cmdByte) & 0xff;
    const fullHex = `${addressPrefix}${btn.cmd}${invCmdByte.toString(16).padStart(2, '0').toUpperCase()}`;

    irBlaster.sendNec(fullHex, btn.name, '24-Key Remote');
    if (onSelectColor && btn.bg.startsWith('#')) {
      onSelectColor(btn.bg);
    }
  };

  // 24 Keys exactly matching the photo
  const topControls: RemoteBtn[] = [
    { id: 'brt-up', name: 'Brightness +', cmd: '00', bg: '#F1F5F9', textColor: '#0F172A', label: 'sun-up' },
    { id: 'brt-down', name: 'Brightness -', cmd: '80', bg: '#F1F5F9', textColor: '#0F172A', label: 'sun-down' },
    { id: 'pwr-off', name: 'Power OFF', cmd: '40', bg: '#18181B', textColor: '#FFFFFF', label: 'OFF' },
    { id: 'pwr-on', name: 'Power ON', cmd: 'C0', bg: '#EF4444', textColor: '#FFFFFF', label: 'ON' },
  ];

  const gridRows: RemoteBtn[][] = [
    // Row 1: R, G, B, W
    [
      { id: 'c-r', name: 'Red', cmd: '20', bg: '#EF4444', textColor: '#FFFFFF', label: 'R' },
      { id: 'c-g', name: 'Green', cmd: 'A0', bg: '#10B981', textColor: '#FFFFFF', label: 'G' },
      { id: 'c-b', name: 'Blue', cmd: '60', bg: '#2563EB', textColor: '#FFFFFF', label: 'B' },
      { id: 'c-w', name: 'White', cmd: 'E0', bg: '#FFFFFF', textColor: '#0F172A', label: 'W' },
    ],
    // Row 2: Orange, Lime, Blue, FLASH
    [
      { id: 'c-o1', name: 'Orange', cmd: '10', bg: '#F97316' },
      { id: 'c-g1', name: 'Lime', cmd: '90', bg: '#22C55E' },
      { id: 'c-b1', name: 'Light Blue', cmd: '50', bg: '#0284C7' },
      { id: 'm-flash', name: 'Flash Mode', cmd: 'D0', bg: '#64748B', textColor: '#FFFFFF', label: 'FLASH' },
    ],
    // Row 3: Amber, Cyan, Purple, STROBE
    [
      { id: 'c-o2', name: 'Amber', cmd: '30', bg: '#F59E0B' },
      { id: 'c-c1', name: 'Cyan', cmd: 'B0', bg: '#06B6D4' },
      { id: 'c-p1', name: 'Purple', cmd: '70', bg: '#7C3AED' },
      { id: 'm-strobe', name: 'Strobe Mode', cmd: 'F0', bg: '#64748B', textColor: '#FFFFFF', label: 'STROBE' },
    ],
    // Row 4: Yellow, Mid-Blue, Violet, FADE
    [
      { id: 'c-y1', name: 'Warm Yellow', cmd: '08', bg: '#EAB308' },
      { id: 'c-b2', name: 'Ocean Blue', cmd: '88', bg: '#0284C7' },
      { id: 'c-p2', name: 'Violet', cmd: '48', bg: '#9333EA' },
      { id: 'm-fade', name: 'Fade Mode', cmd: 'C8', bg: '#64748B', textColor: '#FFFFFF', label: 'FADE' },
    ],
    // Row 5: Light Yellow, Sky Blue, Pink, SMOOTH
    [
      { id: 'c-y2', name: 'Pale Yellow', cmd: '28', bg: '#FACC15' },
      { id: 'c-b3', name: 'Sky Blue', cmd: 'A8', bg: '#0EA5E9' },
      { id: 'c-p3', name: 'Magenta Pink', cmd: '68', bg: '#EC4899' },
      { id: 'm-smooth', name: 'Smooth Mode', cmd: 'E8', bg: '#64748B', textColor: '#FFFFFF', label: 'SMOOTH' },
    ],
  ];

  return (
    <div className="flex flex-col items-center w-full">
      {/* Address Switcher */}
      <div
        className={`flex items-center gap-1.5 mb-4 p-1 rounded-xl border text-xs transition-colors ${
          isDarkMode
            ? 'bg-surface border-surface-border text-white'
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}
      >
        <span
          className={`text-[11px] px-2 font-medium ${
            isDarkMode ? 'text-accent-muted' : 'text-slate-500'
          }`}
        >
          IR Address:
        </span>
        {(['00F7', '00EF', 'FF00'] as const).map((addr) => (
          <button
            key={addr}
            onClick={() => {
              hapticFeedback.tick();
              setAddressPrefix(addr);
            }}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-all ${
              addressPrefix === addr
                ? 'bg-sky-500 text-black shadow-sm'
                : isDarkMode
                ? 'text-accent-muted hover:text-white'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            0x{addr}
          </button>
        ))}
      </div>

      {/* The Physical White Remote Body */}
      <div
        className="w-[260px] rounded-[28px] p-3.5 border-4 shadow-2xl transition-all duration-300 relative select-none"
        style={{
          background: '#ECEFF1',
          borderColor: '#CFD8DC',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.8)',
        }}
      >
        {/* Remote Header / IR Emitter Notch */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3" />

        {/* Inset Control Panel */}
        <div className="bg-[#DEE4E7] rounded-[20px] p-2.5 border border-slate-300 shadow-inner flex flex-col gap-2">
          {/* Top Row: Brightness & Power */}
          <div className="grid grid-cols-4 gap-2 mb-1">
            {topControls.map((btn) => (
              <button
                key={btn.id}
                onClick={() => sendButton(btn)}
                className="h-10 rounded-full flex items-center justify-center font-bold text-[11px] shadow active:scale-90 transition-transform border border-black/10"
                style={{
                  backgroundColor: btn.bg,
                  color: btn.textColor,
                }}
                title={btn.name}
              >
                {btn.label === 'sun-up' ? (
                  <SunMedium size={18} />
                ) : btn.label === 'sun-down' ? (
                  <SunDim size={18} />
                ) : (
                  <span>{btn.label}</span>
                )}
              </button>
            ))}
          </div>

          {/* 5 Rows x 4 Columns Color Matrix */}
          <div className="flex flex-col gap-2">
            {gridRows.map((row, rowIdx) => (
              <div key={rowIdx} className="grid grid-cols-4 gap-2">
                {row.map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => sendButton(btn)}
                    className="h-9 rounded-full flex items-center justify-center font-bold text-[10px] shadow active:scale-90 transition-transform border border-black/15 font-mono"
                    style={{
                      backgroundColor: btn.bg,
                      color: btn.textColor || '#FFFFFF',
                    }}
                    title={btn.name}
                  >
                    {btn.label ? btn.label : ''}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Remote Footer Branding */}
        <div className="mt-3 text-center">
          <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold font-mono">
            24-Key Controller
          </span>
        </div>
      </div>
    </div>
  );
};
