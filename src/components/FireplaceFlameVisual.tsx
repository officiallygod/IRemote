import React, { useEffect, useRef } from 'react';

interface FireplaceFlameVisualProps {
  isOn: boolean;
  isSmokeOn: boolean;
  flameColor: string;
  flameColorName: string;
  onTogglePower?: () => void;
  isDarkMode?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  alpha: number;
  hueShift: number;
}

export const FireplaceFlameVisual: React.FC<FireplaceFlameVisualProps> = ({
  isOn,
  isSmokeOn,
  flameColor,
  flameColorName,
  onTogglePower,
  isDarkMode = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Realistic Ultrasonic Flame Mist Particle Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let isRunning = true;

    const width = canvas.width;
    const height = canvas.height;

    const createParticle = (): Particle => {
      // Emitter spans across the top rectangular slot
      const spawnX = width * 0.18 + Math.random() * (width * 0.64);
      return {
        x: spawnX,
        y: height - 6,
        vx: (Math.random() - 0.5) * 0.7,
        vy: -(1.6 + Math.random() * 2.2), // Rising velocity
        size: 14 + Math.random() * 18,
        life: 0,
        maxLife: 35 + Math.random() * 30,
        alpha: 0.65 + Math.random() * 0.35,
        hueShift: (Math.random() - 0.5) * 15,
      };
    };

    const render = () => {
      if (!isRunning) return;

      ctx.clearRect(0, 0, width, height);

      if (isOn && isSmokeOn) {
        // Spawn 3-5 new particles per frame for thick billowing flame mist
        for (let i = 0; i < 4; i++) {
          if (particles.length < 85) {
            particles.push(createParticle());
          }
        }

        // Update & draw particles with soft radial gradients
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.life++;
          p.x += p.vx + Math.sin(p.life * 0.08) * 0.6; // Organic wind turbulence
          p.y += p.vy;
          p.size += 0.35; // Expands as it rises

          const progress = p.life / p.maxLife;
          const currentAlpha = p.alpha * (1 - progress);

          if (progress >= 1 || currentAlpha <= 0) {
            particles.splice(i, 1);
            continue;
          }

          // Volumetric soft fire mist puff
          ctx.save();
          ctx.globalAlpha = currentAlpha;
          ctx.globalCompositeOperation = 'screen';

          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          // Core bright white-hot center transitioning to vivid flame color then transparent
          grad.addColorStop(0, '#FFFFFF');
          grad.addColorStop(0.25, '#FEF08A');
          grad.addColorStop(0.65, flameColor);
          grad.addColorStop(1, 'transparent');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Brilliant glowing emitter line at slot mouth
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const slotGrad = ctx.createLinearGradient(width * 0.16, 0, width * 0.84, 0);
        slotGrad.addColorStop(0, 'transparent');
        slotGrad.addColorStop(0.3, '#FFFBEB');
        slotGrad.addColorStop(0.5, '#FEF08A');
        slotGrad.addColorStop(0.7, '#FFFBEB');
        slotGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = slotGrad;
        ctx.fillRect(width * 0.16, height - 8, width * 0.68, 6);
        ctx.restore();
      } else {
        particles = [];
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOn, isSmokeOn, flameColor]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full py-4 select-none">
      {/* 1. Realistic Billowing Volumetric Flame Mist Canvas (Matches Photo) */}
      <div className="relative w-72 sm:w-80 h-36 flex items-end justify-center overflow-visible pointer-events-none mb-[-12px] z-20">
        {/* Soft Ambient Volumetric Backlight Glow */}
        {isOn && isSmokeOn && (
          <div
            className="absolute -bottom-4 w-64 h-32 blur-2xl opacity-80 transition-all duration-700 animate-pulse rounded-full"
            style={{ backgroundColor: flameColor }}
          />
        )}

        {/* High-Performance Canvas Flame Mist */}
        <canvas
          ref={canvasRef}
          width={320}
          height={140}
          className="w-full h-full object-cover"
        />
      </div>

      {/* 2. The Physical Humidifier Chassis (1:1 with Allen's Photo) */}
      <div
        className={`relative w-72 sm:w-80 h-40 rounded-2xl border flex flex-col overflow-hidden shadow-2xl transition-all duration-500 z-10 ${
          isDarkMode
            ? 'bg-[#121417] border-[#2A2E35] shadow-[0_25px_60px_rgba(0,0,0,0.9)]'
            : 'bg-[#1A1C20] border-[#373C44] shadow-[0_25px_60px_rgba(0,0,0,0.6)]'
        }`}
      >
        {/* Top Bezel with Horizontal Recessed Mist Slot */}
        <div className="w-full h-6 bg-[#0E1012] border-b border-[#24272D] flex items-center justify-center relative px-4">
          {/* Recessed Flame Slot */}
          <div
            className={`w-full max-w-[210px] h-2.5 rounded-full transition-all duration-500 relative flex items-center justify-center ${
              isOn
                ? 'bg-amber-300 shadow-[0_0_16px_#F59E0B]'
                : 'bg-black/90'
            }`}
            style={{
              backgroundColor: isOn ? flameColor : undefined,
              boxShadow: isOn ? `0 0 20px ${flameColor}` : undefined,
            }}
          >
            {isOn && (
              <span className="w-2/3 h-1 rounded-full bg-white blur-[1px] animate-pulse" />
            )}
          </div>
        </div>

        {/* Front Panoramic Glass Chamber with 3D Charred Logs & Glowing Ember Bed */}
        <div className="relative flex-1 m-2.5 rounded-xl bg-[#090A0C] border border-white/10 overflow-hidden flex flex-col justify-end p-2.5 shadow-inner">
          {/* Chamber Ambient Backlight & Dancing Flame Reflections */}
          <div
            className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
              isOn ? 'opacity-85' : 'opacity-0'
            }`}
            style={{
              background: `radial-gradient(ellipse at 50% 90%, ${flameColor} 0%, rgba(0,0,0,0.8) 75%)`,
            }}
          />

          {/* Dancing Light Reflection Caustics */}
          {isOn && (
            <div
              className="absolute inset-0 opacity-40 pointer-events-none animate-pulse"
              style={{
                background: `linear-gradient(135deg, transparent 40%, ${flameColor} 60%, transparent 80%)`,
                animationDuration: '2.5s',
              }}
            />
          )}

          {/* Charred Fireplace Logs & Glowing Burning Embers */}
          <div className="relative z-10 flex flex-col items-center w-full">
            <svg
              viewBox="0 0 260 55"
              className="w-full h-14 transition-all duration-500"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Back Log 1 */}
              <path
                d="M10 42 Q65 24 130 26 Q195 28 250 42 L245 52 L15 52 Z"
                fill="#16171A"
                stroke="#0A0B0D"
                strokeWidth="1.5"
              />
              {/* Crossed Foreground Log 1 */}
              <path
                d="M25 48 L95 30 Q112 28 124 34 L50 52 Z"
                fill="#222328"
                stroke="#121316"
                strokeWidth="1.5"
              />
              {/* Crossed Foreground Log 2 */}
              <path
                d="M142 34 Q160 26 230 47 L220 52 L136 40 Z"
                fill="#1E1F24"
                stroke="#121316"
                strokeWidth="1.5"
              />
              {/* Center Log 3 */}
              <path
                d="M85 45 Q125 36 175 42 L165 50 L95 50 Z"
                fill="#27282F"
                stroke="#151619"
                strokeWidth="1"
              />

              {/* Glowing Ember Bed & Burning Fissures (1:1 with photo) */}
              {isOn && (
                <>
                  {/* Glowing Coal Base */}
                  <path
                    d="M30 48 Q130 42 230 48"
                    stroke="#EF4444"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    className="opacity-90"
                    filter="blur(1px)"
                  />
                  {/* Fiery Core Cracks */}
                  <path
                    d="M45 44 Q85 34 115 36"
                    stroke={flameColor}
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="animate-pulse"
                  />
                  <path
                    d="M140 36 Q175 32 205 44"
                    stroke={flameColor}
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="animate-pulse"
                  />
                  {/* White-Hot Hotspots */}
                  <circle cx="90" cy="40" r="2.5" fill="#FEF08A" className="animate-ping" />
                  <circle cx="160" cy="38" r="3" fill="#FFFBEB" className="animate-ping" />
                  <circle cx="125" cy="44" r="3" fill="#F97316" />
                  <circle cx="65" cy="46" r="2" fill="#FBBF24" />
                  <circle cx="185" cy="42" r="2.5" fill="#FBBF24" />
                </>
              )}
            </svg>

            {/* Front Indicator Status Dots */}
            <div className="flex items-center justify-center gap-2.5 mt-1 opacity-70">
              <span
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  isOn ? 'bg-amber-400 shadow-[0_0_6px_#F59E0B]' : 'bg-zinc-700'
                }`}
              />
              <span
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  isOn && isSmokeOn ? 'bg-sky-400 shadow-[0_0_6px_#38BDF8]' : 'bg-zinc-700'
                }`}
              />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
            </div>
          </div>
        </div>
      </div>

      {/* Warm Tabletop Reflection Underneath the Box */}
      {isOn && (
        <div
          className="w-64 h-5 blur-md rounded-full opacity-60 transition-all duration-500 mt-[-4px]"
          style={{
            background: `radial-gradient(ellipse at 50% 50%, ${flameColor} 0%, transparent 80%)`,
          }}
        />
      )}

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
