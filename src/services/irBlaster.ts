import { registerPlugin } from '@capacitor/core';
import { encodeNecHex, NecSignal } from './necProtocol';
import { hapticFeedback } from './haptics';

export interface IrBlasterPluginInterface {
  hasIrEmitter(): Promise<{ hasEmitter: boolean }>;
  getCarrierFrequencies(): Promise<{ frequencies: Array<{ min: number; max: number }> }>;
  transmit(options: { carrierFrequency: number; pattern: number[] }): Promise<{ success: boolean }>;
}

// Register native plugin if running on Android
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

export const irBlaster = {
  /**
   * Subscribe to IR transmission events (for UI status light / signal inspector)
   */
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
    const signal = encodeNecHex(hex);
    let isNative = false;

    // Trigger haptic click
    hapticFeedback.click();

    try {
      if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
        const check = await NativeIrBlaster.hasIrEmitter();
        if (check.hasEmitter) {
          await NativeIrBlaster.transmit({
            carrierFrequency: signal.carrierFrequency,
            pattern: signal.pattern,
          });
          isNative = true;
        }
      }
    } catch (err) {
      console.warn('[IR Blaster] Native call failed or running in web preview mode:', err);
    }

    // Broadcast event for UI HUD & Inspector
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

  /**
   * Check if device has hardware IR emitter
   */
  async checkEmitter(): Promise<boolean> {
    try {
      if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
        const res = await NativeIrBlaster.hasIrEmitter();
        return res.hasEmitter;
      }
    } catch {
      // Not native or plugin not loaded
    }
    return false;
  }
};
