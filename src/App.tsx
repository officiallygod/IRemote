import React, { useState, useEffect } from 'react';
import { DashboardView } from './views/DashboardView';
import { SunsetLampView } from './views/SunsetLampView';
import { BedsideLampView } from './views/BedsideLampView';
import { FanControllerView } from './views/FanControllerView';
import { FireplaceView, FireplaceState } from './views/FireplaceView';
import { IrSignalIndicator } from './components/IrSignalIndicator';
import { CustomCodeEditorModal, CustomKey } from './components/CustomCodeEditorModal';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { DynamicCapsuleToast } from './components/DynamicCapsuleToast';
import { FloatingNavDock, ActiveView } from './components/FloatingNavDock';
import { irBlaster } from './services/irBlaster';
import { assistantDeepLink } from './services/assistantDeepLinkService';
import { FAN_CODES } from './data/fanCodes';
import { RGB_LED_CONTROLS, getSavedSunsetOffCode } from './data/rgbLedCodes';
import { FIREPLACE_CODES, getSavedFireplacePowerCode } from './data/fireplaceCodes';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view') as ActiveView;
    return ['dashboard', 'sunset-lamp', 'bedside-lamp', 'smart-fan', 'fireplace'].includes(viewParam)
      ? viewParam
      : 'dashboard';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Light / Dark mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    const themeParam = params.get('theme');
    if (themeParam === 'light') return false;
    if (themeParam === 'dark') return true;

    const saved = localStorage.getItem('iremote_theme');
    return saved !== null ? saved === 'dark' : true;
  });

  // Sync dark class on <html>
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('iremote_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('iremote_theme', 'light');
    }
  }, [isDarkMode]);

  interface SunsetDeviceState {
    isOn: boolean;
    brightness: number;
    color: string;
    moodName: string;
  }

  interface BedsideDeviceState {
    isOn: boolean;
    brightness: number;
    color: string;
    modeName: string;
  }

  interface FanDeviceState {
    isOn: boolean;
    speed: number;
    isSwinging: boolean;
    timer: string;
    mode: string;
  }

  // Device 1: Sunset Projector Lamp State (Image 1)
  const [sunsetState, setSunsetState] = useState<SunsetDeviceState>(() => {
    const saved = localStorage.getItem('iremote_sunset');
    return saved
      ? JSON.parse(saved)
      : { isOn: true, brightness: 85, color: '#FB923C', moodName: 'Golden Hour' };
  });

  // Device 2: Three O Bedside Touch Night Lamp State (Image 2)
  const [bedsideState, setBedsideState] = useState<BedsideDeviceState>(() => {
    const saved = localStorage.getItem('iremote_bedside');
    return saved
      ? JSON.parse(saved)
      : { isOn: true, brightness: 70, color: '#F8E5A5', modeName: 'Warm 2700K' };
  });

  // Device 3: Smart Fan State (Image 1 captured codes)
  const [fanState, setFanState] = useState<FanDeviceState>(() => {
    const saved = localStorage.getItem('iremote_fan');
    return saved
      ? JSON.parse(saved)
      : { isOn: true, speed: 3, isSwinging: true, timer: 'Off', mode: 'Normal' };
  });

  // Device 4: Fireplace Flame Humidifier State (Image 1 & 2)
  const [fireplaceState, setFireplaceState] = useState<FireplaceState>(() => {
    const saved = localStorage.getItem('iremote_fireplace');
    return saved
      ? JSON.parse(saved)
      : { isOn: true, isSmokeOn: true, flameColor: '#F59E0B', flameColorName: 'Golden Amber', timer: 'Off' };
  });

  // Custom IR Keys
  const [customKeys, setCustomKeys] = useState<CustomKey[]>(() => {
    const saved = localStorage.getItem('iremote_custom_keys');
    return saved
      ? JSON.parse(saved)
      : [
          { id: 'k1', name: 'Fan Turbo Mode', hex: 'C03FC03F', color: '#3B82F6' },
          { id: 'k2', name: 'Sunset Flash', hex: '00F7D02F', color: '#EC4899' },
          { id: 'k3', name: 'Fireplace Fog Mist', hex: 'C2E29867', color: '#06B6D4' },
          { id: 'k4', name: 'Fireplace Color Shift', hex: 'C2E238C7', color: '#F59E0B' },
        ];
  });

  // Persist states
  useEffect(() => {
    localStorage.setItem('iremote_sunset', JSON.stringify(sunsetState));
  }, [sunsetState]);

  useEffect(() => {
    localStorage.setItem('iremote_bedside', JSON.stringify(bedsideState));
  }, [bedsideState]);

  useEffect(() => {
    localStorage.setItem('iremote_fan', JSON.stringify(fanState));
  }, [fanState]);

  useEffect(() => {
    localStorage.setItem('iremote_fireplace', JSON.stringify(fireplaceState));
  }, [fireplaceState]);

  useEffect(() => {
    localStorage.setItem('iremote_custom_keys', JSON.stringify(customKeys));
  }, [customKeys]);

  const handleAddCustomKey = (newKey: CustomKey) => {
    setCustomKeys((prev) => [...prev, newKey]);
  };

  const handleDeleteCustomKey = (id: string) => {
    setCustomKeys((prev) => prev.filter((k) => k.id !== id));
  };

  // Assistant & Deep Link Listener Hook (Listens to Google Assistant, Gemini, and Siri requests)
  useEffect(() => {
    const cleanup = assistantDeepLink.onLink((res) => {
      if (!res.handled) return;

      if (res.device === 'sunset' || res.device === 'lamp') {
        if (res.action === 'off') {
          setSunsetState((prev) => ({ ...prev, isOn: false }));
        } else {
          setSunsetState((prev) => ({ ...prev, isOn: true }));
        }
      } else if (res.device === 'fan') {
        if (res.action === 'off') {
          setFanState((prev) => ({ ...prev, isOn: false }));
        } else if (res.action === 'on') {
          setFanState((prev) => ({ ...prev, isOn: true }));
        } else {
          setFanState((prev) => ({ ...prev, isOn: !prev.isOn }));
        }
      } else if (res.device === 'fireplace') {
        if (res.action === 'off') {
          setFireplaceState((prev) => ({ ...prev, isOn: false }));
        } else if (res.action === 'on') {
          setFireplaceState((prev) => ({ ...prev, isOn: true }));
        } else {
          setFireplaceState((prev) => ({ ...prev, isOn: !prev.isOn }));
        }
      } else if (res.device === 'scene') {
        if (res.action?.includes('sleep') || res.message?.includes('Goodnight')) {
          setSunsetState((prev) => ({ ...prev, isOn: false }));
          setBedsideState((prev) => ({ ...prev, isOn: false }));
          setFanState((prev) => ({ ...prev, isOn: false }));
          setFireplaceState((prev) => ({ ...prev, isOn: false }));
        } else if (res.message?.includes('Cozy')) {
          setSunsetState((prev) => ({ ...prev, isOn: true, color: '#FB923C', moodName: 'Golden Hour' }));
          setFireplaceState((prev) => ({ ...prev, isOn: true }));
        }
      }
    });

    assistantDeepLink.init();
    return cleanup;
  }, []);

  return (
    <div
      className={`min-h-screen font-sans antialiased overflow-x-hidden flex flex-col items-center justify-start transition-colors duration-200 ${
        isDarkMode ? 'bg-[#121214] text-[#FCFCFC]' : 'bg-[#F8FAFC] text-[#0F172A]'
      }`}
    >
      {/* Top Infrared Blaster Diode Simulation & HUD */}
      <IrSignalIndicator />

      {/* Main Responsive Container */}
      <main className="w-full max-w-md min-h-screen relative flex flex-col">
        {activeView === 'dashboard' && (
          <DashboardView
            onOpenDevice={(devId) => setActiveView(devId as ActiveView)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenAssistant={() => setIsAssistantOpen(true)}
            isDarkMode={isDarkMode}
            onToggleTheme={() => setIsDarkMode(!isDarkMode)}
            sunsetState={sunsetState}
            ledStripState={bedsideState}
            fanState={fanState}
            fireplaceState={fireplaceState}
            onToggleSunset={() => {
              const next = !sunsetState.isOn;
              setSunsetState((prev) => ({ ...prev, isOn: next }));
              const offCode = getSavedSunsetOffCode();
              irBlaster.sendNec(next ? RGB_LED_CONTROLS.powerOn.hex : offCode, next ? 'Power ON' : 'Power OFF', 'Sunset Lamp');
            }}
            onToggleLedStrip={() => {
              const next = !bedsideState.isOn;
              setBedsideState((prev) => ({ ...prev, isOn: next }));
              irBlaster.sendNec(next ? RGB_LED_CONTROLS.powerOn.hex : RGB_LED_CONTROLS.powerOff.hex, next ? 'Power ON' : 'Power OFF', 'Bedside Lamp');
            }}
            onToggleFan={() => {
              const next = !fanState.isOn;
              setFanState((prev) => ({ ...prev, isOn: next }));
              irBlaster.sendNec(FAN_CODES.power.hex, next ? 'Power ON' : 'Power OFF', 'Smart Fan');
            }}
            onToggleFireplace={() => {
              const next = !fireplaceState.isOn;
              setFireplaceState((prev) => ({ ...prev, isOn: next }));
              const pwrCode = getSavedFireplacePowerCode();
              irBlaster.sendNec(pwrCode, next ? 'Power ON' : 'Power OFF', 'Fireplace');
            }}
          />
        )}

        {activeView === 'sunset-lamp' && (
          <SunsetLampView
            onBack={() => setActiveView('dashboard')}
            state={sunsetState}
            onUpdateState={(update) => setSunsetState((prev) => ({ ...prev, ...update }))}
            isDarkMode={isDarkMode}
          />
        )}

        {activeView === 'bedside-lamp' && (
          <BedsideLampView
            onBack={() => setActiveView('dashboard')}
            state={bedsideState}
            onUpdateState={(update) => setBedsideState((prev) => ({ ...prev, ...update }))}
            isDarkMode={isDarkMode}
          />
        )}

        {activeView === 'smart-fan' && (
          <FanControllerView
            onBack={() => setActiveView('dashboard')}
            state={fanState}
            onUpdateState={(update) => setFanState((prev) => ({ ...prev, ...update }))}
            isDarkMode={isDarkMode}
          />
        )}

        {activeView === 'fireplace' && (
          <FireplaceView
            onBack={() => setActiveView('dashboard')}
            state={fireplaceState}
            onUpdateState={(update) => setFireplaceState((prev) => ({ ...prev, ...update }))}
            isDarkMode={isDarkMode}
          />
        )}
      </main>

      {/* Floating Bottom Navigation Dock (Inspired by user's reference designs) */}
      <FloatingNavDock
        activeView={activeView}
        onChangeView={setActiveView}
        isDarkMode={isDarkMode}
      />

      {/* Luxury Dynamic Capsule Toast */}
      <DynamicCapsuleToast />

      {/* AI Voice Assistant & Gemini / Siri Setup Modal */}
      <VoiceAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        isDarkMode={isDarkMode}
      />

      {/* Custom Key Manager & NEC Code Editor Modal */}
      <CustomCodeEditorModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        customKeys={customKeys}
        onAddKey={handleAddCustomKey}
        onDeleteKey={handleDeleteCustomKey}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
