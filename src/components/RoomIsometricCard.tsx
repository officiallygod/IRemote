import React from 'react';
import { Thermometer, Zap, Sparkles } from 'lucide-react';

interface RoomIsometricCardProps {
  roomName: string;
  activeDevicesCount: number;
  temperature?: string;
  activeMode?: string;
  isSunsetOn: boolean;
  isBedsideOn: boolean;
  onToggleSunset: () => void;
  onToggleBedside: () => void;
  isDarkMode?: boolean;
}

export const RoomIsometricCard: React.FC<RoomIsometricCardProps> = ({
  roomName = 'Dorm Room',
  activeDevicesCount,
  temperature = '22°',
  activeMode = 'Golden Hour',
  isSunsetOn,
  isBedsideOn,
  onToggleSunset,
  onToggleBedside,
  isDarkMode = true,
}) => {
  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden border shadow-2xl transition-colors ${
        isDarkMode ? 'bg-surface border-surface-border' : 'bg-white border-slate-200'
      }`}
    >
      {/* 3D Isometric Dorm Room Scene */}
      <div
        className={`relative w-full h-[255px] flex items-center justify-center overflow-hidden transition-colors ${
          isDarkMode
            ? 'bg-gradient-to-b from-[#18181C] to-[#101012]'
            : 'bg-gradient-to-b from-slate-100 to-slate-200'
        }`}
      >
        <svg viewBox="0 0 420 280" className="w-full h-full object-cover scale-105">
          <defs>
            {/* Wall Gradients */}
            <linearGradient id="leftWallGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isDarkMode ? '#333842' : '#CBD5E1'} />
              <stop offset="100%" stopColor={isDarkMode ? '#21252B' : '#94A3B8'} />
            </linearGradient>
            <linearGradient id="rightWallGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isDarkMode ? '#282C34' : '#94A3B8'} />
              <stop offset="100%" stopColor={isDarkMode ? '#1B1D23' : '#64748B'} />
            </linearGradient>

            {/* Hardwood Floor with planks */}
            <linearGradient id="floorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isDarkMode ? '#5C3826' : '#9A5B32'} />
              <stop offset="100%" stopColor={isDarkMode ? '#382015' : '#713F1D'} />
            </linearGradient>

            {/* Window Daylight Beam onto floor */}
            <linearGradient id="sunbeam" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" stopOpacity={isDarkMode ? '0.22' : '0.45'} />
              <stop offset="100%" stopColor="#FEF08A" stopOpacity="0" />
            </linearGradient>

            {/* Window Outdoor Sky */}
            <linearGradient id="windowView" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="70%" stopColor="#93C5FD" />
              <stop offset="100%" stopColor="#FEF08A" />
            </linearGradient>

            {/* Sunset Projector Lamp Projected Solar Disc (Image 1) */}
            <radialGradient id="sunsetSolarHalo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.95" />
              <stop offset="35%" stopColor="#F97316" stopOpacity="0.88" />
              <stop offset="70%" stopColor="#FBBF24" stopOpacity="0.7" />
              <stop offset="92%" stopColor="#FEF08A" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FEF08A" stopOpacity="0" />
            </radialGradient>

            {/* Three O Bedside Lamp Warm Radiant Bubble (Image 2) */}
            <radialGradient id="bedsideWarmBubble" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFBEB" stopOpacity="0.95" />
              <stop offset="30%" stopColor="#FEF08A" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#F59E0B" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* 1. ROOM SHELL: Isometric Walls & Floor */}
          {/* Back Left Wall */}
          <polygon points="210,30 35,115 35,225 210,165" fill="url(#leftWallGrad)" />
          {/* Back Right Wall */}
          <polygon points="210,30 385,115 385,225 210,165" fill="url(#rightWallGrad)" />
          {/* Hardwood Floor */}
          <polygon points="35,225 210,165 385,225 210,285" fill="url(#floorGrad)" />

          {/* Floor Planks Line Accents */}
          <line x1="70" y1="213" x2="245" y2="177" stroke="#000" strokeWidth="0.8" strokeOpacity="0.15" />
          <line x1="105" y1="201" x2="280" y2="189" stroke="#000" strokeWidth="0.8" strokeOpacity="0.15" />
          <line x1="140" y1="189" x2="315" y2="201" stroke="#000" strokeWidth="0.8" strokeOpacity="0.15" />
          <line x1="175" y1="177" x2="350" y2="213" stroke="#000" strokeWidth="0.8" strokeOpacity="0.15" />

          {/* Baseboards */}
          <polyline points="35,224 210,164 385,224" fill="none" stroke={isDarkMode ? '#1E2127' : '#94A3B8'} strokeWidth="3" />

          {/* 2. THE WINDOW (On Left Wall, right next to the study desk) */}
          {/* Window Reveal Frame */}
          <polygon points="60,110 120,80 120,160 60,190" fill="url(#windowView)" />
          <polygon points="60,110 120,80 120,160 60,190" fill="none" stroke="#F8FAFC" strokeWidth="3.5" />
          {/* Cross Muntins */}
          <line x1="90" y1="95" x2="90" y2="175" stroke="#F8FAFC" strokeWidth="2" />
          <line x1="60" y1="150" x2="120" y2="120" stroke="#F8FAFC" strokeWidth="2" />
          {/* Window Sill */}
          <polygon points="56,190 122,157 126,162 60,195" fill="#E2E8F0" />
          {/* Sunbeam pouring across the desk & floor */}
          <polygon points="60,190 120,160 210,215 130,245" fill="url(#sunbeam)" pointerEvents="none" />

          {/* 3. WALL POSTER ON RIGHT WALL */}
          <polygon points="305,80 345,98 345,135 305,117" fill="#0F172A" stroke="#E2E8F0" strokeWidth="1.5" />
          <polygon points="310,87 340,101 340,129 310,115" fill="#38BDF8" opacity="0.6" />

          {/* 4. THE STUDY DESK (Placed beside the window) */}
          {/* Desk Surface (Oak/Walnut Wood) */}
          <polygon points="120,160 185,128 215,142 150,175" fill={isDarkMode ? '#8C5835' : '#B45309'} />
          {/* Desk Edges */}
          <polygon points="120,160 150,175 150,181 120,166" fill={isDarkMode ? '#5E381F' : '#92400E'} />
          <polygon points="150,175 215,142 215,148 150,181" fill={isDarkMode ? '#442614' : '#78350F'} />
          {/* Desk Legs (Black Metal) */}
          <line x1="123" y1="165" x2="123" y2="202" stroke="#09090B" strokeWidth="2.5" />
          <line x1="150" y1="180" x2="150" y2="218" stroke="#09090B" strokeWidth="2.5" />
          <line x1="213" y1="147" x2="213" y2="183" stroke="#09090B" strokeWidth="2.5" />

          {/* Laptop on Desk */}
          <polygon points="152,156 172,146 182,151 162,161" fill="#E2E8F0" />
          <polygon points="172,146 172,134 182,139 182,151" fill="#38BDF8" />

          {/* SUNSET PROJECTOR LAMP SITTING ON DESK (Image 1) */}
          {/* Base */}
          <ellipse cx="198" cy="138" rx="4.5" ry="2.2" fill="#09090B" />
          {/* Chrome Neck */}
          <line x1="198" y1="138" x2="198" y2="122" stroke="#E4E4E7" strokeWidth="1.8" />
          {/* Projector Head */}
          <circle cx="198" cy="119" r="4.5" fill={isSunsetOn ? '#F97316' : '#52525B'} stroke="#09090B" strokeWidth="1" />

          {/* SUNSET LAMP PROJECTION ON WALL (Image 1) */}
          {isSunsetOn && (
            <ellipse cx="185" cy="80" rx="55" ry="38" fill="url(#sunsetSolarHalo)" />
          )}

          {/* 5. COZY DORM BED (Right side of the room) */}
          {/* Bed Headboard */}
          <polygon points="310,125 330,115 365,132 345,142" fill={isDarkMode ? '#3F3F46' : '#475569'} />
          <polygon points="310,125 345,142 345,152 310,135" fill={isDarkMode ? '#27272A' : '#334155'} />

          {/* Bed Base & Mattress Frame */}
          <polygon points="225,170 325,123 355,138 255,185" fill={isDarkMode ? '#E2E8F0' : '#FFFFFF'} />
          <polygon points="225,170 255,185 255,198 225,183" fill={isDarkMode ? '#94A3B8' : '#CBD5E1'} />
          <polygon points="255,185 355,138 355,151 255,198" fill={isDarkMode ? '#64748B' : '#94A3B8'} />

          {/* Pillows */}
          <polygon points="305,135 325,125 335,130 315,140" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.8" />
          <polygon points="325,143 345,133 355,138 335,148" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.8" />

          {/* Cozy Duvet (Cyan Accent) */}
          <polygon points="235,176 295,148 335,168 275,196" fill={isDarkMode ? '#0284C7' : '#0369A1'} />
          {/* Folded Top Edge of Duvet */}
          <polygon points="295,148 290,145 330,165 335,168" fill="#38BDF8" />

          {/* 6. BEDSIDE NIGHTSTAND & THREE O NIGHT LAMP (Image 2) */}
          {/* Nightstand Table */}
          <polygon points="208,190 232,178 244,184 220,196" fill={isDarkMode ? '#5C3826' : '#92400E'} />
          <polygon points="208,190 220,196 220,208 208,202" fill={isDarkMode ? '#3B2015' : '#78350F'} />
          <polygon points="220,196 244,184 244,196 220,208" fill={isDarkMode ? '#27140B' : '#451A03'} />

          {/* Three O Bedside Touch Night Lamp Model (Image 2) */}
          {/* Base */}
          <ellipse cx="226" cy="186" rx="4" ry="2" fill="#E2E8F0" />
          {/* Translucent Frosted Dome */}
          <ellipse
            cx="226"
            cy="181"
            rx="3.5"
            ry="3.8"
            fill={isBedsideOn ? '#FFFBEB' : isDarkMode ? '#52525B' : '#CBD5E1'}
          />

          {/* Bedside Lamp Radiant Light Bubble (Image 2) */}
          {isBedsideOn && (
            <ellipse cx="226" cy="181" rx="34" ry="20" fill="url(#bedsideWarmBubble)" />
          )}

          {/* 7. DORM RUG (Between Bed and Desk) */}
          <polygon points="160,205 220,176 242,187 182,216" fill="#D97706" opacity="0.85" />

          {/* 8. POTTED MONSTERA PLANT (Corner) */}
          <circle cx="58" cy="210" r="8" fill="#15803D" />
          <circle cx="52" cy="205" r="7" fill="#16A34A" />
          <polygon points="53,212 63,212 61,223 55,223" fill="#B45309" />
        </svg>

        {/* Hotspot Pin for Sunset Lamp (On Study Desk) */}
        <div
          onClick={onToggleSunset}
          className="absolute top-[98px] left-[45%] cursor-pointer z-20 group"
          title="Toggle Sunset Lamp"
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 ${
              isSunsetOn
                ? 'bg-amber-400 text-black shadow-glow-amber scale-110'
                : 'bg-white/20 text-white/70 hover:bg-white/40'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
        </div>

        {/* Hotspot Pin for Three O Bedside Lamp (Beside Bed) */}
        <div
          onClick={onToggleBedside}
          className="absolute top-[152px] left-[53%] cursor-pointer z-20 group"
          title="Toggle Bedside Lamp"
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 ${
              isBedsideOn
                ? 'bg-yellow-300 text-black shadow-md scale-110'
                : 'bg-white/20 text-white/70 hover:bg-white/40'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
        </div>
      </div>

      {/* Floating Status Badges at Bottom (Clean temperature without Karlsruhe text) */}
      <div
        className={`p-3 backdrop-blur-md flex items-center justify-between border-t transition-colors ${
          isDarkMode ? 'bg-surface/90 border-surface-border' : 'bg-slate-50/90 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          {/* Temperature Badge (Clean, e.g. "22°") */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${
              isDarkMode
                ? 'bg-[#18181B] border-surface-border text-amber-300'
                : 'bg-white border-slate-200 text-amber-700 shadow-sm'
            }`}
            title="Room Temperature"
          >
            <Thermometer size={13} />
            <span>{temperature}</span>
          </div>

          {/* Active Devices Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${
              isDarkMode
                ? 'bg-[#18181B] border-surface-border text-white/80'
                : 'bg-white border-slate-200 text-slate-700 shadow-sm'
            }`}
          >
            <Zap size={13} className="text-sky-400" />
            <span>{activeDevicesCount} Active</span>
          </div>
        </div>

        {/* Mode Pill */}
        <div
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-medium ${
            isDarkMode
              ? 'bg-[#18181B] border-surface-border text-white/80'
              : 'bg-white border-slate-200 text-slate-700 shadow-sm'
          }`}
        >
          <Sparkles size={13} className="text-amber-400" />
          <span>{activeMode}</span>
        </div>
      </div>
    </div>
  );
};
