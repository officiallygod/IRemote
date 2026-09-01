import { registerPlugin, Capacitor } from '@capacitor/core';
import { encodeNecHex, NecSignal } from './necProtocol';
import { hapticFeedback } from './haptics';

export interface IrBlasterPluginInterface {
  hasIrEmitter(): Promise<{ hasEmitter: boolean }>;
  getCarrierFrequencies(): Promise<{ frequencies: Array<{ min: number; max: number }> }>;
  transmit(options: { carrierFrequency: number; pattern: number[] }): Promise<{ success: boolean }>;
  transmitHex?(options: { hex: string; frequency?: number; repeatCount?: number }): Promise<{ success: boolean }>;
}

// Register native plugin
const NativeIrBlaster = registerPlugin<IrBlasterPluginInterface>('IrBlaster');

export interface IrTransmitEvent {
  id: string;
  deviceName: string;
  actionName: string;
  signal: NecSignal;
  timestamp: number;
  isNative: boolean;
}

type TransmitListener = (event: IrTransmitEvent) => void;
const listeners: Set<TransmitListener> = new Set();

let lastTransmitTime = 0;

export const irBlaster = {
  subscribe(listener: TransmitListener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /**
   * Transmit a NEC HEX command
   */
  async sendNec(hex: string, actionName: string = 'Command', deviceName: string = 'Device'): Promise<boolean> {
    const cleanHex = hex.replace(/^0x/i, '').trim();
    const signal = encodeNecHex(cleanHex);
    let isNative = false;

    // Throttle duplicate spam within 80ms
    const now = Date.now();
    if (now - lastTransmitTime < 80) {
      return false;
    }
    lastTransmitTime = now;

    // Trigger haptic click
    hapticFeedback.click();

    try {
      if (Capacitor.isNativePlatform()) {
        // Preferred: native multi-frame hex blaster
        if (typeof (NativeIrBlaster as any).transmitHex === 'function') {
          await (NativeIrBlaster as any).transmitHex({
            hex: cleanHex,
            frequency: 38000,
            repeatCount: 2,
          });
          isNative = true;
        } else {
          // Fallback: raw pattern
          await NativeIrBlaster.transmit({
            carrierFrequency: signal.carrierFrequency,
            pattern: signal.pattern,
          });
          isNative = true;
        }
      }
    } catch (err) {
      console.warn('[IR Blaster] Native call error or web mode:', err);
    }

    // Broadcast event for UI indicator HUD
    const event: IrTransmitEvent = {
      id: Math.random().toString(36).substring(2, 9),
      deviceName,
      actionName,
      signal,
      timestamp: Date.now(),
      isNative,
    };

    listeners.forEach((fn) => fn(event));
    return true;
  },

  async checkEmitter(): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        const res = await NativeIrBlaster.hasIrEmitter();
        return res.hasEmitter;
      }
    } catch {
      // Ignored
    }
    return false;
  },
};
