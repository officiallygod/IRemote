import React, { useState, useEffect } from 'react';
import { Plus, LayoutGrid, Sun, Moon, Sliders, Sparkles } from 'lucide-react';
import { ThreeRoomScene } from '../components/ThreeRoomScene';
import { DeviceCard } from '../components/DeviceCard';
import { hapticFeedback } from '../services/haptics';
import { fetchKarlsruheWeather } from '../services/weatherService';

interface DashboardViewProps {
  onOpenDevice: (deviceId: string) => void;
  onOpenSettings: () => void;
  onOpenAssistant: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  // Shared state
  sunsetState: { isOn: boolean; brightness: number; color: string; moodName: string };
  ledStripState: { isOn: boolean; brightness: number; color: string };
  fanState: { isOn: boolean; speed: number; isSwinging: boolean };
  fireplaceState: { isOn: boolean; isSmokeOn: boolean; flameColor: string; flameColorName: string; timer: string };
  onToggleSunset: () => void;
  onToggleLedStrip: () => void;
  onToggleFan: () => void;
  onToggleFireplace: () => void;
}

const ZONES = ['Dorm Room'];

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenDevice,
  onOpenSettings,
  onOpenAssistant,
  isDarkMode,
  onToggleTheme,
  sunsetState,
  ledStripState,
  fanState,
  fireplaceState,
  onToggleSunset,
  onToggleLedStrip,
  onToggleFan,
  onToggleFireplace,
}) => {
  const [selectedZone, setSelectedZone] = useState('Dorm Room');
  const [karlsruheTemp, setKarlsruheTemp] = useState('22°');

  // Fetch real temperature
  useEffect(() => {
    let isMounted = true;
    fetchKarlsruheWeather().then((data) => {
      if (isMounted) {
        setKarlsruheTemp(`${Math.round(data.temperature)}°`);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const activeCount =
    (sunsetState.isOn ? 1 : 0) +
    (ledStripState.isOn ? 1 : 0) +
    (fanState.isOn ? 1 : 0) +
    (fireplaceState.isOn ? 1 : 0);

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden select-none max-w-md mx-auto relative">
      {/* 1. Persistent Top Navigation Bar (Stays completely frozen in place) */}
      <header
        className={`shrink-0 z-30 pt-12 pb-3 px-5 backdrop-blur-xl border-b transition-colors flex items-center justify-between ${
          isDarkMode ? 'bg-[#121214]/85 border-white/5 text-white' : 'bg-white/85 border-slate-200 text-slate-900'
        }`}
      >
        {/* Karlsruhe Weather Chip on left */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
              isDarkMode
                ? 'bg-surface border-surface-border text-white'
                : 'bg-slate-100 border-slate-200 text-slate-800 shadow-sm'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>{karlsruheTemp}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Voice & Assistant Integration Button */}
          <button
            onClick={() => {
              hapticFeedback.click();
              onOpenAssistant();
            }}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all active:scale-90 relative ${
              isDarkMode
                ? 'bg-surface border-surface-border text-amber-400 hover:text-amber-300'
                : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm'
            }`}
            title="Gemini, Google Assistant & Siri"
            aria-label="AI Voice Assistant Setup"
          >
            <Sparkles size={16} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={() => {
              hapticFeedback.click();
              onToggleTheme();
            }}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all active:scale-90 ${
              isDarkMode
                ? 'bg-surface border-surface-border text-amber-400 hover:text-amber-300'
                : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm'
            }`}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Custom Codes / Settings Button */}
          <button
            onClick={() => {
              hapticFeedback.click();
              onOpenSettings();
            }}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all active:scale-90 ${
              isDarkMode
                ? 'bg-surface border-surface-border text-white/80 hover:text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm'
            }`}
            title="Custom IR Keys"
            aria-label="Custom IR Keys"
          >
            <Sliders size={16} />
          </button>
        </div>
      </header>

      {/* 2. Scrollable Body Content (Scrolls smoothly underneath the persistent nav bar) */}
      <main className="flex-1 overflow-y-auto px-5 pt-3 pb-36 space-y-4 overscroll-contain">
        {/* Zone Pill Bar (Smooth Edge-to-Edge Scroll) */}
        <div className="relative -mx-5 px-5">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5 scroll-smooth overscroll-x-contain">
            {ZONES.map((zone) => {
              const isActive = selectedZone === zone;
              return (
                <button
                  key={zone}
                  onClick={(e) => {
                    hapticFeedback.tick();
                    setSelectedZone(zone);
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                  }}
                  className={`h-8 px-4 rounded-full text-xs font-bold shrink-0 transition-all border active:scale-95 ${
                    isActive
                      ? isDarkMode
                        ? 'bg-white text-[#121214] border-white shadow-md'
                        : 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : isDarkMode
                      ? 'bg-surface text-accent-muted border-surface-border hover:text-white'
                      : 'bg-white text-slate-600 border-slate-200 shadow-sm'
                  }`}
                >
                  {zone}
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive 3D Room Scene (Bruno Simon isometric style, procedural Three.js) */}
        <div>
          <ThreeRoomScene
            isDarkMode={isDarkMode}
            isSunsetOn={sunsetState.isOn}
            isBedsideOn={ledStripState.isOn}
            isFanOn={fanState.isOn}
            isFireplaceOn={fireplaceState.isOn}
            sunsetColor={sunsetState.color}
            fireplaceColor={fireplaceState.flameColor}
            fanSpeed={fanState.speed}
            onToggleSunset={onToggleSunset}
            onToggleBedside={onToggleLedStrip}
            onToggleFan={onToggleFan}
            onToggleFireplace={onToggleFireplace}
            onOpenDevice={onOpenDevice}
          />
        </div>

        {/* Device Grid Header */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <LayoutGrid size={15} className={isDarkMode ? 'text-accent-muted' : 'text-slate-500'} />
            <h3
              className={`text-xs font-bold tracking-wider uppercase ${
                isDarkMode ? 'text-white' : 'text-slate-800'
              }`}
            >
              Appliances
            </h3>
          </div>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
              isDarkMode
                ? 'bg-white/5 border-white/10 text-accent-muted'
                : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            {activeCount} Active
          </span>
        </div>

        {/* Device Cards Grid (4 Devices in 2x2 grid) */}
        <div className="grid grid-cols-2 gap-3.5 pb-2">
          {/* Device 1: Sunset Lamp */}
          <DeviceCard
            id="device-sunset"
            deviceIndexLabel="Device 1"
            name="Sunset Lamp"
            type="sunset"
            isOn={sunsetState.isOn}
            onTogglePower={onToggleSunset}
            onClick={() => onOpenDevice('sunset-lamp')}
            badgeText={sunsetState.moodName}
            accentColor="#FB923C"
            isDarkMode={isDarkMode}
          />

          {/* Device 2: Bedside Touch Lamp */}
          <DeviceCard
            id="device-bedside"
            deviceIndexLabel="Device 2"
            name="Bedside Lamp"
            type="light"
            isOn={ledStripState.isOn}
            onTogglePower={onToggleLedStrip}
            onClick={() => onOpenDevice('bedside-lamp')}
            badgeText={`${ledStripState.brightness}%`}
            accentColor="#F8E5A5"
            isDarkMode={isDarkMode}
          />

          {/* Device 3: Smart Fan */}
          <DeviceCard
            id="device-fan"
            deviceIndexLabel="Device 3"
            name="Smart Fan"
            type="fan"
            isOn={fanState.isOn}
            onTogglePower={onToggleFan}
            onClick={() => onOpenDevice('smart-fan')}
            badgeText={`Speed ${fanState.speed} • ${fanState.isSwinging ? 'Swing' : 'Static'}`}
            accentColor="#BAE6FD"
            isDarkMode={isDarkMode}
          />

          {/* Device 4: Flame Humidifier / Fireplace */}
          <DeviceCard
            id="device-fireplace"
            deviceIndexLabel="Device 4"
            name="Fireplace"
            type="fireplace"
            isOn={fireplaceState.isOn}
            onTogglePower={onToggleFireplace}
            onClick={() => onOpenDevice('fireplace')}
            badgeText={fireplaceState.isOn ? fireplaceState.flameColorName : 'Off'}
            accentColor="#FED7AA"
            isDarkMode={isDarkMode}
          />
        </div>
      </main>
    </div>
  );
};
