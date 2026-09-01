import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const hapticFeedback = {
  // Light tick for dial notches and sliders
  tick: async () => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(8);
      }
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Ignore if not supported
    }
  },

  // Medium click for normal buttons
  click: async () => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      // Ignore
    }
  },

  // Heavy pop for power toggles
  heavy: async () => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(35);
      }
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {
      // Ignore
    }
  },

  // Success chime for mode changes
  success: async () => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([15, 40, 20]);
      }
      await Haptics.notification({ type: NotificationType.Success });
    } catch {
      // Ignore
    }
  },
};
