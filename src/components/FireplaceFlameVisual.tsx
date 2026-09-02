import React, { useEffect, useRef } from 'react';
import { hapticFeedback } from '../services/haptics';

interface FireplaceFlameVisualProps {
  isOn: boolean;
  isSmokeOn: boolean;
  flameColor: string;
  flameColorName: string;
  timer?: string; // 'Off' | '1h' | '3h' | '5h' | 'ON'
  onTogglePower?: () => void;
  isDarkMode?: boolean;
}

interface FlameMistParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  opacity: number;
  curveOffset: number;
  turbSpeed: number;
}

export const FireplaceFlameVisual: React.FC<FireplaceFlameVisualProps> = ({
  isOn,
  isSmokeOn,
  flameColor,
  flameColorName,
  timer = 'Off',
  onTogglePower,
  isDarkMode = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // High-Fidelity Ultrasonic Billowing Flame Simulation (Tall & Leaping matching user photo)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: FlameMistParticle[] = [];
    let isRunning = true;
    let frameCount = 0;

    const width = canvas.width;
    const height = canvas.height;

    // Slot bounds (matches rectangular slot on top)
    const slotStartX = width * 0.18;
    const slotWidth = width * 0.64;

    const spawnParticle = (): FlameMistParticle => {
      // Gaussian distribution centered over slot
      const u = Math.random() + Math.random();
      const norm = u > 1 ? 2 - u : u;
      const x = slotStartX + norm * slotWidth;

      return {
        x,
        y: height - 8,
        vx: (Math.random() - 0.5) * 0.7,
        vy: -(2.4 + Math.random() * 3.2), // Tall leaping upward velocity
        size: 18 + Math.random() * 20,
        life: 0,
        maxLife: 45 + Math.random() * 35,
        opacity: 0.8 + Math.random() * 0.2,
        curveOffset: Math.random() * Math.PI * 2,
        turbSpeed: 0.04 + Math.random() * 0.05,
      };
    };

    const render = () => {
      if (!isRunning) return;
      frameCount++;

      ctx.clearRect(0, 0, width, height);

      if (isOn) {
        // If smoke is on: spawn thick billowing flame mist particles
        // If smoke is off: spawn subtle luminous heat shimmer
        const spawnCount = isSmokeOn ? 5 : 1;
        const maxParticles = isSmokeOn ? 120 : 25;

        for (let i = 0; i < spawnCount; i++) {
          if (particles.length < maxParticles) {
            particles.push(spawnParticle());
          }
        }

        // Draw particles with soft radial gradients
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.life++;

          // Fluid organic wind turbulence
          p.x += p.vx + Math.sin(frameCount * p.turbSpeed + p.curveOffset) * 0.85;
          p.y += p.vy;
          p.size += 0.55; // Natural expansion as flame mist ascends

          const progress = p.life / p.maxLife;
          const currentAlpha = p.opacity * (1 - progress);

          if (progress >= 1 || currentAlpha <= 0) {
            particles.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.globalAlpha = currentAlpha * (isSmokeOn ? 1.0 : 0.3);
          ctx.globalCompositeOperation = 'screen';

          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          // Brilliant white-hot center transitioning to golden yellow then selected flame color
          grad.addColorStop(0, '#FFFFFF');
          grad.addColorStop(0.18, '#FEF08A');
          grad.addColorStop(0.6, flameColor);
          grad.addColorStop(1, 'transparent');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Brilliant glowing emitter strip at slot mouth (1:1 with photo)
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const slotGrad = ctx.createLinearGradient(slotStartX, 0, slotStartX + slotWidth, 0);
        slotGrad.addColorStop(0, 'transparent');
        slotGrad.addColorStop(0.2, '#FFFBEB');
        slotGrad.addColorStop(0.5, '#FEF08A');
        slotGrad.addColorStop(0.8, '#FFFBEB');
        slotGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = slotGrad;
        ctx.fillRect(slotStartX, height - 10, slotWidth, 9);

        // Rising micro-ember sparks
        if (isSmokeOn && frameCount % 5 === 0) {
          const sparkX = slotStartX + Math.random() * slotWidth;
          const sparkY = height - 16 - Math.random() * 60;
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(sparkX, sparkY, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else {
        particles = [];
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOn, isSmokeOn, flameColor]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full py-2 select-none">
      {/* 1. Volumetric Leaping Flames & Mist Canvas (Tall 180px, matches photo) */}
      <div className="relative w-80 sm:w-96 h-52 flex items-end justify-center overflow-visible pointer-events-none mb-[-24px] z-20">
        {/* Soft Ambient Volumetric Backlight Glow */}
        {isOn && (
          <div
            className="absolute -bottom-6 w-72 h-44 blur-3xl opacity-85 transition-all duration-700 animate-pulse rounded-full"
            style={{ backgroundColor: flameColor }}
          />
        )}

        {/* High-Performance Canvas Flame Mist */}
        <canvas
          ref={canvasRef}
          width={380}
          height={210}
          className="w-full h-full object-cover"
        />
      </div>

      {/* 2. The Physical Fireplace Chassis (1:1 with photo - Sharp obsidian rectangular box) */}
      <div
        onClick={() => {
          if (onTogglePower) {
            hapticFeedback.click();
            onTogglePower();
          }
        }}
        className={`relative w-84 sm:w-96 h-52 rounded-2xl border flex flex-col overflow-hidden shadow-2xl transition-all duration-500 z-10 cursor-pointer active:scale-98 ${
          isDarkMode
            ? 'bg-[#101114] border-[#25272D] shadow-[0_30px_70px_rgba(0,0,0,0.95)]'
            : 'bg-[#181A1E] border-[#32363E] shadow-[0_30px_70px_rgba(0,0,0,0.65)]'
        }`}
        style={{
          boxShadow: isOn
            ? `0 25px 60px -15px rgba(0,0,0,0.9), 0 0 35px ${flameColor}25, inset 0 1px 2px rgba(255,255,255,0.12)`
            : '0 25px 60px -15px rgba(0,0,0,0.8), inset 0 1px 2px rgba(255,255,255,0.06)',
        }}
      >
        {/* Top Recessed Lid with Horizontal Emitter Slot */}
        <div className="w-full h-7 bg-[#0B0C0E] border-b border-[#202227] flex items-center justify-center px-6 relative">
          <div className="absolute top-1 inset-x-8 h-[1px] bg-white/5" />

          {/* Recessed Flame Exhaust Slot */}
          <div
            className={`w-full max-w-[250px] h-2.5 rounded-full transition-all duration-500 relative flex items-center justify-center ${
              isOn
                ? 'bg-amber-300 shadow-[0_0_18px_#F59E0B]'
                : 'bg-black/95'
            }`}
            style={{
              backgroundColor: isOn ? flameColor : undefined,
              boxShadow: isOn ? `0 0 22px ${flameColor}` : undefined,
            }}
          >
            {isOn && (
              <span className="w-4/5 h-1 rounded-full bg-white blur-[0.8px] animate-pulse" />
            )}
          </div>
        </div>

        {/* Front Panoramic Glass Chamber with Stacked Charred Logs (Exact Match with Image 1) */}
        <div className="relative flex-1 m-3 mb-1.5 rounded-xl bg-[#060709] border border-white/10 overflow-hidden flex flex-col justify-end p-2 shadow-inner">
          {/* Internal Chamber Fire Backlight & Reflections */}
          <div
            className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
              isOn ? 'opacity-95' : 'opacity-0'
            }`}
            style={{
              background: `radial-gradient(ellipse at 50% 95%, ${flameColor} 0%, rgba(0,0,0,0.85) 80%)`,
            }}
          />

          {/* Glass Specular Reflection Highlight */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background:
                'linear-gradient(125deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.02) 40%, transparent 60%)',
            }}
          />

          {/* Stacked 3D Charred Firewood Logs (1:1 with photo) */}
          <div className="relative z-10 flex flex-col items-center w-full">
            <svg
              viewBox="0 0 280 85"
              className="w-full h-28 transition-all duration-500"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="logCharredWood" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#32343C" />
                  <stop offset="35%" stopColor="#1C1E23" />
                  <stop offset="100%" stopColor="#08090B" />
                </linearGradient>
                <linearGradient id="logBarkHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#40434D" />
                  <stop offset="40%" stopColor="#25272E" />
                  <stop offset="100%" stopColor="#0C0D10" />
                </linearGradient>
                <linearGradient id="flameBackglow" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.85" />
                  <stop offset="40%" stopColor="#F59E0B" stopOpacity="0.75" />
                  <stop offset="85%" stopColor="#FEF08A" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* SOFT VOLUMETRIC INTERNAL FIRE GLOW (Behind the logs) */}
              {isOn && (
                <g className="opacity-90">
                  <ellipse cx="140" cy="55" rx="100" ry="35" fill="url(#flameBackglow)" filter="blur(6px)" />
                  <ellipse cx="95" cy="45" rx="45" ry="25" fill="url(#flameBackglow)" filter="blur(4px)" className="animate-pulse" />
                  <ellipse cx="185" cy="45" rx="45" ry="25" fill="url(#flameBackglow)" filter="blur(4px)" className="animate-pulse" />
                </g>
              )}

              {/* FLAT CHARCOAL BED (Rugged coal rocks spanning the bottom - 1:1 with photo) */}
              <g fill="#121316" stroke="#0A0B0D" strokeWidth="1">
                {/* Individual jagged coal lumps */}
                <polygon points="15,78 35,68 55,70 65,78 20,82" />
                <polygon points="50,78 75,66 95,68 110,78 55,82" />
                <polygon points="98,78 120,67 145,69 160,78 102,82" />
                <polygon points="150,78 175,66 205,68 220,78 155,82" />
                <polygon points="210,78 235,67 260,70 270,78 215,82" />
              </g>

              {/* GLOWING RED & ORANGE COALS BENEATH LOGS */}
              {isOn && (
                <>
                  {/* Broad Fiery Lava Glow Under Coals */}
                  <rect x="20" y="68" width="240" height="12" rx="6" fill="#EF4444" filter="blur(3px)" className="opacity-95" />
                  {/* Glowing Orange Fissures Between Rocks */}
                  <path d="M30 73 L70 71 L110 74 L160 72 L210 74 L255 72" stroke={flameColor} strokeWidth="4.5" strokeLinecap="round" className="animate-pulse" />
                  <path d="M55 72 L95 70 L145 73 L195 71 L235 73" stroke="#FEF08A" strokeWidth="2" strokeLinecap="round" />
                  
                  {/* Molten Sparks & Hot Spots */}
                  <circle cx="75" cy="71" r="2.5" fill="#FFFBEB" className="animate-ping" />
                  <circle cx="140" cy="70" r="3" fill="#FEF08A" className="animate-ping" />
                  <circle cx="215" cy="72" r="2.5" fill="#FFFBEB" className="animate-ping" />
                </>
              )}

              {/* LOG 1: LEFT HORIZONTAL CHARRED LOG */}
              <path
                d="M30 72 C40 60, 80 56, 125 58 L120 68 C80 66, 45 68, 30 74 Z"
                fill="url(#logBarkHighlight)"
                stroke="#08090B"
                strokeWidth="1.2"
              />
              <path d="M45 66 Q80 62 110 64" stroke="#14151B" strokeWidth="1" />
              <ellipse cx="32" cy="73" rx="5" ry="3" fill="#1A1C22" stroke="#0B0C0E" />

              {/* LOG 2: CENTER HEAVY CHARRED CYLINDER (Signature from photo) */}
              <path
                d="M105 60 C120 50, 165 48, 220 52 L215 65 C165 62, 120 62, 105 68 Z"
                fill="url(#logBarkHighlight)"
                stroke="#08090B"
                strokeWidth="1.5"
              />
              {/* Bark ridges on Center Log */}
              <path d="M125 56 Q165 52 205 55" stroke="#121318" strokeWidth="1.5" />
              <path d="M130 61 Q170 57 200 60" stroke="#121318" strokeWidth="1.2" />
              {/* Cut Face of Center Log (Facing right, exactly like photo) */}
              <ellipse cx="218" cy="58" rx="7" ry="10" fill="#24262E" stroke="#0F1014" strokeWidth="1" />
              <ellipse cx="218" cy="58" rx="4" ry="6" fill="#15171D" />
              <ellipse cx="218" cy="58" rx="2" ry="3" fill="#0C0D10" />

              {/* LOG 3: RIGHT DIAGONAL CROSSED BRANCH (Rests on top of center log, sloping down) */}
              <path
                d="M165 48 L240 68 L230 76 L155 56 Z"
                fill="url(#logCharredWood)"
                stroke="#060708"
                strokeWidth="1.5"
              />
              <path d="M175 54 L225 68" stroke="#101116" strokeWidth="1.2" />
              <ellipse cx="160" cy="52" rx="6" ry="4" fill="#2A2D36" stroke="#0E0F12" transform="rotate(-25 160 52)" />

              {/* LOG 4: CENTER KNOT TIMBER */}
              <path
                d="M75 68 C90 62, 130 60, 165 64 L160 72 C125 70, 90 70, 75 74 Z"
                fill="url(#logCharredWood)"
                stroke="#060708"
                strokeWidth="1.2"
              />
              <ellipse cx="115" cy="65" rx="5" ry="3" fill="#161820" stroke="#090A0C" />
            </svg>
          </div>
        </div>

        {/* 3 Status Timer LEDs Centered Below Glass Window: 1H  3H  5H (Exact match with photo!) */}
        <div className="w-full pb-1.5 flex items-center justify-center gap-4 text-[9px] font-mono font-bold tracking-wider select-none">
          {/* 1H Indicator */}
          <div className="flex flex-col items-center gap-0.5">
            <span
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                isOn && timer === '1h'
                  ? 'bg-amber-400 shadow-[0_0_8px_#F59E0B]'
                  : 'bg-zinc-800'
              }`}
            />
            <span className={isOn && timer === '1h' ? 'text-amber-400' : 'text-zinc-600'}>
              1H
            </span>
          </div>

          {/* 3H Indicator */}
          <div className="flex flex-col items-center gap-0.5">
            <span
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                isOn && timer === '3h'
                  ? 'bg-amber-400 shadow-[0_0_8px_#F59E0B]'
                  : 'bg-zinc-800'
              }`}
            />
            <span className={isOn && timer === '3h' ? 'text-amber-400' : 'text-zinc-600'}>
              3H
            </span>
          </div>

          {/* 5H Indicator */}
          <div className="flex flex-col items-center gap-0.5">
            <span
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                isOn && timer === '5h'
                  ? 'bg-amber-400 shadow-[0_0_8px_#F59E0B]'
                  : 'bg-zinc-800'
              }`}
            />
            <span className={isOn && timer === '5h' ? 'text-amber-400' : 'text-zinc-600'}>
              5H
            </span>
          </div>
        </div>
      </div>

      {/* 3. Mirror Reflection on Table Surface Below Box (1:1 with photo!) */}
      {isOn && (
        <div
          className="w-72 h-8 blur-md rounded-full opacity-60 transition-all duration-500 mt-[-4px] scale-y-[-1]"
          style={{
            background: `radial-gradient(ellipse at 50% 50%, #EF4444 0%, ${flameColor} 40%, transparent 80%)`,
          }}
        />
      )}

      {/* Subtitle status badge */}
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
