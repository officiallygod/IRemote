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
    const height = container.clientHeight || 240;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera setup (Orthographic Isometric Camera)
    const aspect = width / height;
    const frustumSize = 4.2;
    const camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      100
    );

    // True isometric position
    camera.position.set(4, 3.8, 4);
    camera.lookAt(0, 0.4, 0);

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
    const ambientLight = new THREE.AmbientLight(ambientColor, isDarkMode ? 1.2 : 2.0);
    scene.add(ambientLight);

    const sunDirLight = new THREE.DirectionalLight(0xfff7ed, isDarkMode ? 1.0 : 1.8);
    sunDirLight.position.set(-3, 5, 2);
    sunDirLight.castShadow = true;
    sunDirLight.shadow.mapSize.width = 512;
    sunDirLight.shadow.mapSize.height = 512;
    scene.add(sunDirLight);

    // 5. Materials
    const floorMat = new THREE.MeshStandardMaterial({
      color: isDarkMode ? 0x1a1c22 : 0xe2e8f0,
      roughness: 0.7,
      metalness: 0.1,
    });
    const wallMat = new THREE.MeshStandardMaterial({
      color: isDarkMode ? 0x242831 : 0xf8fafc,
      roughness: 0.8,
    });
    const woodMat = new THREE.MeshStandardMaterial({
      color: isDarkMode ? 0x6e4a2c : 0xb47946,
      roughness: 0.6,
    });
    const metalMat = new THREE.MeshStandardMaterial({
      color: isDarkMode ? 0x2a2d36 : 0x475569,
      roughness: 0.3,
      metalness: 0.8,
    });
    const bedMat = new THREE.MeshStandardMaterial({
      color: isDarkMode ? 0x0284c7 : 0x38bdf8,
      roughness: 0.9,
    });
    const pillowMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.95,
    });

    // 6. Geometry: Floor & Corner Walls
    const floorGeo = new THREE.BoxGeometry(3.6, 0.12, 3.6);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, -0.06, 0);
    floor.receiveShadow = true;
    masterGroup.add(floor);

    // Left Wall (Z axis wall)
    const leftWallGeo = new THREE.BoxGeometry(0.12, 2.2, 3.6);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.position.set(-1.86, 1.04, 0);
    leftWall.receiveShadow = true;
    masterGroup.add(leftWall);

    // Back Wall (X axis wall)
    const backWallGeo = new THREE.BoxGeometry(3.6, 2.2, 0.12);
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, 1.04, -1.86);
    backWall.receiveShadow = true;
    masterGroup.add(backWall);

    // Window on Left Wall
    const windowFrameMat = new THREE.MeshStandardMaterial({
      color: isDarkMode ? 0x3f4654 : 0x94a3b8,
      roughness: 0.5,
    });
    const windowGlassMat = new THREE.MeshBasicMaterial({
      color: isDarkMode ? 0x38bdf8 : 0xbae6fd,
      transparent: true,
      opacity: 0.45,
    });
    const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.1, 1.4), windowFrameMat);
    windowFrame.position.set(-1.8, 1.25, -0.4);
    masterGroup.add(windowFrame);

    const windowGlass = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.98, 1.28), windowGlassMat);
    windowGlass.position.set(-1.8, 1.25, -0.4);
    masterGroup.add(windowGlass);

    // 7. Study Desk (Next to window)
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.8), woodMat);
    deskTop.position.set(-1.05, 0.72, -0.4);
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    masterGroup.add(deskTop);

    // Desk Legs
    const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.72);
    const legPositions = [
      [-1.55, 0.36, -0.72],
      [-0.55, 0.36, -0.72],
      [-1.55, 0.36, -0.08],
      [-0.55, 0.36, -0.08],
    ];
    legPositions.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, metalMat);
      leg.position.set(x, y, z);
      masterGroup.add(leg);
    });

    // Laptop on Desk
    const laptopBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.015, 0.2),
      metalMat
    );
    laptopBase.position.set(-1.05, 0.76, -0.4);
    masterGroup.add(laptopBase);

    const laptopScreen = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.18, 0.012),
      new THREE.MeshBasicMaterial({ color: isDarkMode ? 0x38bdf8 : 0xffffff })
    );
    laptopScreen.position.set(-1.05, 0.86, -0.49);
    laptopScreen.rotation.x = -0.2;
    masterGroup.add(laptopScreen);

    // iPad / Tablet on Desk next to laptop (Requested by user)
    const ipadBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.008, 0.22),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 })
    );
    ipadBase.position.set(-0.7, 0.755, -0.38);
    ipadBase.rotation.y = 0.12;
    masterGroup.add(ipadBase);

    const ipadScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.145, 0.205),
      new THREE.MeshBasicMaterial({ color: isDarkMode ? 0x0284c7 : 0x38bdf8 })
    );
    ipadScreen.position.set(-0.7, 0.761, -0.38);
    ipadScreen.rotation.x = -Math.PI / 2;
    ipadScreen.rotation.z = 0.12;
    masterGroup.add(ipadScreen);

    // Ergonomic Racing Gaming Chair next to table (Requested by user)
    const gamingChairGroup = new THREE.Group();
    gamingChairGroup.position.set(-0.88, 0, 0.18);
    gamingChairGroup.rotation.y = -0.35; // Angled facing the desk

    // 5-Star Caster Base
    const chairBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.03, 5),
      metalMat
    );
    chairBase.position.y = 0.04;
    gamingChairGroup.add(chairBase);

    // Gas-lift piston cylinder
    const piston = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.32),
      metalMat
    );
    piston.position.y = 0.2;
    gamingChairGroup.add(piston);

    // Bucket seat cushion with side wings
    const chairLeatherMat = new THREE.MeshStandardMaterial({
      color: 0x14161a,
      roughness: 0.65,
    });
    const racingStripeMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4, // Vibrant racing cyan stripe
      roughness: 0.4,
    });

    const seatCushion = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.07, 0.36), chairLeatherMat);
    seatCushion.position.y = 0.39;
    gamingChairGroup.add(seatCushion);

    // Seat side bolsters
    const bolsterL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.34), racingStripeMat);
    bolsterL.position.set(-0.16, 0.43, 0);
    gamingChairGroup.add(bolsterL);
    const bolsterR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.34), racingStripeMat);
    bolsterR.position.set(0.16, 0.43, 0);
    gamingChairGroup.add(bolsterR);

    // Tall Ergonomic Racing Backrest
    const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.48, 0.05), chairLeatherMat);
    backrest.position.set(0, 0.66, 0.16);
    backrest.rotation.x = -0.1;
    gamingChairGroup.add(backrest);

    // Racing Headrest Cushion
    const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.05), racingStripeMat);
    headrest.position.set(0, 0.88, 0.19);
    gamingChairGroup.add(headrest);

    // Dual 3D Armrests
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.16, 0.16), metalMat);
    armL.position.set(-0.2, 0.52, 0.04);
    gamingChairGroup.add(armL);
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.16, 0.16), metalMat);
    armR.position.set(0.2, 0.52, 0.04);
    gamingChairGroup.add(armR);

    masterGroup.add(gamingChairGroup);

    // 8. Dorm Bed
    const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.28, 2.0), woodMat);
    bedFrame.position.set(0.9, 0.14, -0.6);
    masterGroup.add(bedFrame);

    const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.18, 1.9), bedMat);
    mattress.position.set(0.9, 0.32, -0.6);
    masterGroup.add(mattress);

    // Matte Black Quilt / Blanket draped on the foot of the bed (Requested by user)
    const blackBlanketMat = new THREE.MeshStandardMaterial({
      color: 0x121316,
      roughness: 0.95,
    });
    const blackBlanket = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.06, 0.82), blackBlanketMat);
    blackBlanket.position.set(0.9, 0.38, -0.12);
    masterGroup.add(blackBlanket);

    const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.38), pillowMat);
    pillow.position.set(0.9, 0.44, -1.35);
    masterGroup.add(pillow);

    // Bedside Table
    const nightstand = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.46, 0.48), woodMat);
    nightstand.position.set(0.1, 0.23, -1.45);
    masterGroup.add(nightstand);

    // -------------------------------------------------------------
    // APPLIANCE 1: Sunset Projector Lamp (on desk)
    // -------------------------------------------------------------
    const sunsetStand = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.05, 0.28), metalMat);
    sunsetStand.position.set(-1.45, 0.89, -0.65);
    masterGroup.add(sunsetStand);

    const sunsetHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xff8c00, roughness: 0.2, emissive: 0xff6600, emissiveIntensity: 0.6 })
    );
    sunsetHead.position.set(-1.45, 1.05, -0.65);
    masterGroup.add(sunsetHead);

    // Sunset Wall Halo Projection (Smooth glowing disc on back wall)
    const haloGeo = new THREE.CircleGeometry(0.65, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(sunsetColor),
      transparent: true,
      opacity: isSunsetOn ? 0.75 : 0.0,
      side: THREE.DoubleSide,
    });
    const sunsetHalo = new THREE.Mesh(haloGeo, haloMat);
    sunsetHalo.position.set(-1.15, 1.45, -1.79);
    masterGroup.add(sunsetHalo);
    sunsetHaloRef.current = sunsetHalo;

    const sunsetLight = new THREE.PointLight(new THREE.Color(sunsetColor), isSunsetOn ? 2.5 : 0, 3.5);
    sunsetLight.position.set(-1.4, 1.1, -0.7);
    masterGroup.add(sunsetLight);
    sunsetLightRef.current = sunsetLight;

    // -------------------------------------------------------------
    // APPLIANCE 2: Three O Bedside Lamp (on nightstand)
    // -------------------------------------------------------------
    const bedsideBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04), metalMat);
    bedsideBase.position.set(0.1, 0.48, -1.45);
    masterGroup.add(bedsideBase);

    const bedsideDomeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: isBedsideOn ? 0xf8e5a5 : 0x000000,
      emissiveIntensity: isBedsideOn ? 0.9 : 0.0,
      roughness: 0.2,
    });
    const bedsideDome = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.16, 16), bedsideDomeMat);
    bedsideDome.position.set(0.1, 0.58, -1.45);
    masterGroup.add(bedsideDome);
    bedsideDomeRef.current = bedsideDome;

    const bedsideLight = new THREE.PointLight(0xf8e5a5, isBedsideOn ? 2.0 : 0, 2.5);
    bedsideLight.position.set(0.1, 0.65, -1.45);
    masterGroup.add(bedsideLight);
    bedsideLightRef.current = bedsideLight;

    // -------------------------------------------------------------
    // APPLIANCE 3: Smart Fan (Floor standing)
    // -------------------------------------------------------------
    const fanBase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03), metalMat);
    fanBase.position.set(-1.3, 0.015, 1.1);
    masterGroup.add(fanBase);

    const fanPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.95), metalMat);
    fanPole.position.set(-1.3, 0.5, 1.1);
    masterGroup.add(fanPole);

    // Fan Cage Ring
    const fanRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.015, 8, 24),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 })
    );
    fanRing.position.set(-1.3, 1.0, 1.1);
    masterGroup.add(fanRing);

    // Fan Rotor & Blades Group (Animated in render loop)
    const fanBladesGroup = new THREE.Group();
    fanBladesGroup.position.set(-1.3, 1.0, 1.1);
    masterGroup.add(fanBladesGroup);
    fanBladesRef.current = fanBladesGroup;

    // 3 Aerodynamic blades
    const bladeGeo = new THREE.BoxGeometry(0.04, 0.18, 0.008);
    const bladeMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.rotation.z = (i * (Math.PI * 2)) / 3;
      blade.position.y = 0.07 * Math.cos(blade.rotation.z);
      blade.position.x = -0.07 * Math.sin(blade.rotation.z);
      fanBladesGroup.add(blade);
    }

    // -------------------------------------------------------------
    // APPLIANCE 4: Flame Humidifier (Fireplace box on table)
    // -------------------------------------------------------------
    const fireplaceGroup = new THREE.Group();
    fireplaceGroup.position.set(-0.35, 0.81, -0.4);

    // 1. Obsidian Outer Chassis (Matches photo)
    const fireplaceChassis = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.17, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x111215, roughness: 0.35, metalness: 0.2 })
    );
    fireplaceGroup.add(fireplaceChassis);

    // 2. Front Panoramic Glass Window
    const fpGlassMat = new THREE.MeshStandardMaterial({
      color: 0x050608,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.85,
    });
    const fpGlass = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.11, 0.01), fpGlassMat);
    fpGlass.position.set(0, -0.01, 0.082);
    fireplaceGroup.add(fpGlass);

    // 3. Glowing Ember Bed inside the chamber
    const emberMat = new THREE.MeshBasicMaterial({
      color: isFireplaceOn ? 0xef4444 : 0x1a1a1e,
    });
    const emberBed = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.015, 0.08), emberMat);
    emberBed.position.set(0, -0.045, 0.04);
    fireplaceGroup.add(emberBed);

    // 4. Miniature Charred Wood Logs inside the chamber
    const logMat = new THREE.MeshStandardMaterial({ color: 0x1e2025, roughness: 0.9 });
    const fpLog1 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 6), logMat);
    fpLog1.rotation.z = Math.PI / 2;
    fpLog1.position.set(0, -0.03, 0.04);
    fireplaceGroup.add(fpLog1);

    const fpLog2 = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.14, 6), logMat);
    fpLog2.rotation.z = Math.PI / 3;
    fpLog2.position.set(0.04, -0.02, 0.05);
    fireplaceGroup.add(fpLog2);

    // 5. Top Emitter Slot (Glowing horizontal slit)
    const slotMat = new THREE.MeshBasicMaterial({
      color: isFireplaceOn ? 0xfef08a : 0x08090a,
    });
    const fpSlot = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.005, 0.02), slotMat);
    fpSlot.position.set(0, 0.086, 0);
    fireplaceGroup.add(fpSlot);

    // 6. Rising animated flame mist tongue
    const flameMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(fireplaceColor),
      transparent: true,
      opacity: isFireplaceOn ? 0.85 : 0.0,
      side: THREE.DoubleSide,
    });
    const flameMesh = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.24, 12), flameMat);
    flameMesh.position.set(0, 0.19, 0);
    flameMesh.rotation.x = Math.PI;
    fireplaceGroup.add(flameMesh);
    fireplaceFlameRef.current = flameMesh;

    // Chamber ambient light cast
    const fpPointLight = new THREE.PointLight(new THREE.Color(fireplaceColor), isFireplaceOn ? 1.8 : 0, 1.5);
    fpPointLight.position.set(0, 0.1, 0.1);
    fireplaceGroup.add(fpPointLight);

    masterGroup.add(fireplaceGroup);

    // -------------------------------------------------------------
    // APPLIANCE 5: Wall-Mounted Smart TV above the Fireplace (Requested by user)
    // -------------------------------------------------------------
    const tvGroup = new THREE.Group();
    // Mounted directly on back wall (z = -1.74) centered above fireplace (x = -0.35, y = 1.45)
    tvGroup.position.set(-0.35, 1.45, -1.74);

    // Wall Bracket
    const tvBracket = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.03), metalMat);
    tvBracket.position.z = 0.015;
    tvGroup.add(tvBracket);

    // 50" Slim Obsidian Frame
    const tvFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.44, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x0a0b0d, roughness: 0.3, metalness: 0.8 })
    );
    tvFrame.position.z = 0.035;
    tvGroup.add(tvFrame);

    // Glossy OLED Display Screen
    const tvScreenMat = new THREE.MeshBasicMaterial({
      color: isDarkMode ? 0x0f172a : 0x1e293b,
    });
    const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.4), tvScreenMat);
    tvScreen.position.z = 0.046;
    tvGroup.add(tvScreen);

    // Ambient TV Backlight casting glow onto the wall
    const tvBacklight = new THREE.PointLight(0x38bdf8, isDarkMode ? 0.9 : 0.4, 1.4);
    tvBacklight.position.set(0, 0, 0.01);
    tvGroup.add(tvBacklight);

    masterGroup.add(tvGroup);

    // 9. Interactive Pointer Drag & Rotation
    const handlePointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      prevPointerX.current = e.clientX;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const deltaX = e.clientX - prevPointerX.current;
      prevPointerX.current = e.clientX;
      targetRotationY.current += deltaX * 0.008;
      // Clamp rotation between -35 deg and +35 deg
      targetRotationY.current = Math.max(-0.65, Math.min(0.65, targetRotationY.current));
    };

    const handlePointerUp = () => {
      isDragging.current = false;
    };

    container.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // 10. Smooth Render Loop with Framerate Throttling & Visibility Observer
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

    // 11. Cleanup
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
      sunsetLightRef.current.intensity = isSunsetOn ? 2.5 : 0;
      sunsetLightRef.current.color.set(sunsetColor);
    }
    if (sunsetHaloRef.current) {
      const mat = sunsetHaloRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = isSunsetOn ? 0.75 : 0;
      mat.color.set(sunsetColor);
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
      mat.opacity = isFireplaceOn ? 0.85 : 0;
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

        <button
          onClick={handleResetAngle}
          className="pointer-events-auto p-1.5 rounded-full backdrop-blur-md bg-black/50 border border-white/15 text-white/80 hover:text-white transition-all active:scale-90"
          title="Reset Isometric Angle"
        >
          <RotateCcw size={13} />
        </button>
      </div>

      {/* Floating Interactive Device Action Pills along the Bottom */}
      <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-1.5 pointer-events-none z-10">
        {/* Sunset Lamp Pill */}
        <button
          onClick={() => {
            hapticFeedback.click();
            onToggleSunset();
          }}
          className={`pointer-events-auto flex-1 py-1.5 px-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 backdrop-blur-md border transition-all active:scale-95 ${
            isSunsetOn
              ? 'bg-amber-400 text-black border-amber-300 shadow-glow-amber'
              : 'bg-black/60 text-white/80 border-white/15 hover:bg-black/80'
          }`}
        >
          <Sun size={12} />
          <span className="truncate">Sunset</span>
        </button>

        {/* Bedside Lamp Pill */}
        <button
          onClick={() => {
            hapticFeedback.click();
            onToggleBedside();
          }}
          className={`pointer-events-auto flex-1 py-1.5 px-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 backdrop-blur-md border transition-all active:scale-95 ${
            isBedsideOn
              ? 'bg-yellow-200 text-black border-yellow-100 shadow-glow-amber'
              : 'bg-black/60 text-white/80 border-white/15 hover:bg-black/80'
          }`}
        >
          <Lightbulb size={12} />
          <span className="truncate">Bedside</span>
        </button>

        {/* Smart Fan Pill */}
        {onToggleFan && (
          <button
            onClick={() => {
              hapticFeedback.click();
              onToggleFan();
            }}
            className={`pointer-events-auto flex-1 py-1.5 px-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 backdrop-blur-md border transition-all active:scale-95 ${
              isFanOn
                ? 'bg-sky-400 text-black border-sky-300 shadow-glow-cyan'
                : 'bg-black/60 text-white/80 border-white/15 hover:bg-black/80'
            }`}
          >
            <Fan size={12} className={isFanOn ? 'animate-spin' : ''} />
            <span className="truncate">Fan</span>
          </button>
        )}

        {/* Fireplace Pill */}
        {onToggleFireplace && (
          <button
            onClick={() => {
              hapticFeedback.click();
              onToggleFireplace();
            }}
            className={`pointer-events-auto flex-1 py-1.5 px-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 backdrop-blur-md border transition-all active:scale-95 ${
              isFireplaceOn
                ? 'bg-orange-500 text-white border-orange-400 shadow-glow-amber'
                : 'bg-black/60 text-white/80 border-white/15 hover:bg-black/80'
            }`}
          >
            <Flame size={12} />
            <span className="truncate">Flame</span>
          </button>
        )}
      </div>
    </div>
  );
};
