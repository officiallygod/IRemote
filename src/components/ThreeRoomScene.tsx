import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Sun, Lightbulb, Fan, Flame, RotateCcw } from 'lucide-react';
import { hapticFeedback } from '../services/haptics';

interface ThreeRoomSceneProps {
  isDarkMode?: boolean;
  isSunsetOn: boolean;
  isBedsideOn: boolean;
  isFanOn?: boolean;
  isFireplaceOn?: boolean;
  sunsetColor?: string;
  fireplaceColor?: string;
  fanSpeed?: number; // 1, 2, 3
  onToggleSunset: () => void;
  onToggleBedside: () => void;
  onToggleFan?: () => void;
  onToggleFireplace?: () => void;
  onOpenDevice?: (deviceId: string) => void;
}

// Generates authentic multi-shade chromatic sunset projection texture (mix of radiant yellow, amber, crimson, violet)
function createChromaticSunsetTexture(primaryHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);

  const color = new THREE.Color(primaryHex);
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);

  // Warm sunset hue (amber/orange/red):
  if (hsl.h < 0.15 || hsl.h > 0.9) {
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');     // White-hot radiant center
    grad.addColorStop(0.2, 'rgba(254, 240, 138, 0.95)');    // Solar Gold
    grad.addColorStop(0.48, 'rgba(249, 115, 22, 0.88)');    // Tangerine Amber
    grad.addColorStop(0.75, 'rgba(225, 29, 72, 0.7)');      // Sunset Ruby Rose
    grad.addColorStop(0.92, 'rgba(147, 51, 234, 0.4)');     // Twilight Dusk Violet
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');           // Atmospheric falloff
  } else {
    // Dynamic multi-shade chromatic rings for all other colors
    const core = new THREE.Color().setHSL((hsl.h + 0.08) % 1.0, Math.min(1, hsl.s * 1.2), 0.9);
    const mid = color;
    const rim = new THREE.Color().setHSL((hsl.h - 0.12 + 1.0) % 1.0, hsl.s, 0.5);

    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.22, `rgba(${Math.round(core.r * 255)}, ${Math.round(core.g * 255)}, ${Math.round(core.b * 255)}, 0.95)`);
    grad.addColorStop(0.55, `rgba(${Math.round(mid.r * 255)}, ${Math.round(mid.g * 255)}, ${Math.round(mid.b * 255)}, 0.85)`);
    grad.addColorStop(0.85, `rgba(${Math.round(rim.r * 255)}, ${Math.round(rim.g * 255)}, ${Math.round(rim.b * 255)}, 0.45)`);
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export const ThreeRoomScene: React.FC<ThreeRoomSceneProps> = ({
  isDarkMode = true,
  isSunsetOn,
  isBedsideOn,
  isFanOn = true,
  isFireplaceOn = true,
  sunsetColor = '#FB923C',
  fireplaceColor = '#F59E0B',
  fanSpeed = 2,
  onToggleSunset,
  onToggleBedside,
  onToggleFan,
  onToggleFireplace,
  onOpenDevice,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const fanBladesRef = useRef<THREE.Group | null>(null);
  const fanRingRef = useRef<THREE.Mesh | null>(null);
  const sunsetLightRef = useRef<THREE.PointLight | null>(null);
  const sunsetHaloRef = useRef<THREE.Mesh | null>(null);
  const bedsideLightRef = useRef<THREE.PointLight | null>(null);
  const bedsideDomeRef = useRef<THREE.Mesh | null>(null);
  const fireplaceFlameRef = useRef<THREE.Mesh | null>(null);

  // Live state refs
  const isSunsetOnRef = useRef(isSunsetOn);
  const isBedsideOnRef = useRef(isBedsideOn);
  const isFanOnRef = useRef(isFanOn);
  const fanSpeedRef = useRef(fanSpeed);
  const isFireplaceOnRef = useRef(isFireplaceOn);
  const sunsetColorRef = useRef(sunsetColor);
  const fireplaceColorRef = useRef(fireplaceColor);

  // Smooth dynamic physics & light transition state refs
  const currentFanVelocity = useRef(isFanOn ? (fanSpeed === 1 ? 0.15 : fanSpeed === 2 ? 0.3 : 0.55) : 0);
  const currentFanGlow = useRef(isFanOn ? 0.8 : 0);
  const currentSunsetIntensity = useRef(isSunsetOn ? 2.8 : 0);
  const currentSunsetHaloOpacity = useRef(isSunsetOn ? 0.95 : 0);
  const currentBedsideIntensity = useRef(isBedsideOn ? 2.0 : 0);
  const currentBedsideEmissive = useRef(isBedsideOn ? 0.9 : 0);
  const currentFlameOpacity = useRef(isFireplaceOn ? 0.88 : 0);

  // Sync props to live animation refs
  useEffect(() => {
    isSunsetOnRef.current = isSunsetOn;
    isBedsideOnRef.current = isBedsideOn;
    isFanOnRef.current = isFanOn;
    fanSpeedRef.current = fanSpeed;
    isFireplaceOnRef.current = isFireplaceOn;
    sunsetColorRef.current = sunsetColor;
    fireplaceColorRef.current = fireplaceColor;
  }, [isSunsetOn, isBedsideOn, isFanOn, fanSpeed, isFireplaceOn, sunsetColor, fireplaceColor]);

  // Rotation control
  const rotationGroupRef = useRef<THREE.Group | null>(null);
  const targetRotationY = useRef(0);
  const currentRotationY = useRef(0);
  const isDragging = useRef(false);
  const prevPointerX = useRef(0);

  // Camera reset
  const handleResetAngle = useCallback(() => {
    hapticFeedback.tick();
    targetRotationY.current = 0;
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 380;
    const height = container.clientHeight || 250;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera setup: More Zoomed-In by Default (frustumSize: 3.3)
    const aspect = width / height;
    const frustumSize = 3.35; // Focused architectural framing
    const camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      100
    );

    // Lower camera angle to see the window, balcony door, and desk setup clearly
    camera.position.set(3.7, 2.65, 3.7);
    camera.lookAt(0, 0.72, -0.25);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Master Rotation Group for smooth interactive pan
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);
    rotationGroupRef.current = masterGroup;

    // 4. Lighting
    const ambientColor = isDarkMode ? 0x22242a : 0xf1f5f9;
    const ambientLight = new THREE.AmbientLight(ambientColor, isDarkMode ? 1.3 : 2.2);
    scene.add(ambientLight);

    const sunDirLight = new THREE.DirectionalLight(0xfff7ed, isDarkMode ? 1.1 : 1.9);
    sunDirLight.position.set(-3, 6, 2);
    sunDirLight.castShadow = true;
    sunDirLight.shadow.mapSize.width = 512;
    sunDirLight.shadow.mapSize.height = 512;
    scene.add(sunDirLight);

    // Outdoor Window Sunlight Beam
    const outdoorLight = new THREE.DirectionalLight(0xecfdf5, isDarkMode ? 0.8 : 1.5);
    outdoorLight.position.set(-1, 3, -5);
    scene.add(outdoorLight);

    // 5. Materials
    const floorMat = new THREE.MeshStandardMaterial({
      color: isDarkMode ? 0x18191e : 0xe2e8f0,
      roughness: 0.75,
      metalness: 0.05,
    });
    const wallMat = new THREE.MeshStandardMaterial({
      color: isDarkMode ? 0x242831 : 0xf8fafc,
      roughness: 0.85,
    });
    // Crisp Modern White Desk Material (Requested by user)
    const whiteDeskMat = new THREE.MeshStandardMaterial({
      color: isDarkMode ? 0xf1f5f9 : 0xffffff,
      roughness: 0.35,
      metalness: 0.1,
    });
    const woodBedMat = new THREE.MeshStandardMaterial({
      color: isDarkMode ? 0x7c4a27 : 0xa16207,
      roughness: 0.6,
    });
    const metalMat = new THREE.MeshStandardMaterial({
      color: isDarkMode ? 0x2a2d36 : 0x475569,
      roughness: 0.3,
      metalness: 0.8,
    });
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.15,
      metalness: 0.95,
    });
    const rugMat = new THREE.MeshStandardMaterial({
      color: isDarkMode ? 0x334155 : 0x94a3b8,
      roughness: 0.95,
    });
    const blueChairMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8, // Authentic light-blue fabric drape (matching user photo!)
      roughness: 0.7,
    });
    const darkBlanketMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Authentic dark navy / black blanket (matching photo!)
      roughness: 0.95,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const whiteMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
    });

    // -------------------------------------------------------------
    // 6. NARROW DORM ROOM SHELL (Reduced width requested by user: 2.8m width)
    // -------------------------------------------------------------
    const roomWidth = 2.8;
    const roomLength = 4.0;
    const halfW = roomWidth / 2; // 1.4m

    const floor = new THREE.Mesh(new THREE.BoxGeometry(roomWidth, 0.12, roomLength), floorMat);
    floor.position.set(0, -0.06, 0);
    floor.receiveShadow = true;
    masterGroup.add(floor);

    // Left Wall (Z-axis wall)
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.4, roomLength), wallMat);
    leftWall.position.set(-halfW - 0.06, 1.14, 0);
    leftWall.receiveShadow = true;
    masterGroup.add(leftWall);

    // Back Wall (X-axis wall)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(roomWidth, 2.4, 0.12), wallMat);
    backWall.position.set(0, 1.14, -roomLength / 2 - 0.06);
    backWall.receiveShadow = true;
    masterGroup.add(backWall);

    // -------------------------------------------------------------
    // BACK WALL DETAILS: WINDOW, BALCONY DOOR, RADIATOR & DRYING RACK
    // -------------------------------------------------------------
    // 1. Left Square Window with Outdoor Tree View & Sill
    const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.68, 0.04), whiteMat);
    windowFrame.position.set(-0.85, 1.35, -2.0);
    masterGroup.add(windowFrame);

    // Window Sill
    const windowSill = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.03, 0.08), whiteMat);
    windowSill.position.set(-0.85, 0.99, -1.97);
    masterGroup.add(windowSill);

    // Window Glass with sunny garden view
    const windowGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(0.60, 0.60),
      new THREE.MeshBasicMaterial({ color: 0x86efac, transparent: true, opacity: 0.92 })
    );
    windowGlass.position.set(-0.85, 1.35, -1.97);
    masterGroup.add(windowGlass);

    // Window Crossbars (Mullions)
    const winCrossV = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.60, 0.02), whiteMat);
    winCrossV.position.set(-0.85, 1.35, -1.96);
    masterGroup.add(winCrossV);

    const winCrossH = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.02, 0.02), whiteMat);
    winCrossH.position.set(-0.85, 1.35, -1.96);
    masterGroup.add(winCrossH);

    // 2. Right Balcony Glass Door with Handle
    const balconyDoorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.60, 1.76, 0.04), whiteMat);
    balconyDoorFrame.position.set(-0.15, 0.98, -2.0);
    masterGroup.add(balconyDoorFrame);

    const balconyDoorGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(0.52, 1.66),
      new THREE.MeshBasicMaterial({ color: 0xbbf7d0, transparent: true, opacity: 0.88 })
    );
    balconyDoorGlass.position.set(-0.15, 0.98, -1.97);
    masterGroup.add(balconyDoorGlass);

    // Balcony Door Handle Latch
    const balconyHandle = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.03), metalMat);
    balconyHandle.position.set(0.11, 0.98, -1.96);
    masterGroup.add(balconyHandle);

    // 3. European Wall Radiator Heater
    const radiator = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.44, 0.05), whiteMat);
    radiator.position.set(0.55, 0.42, -1.98);
    masterGroup.add(radiator);

    // -------------------------------------------------------------
    // LEFT SIDE: WHITE DESK, DUAL MONITORS, MOUSEPAD, KEYBOARD, MOUSE, LAPTOP, COMPACT FIREPLACE
    // -------------------------------------------------------------
    // Large Soft Grey Textured Rug in aisle
    const greyRug = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.01, 1.7), rugMat);
    greyRug.position.set(-0.6, 0.005, -0.65);
    greyRug.receiveShadow = true;
    masterGroup.add(greyRug);

    // Clean Modern White Study Desk (Requested by user)
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.65), whiteDeskMat);
    deskTop.position.set(-0.75, 0.74, -1.3);
    masterGroup.add(deskTop);

    // White Desk Drawer Pedestal
    const drawerBox = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.42, 0.58), whiteDeskMat);
    drawerBox.position.set(-0.3, 0.48, -1.3);
    masterGroup.add(drawerBox);

    // Desk Frame Legs (White)
    const deskLegGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.72);
    [[-1.3, 0.36, -1.55], [-1.3, 0.36, -1.05], [-0.22, 0.36, -1.05]].forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(deskLegGeo, whiteDeskMat);
      leg.position.set(x, y, z);
      masterGroup.add(leg);
    });

    // DUAL MONITOR SETUP
    // Monitor 1: Wide Horizontal Screen
    const mon1Stand = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.035, 0.2), metalMat);
    mon1Stand.position.set(-1.08, 0.85, -1.4);
    masterGroup.add(mon1Stand);

    const mon1Screen = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.26, 0.015),
      new THREE.MeshBasicMaterial({ color: isDarkMode ? 0x0284c7 : 0x0f172a })
    );
    mon1Screen.position.set(-1.08, 1.02, -1.4);
    masterGroup.add(mon1Screen);

    // Monitor 2: Vertical Portrait Screen Next to it
    const mon2Stand = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.035, 0.2), metalMat);
    mon2Stand.position.set(-0.75, 0.85, -1.4);
    masterGroup.add(mon2Stand);

    const mon2Screen = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.38, 0.015),
      new THREE.MeshBasicMaterial({ color: isDarkMode ? 0x38bdf8 : 0x1e293b })
    );
    mon2Screen.position.set(-0.75, 1.08, -1.4);
    masterGroup.add(mon2Screen);

    // MOUSEPAD, MECHANICAL KEYBOARD & GAMING MOUSE (Requested by user)
    // 1. Extended Dark Desk Mousepad
    const mousepad = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.004, 0.26),
      new THREE.MeshStandardMaterial({ color: 0x181a20, roughness: 0.9 })
    );
    mousepad.position.set(-0.85, 0.763, -1.18);
    masterGroup.add(mousepad);

    // 2. Mechanical Gaming Keyboard (Clean White)
    const keyboard = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.012, 0.11),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.1 })
    );
    keyboard.position.set(-0.92, 0.771, -1.18);
    masterGroup.add(keyboard);

    // 3. Ergonomic Gaming Mouse
    const mouse = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.014, 0.085),
      new THREE.MeshStandardMaterial({ color: 0x090a0d, roughness: 0.4 })
    );
    mouse.position.set(-0.66, 0.772, -1.18);
    masterGroup.add(mouse);

    // Laptop Open on the Right Side of the Desk (Screen Turned Off)
    const laptopBase = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.01, 0.16), metalMat);
    laptopBase.position.set(-0.42, 0.766, -1.2);
    masterGroup.add(laptopBase);

    const laptopScreen = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.15, 0.01),
      new THREE.MeshStandardMaterial({ color: 0x0a0b0e, roughness: 0.2, metalness: 0.6 }) // Sleek dark glass off display
    );
    laptopScreen.position.set(-0.42, 0.85, -1.28);
    laptopScreen.rotation.x = -0.2;
    masterGroup.add(laptopScreen);

    // -------------------------------------------------------------
    // APPLIANCE 4: COMPACT DESKTOP FIREPLACE (Small & on desk, no big light beam!)
    // -------------------------------------------------------------
    const fpDeskGroup = new THREE.Group();
    // Sitting neatly on the right corner of the study desk (x = -0.22, y = 0.76, z = -1.45)
    fpDeskGroup.position.set(-0.22, 0.81, -1.42);

    // Compact Obsidian Casing (Small desktop aroma diffuser unit!)
    const fpBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.09, 0.09),
      new THREE.MeshStandardMaterial({ color: 0x111215, roughness: 0.35, metalness: 0.25 })
    );
    fpDeskGroup.add(fpBody);

    // Front Window with Glowing Burning Logs
    const fpWin = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.06, 0.005),
      new THREE.MeshBasicMaterial({ color: isFireplaceOn ? new THREE.Color(fireplaceColor) : 0x1a1a1f })
    );
    fpWin.position.set(0, -0.005, 0.046);
    fpDeskGroup.add(fpWin);

    // Top Mist Leaping Flame Tongue (Delicate rising flame wisps)
    const topFlame = new THREE.Mesh(
      new THREE.ConeGeometry(0.045, 0.12, 12),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(fireplaceColor), transparent: true, opacity: isFireplaceOn ? 0.9 : 0 })
    );
    topFlame.position.set(0, 0.1, 0);
    topFlame.rotation.x = Math.PI;
    fpDeskGroup.add(topFlame);
    fireplaceFlameRef.current = topFlame;

    const fpPointLight = new THREE.PointLight(new THREE.Color(fireplaceColor), isFireplaceOn ? 1.8 : 0, 1.8);
    fpPointLight.position.set(0, 0.08, 0.08);
    fpDeskGroup.add(fpPointLight);

    masterGroup.add(fpDeskGroup);

    // AUTHENTIC LIGHT-BLUE ERGONOMIC OFFICE CHAIR
    const officeChairGroup = new THREE.Group();
    officeChairGroup.position.set(-0.85, 0, -0.65);
    officeChairGroup.rotation.y = 0.15;

    // Chrome 5-star wheeled base
    const chairBase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 5), chromeMat);
    chairBase.position.y = 0.05;
    officeChairGroup.add(chairBase);

    const chairPiston = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.32), chromeMat);
    chairPiston.position.y = 0.22;
    officeChairGroup.add(chairPiston);

    // Light-Blue Fabric Seat Cushion
    const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.4), blueChairMat);
    chairSeat.position.y = 0.42;
    officeChairGroup.add(chairSeat);

    // Tall Curved Light-Blue Fabric Backrest
    const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.54, 0.06), blueChairMat);
    chairBack.position.set(0, 0.72, 0.17);
    chairBack.rotation.x = -0.12;
    officeChairGroup.add(chairBack);

    // Black Ergonomic Armrests
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.16, 0.16), metalMat);
    armL.position.set(-0.22, 0.54, 0.04);
    officeChairGroup.add(armL);
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.16, 0.16), metalMat);
    armR.position.set(0.22, 0.54, 0.04);
    officeChairGroup.add(armR);

    masterGroup.add(officeChairGroup);

    // -------------------------------------------------------------
    // RIGHT SIDE: WOODEN SINGLE BED, ART POSTERS & FAN NEXT TO BED
    // -------------------------------------------------------------
    // Wooden Single Bed Frame (Snug on right wall: x = 0.85)
    const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.32, 2.05), woodBedMat);
    bedFrame.position.set(0.85, 0.16, -0.25);
    masterGroup.add(bedFrame);

    // High Wooden Headboard along back
    const headboard = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.48, 0.06), woodBedMat);
    headboard.position.set(0.85, 0.44, -1.25);
    masterGroup.add(headboard);

    // Mattress
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.16, 1.9), whiteMat);
    mattress.position.set(0.85, 0.38, -0.25);
    masterGroup.add(mattress);

    // Grey Pillow
    const pillow = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.08, 0.36),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 })
    );
    pillow.position.set(0.85, 0.48, -0.95);
    masterGroup.add(pillow);

    // Dark Navy / Black Quilt Blanket draped on the bed
    const darkBlanket = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.07, 1.4), darkBlanketMat);
    darkBlanket.position.set(0.85, 0.48, 0.05);
    masterGroup.add(darkBlanket);

    // -------------------------------------------------------------
    // 3 FRAMED ART POSTERS ON THE LEFT WALL DEAD CENTER (x = -1.38, z = 0.0 midpoint)
    // Procedural High-Detail Canvas Textures (Cunningham C5-R, Marlboro Senna F1, Ford GT40 Mk IV)
    // -------------------------------------------------------------
    const createPosterCanvasTexture = (type: 'cunningham' | 'marlboro' | 'ford_gt') => {
      const W = 512;
      const H = 768;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      if (type === 'cunningham') {
        // 1. CUNNINGHAM C5-R (1953 Le Mans #2 - Blue/White)
        const blueSplit = H * 0.58;
        ctx.fillStyle = '#1e528b';
        ctx.fillRect(0, 0, W, blueSplit);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, blueSplit, W, H - blueSplit);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CUNNINGHAM C5-R', W / 2, 75);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.font = '500 13px system-ui, sans-serif';
        ctx.fillText('John Fitch & Phil Walters | Circuit de la Sarthe, June 1953', W / 2, 102);

        // Draw Car
        ctx.save();
        ctx.translate(W / 2, 450);

        ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
        ctx.beginPath();
        ctx.ellipse(0, 48, 175, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-160, 20);
        ctx.quadraticCurveTo(-140, -40, -50, -42);
        ctx.quadraticCurveTo(0, -38, 50, -42);
        ctx.quadraticCurveTo(140, -40, 160, 20);
        ctx.lineTo(165, 45);
        ctx.quadraticCurveTo(100, 52, 0, 52);
        ctx.quadraticCurveTo(-100, 52, -165, 45);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Blue stripes
        ctx.fillStyle = '#1e528b';
        ctx.fillRect(-18, -40, 10, 90);
        ctx.fillRect(8, -40, 10, 90);

        // Front Grille
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.ellipse(0, 22, 66, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Fog lamps
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(-42, 22, 9, 0, Math.PI * 2);
        ctx.arc(42, 22, 9, 0, Math.PI * 2);
        ctx.fill();

        // Headlights
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(-120, -5, 16, 0, Math.PI * 2);
        ctx.arc(120, -5, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Windscreen & Driver
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.ellipse(0, -50, 42, 12, 0, 0, Math.PI);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-8, -62, 14, 0, Math.PI * 2);
        ctx.fill();

        // #2 decal
        ctx.fillStyle = '#1e528b';
        ctx.font = 'bold 36px serif';
        ctx.textAlign = 'center';
        ctx.fillText('2', -152, 22);

        // Wheels
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-172, 18, 18, 32);
        ctx.fillRect(154, 18, 18, 32);
        ctx.restore();
      } else if (type === 'marlboro') {
        // 2. MARLBORO AYRTON SENNA MP4/4 COCKPIT
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#537188');
        grad.addColorStop(0.35, '#7b92a5');
        grad.addColorStop(0.65, '#9bb0c1');
        grad.addColorStop(1, '#607274');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.beginPath();
        ctx.ellipse(W * 0.4, H * 0.3, 220, 90, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Marlboro text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'italic 700 58px "Times New Roman", Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('Marlboro', W / 2, 260);

        // McLaren monocoque
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, 768);
        ctx.lineTo(0, 480);
        ctx.lineTo(180, 380);
        ctx.lineTo(260, 420);
        ctx.lineTo(W, 600);
        ctx.lineTo(W, 768);
        ctx.closePath();
        ctx.fill();

        // Red chevron
        ctx.fillStyle = '#e11d48';
        ctx.beginPath();
        ctx.moveTo(80, 435);
        ctx.lineTo(180, 380);
        ctx.lineTo(210, 440);
        ctx.lineTo(120, 490);
        ctx.closePath();
        ctx.fill();

        // BOSS & Senna
        ctx.fillStyle = '#0f172a';
        ctx.font = 'italic 600 15px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Senna', 200, 410);
        ctx.font = '900 22px sans-serif';
        ctx.fillText('BOSS', 198, 432);

        // Foreground Marlboro
        ctx.fillStyle = '#0f172a';
        ctx.font = 'italic 900 76px "Times New Roman", serif';
        ctx.save();
        ctx.translate(140, 710);
        ctx.rotate(-0.16);
        ctx.fillText('Marlboro', 0, 0);
        ctx.restore();

        // Red foreground chevron
        ctx.fillStyle = '#e11d48';
        ctx.beginPath();
        ctx.moveTo(0, 680);
        ctx.lineTo(180, 560);
        ctx.lineTo(280, 630);
        ctx.lineTo(140, 768);
        ctx.lineTo(0, 768);
        ctx.closePath();
        ctx.fill();

        // Senna Helmet
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(260, 465, 60, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineWidth = 14;
        ctx.strokeStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(260, 465, 60, 0.15, Math.PI - 0.15);
        ctx.stroke();

        ctx.lineWidth = 10;
        ctx.strokeStyle = '#1e3a8a';
        ctx.beginPath();
        ctx.arc(260, 465, 54, 0.2, Math.PI - 0.2);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('NACIONAL', 255, 435);

        // Visor
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(220, 452, 85, 34, 10);
        ctx.fill();

        // Red mirror
        ctx.fillStyle = '#e11d48';
        ctx.beginPath();
        ctx.ellipse(365, 455, 26, 18, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        // 3. FORD GT40 MK IV (1967 Le Mans #1 - Yellow/White)
        const yellowSplit = H * 0.58;
        ctx.fillStyle = '#e5a500';
        ctx.fillRect(0, 0, W, yellowSplit);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, yellowSplit, W, H - yellowSplit);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('FORD GT40 MK IV', W / 2, 75);

        // Draw GT40 Car
        ctx.save();
        ctx.translate(W / 2, 450);

        ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
        ctx.beginPath();
        ctx.ellipse(0, 48, 175, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#e5a500';
        ctx.beginPath();
        ctx.moveTo(-160, 25);
        ctx.quadraticCurveTo(-140, -35, -50, -38);
        ctx.quadraticCurveTo(0, -35, 50, -38);
        ctx.quadraticCurveTo(140, -35, 160, 25);
        ctx.lineTo(165, 45);
        ctx.quadraticCurveTo(100, 52, 0, 52);
        ctx.quadraticCurveTo(-100, 52, -165, 45);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Black stripes
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-18, -36, 12, 85);
        ctx.fillRect(6, -36, 12, 85);

        // #1 roundel
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0, 12, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px serif';
        ctx.textAlign = 'center';
        ctx.fillText('1', 0, 23);

        // Headlamps
        const drawGT40Lamp = (hx: number, hy: number) => {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(hx, hy, 22, 14, hx < 0 ? -0.2 : 0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(hx - 8, hy, 7, 0, Math.PI * 2);
          ctx.arc(hx + 8, hy, 7, 0, Math.PI * 2);
          ctx.fill();
        };
        drawGT40Lamp(-115, -2);
        drawGT40Lamp(115, -2);

        // Cockpit
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(-50, -36);
        ctx.quadraticCurveTo(0, -68, 50, -36);
        ctx.closePath();
        ctx.fill();

        // Splitter
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-150, 48, 300, 6);

        // Wheels
        ctx.fillRect(-168, 18, 16, 32);
        ctx.fillRect(152, 18, 16, 32);
        ctx.restore();
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      return texture;
    };

    const oakFrameMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.6 }); // Light natural birch/oak wood frame
    const createArtFrame = (x: number, y: number, z: number, w: number, h: number, texture: THREE.CanvasTexture) => {
      const frameGroup = new THREE.Group();
      frameGroup.position.set(x, y, z);
      frameGroup.rotation.y = Math.PI / 2; // Flat against left wall facing right into room

      // Natural Light Birch / Oak Wood Frame
      const frameBorder = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.04, h + 0.04, 0.015),
        oakFrameMat
      );
      frameGroup.add(frameBorder);

      // Inner White Passe-Partout Matte
      const passePartout = new THREE.Mesh(
        new THREE.PlaneGeometry(w + 0.02, h + 0.02),
        new THREE.MeshBasicMaterial({ color: 0xf8fafc })
      );
      passePartout.position.z = 0.009;
      frameGroup.add(passePartout);

      // Artwork Print Texture
      const artPrint = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ map: texture })
      );
      artPrint.position.z = 0.01;
      frameGroup.add(artPrint);

      return frameGroup;
    };

    // 3 FRAMES DEAD CENTER ON THE LEFT WALL (Midpoint z = 0.0, y = 1.48 - 1.52)
    // Frame 1: Cunningham C5-R Le Mans Poster (z = -0.38)
    masterGroup.add(createArtFrame(-1.38, 1.48, -0.38, 0.20, 0.32, createPosterCanvasTexture('cunningham')));

    // Frame 2: Iconic Marlboro Ayrton Senna McLaren F1 Poster (Dead Center, z = 0.0)
    masterGroup.add(createArtFrame(-1.38, 1.52, 0.0, 0.24, 0.36, createPosterCanvasTexture('marlboro')));

    // Frame 3: Ford GT40 Mk IV Le Mans Poster (z = +0.38)
    masterGroup.add(createArtFrame(-1.38, 1.48, 0.38, 0.20, 0.32, createPosterCanvasTexture('ford_gt')));

    // -------------------------------------------------------------
    // APPLIANCE 3: SMART FLOOR FAN NEXT TO THE BED (Requested by user!)
    // -------------------------------------------------------------
    const fanBase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.03), metalMat);
    fanBase.position.set(0.85, 0.015, 0.98); // Standing at the foot/side of the bed!
    masterGroup.add(fanBase);

    const fanPole = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.88), metalMat);
    fanPole.position.set(0.85, 0.46, 0.98);
    masterGroup.add(fanPole);

    const fanRingMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.3,
      emissive: isFanOn ? 0x0284c7 : 0x000000,
      emissiveIntensity: isFanOn ? 0.8 : 0.0,
    });
    const fanRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.012, 8, 24), fanRingMat);
    fanRing.position.set(0.85, 0.9, 0.98);
    masterGroup.add(fanRing);
    fanRingRef.current = fanRing;

    const fanBladesGroup = new THREE.Group();
    fanBladesGroup.position.set(0.85, 0.9, 0.98);
    masterGroup.add(fanBladesGroup);
    fanBladesRef.current = fanBladesGroup;

    const bladeGeo = new THREE.BoxGeometry(0.03, 0.14, 0.008);
    const bladeMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.rotation.z = (i * (Math.PI * 2)) / 3;
      blade.position.y = 0.06 * Math.cos(blade.rotation.z);
      blade.position.x = -0.06 * Math.sin(blade.rotation.z);
      fanBladesGroup.add(blade);
    }

    // -------------------------------------------------------------
    // APPLIANCE 1: SUNSET LAMP PROJECTING ON LEFT WALL (Requested by user!)
    // -------------------------------------------------------------
    const sunsetStand = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.04, 0.24), metalMat);
    sunsetStand.position.set(-1.25, 0.88, -1.2);
    masterGroup.add(sunsetStand);

    const sunsetHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xff8c00, roughness: 0.2, emissive: 0xff6600, emissiveIntensity: 0.6 })
    );
    sunsetHead.position.set(-1.25, 1.02, -1.2);
    masterGroup.add(sunsetHead);

    // Multi-shade Chromatic Sunset Halo Projection ON THE LEFT WALL!
    const sunsetTexture = createChromaticSunsetTexture(sunsetColor);
    const haloMat = new THREE.MeshBasicMaterial({
      map: sunsetTexture,
      transparent: true,
      opacity: isSunsetOn ? 0.95 : 0.0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    // Projected directly on left wall (x = -1.39)
    const sunsetHalo = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), haloMat);
    sunsetHalo.position.set(-1.38, 1.4, -1.0);
    sunsetHalo.rotation.y = Math.PI / 2; // Flat against the left wall!
    masterGroup.add(sunsetHalo);
    sunsetHaloRef.current = sunsetHalo;

    const sunsetLight = new THREE.PointLight(new THREE.Color(sunsetColor), isSunsetOn ? 2.8 : 0, 3.5);
    sunsetLight.position.set(-1.2, 1.15, -1.0);
    masterGroup.add(sunsetLight);
    sunsetLightRef.current = sunsetLight;

    // -------------------------------------------------------------
    // APPLIANCE 2: Three O Bedside Lamp (on nightstand)
    // -------------------------------------------------------------
    const bedsideTable = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 0.32), woodBedMat);
    bedsideTable.position.set(0.28, 0.21, -1.4);
    masterGroup.add(bedsideTable);

    const bedsideBase = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.025), metalMat);
    bedsideBase.position.set(0.28, 0.43, -1.4);
    masterGroup.add(bedsideBase);

    const bedsideDomeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: isBedsideOn ? 0xf8e5a5 : 0x000000,
      emissiveIntensity: isBedsideOn ? 0.9 : 0.0,
      roughness: 0.2,
    });
    const bedsideDome = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.12, 16), bedsideDomeMat);
    bedsideDome.position.set(0.28, 0.50, -1.4);
    masterGroup.add(bedsideDome);
    bedsideDomeRef.current = bedsideDome;

    const bedsideLight = new THREE.PointLight(0xf8e5a5, isBedsideOn ? 2.0 : 0, 2.2);
    bedsideLight.position.set(0.28, 0.56, -1.4);
    masterGroup.add(bedsideLight);
    bedsideLightRef.current = bedsideLight;

    // 7. Interactive Pointer Drag & Rotation
    const handlePointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      prevPointerX.current = e.clientX;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const deltaX = e.clientX - prevPointerX.current;
      prevPointerX.current = e.clientX;
      targetRotationY.current += deltaX * 0.007;
      targetRotationY.current = Math.max(-0.6, Math.min(0.6, targetRotationY.current));
    };

    const handlePointerUp = () => {
      isDragging.current = false;
    };

    container.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // 8. Smooth Render Loop with Framerate Throttling & Visibility Observer
    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(container);

    let flamePulse = 0;

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      if (!isVisible) return;

      // 1. Damped rotation interpolation for 3D drag
      currentRotationY.current += (targetRotationY.current - currentRotationY.current) * 0.1;
      if (rotationGroupRef.current) {
        rotationGroupRef.current.rotation.y = currentRotationY.current;
      }

      // 2. SMART FAN SMOOTH ACCELERATION & COASTING DECELERATION (Inertia physics!)
      const targetFanVelocity = isFanOnRef.current
        ? fanSpeedRef.current === 1
          ? 0.12
          : fanSpeedRef.current === 2
          ? 0.28
          : 0.52
        : 0;
      // Gentle spin-up when turned on (0.05 factor), natural aerodynamic coast-down when turned off (0.025 factor)
      const fanLerpRate = isFanOnRef.current ? 0.05 : 0.025;
      currentFanVelocity.current += (targetFanVelocity - currentFanVelocity.current) * fanLerpRate;

      if (fanBladesRef.current && Math.abs(currentFanVelocity.current) > 0.0002) {
        fanBladesRef.current.rotation.z += currentFanVelocity.current;
      }

      // Fan ring smooth glow fade
      const targetFanGlow = isFanOnRef.current ? 0.8 : 0;
      currentFanGlow.current += (targetFanGlow - currentFanGlow.current) * 0.08;
      if (fanRingRef.current) {
        const mat = fanRingRef.current.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = currentFanGlow.current;
      }

      // 3. SUNSET LAMP SMOOTH LIGHT & HALO FADE
      const targetSunsetLight = isSunsetOnRef.current ? 2.8 : 0;
      currentSunsetIntensity.current += (targetSunsetLight - currentSunsetIntensity.current) * 0.08;
      if (sunsetLightRef.current) {
        sunsetLightRef.current.intensity = currentSunsetIntensity.current;
        sunsetLightRef.current.color.set(sunsetColorRef.current);
      }

      const targetSunsetHalo = isSunsetOnRef.current ? 0.95 : 0;
      currentSunsetHaloOpacity.current += (targetSunsetHalo - currentSunsetHaloOpacity.current) * 0.08;
      if (sunsetHaloRef.current) {
        const mat = sunsetHaloRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = currentSunsetHaloOpacity.current;
      }

      // 4. BEDSIDE LAMP SMOOTH DIMMING & EMISSIVE WARMTH
      const targetBedside = isBedsideOnRef.current ? 2.0 : 0;
      currentBedsideIntensity.current += (targetBedside - currentBedsideIntensity.current) * 0.08;
      if (bedsideLightRef.current) {
        bedsideLightRef.current.intensity = currentBedsideIntensity.current;
      }

      const targetBedsideEm = isBedsideOnRef.current ? 0.9 : 0;
      currentBedsideEmissive.current += (targetBedsideEm - currentBedsideEmissive.current) * 0.08;
      if (bedsideDomeRef.current) {
        const mat = bedsideDomeRef.current.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = currentBedsideEmissive.current;
      }

      // 5. FIREPLACE FLAME SMOOTH IGNITION & EXTINGUISH
      const targetFlame = isFireplaceOnRef.current ? 0.88 : 0;
      currentFlameOpacity.current += (targetFlame - currentFlameOpacity.current) * 0.08;
      if (fireplaceFlameRef.current) {
        const mat = fireplaceFlameRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = currentFlameOpacity.current;
        mat.color.set(fireplaceColorRef.current);

        if (currentFlameOpacity.current > 0.01) {
          flamePulse += 0.05;
          const scale = 1.0 + Math.sin(flamePulse) * 0.12;
          fireplaceFlameRef.current.scale.set(scale, scale, scale);
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

  // Update dynamic texture when sunset color changes
  useEffect(() => {
    if (sunsetHaloRef.current) {
      const mat = sunsetHaloRef.current.material as THREE.MeshBasicMaterial;
      if (mat.map) {
        mat.map.dispose();
      }
      mat.map = createChromaticSunsetTexture(sunsetColor);
      mat.needsUpdate = true;
    }
  }, [sunsetColor]);

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden border shadow-2xl transition-all select-none ${
        isDarkMode
          ? 'bg-[#14161A] border-surface-border shadow-[0_20px_50px_rgba(0,0,0,0.8)]'
          : 'bg-white border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.08)]'
      }`}
    >
      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        className="w-full h-[255px] cursor-grab active:cursor-grabbing touch-none overflow-hidden"
      />

      {/* Minimal Unobtrusive Reset Angle Button */}
      <div className="absolute top-3 right-3 pointer-events-none z-10">
        <button
          onClick={handleResetAngle}
          className="pointer-events-auto w-7 h-7 rounded-full backdrop-blur-md bg-black/40 border border-white/10 text-white/80 hover:text-white flex items-center justify-center transition-all active:scale-90 shadow-sm"
          title="Reset View Angle"
        >
          <RotateCcw size={13} />
        </button>
      </div>

      {/* Floating Interactive Device Action Bar (Quick Toggle Hotkeys) */}
      <div className="absolute bottom-3 inset-x-3 grid grid-cols-4 gap-1.5 z-10 select-none">
        {/* 1. Sunset Lamp */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            hapticFeedback.click();
            onToggleSunset();
          }}
          className={`flex items-center justify-center gap-1 py-1.5 rounded-xl font-bold text-[11px] transition-all border active:scale-95 ${
            isSunsetOn
              ? 'bg-amber-400 text-black border-amber-400 shadow-glow-amber'
              : 'bg-black/60 backdrop-blur-md text-white/80 border-white/10 hover:bg-black/80'
          }`}
        >
          <Sun size={12} className={isSunsetOn ? 'text-black' : 'text-amber-400'} />
          <span>Sunset</span>
        </button>

        {/* 2. Bedside Lamp */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            hapticFeedback.click();
            onToggleBedside();
          }}
          className={`flex items-center justify-center gap-1 py-1.5 rounded-xl font-bold text-[11px] transition-all border active:scale-95 ${
            isBedsideOn
              ? 'bg-yellow-300 text-black border-yellow-300 shadow-[0_0_12px_rgba(253,224,71,0.5)]'
              : 'bg-black/60 backdrop-blur-md text-white/80 border-white/10 hover:bg-black/80'
          }`}
        >
          <Lightbulb size={12} className={isBedsideOn ? 'text-black' : 'text-yellow-300'} />
          <span>Bedside</span>
        </button>

        {/* 3. Smart Fan */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            hapticFeedback.click();
            if (onToggleFan) onToggleFan();
          }}
          className={`flex items-center justify-center gap-1 py-1.5 rounded-xl font-bold text-[11px] transition-all border active:scale-95 ${
            isFanOn
              ? 'bg-cyan-400 text-black border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
              : 'bg-black/60 backdrop-blur-md text-white/80 border-white/10 hover:bg-black/80'
          }`}
        >
          <Fan size={12} className={isFanOn ? 'text-black animate-spin' : 'text-cyan-400'} />
          <span>Fan</span>
        </button>

        {/* 4. Fireplace */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            hapticFeedback.click();
            if (onToggleFireplace) onToggleFireplace();
          }}
          className={`flex items-center justify-center gap-1 py-1.5 rounded-xl font-bold text-[11px] transition-all border active:scale-95 ${
            isFireplaceOn
              ? 'bg-orange-500 text-white border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.6)]'
              : 'bg-black/60 backdrop-blur-md text-white/80 border-white/10 hover:bg-black/80'
          }`}
        >
          <Flame size={12} className={isFireplaceOn ? 'text-white' : 'text-orange-400'} />
          <span>Flame</span>
        </button>
      </div>
    </div>
  );
};
