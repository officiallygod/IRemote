import React, { useState, useEffect } from 'react';
import { irBlaster, IrTransmitEvent } from '../services/irBlaster';
import { Radio, Zap, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const IrSignalIndicator: React.FC = () => {
  const [activeEvent, setActiveEvent] = useState<IrTransmitEvent | null>(null);
  const [isBlasting, setIsBlasting] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const [lastEvent, setLastEvent] = useState<IrTransmitEvent | null>(null);

  useEffect(() => {
    const unsubscribe = irBlaster.subscribe((event) => {
      setActiveEvent(event);
      setLastEvent(event);
      setIsBlasting(true);

      const timer = setTimeout(() => {
        setIsBlasting(false);
      }, 1800);

      return () => clearTimeout(timer);
    });

    return unsubscribe;
  }, []);

  return (
    <>
      {/* Top Physical IR Blaster Diode Glow Simulation */}
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none">
        <AnimatePresence>
          {isBlasting && (
            <>
              {/* IR LED Beam Emitter */}
              <motion.div
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="w-16 h-8 origin-top bg-gradient-to-b from-[#EF4444] via-[#F43F5E]/40 to-transparent blur-[6px]"
              />

              {/* Toast Notification Pill */}
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 12, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="pointer-events-auto flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#1A1A1A]/95 border border-white/15 shadow-2xl backdrop-blur-md cursor-pointer hover:border-accent-cyan/50 transition-colors"
                onClick={() => setShowInspector(true)}
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </span>

                <span className="text-xs font-semibold text-white">
                  {activeEvent?.deviceName}: <span className="text-accent-cyan">{activeEvent?.actionName}</span>
                </span>

                <span className="text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-white/80">
                  {activeEvent?.signal.hex}
                </span>

                <ChevronRight size={14} className="text-white/40" />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Detailed Signal Inspector Modal */}
      <AnimatePresence>
        {showInspector && lastEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-surface border border-surface-border rounded-3xl p-5 shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <div className="flex items-center gap-2">
                  <Radio size={18} className="text-accent-cyan" />
                  <h3 className="text-sm font-bold text-white">IR Signal Inspector</h3>
                </div>
                <button
                  onClick={() => setShowInspector(false)}
                  className="w-8 h-8 rounded-full bg-[#18181B] flex items-center justify-center text-white/60 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="py-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#18181B] p-2.5 rounded-xl border border-surface-border">
                    <span className="text-accent-muted block text-[10px]">Target Device</span>
                    <span className="font-semibold text-white">{lastEvent.deviceName}</span>
                  </div>
                  <div className="bg-[#18181B] p-2.5 rounded-xl border border-surface-border">
                    <span className="text-accent-muted block text-[10px]">Action</span>
                    <span className="font-semibold text-accent-cyan">{lastEvent.actionName}</span>
                  </div>
                  <div className="bg-[#18181B] p-2.5 rounded-xl border border-surface-border">
                    <span className="text-accent-muted block text-[10px]">Protocol / Carrier</span>
                    <span className="font-semibold text-white">NEC @ 38.0 kHz</span>
                  </div>
                  <div className="bg-[#18181B] p-2.5 rounded-xl border border-surface-border">
                    <span className="text-accent-muted block text-[10px]">Transmission Mode</span>
                    <span className="font-semibold text-accent-amber">
                      {lastEvent.isNative ? 'Poco IR Hardware' : 'Web Simulation'}
                    </span>
                  </div>
                </div>

                <div className="bg-[#18181B] p-3 rounded-xl border border-surface-border">
                  <span className="text-accent-muted block text-[10px] mb-1">32-Bit Hex Code</span>
                  <div className="font-mono text-base font-bold text-accent-amber">{lastEvent.signal.hex}</div>
                </div>

                <div className="bg-[#18181B] p-3 rounded-xl border border-surface-border">
                  <span className="text-accent-muted block text-[10px] mb-1">Raw Microsecond Pulse Count</span>
                  <div className="text-xs text-white/80 font-mono">
                    {lastEvent.signal.pattern.length} alternating marks/spaces (~67.5ms total duration)
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  irBlaster.sendNec(lastEvent.signal.hex, lastEvent.actionName, lastEvent.deviceName);
                }}
                className="w-full py-3 rounded-xl bg-accent-cyan text-[#121214] font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-transform"
              >
                <Zap size={14} fill="currentColor" />
                Re-transmit Signal
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
