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
  const sunsetLightRef = useRef<THREE.PointLight | null>(null);
  const sunsetHaloRef = useRef<THREE.Mesh | null>(null);
  const bedsideLightRef = useRef<THREE.PointLight | null>(null);
  const bedsideDomeRef = useRef<THREE.Mesh | null>(null);
  const fireplaceFlameRef = useRef<THREE.Mesh | null>(null);

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

    // 2. Camera setup (True Isometric Perspective)
    const aspect = width / height;
    const frustumSize = 4.4;
    const camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      100
    );

    camera.position.set(4.2, 4.0, 4.2);
    camera.lookAt(0, 0.35, 0);

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
    const woodDeskMat = new THREE.MeshStandardMaterial({
      color: isDarkMode ? 0x6e4a2c : 0xb47946,
      roughness: 0.65,
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

    // 6. Geometry: Floor & Walls (Dorm Room Dimensions)
    const floor = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.12, 4.2), floorMat);
    floor.position.set(0, -0.06, 0);
    floor.receiveShadow = true;
    masterGroup.add(floor);

    // Left Wall (Z-axis wall)
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.4, 4.2), wallMat);
    leftWall.position.set(-1.86, 1.14, 0);
    leftWall.receiveShadow = true;
    masterGroup.add(leftWall);

    // Back Wall (X-axis wall)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.4, 0.12), wallMat);
    backWall.position.set(0, 1.14, -2.16);
    backWall.receiveShadow = true;
    masterGroup.add(backWall);

    // -------------------------------------------------------------
    // BACK WALL DETAILS: WINDOW, BALCONY DOOR, RADIATOR & DRYING RACK (1:1 with photo!)
    // -------------------------------------------------------------
    // 1. Left Square Window with Green Tree View
    const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.72, 0.04), whiteMat);
    windowFrame.position.set(-1.15, 1.35, -2.09);
    masterGroup.add(windowFrame);

    const windowGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(0.62, 0.62),
      new THREE.MeshBasicMaterial({ color: 0x86efac, transparent: true, opacity: 0.9 })
    );
    windowGlass.position.set(-1.15, 1.35, -2.06);
    masterGroup.add(windowGlass);

    // 2. Right Balcony Glass Door (Tall glass door leading to balcony)
    const balconyDoorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.7, 0.04), whiteMat);
    balconyDoorFrame.position.set(-0.25, 0.95, -2.09);
    masterGroup.add(balconyDoorFrame);

    const balconyDoorGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(0.58, 1.6),
      new THREE.MeshBasicMaterial({ color: 0xbbf7d0, transparent: true, opacity: 0.85 })
    );
    balconyDoorGlass.position.set(-0.25, 0.95, -2.06);
    masterGroup.add(balconyDoorGlass);

    // 3. European Wall Radiator Heater under the window/wall
    const radiator = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.48, 0.05), whiteMat);
    radiator.position.set(0.48, 0.44, -2.07);
    masterGroup.add(radiator);

    // 4. Black Clothes Drying Rack (In front of radiator/door)
    const rackGroup = new THREE.Group();
    rackGroup.position.set(0.35, 0.45, -1.75);
    const rackFrame1 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.85, 0.42), metalMat);
    rackGroup.add(rackFrame1);
    const rackFrame2 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.85, 0.42), metalMat);
    rackFrame2.position.x = 0.16;
    rackGroup.add(rackFrame2);
    // Hanging laundry on rack
    const laundryMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.45, 0.38), darkBlanketMat);
    laundryMesh.position.set(0.08, 0.05, 0);
    rackGroup.add(laundryMesh);
    masterGroup.add(rackGroup);

    // -------------------------------------------------------------
    // LEFT SIDE: WOODEN DESK, DUAL MONITORS, LAPTOP, IPAD, GREY RUG & LIGHT-BLUE CHAIR
    // -------------------------------------------------------------
    // Large Soft Grey Textured Rug under desk & chair
    const greyRug = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.01, 1.8), rugMat);
    greyRug.position.set(-1.05, 0.005, -0.65);
    greyRug.receiveShadow = true;
    masterGroup.add(greyRug);

    // Brown Wooden Study Desk
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.05, 0.7), woodDeskMat);
    deskTop.position.set(-1.05, 0.74, -1.35);
    masterGroup.add(deskTop);

    // Desk Drawer Pedestal on the Right
    const drawerBox = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 0.62), woodDeskMat);
    drawerBox.position.set(-0.55, 0.48, -1.35);
    masterGroup.add(drawerBox);

    // Desk Legs
    const deskLegGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.72);
    [[-1.62, 0.36, -1.62], [-1.62, 0.36, -1.08], [-0.48, 0.36, -1.08]].forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(deskLegGeo, woodDeskMat);
      leg.position.set(x, y, z);
      masterGroup.add(leg);
    });

    // DUAL MONITOR SETUP (1:1 with photo!)
    // Monitor 1: Wide Horizontal Screen on Left
    const mon1Stand = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.04, 0.22), metalMat);
    mon1Stand.position.set(-1.42, 0.86, -1.45);
    masterGroup.add(mon1Stand);

    const mon1Screen = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.28, 0.015),
      new THREE.MeshBasicMaterial({ color: isDarkMode ? 0x0284c7 : 0x0f172a })
    );
    mon1Screen.position.set(-1.42, 1.04, -1.45);
    masterGroup.add(mon1Screen);

    // Monitor 2: Vertical Portrait Screen Next to it!
    const mon2Stand = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.04, 0.22), metalMat);
    mon2Stand.position.set(-1.05, 0.86, -1.45);
    masterGroup.add(mon2Stand);

    const mon2Screen = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.42, 0.015),
      new THREE.MeshBasicMaterial({ color: isDarkMode ? 0x38bdf8 : 0x1e293b })
    );
    mon2Screen.position.set(-1.05, 1.11, -1.45);
    masterGroup.add(mon2Screen);

    // Laptop Open on the Right Side of the Desk with Colorful Screen (Matching photo!)
    const laptopBase = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.012, 0.18), metalMat);
    laptopBase.position.set(-0.65, 0.77, -1.25);
    masterGroup.add(laptopBase);

    const laptopScreen = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.16, 0.01),
      new THREE.MeshBasicMaterial({ color: 0xa855f7 }) // Glowing magenta/purple wallpaper
    );
    laptopScreen.position.set(-0.65, 0.86, -1.33);
    laptopScreen.rotation.x = -0.22;
    masterGroup.add(laptopScreen);

    // iPad / Tablet on Desk
    const ipadMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.006, 0.2),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    ipadMesh.position.set(-1.05, 0.77, -1.15);
    ipadMesh.rotation.y = 0.1;
    masterGroup.add(ipadMesh);

    // AUTHENTIC LIGHT-BLUE ERGONOMIC OFFICE CHAIR (1:1 with user photo!)
    const officeChairGroup = new THREE.Group();
    officeChairGroup.position.set(-1.05, 0, -0.65);
    officeChairGroup.rotation.y = 0.15;

    // Chrome 5-star wheeled base
    const chairBase = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.03, 5), chromeMat);
    chairBase.position.y = 0.05;
    officeChairGroup.add(chairBase);

    const chairPiston = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.32), chromeMat);
    chairPiston.position.y = 0.22;
    officeChairGroup.add(chairPiston);

    // Light-Blue Fabric Seat Cushion
    const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.42), blueChairMat);
    chairSeat.position.y = 0.42;
    officeChairGroup.add(chairSeat);

    // Tall Curved Light-Blue Fabric Backrest with Headrest
    const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.58, 0.06), blueChairMat);
    chairBack.position.set(0, 0.74, 0.18);
    chairBack.rotation.x = -0.12;
    officeChairGroup.add(chairBack);

    // Black Ergonomic Armrests
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.18), metalMat);
    armL.position.set(-0.23, 0.56, 0.04);
    officeChairGroup.add(armL);
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.18), metalMat);
    armR.position.set(0.23, 0.56, 0.04);
    officeChairGroup.add(armR);

    masterGroup.add(officeChairGroup);

    // -------------------------------------------------------------
    // RIGHT SIDE: WOODEN SINGLE BED & 3 MOTORSPORT ART POSTERS (1:1 with photo!)
    // -------------------------------------------------------------
    // Wooden Single Bed Frame
    const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.32, 2.1), woodBedMat);
    bedFrame.position.set(1.15, 0.16, -0.25);
    masterGroup.add(bedFrame);

    // High Wooden Headboard along the back
    const headboard = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.48, 0.06), woodBedMat);
    headboard.position.set(1.15, 0.44, -1.28);
    masterGroup.add(headboard);

    // Mattress
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.16, 1.95), whiteMat);
    mattress.position.set(1.15, 0.38, -0.25);
    masterGroup.add(mattress);

    // Grey Pillow at the head
    const pillow = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.08, 0.38),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 })
    );
    pillow.position.set(1.15, 0.48, -0.98);
    masterGroup.add(pillow);

    // Dark Navy / Black Quilt Blanket draped over the bed (Matching user photo!)
    const darkBlanket = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.07, 1.45), darkBlanketMat);
    darkBlanket.position.set(1.15, 0.48, 0.05);
    masterGroup.add(darkBlanket);

    // 3 FRAMED MOTORSPORT ART POSTERS ON THE RIGHT WALL (Exact match with user photo!)
    // Poster 1 (Left): Blue/White Sports Car
    const poster1 = new THREE.Mesh(
      new THREE.PlaneGeometry(0.24, 0.36),
      new THREE.MeshBasicMaterial({ color: 0x0284c7 })
    );
    poster1.position.set(1.78, 1.45, -0.6);
    poster1.rotation.y = -Math.PI / 2;
    masterGroup.add(poster1);

    // Poster 2 (Center): Marlboro Motorsport Race Car (Largest)
    const poster2 = new THREE.Mesh(
      new THREE.PlaneGeometry(0.32, 0.46),
      new THREE.MeshBasicMaterial({ color: 0xef4444 }) // Iconic Marlboro red
    );
    poster2.position.set(1.78, 1.48, -0.22);
    poster2.rotation.y = -Math.PI / 2;
    masterGroup.add(poster2);

    // Poster 3 (Right): Yellow Porsche Race Car
    const poster3 = new THREE.Mesh(
      new THREE.PlaneGeometry(0.26, 0.38),
      new THREE.MeshBasicMaterial({ color: 0xeab308 }) // Vibrant Porsche yellow
    );
    poster3.position.set(1.78, 1.45, 0.16);
    poster3.rotation.y = -Math.PI / 2;
    masterGroup.add(poster3);

    // -------------------------------------------------------------
    // APPLIANCES INTEGRATION
    // -------------------------------------------------------------
    // APPLIANCE 1: Sunset Projector Lamp (on desk casting multi-shade chromatic halo)
    const sunsetStand = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.05, 0.28), metalMat);
    sunsetStand.position.set(-1.6, 0.88, -1.55);
    masterGroup.add(sunsetStand);

    const sunsetHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xff8c00, roughness: 0.2, emissive: 0xff6600, emissiveIntensity: 0.6 })
    );
    sunsetHead.position.set(-1.6, 1.04, -1.55);
    masterGroup.add(sunsetHead);

    // Multi-shade Chromatic Sunset Halo Projection on back wall
    const sunsetTexture = createChromaticSunsetTexture(sunsetColor);
    const haloMat = new THREE.MeshBasicMaterial({
      map: sunsetTexture,
      transparent: true,
      opacity: isSunsetOn ? 0.95 : 0.0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const sunsetHalo = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), haloMat);
    sunsetHalo.position.set(-1.4, 1.55, -2.08);
    masterGroup.add(sunsetHalo);
    sunsetHaloRef.current = sunsetHalo;

    const sunsetLight = new THREE.PointLight(new THREE.Color(sunsetColor), isSunsetOn ? 2.8 : 0, 3.8);
    sunsetLight.position.set(-1.55, 1.15, -1.5);
    masterGroup.add(sunsetLight);
    sunsetLightRef.current = sunsetLight;

    // APPLIANCE 2: Three O Bedside Lamp (on nightstand)
    const bedsideBase = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03), metalMat);
    bedsideBase.position.set(0.48, 0.72, -1.45);
    masterGroup.add(bedsideBase);

    const bedsideDomeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: isBedsideOn ? 0xf8e5a5 : 0x000000,
      emissiveIntensity: isBedsideOn ? 0.9 : 0.0,
      roughness: 0.2,
    });
    const bedsideDome = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.14, 16), bedsideDomeMat);
    bedsideDome.position.set(0.48, 0.81, -1.45);
    masterGroup.add(bedsideDome);
    bedsideDomeRef.current = bedsideDome;

    const bedsideLight = new THREE.PointLight(0xf8e5a5, isBedsideOn ? 2.0 : 0, 2.5);
    bedsideLight.position.set(0.48, 0.88, -1.45);
    masterGroup.add(bedsideLight);
    bedsideLightRef.current = bedsideLight;

    // APPLIANCE 3: Smart Floor Fan (Standing near bed/window)
    const fanBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.03), metalMat);
    fanBase.position.set(-1.55, 0.015, 0.45);
    masterGroup.add(fanBase);

    const fanPole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.92), metalMat);
    fanPole.position.set(-1.55, 0.48, 0.45);
    masterGroup.add(fanPole);

    const fanRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.2, 0.014, 8, 24),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 })
    );
    fanRing.position.set(-1.55, 0.95, 0.45);
    masterGroup.add(fanRing);

    const fanBladesGroup = new THREE.Group();
    fanBladesGroup.position.set(-1.55, 0.95, 0.45);
    masterGroup.add(fanBladesGroup);
    fanBladesRef.current = fanBladesGroup;

    const bladeGeo = new THREE.BoxGeometry(0.035, 0.16, 0.008);
    const bladeMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.rotation.z = (i * (Math.PI * 2)) / 3;
      blade.position.y = 0.065 * Math.cos(blade.rotation.z);
      blade.position.x = -0.065 * Math.sin(blade.rotation.z);
      fanBladesGroup.add(blade);
    }

    // APPLIANCE 4: Realistic 3D Fireplace Hearth with Burning Logs & Flames
    const fireplaceGroup = new THREE.Group();
    fireplaceGroup.position.set(0.48, 0.22, -1.45);

    const fpChassis = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.42, 0.24),
      new THREE.MeshStandardMaterial({ color: 0x111215, roughness: 0.35, metalness: 0.25 })
    );
    fireplaceGroup.add(fpChassis);

    // Front Panoramic Tinted Glass Pane
    const fpGlass = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.28, 0.008),
      new THREE.MeshPhysicalMaterial({ color: 0x080a0e, roughness: 0.05, transparent: true, opacity: 0.22, transmission: 0.88 })
    );
    fpGlass.position.set(0, -0.02, 0.122);
    fireplaceGroup.add(fpGlass);

    // Glowing Ember Bed
    const emberBed = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.02, 0.14),
      new THREE.MeshBasicMaterial({ color: isFireplaceOn ? new THREE.Color(fireplaceColor) : 0x16171a })
    );
    emberBed.position.set(0, -0.13, 0.05);
    fireplaceGroup.add(emberBed);

    // 3D Charred Oak Firewood Logs
    const fpLog1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.34, 12), new THREE.MeshStandardMaterial({ color: 0x2c2f37, roughness: 0.85 }));
    fpLog1.rotation.z = Math.PI / 2;
    fpLog1.position.set(0, -0.09, 0.06);
    fireplaceGroup.add(fpLog1);

    const fpLog2 = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.22, 12), new THREE.MeshStandardMaterial({ color: 0x2c2f37, roughness: 0.85 }));
    fpLog2.rotation.z = Math.PI / 3.2;
    fpLog2.position.set(-0.08, -0.06, 0.07);
    fireplaceGroup.add(fpLog2);

    // Internal Burning Flame Tongue
    const insideFlame = new THREE.Mesh(
      new THREE.ConeGeometry(0.09, 0.14, 12),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(fireplaceColor), transparent: true, opacity: isFireplaceOn ? 0.9 : 0 })
    );
    insideFlame.position.set(0, -0.04, 0.06);
    insideFlame.rotation.x = Math.PI;
    fireplaceGroup.add(insideFlame);

    // Top Mist Leaping Flame
    const topFlame = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.26, 16),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(fireplaceColor), transparent: true, opacity: isFireplaceOn ? 0.88 : 0 })
    );
    topFlame.position.set(0, 0.34, 0.01);
    topFlame.rotation.x = Math.PI;
    fireplaceGroup.add(topFlame);
    fireplaceFlameRef.current = topFlame;

    const fpPointLight = new THREE.PointLight(new THREE.Color(fireplaceColor), isFireplaceOn ? 2.8 : 0, 2.8);
    fpPointLight.position.set(0, 0.1, 0.18);
    fireplaceGroup.add(fpPointLight);

    masterGroup.add(fireplaceGroup);

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

      // Damped rotation interpolation
      currentRotationY.current += (targetRotationY.current - currentRotationY.current) * 0.1;
      if (rotationGroupRef.current) {
        rotationGroupRef.current.rotation.y = currentRotationY.current;
      }

      // Rotate fan blades if fan is ON
      if (fanBladesRef.current && isFanOn) {
        const speedMultiplier = fanSpeed === 1 ? 0.15 : fanSpeed === 2 ? 0.3 : 0.55;
        fanBladesRef.current.rotation.z += speedMultiplier;
      }

      // Subtle pulse for flame humidifier
      if (fireplaceFlameRef.current && isFireplaceOn) {
        flamePulse += 0.05;
        const scale = 1.0 + Math.sin(flamePulse) * 0.12;
        fireplaceFlameRef.current.scale.set(scale, scale, scale);
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

  // Update dynamic lights & colors when props change without recreating scene
  useEffect(() => {
    if (sunsetLightRef.current) {
      sunsetLightRef.current.intensity = isSunsetOn ? 2.8 : 0;
      sunsetLightRef.current.color.set(sunsetColor);
    }
    if (sunsetHaloRef.current) {
      const mat = sunsetHaloRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = isSunsetOn ? 0.95 : 0;
      if (mat.map) {
        mat.map.dispose();
      }
      mat.map = createChromaticSunsetTexture(sunsetColor);
      mat.needsUpdate = true;
    }
    if (bedsideLightRef.current) {
      bedsideLightRef.current.intensity = isBedsideOn ? 2.0 : 0;
    }
    if (bedsideDomeRef.current) {
      const mat = bedsideDomeRef.current.material as THREE.MeshStandardMaterial;
      mat.emissive.set(isBedsideOn ? 0xf8e5a5 : 0x000000);
      mat.emissiveIntensity = isBedsideOn ? 0.9 : 0;
    }
    if (fireplaceFlameRef.current) {
      const mat = fireplaceFlameRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = isFireplaceOn ? 0.88 : 0;
      mat.color.set(fireplaceColor);
    }
  }, [isSunsetOn, isBedsideOn, isFireplaceOn, sunsetColor, fireplaceColor]);

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

      {/* Interactive 3D Overlay Badges (Direct Tap Hotspots) */}
      <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md bg-black/50 border border-white/15 text-white text-[11px] font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Interactive 3D Room</span>
        </div>

        {/* Reset Angle Button */}
        <button
          onClick={handleResetAngle}
          className="pointer-events-auto w-8 h-8 rounded-full backdrop-blur-md bg-black/50 border border-white/15 text-white flex items-center justify-center transition-transform active:scale-90"
          title="Reset View Angle"
        >
          <RotateCcw size={14} />
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
