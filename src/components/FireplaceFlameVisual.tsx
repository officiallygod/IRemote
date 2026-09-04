import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
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

// Procedural Soft Volumetric Flame Particle Texture (Silky fluid feathering)
function createSoftFlameTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.2, 'rgba(254, 240, 138, 0.9)');
  grad.addColorStop(0.5, 'rgba(249, 115, 22, 0.6)');
  grad.addColorStop(0.8, 'rgba(239, 68, 68, 0.25)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
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
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rotationGroupRef = useRef<THREE.Group | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Dynamic references
  const pointLightRef = useRef<THREE.PointLight | null>(null);
  const chamberLightRef = useRef<THREE.PointLight | null>(null);
  const emberMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const slotMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const fissureMatRef = useRef<THREE.MeshBasicMaterial | null>(null);

  // Particle references
  const topFlameSpritesRef = useRef<Array<{
    sprite: THREE.Sprite;
    baseX: number;
    baseZ: number;
    speedY: number;
    speedX: number;
    phase: number;
    scaleBase: number;
  }>>([]);

  const insideFlameSpritesRef = useRef<Array<{
    sprite: THREE.Sprite;
    baseX: number;
    baseY: number;
    baseZ: number;
    phase: number;
    scaleBase: number;
  }>>([]);

  // Interactive 3D drag
  const isDragging = useRef(false);
  const prevPointerX = useRef(0);
  const targetRotationY = useRef(0);
  const currentRotationY = useRef(0);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = 250;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 0.18, 1.85); // Zoomed in closer for rich prominent detail!
    camera.lookAt(0, 0.06, 0);

    // 2. High-Performance WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Master Interactive Rotation Group
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);
    rotationGroupRef.current = masterGroup;

    // 4. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, isDarkMode ? 0.7 : 1.3);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff7ed, isDarkMode ? 1.0 : 1.5);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.35);
    rimLight.position.set(-2, -0.5, -2);
    scene.add(rimLight);

    // Dynamic Top Mist Flame Light
    const fireLight = new THREE.PointLight(new THREE.Color(flameColor), isOn ? 3.5 : 0, 3.8);
    fireLight.position.set(0, 0.2, 0.25);
    masterGroup.add(fireLight);
    pointLightRef.current = fireLight;

    // 5. Materials
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x111215,
      roughness: 0.35,
      metalness: 0.25,
    });
    const bevelMat = new THREE.MeshStandardMaterial({
      color: 0x1e2026,
      roughness: 0.25,
      metalness: 0.5,
    });
    const interiorCavityMat = new THREE.MeshStandardMaterial({
      color: 0x050608,
      roughness: 0.95,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x080a0e,
      roughness: 0.04,
      metalness: 0.1,
      transparent: true,
      opacity: 0.2, // Crystal clear view of burning logs and internal flames!
      transmission: 0.9,
      ior: 1.45,
    });
    const logMat = new THREE.MeshStandardMaterial({
      color: 0x2b2e36,
      roughness: 0.85,
      metalness: 0.1,
    });
    const logKnotMat = new THREE.MeshStandardMaterial({
      color: 0x424754,
      roughness: 0.7,
      metalness: 0.15,
    });

    // 6. The Fireplace Chassis Assembly: Hollow open frame with front window
    const chassisGroup = new THREE.Group();
    masterGroup.add(chassisGroup);

    // Chassis Back Plate
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.52, 0.04), interiorCavityMat);
    backWall.position.set(0, 0, -0.19);
    chassisGroup.add(backWall);

    // Chassis Top Arch / Border
    const topBorder = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.09, 0.42), chassisMat);
    topBorder.position.set(0, 0.215, 0);
    chassisGroup.add(topBorder);

    // Chassis Bottom Hearth Border
    const bottomBorder = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.09, 0.42), chassisMat);
    bottomBorder.position.set(0, -0.215, 0);
    chassisGroup.add(bottomBorder);

    // Chassis Left Pillar
    const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.34, 0.42), chassisMat);
    leftPillar.position.set(-0.555, 0, 0);
    chassisGroup.add(leftPillar);

    // Chassis Right Pillar
    const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.34, 0.42), chassisMat);
    rightPillar.position.set(0.555, 0, 0);
    chassisGroup.add(rightPillar);

    // Top Beveled Lid
    const topLid = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.04, 0.44), bevelMat);
    topLid.position.y = 0.27;
    chassisGroup.add(topLid);

    // Top Recessed Mist Emitter Channel
    const slotMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.86, 0.012, 0.04),
      new THREE.MeshBasicMaterial({
        color: isOn ? 0xfef08a : 0x07080a,
      })
    );
    slotMesh.position.set(0, 0.291, 0);
    chassisGroup.add(slotMesh);
    slotMatRef.current = slotMesh.material as THREE.MeshBasicMaterial;

    // Front Panoramic Tinted Glass Pane
    const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.34, 0.008), glassMat);
    frontGlass.position.set(0, 0, 0.21);
    chassisGroup.add(frontGlass);

    // Internal Warm Glow inside Firebox Chamber (Illuminating the logs from within)
    const chamberGlow = new THREE.PointLight(new THREE.Color(flameColor), isOn ? 3.5 : 0, 1.8);
    chamberGlow.position.set(0, 0.02, 0.1);
    chassisGroup.add(chamberGlow);
    chamberLightRef.current = chamberGlow;

    // 7. Molten Glowing Burning Ember Bed
    const emberMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.96, 0.03, 0.22),
      new THREE.MeshBasicMaterial({
        color: isOn ? new THREE.Color(flameColor) : 0x121316,
      })
    );
    emberMesh.position.set(0, -0.15, 0.1);
    chassisGroup.add(emberMesh);
    emberMatRef.current = emberMesh.material as THREE.MeshBasicMaterial;

    // 8. Stacked 3D Charred Oak Firewood Logs inside the Glass Chamber (1:1 with photo!)
    // Main horizontal charred timber
    const log1 = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.68, 16), logMat);
    log1.rotation.z = Math.PI / 2;
    log1.position.set(0, -0.09, 0.12);
    chassisGroup.add(log1);

    // Cut tree ring on main log
    const log1Cut = new THREE.Mesh(new THREE.CircleGeometry(0.038, 16), logKnotMat);
    log1Cut.rotation.y = Math.PI / 2;
    log1Cut.position.set(0.34, -0.09, 0.12);
    chassisGroup.add(log1Cut);

    // Left angled timber
    const log2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 16), logMat);
    log2.rotation.z = Math.PI / 3.3;
    log2.position.set(-0.18, -0.05, 0.14);
    chassisGroup.add(log2);

    // Right crossed diagonal branch (Rests on top of center log)
    const log3 = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.46, 16), logMat);
    log3.rotation.z = -Math.PI / 3.6;
    log3.position.set(0.2, -0.04, 0.14);
    chassisGroup.add(log3);

    // Fiery hot fissures between logs (pulses red/orange)
    const fissureMat = new THREE.MeshBasicMaterial({
      color: isOn ? 0xff3700 : 0x000000,
      transparent: true,
      opacity: isOn ? 0.95 : 0,
    });
    fissureMatRef.current = fissureMat;
    const fissure1 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.01, 0.04), fissureMat);
    fissure1.position.set(-0.12, -0.11, 0.15);
    chassisGroup.add(fissure1);
    const fissure2 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.01, 0.04), fissureMat);
    fissure2.position.set(0.14, -0.11, 0.15);
    chassisGroup.add(fissure2);

    // Shared Procedural Soft Flame Texture
    const flameTexture = createSoftFlameTexture();

    // -------------------------------------------------------------------------
    // 9. LAYER 1: FLAMES INSIDE THE FIREPLACE CHAMBER (Licking around the wood logs!)
    // -------------------------------------------------------------------------
    const insideFlamesGroup = new THREE.Group();
    chassisGroup.add(insideFlamesGroup);

    const insideSprites: Array<{
      sprite: THREE.Sprite;
      baseX: number;
      baseY: number;
      baseZ: number;
      phase: number;
      scaleBase: number;
    }> = [];

    // Create 18 dancing flame tongues nestled directly within the wood logs
    for (let i = 0; i < 18; i++) {
      const inSpMat = new THREE.SpriteMaterial({
        map: flameTexture,
        color: new THREE.Color(flameColor),
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const inSprite = new THREE.Sprite(inSpMat);
      const baseX = (Math.random() - 0.5) * 0.65;
      const baseY = -0.12 + Math.random() * 0.14; // Nestled between coals and top of logs
      const baseZ = 0.11 + Math.random() * 0.06;
      inSprite.position.set(baseX, baseY, baseZ);

      const scaleBase = 0.12 + Math.random() * 0.1;
      inSprite.scale.set(scaleBase, scaleBase * 1.6, 1);

      insideFlamesGroup.add(inSprite);

      insideSprites.push({
        sprite: inSprite,
        baseX,
        baseY,
        baseZ,
        phase: Math.random() * Math.PI * 2,
        scaleBase,
      });
    }
    insideFlameSpritesRef.current = insideSprites;

    // -------------------------------------------------------------------------
    // 10. LAYER 2: TOP VOLUMETRIC LEAPING FLAME MIST (Rising high out of the slot)
    // -------------------------------------------------------------------------
    const topSpritesGroup = new THREE.Group();
    masterGroup.add(topSpritesGroup);

    const topSprites: Array<{
      sprite: THREE.Sprite;
      baseX: number;
      baseZ: number;
      speedY: number;
      speedX: number;
      phase: number;
      scaleBase: number;
    }> = [];

    const numTopSprites = 38;
    for (let i = 0; i < numTopSprites; i++) {
      const spMat = new THREE.SpriteMaterial({
        map: flameTexture,
        color: new THREE.Color(flameColor),
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const sprite = new THREE.Sprite(spMat);
      const spawnX = (Math.random() - 0.5) * 0.78;
      const spawnZ = (Math.random() - 0.5) * 0.03;
      const spawnY = 0.3 + Math.random() * 0.45;
      sprite.position.set(spawnX, spawnY, spawnZ);

      const scaleBase = 0.22 + Math.random() * 0.2;
      sprite.scale.set(scaleBase, scaleBase * 1.5, 1);

      topSpritesGroup.add(sprite);

      topSprites.push({
        sprite,
        baseX: spawnX,
        baseZ: spawnZ,
        speedY: 0.007 + Math.random() * 0.011,
        speedX: (Math.random() - 0.5) * 0.003,
        phase: Math.random() * Math.PI * 2,
        scaleBase,
      });
    }
    topFlameSpritesRef.current = topSprites;

    // 11. Tabletop Mirror Reflection Plane below the fireplace
    const reflectionMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 0.6),
      new THREE.MeshBasicMaterial({
        color: isOn ? new THREE.Color(flameColor) : 0x000000,
        transparent: true,
        opacity: isOn ? 0.22 : 0,
        blending: THREE.AdditiveBlending,
      })
    );
    reflectionMesh.position.set(0, -0.28, 0);
    reflectionMesh.rotation.x = -Math.PI / 2;
    masterGroup.add(reflectionMesh);

    // 12. Interactive Pointer Drag for 3D Orbit
    const handlePointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      prevPointerX.current = e.clientX;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const deltaX = e.clientX - prevPointerX.current;
      prevPointerX.current = e.clientX;
      targetRotationY.current += deltaX * 0.007;
      targetRotationY.current = Math.max(-0.5, Math.min(0.5, targetRotationY.current));
    };

    const handlePointerUp = () => {
      isDragging.current = false;
    };

    container.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // 13. Visibility Observer (0% CPU when off-screen)
    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(container);

    let flameTime = 0;

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      if (!isVisible) return;
      flameTime += 0.04;

      // Spring rotation interpolation
      currentRotationY.current += (targetRotationY.current - currentRotationY.current) * 0.12;
      if (rotationGroupRef.current) {
        rotationGroupRef.current.rotation.y = currentRotationY.current;
      }

      // Animate 1: INTERNAL FLAMES INSIDE THE FIREPLACE CHAMBER (Dancing between logs)
      if (isOn) {
        insideFlamesGroup.visible = true;
        insideSprites.forEach((sp) => {
          // Dynamic flickering and swaying
          const flick = Math.sin(flameTime * 5 + sp.phase);
          const scaleY = sp.scaleBase * (1.3 + flick * 0.4);
          const scaleX = sp.scaleBase * (1.0 - flick * 0.15);
          sp.sprite.scale.set(scaleX, scaleY, 1);
          sp.sprite.position.y = sp.baseY + Math.abs(Math.sin(flameTime * 4 + sp.phase)) * 0.04;
          sp.sprite.position.x = sp.baseX + Math.sin(flameTime * 3 + sp.phase) * 0.015;
          sp.sprite.material.opacity = 0.75 + flick * 0.2;
        });

        // Pulsating thermal glow inside the chamber
        if (chamberLightRef.current) {
          chamberLightRef.current.intensity = 2.8 + Math.sin(flameTime * 4.5) * 0.6;
        }
      } else {
        insideFlamesGroup.visible = false;
        if (chamberLightRef.current) {
          chamberLightRef.current.intensity = 0;
        }
      }

      // Animate 2: TOP VOLUMETRIC MIST FLAMES
      if (isOn && isSmokeOn) {
        topSpritesGroup.visible = true;
        topSprites.forEach((sp) => {
          sp.sprite.position.y += sp.speedY;
          sp.sprite.position.x = sp.baseX + Math.sin(flameTime * 2.2 + sp.phase) * 0.035;

          const progress = (sp.sprite.position.y - 0.29) / 0.55;

          if (progress >= 1.0) {
            sp.sprite.position.y = 0.3;
            sp.baseX = (Math.random() - 0.5) * 0.78;
          } else {
            // Billowing expansion and soft fade out
            const scale = sp.scaleBase * (1.0 + progress * 0.9);
            sp.sprite.scale.set(scale, scale * 1.5, 1);
            sp.sprite.material.opacity = (1.0 - progress) * 0.8;
          }
        });

        // Pulsating top flame point light
        if (pointLightRef.current) {
          pointLightRef.current.intensity = 3.2 + Math.sin(flameTime * 3.5) * 0.7;
        }
      } else {
        topSpritesGroup.visible = false;
        if (pointLightRef.current) {
          pointLightRef.current.intensity = isOn ? 2.0 : 0;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      observer.disconnect();
      container.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isDarkMode]);

  // Real-time prop updates (Color & Power)
  useEffect(() => {
    if (pointLightRef.current) {
      pointLightRef.current.color.set(flameColor);
      pointLightRef.current.intensity = isOn ? 3.2 : 0;
    }
    if (chamberLightRef.current) {
      chamberLightRef.current.color.set(flameColor);
      chamberLightRef.current.intensity = isOn ? 2.8 : 0;
    }
    if (emberMatRef.current) {
      emberMatRef.current.color.set(isOn ? flameColor : '#121316');
    }
    if (fissureMatRef.current) {
      fissureMatRef.current.color.set(isOn ? '#FF3700' : '#000000');
      fissureMatRef.current.opacity = isOn ? 0.95 : 0;
    }
    if (slotMatRef.current) {
      slotMatRef.current.color.set(isOn ? '#FEF08A' : '#07080A');
    }
    if (insideFlameSpritesRef.current) {
      insideFlameSpritesRef.current.forEach((sp) => {
        sp.sprite.material.color.set(flameColor);
      });
    }
    if (topFlameSpritesRef.current) {
      topFlameSpritesRef.current.forEach((sp) => {
        sp.sprite.material.color.set(flameColor);
      });
    }
  }, [isOn, isSmokeOn, flameColor]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full select-none">
      {/* 1. Photorealistic 3D Three.js WebGL Fireplace Viewport */}
      <div
        onClick={() => {
          if (onTogglePower) {
            hapticFeedback.click();
            onTogglePower();
          }
        }}
        className="relative w-full flex items-center justify-center cursor-grab active:cursor-grabbing touch-none overflow-visible py-1"
      >
        <div ref={mountRef} className="w-full h-[250px] flex items-center justify-center" />
      </div>

      {/* 2. Authentic 1H  3H  5H Status LEDs Below Window (1:1 with photo) */}
      <div className="w-full flex items-center justify-center gap-6 text-[10px] font-mono font-bold tracking-wider mt-[-6px] select-none">
        {/* 1H Indicator */}
        <div className="flex flex-col items-center gap-0.5">
          <span
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              isOn && timer === '1h'
                ? 'bg-amber-400 shadow-[0_0_10px_#F59E0B]'
                : 'bg-zinc-800'
            }`}
          />
          <span className={isOn && timer === '1h' ? 'text-amber-400 font-extrabold' : 'text-zinc-600'}>
            1H
          </span>
        </div>

        {/* 3H Indicator */}
        <div className="flex flex-col items-center gap-0.5">
          <span
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              isOn && timer === '3h'
                ? 'bg-amber-400 shadow-[0_0_10px_#F59E0B]'
                : 'bg-zinc-800'
            }`}
          />
          <span className={isOn && timer === '3h' ? 'text-amber-400 font-extrabold' : 'text-zinc-600'}>
            3H
          </span>
        </div>

        {/* 5H Indicator */}
        <div className="flex flex-col items-center gap-0.5">
          <span
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              isOn && timer === '5h'
                ? 'bg-amber-400 shadow-[0_0_10px_#F59E0B]'
                : 'bg-zinc-800'
            }`}
          />
          <span className={isOn && timer === '5h' ? 'text-amber-400 font-extrabold' : 'text-zinc-600'}>
            5H
          </span>
        </div>
      </div>

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
