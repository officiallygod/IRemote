import React, { useState, useEffect } from 'react';
import { Radio, Zap } from 'lucide-react';
import { irBlaster, IrTransmitEvent } from '../services/irBlaster';

export const DynamicCapsuleToast: React.FC = () => {
  const [currentEvent, setCurrentEvent] = useState<IrTransmitEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let hideTimer: NodeJS.Timeout;

    const unsubscribe = irBlaster.subscribe((event: IrTransmitEvent) => {
      setCurrentEvent(event);
      setIsVisible(true);

      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 2200);
    });

    return () => {
      unsubscribe();
      clearTimeout(hideTimer);
    };
  }, []);

  if (!currentEvent || !isVisible) return null;

  return (
    <aside
      aria-live="polite"
      className="fixed top-4 inset-x-0 z-50 flex justify-center pointer-events-none px-4 animate-slide-down"
    >
      <div
        className="pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-full shadow-2xl border border-white/15 backdrop-blur-2xl transition-all duration-300"
        style={{
          background: 'rgba(18, 18, 20, 0.92)',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.15)',
        }}
      >
        {/* Pulsing Transmitter Wave */}
        <div className="relative flex items-center justify-center w-6 h-6">
          <span className="absolute w-full h-full rounded-full bg-cyan-400/30 animate-ping" />
          <div className="w-5 h-5 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-glow-cyan z-10">
            <Radio size={12} strokeWidth={2.5} />
          </div>
        </div>

        {/* Content Details */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-extrabold text-white tracking-tight">
            {currentEvent.deviceName}
          </span>
          <span className="w-1 h-1 rounded-full bg-zinc-600" />
          <span className="text-zinc-300 font-medium">{currentEvent.actionName}</span>
        </div>

        {/* Hex Code Badge */}
        <div className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-mono font-bold text-amber-400 border border-white/10">
          0x{currentEvent.signal.hex}
        </div>
      </div>
    </aside>
  );
};
