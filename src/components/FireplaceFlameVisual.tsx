import React from 'react';

interface FireplaceFlameVisualProps {
  isOn: boolean;
  isSmokeOn: boolean;
  flameColor: string;
  flameColorName: string;
  onTogglePower?: () => void;
  isDarkMode?: boolean;
}

export const FireplaceFlameVisual: React.FC<FireplaceFlameVisualProps> = ({
  isOn,
  isSmokeOn,
  flameColor,
  flameColorName,
  onTogglePower,
  isDarkMode = true,
}) => {
  return (
    <div className="relative flex flex-col items-center justify-center w-full py-4 select-none">
      {/* Illuminated Rising Mist / Flame Plumes from Top Slot */}
      <div className="relative w-64 h-24 flex items-end justify-center overflow-visible pointer-events-none mb-[-6px] z-10">
        {isOn && isSmokeOn && (
          <>
            {/* Ambient Flame Aura */}
            <div
              className="absolute -bottom-2 w-56 h-28 blur-xl opacity-75 transition-all duration-700 animate-pulse rounded-full"
              style={{
                backgroundColor: flameColor,
              }}
            />

            {/* Rising Flame Mist Tongue 1 (Center) */}
            <div
              className="absolute bottom-0 w-24 h-28 rounded-t-full blur-md opacity-90 transition-colors duration-500 animate-bounce"
              style={{
                background: `linear-gradient(to top, ${flameColor}, transparent)`,
                animationDuration: '2.4s',
              }}
            />

            {/* Rising Flame Mist Tongue 2 (Left) */}
            <div
              className="absolute bottom-0 left-10 w-20 h-24 rounded-t-full blur-md opacity-80 transition-colors duration-500"
              style={{
                background: `linear-gradient(to top, ${flameColor}, transparent)`,
                animation: 'pulse 1.8s ease-in-out infinite',
              }}
            />

            {/* Rising Flame Mist Tongue 3 (Right) */}
            <div
              className="absolute bottom-0 right-10 w-20 h-24 rounded-t-full blur-md opacity-80 transition-colors duration-500"
              style={{
                background: `linear-gradient(to top, ${flameColor}, transparent)`,
                animation: 'pulse 2.2s ease-in-out infinite',
              }}
            />

            {/* Bright Core Fire Glow */}
            <div
              className="absolute bottom-0 w-40 h-8 rounded-full blur-sm opacity-95 transition-colors duration-300"
              style={{
                backgroundColor: '#FFF7ED',
                boxShadow: `0 0 20px ${flameColor}`,
              }}
            />
          </>
        )}
      </div>

      {/* The Physical Humidifier Chassis (Matches Photo 1 & 2) */}
      <div
        className={`relative w-72 sm:w-80 h-36 rounded-2xl border flex flex-col overflow-hidden shadow-2xl transition-all duration-500 ${
          isDarkMode
            ? 'bg-[#181A1D] border-[#2A2E35] shadow-[0_20px_50px_rgba(0,0,0,0.8)]'
            : 'bg-[#212429] border-[#373C44] shadow-[0_20px_50px_rgba(0,0,0,0.5)]'
        }`}
      >
        {/* Top Bezel with Horizontal Mist Emitter Slot */}
        <div className="w-full h-5 bg-[#121417] border-b border-[#2A2E35] flex items-center justify-center relative">
          {/* Flame Exhaust Vent */}
          <div
            className={`w-44 h-2 rounded-full transition-all duration-500 ${
              isOn
                ? 'bg-amber-200 shadow-[0_0_12px_#F59E0B]'
                : 'bg-black/80'
            }`}
            style={{
              backgroundColor: isOn ? flameColor : undefined,
              boxShadow: isOn ? `0 0 16px ${flameColor}` : undefined,
            }}
          />
        </div>

        {/* Front Glass Fireplace Chamber */}
        <div className="relative flex-1 m-2 rounded-xl bg-black/90 border border-white/5 overflow-hidden flex flex-col justify-end p-2.5">
          {/* Chamber Ambient Backlight */}
          <div
            className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
              isOn ? 'opacity-70' : 'opacity-0'
            }`}
            style={{
              background: `radial-gradient(ellipse at 50% 100%, ${flameColor} 0%, transparent 80%)`,
            }}
          />

          {/* Charred Fireplace Logs & Burning Embers */}
          <div className="relative z-10 flex flex-col items-center w-full">
            {/* Log Silhouettes with Glowing Cracks */}
            <svg
              viewBox="0 0 240 45"
              className="w-full h-12 transition-all duration-500"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Back charred log */}
              <path
                d="M15 35 Q60 20 120 22 Q180 24 225 35 L220 42 L20 42 Z"
                fill="#1E1E22"
                stroke="#121214"
                strokeWidth="1.5"
              />
              {/* Crossed foreground log 1 */}
              <path
                d="M30 40 L90 25 Q105 23 115 28 L50 42 Z"
                fill="#27272D"
                stroke="#17171A"
                strokeWidth="1.5"
              />
              {/* Crossed foreground log 2 */}
              <path
                d="M130 28 Q145 22 205 39 L195 43 L125 33 Z"
                fill="#24242A"
                stroke="#17171A"
                strokeWidth="1.5"
              />

              {/* Glowing Embers Fissures (Pulses when ON) */}
              {isOn && (
                <>
                  <path
                    d="M45 38 Q85 30 110 32"
                    stroke={flameColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="animate-pulse"
                  />
                  <path
                    d="M135 32 Q165 28 190 38"
                    stroke={flameColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="animate-pulse"
                  />
                  <circle cx="80" cy="35" r="2" fill="#FEF08A" className="animate-ping" />
                  <circle cx="155" cy="34" r="2.5" fill="#FEF08A" className="animate-ping" />
                  <circle cx="120" cy="38" r="3" fill="#F97316" />
                </>
              )}
            </svg>

            {/* Front Indicator Dots */}
            <div className="flex items-center justify-center gap-3 mt-1.5 opacity-60">
              <span className={`w-1.5 h-1.5 rounded-full ${isOn ? 'bg-amber-400' : 'bg-zinc-700'}`} />
              <span className={`w-1.5 h-1.5 rounded-full ${isOn && isSmokeOn ? 'bg-sky-400' : 'bg-zinc-700'}`} />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Subtitle status label */}
      <div className="mt-3 flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${
            isOn ? 'bg-amber-400 animate-pulse' : 'bg-zinc-600'
          }`}
        />
        <span
          className={`text-xs font-bold uppercase tracking-wider ${
            isDarkMode ? 'text-accent-muted' : 'text-slate-600'
          }`}
        >
          {isOn ? `${flameColorName} • ${isSmokeOn ? 'Flame Mist Active' : 'Light Only'}` : 'Powered Off'}
        </span>
      </div>
    </div>
  );
};
