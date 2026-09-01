import React, { useState, useEffect } from 'react';
import { Plus, LayoutGrid, Sun, Moon } from 'lucide-react';
import { RoomIsometricCard } from '../components/RoomIsometricCard';
import { DeviceCard } from '../components/DeviceCard';
import { hapticFeedback } from '../services/haptics';
import { fetchKarlsruheWeather } from '../services/weatherService';

interface DashboardViewProps {
  onOpenDevice: (deviceId: string) => void;
  onOpenSettings: () => void;
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

  // Fetch real temperature (clean degrees only)
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
    <div className="flex flex-col w-full min-h-screen pb-24 px-5 pt-14 sm:pt-16 select-none max-w-md mx-auto justify-between">
      <div>
        {/* Top Header: "Hi, Allen!" + Theme Toggle + Settings */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <span
              className={`text-xs font-semibold block mb-0.5 tracking-wide ${
                isDarkMode ? 'text-accent-muted' : 'text-slate-500'
              }`}
            >
              Hi, Allen!
            </span>
            <h1
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Choose<br />Lighting Zone
            </h1>
          </div>

          {/* Header Controls: Theme Toggle & Settings */}
          <div className="flex items-center gap-2">
            {/* Light / Dark Mode Toggle */}
            <button
              onClick={() => {
                hapticFeedback.tick();
                onToggleTheme();
              }}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-90 border ${
                isDarkMode
                  ? 'bg-surface border-surface-border text-amber-300 hover:bg-surface-hover'
                  : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
              }`}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* 4-dot Grid / Settings Action */}
            <button
              onClick={() => {
                hapticFeedback.click();
                onOpenSettings();
              }}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-90 border ${
                isDarkMode
                  ? 'bg-surface border-surface-border text-white/80 hover:text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900'
              }`}
              aria-label="Settings and Codes"
            >
              <LayoutGrid size={18} />
            </button>
          </div>
        </div>

        {/* Lighting Zone Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2.5 mb-3.5 -mx-4 px-4 sm:-mx-6 sm:px-6">
          <button
            onClick={() => hapticFeedback.tick()}
            className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition-all border ${
              isDarkMode
                ? 'bg-surface border-surface-border text-white/80'
                : 'bg-white border-slate-200 text-slate-700 shadow-sm'
            }`}
          >
            <Plus size={15} />
          </button>

          {ZONES.map((zone) => {
            const isActive = selectedZone === zone;
            return (
              <button
                key={zone}
                onClick={() => {
                  hapticFeedback.tick();
                  setSelectedZone(zone);
                }}
                className={`h-9 px-4 rounded-full text-xs font-bold shrink-0 transition-all border ${
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

        {/* 3D Isometric Room Scene Card */}
        <div className="mb-5">
          <RoomIsometricCard
            roomName={selectedZone}
            activeDevicesCount={activeCount}
            temperature={karlsruheTemp}
            activeMode={sunsetState.moodName}
            isSunsetOn={sunsetState.isOn}
            isBedsideOn={ledStripState.isOn}
            onToggleSunset={onToggleSunset}
            onToggleBedside={onToggleLedStrip}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Devices Section Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <h3
            className={`text-sm font-bold tracking-wide ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            Devices
          </h3>
          <span
            className={`text-xs font-semibold ${
              isDarkMode ? 'text-accent-muted' : 'text-slate-500'
            }`}
          >
            {activeCount} Active
          </span>
        </div>

        {/* Device Cards Grid (IKEA removed, real 3 devices present) */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* Device 1: Sunset Lamp (Image 5 model) */}
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

          {/* Device 2: Three O Bedside Touch Night Lamp (Image 2) */}
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
      </div>
    </div>
  );
};
