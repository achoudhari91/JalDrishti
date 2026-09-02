/* ==========================================================================
   JALDRISHTI - THREE.JS ULTRA-REALISTIC WATER & JALDRISHTI ROVER SCENE
   Realistic animated water surface, autonomous JalDrishti Rover vessel,
   underwater multi-spectral laser fan, and floating microplastics/ash particles.
   ========================================================================== */

function initJalDrishtiRoverScene() {
  const canvas = document.getElementById('vessel3DCanvas');
  if (!canvas) return;

  // Determine container dimensions safely
  const container = canvas.parentElement;
  const width = (canvas.clientWidth && canvas.clientWidth > 50) ? canvas.clientWidth : (container ? container.clientWidth : 600);
  const height = (canvas.clientHeight && canvas.clientHeight > 50) ? canvas.clientHeight : (container ? container.clientHeight : 480);

  // 1. Scene, Camera, Renderer Setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f9ff);
  scene.fog = new THREE.FogExp2(0xe0f2fe, 0.025);

  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
  
  // Camera Positions for interactive 3D inspection modes
  const cameraModes = {
    rover: { pos: new THREE.Vector3(0, 3.2, 7.5), look: new THREE.Vector3(0, 0.2, 0) },
    laser: { pos: new THREE.Vector3(0, -0.4, 4.2), look: new THREE.Vector3(0, -0.8, 0) },
    particles: { pos: new THREE.Vector3(2.6, 0.8, 4.0), look: new THREE.Vector3(0, -0.3, 0) }
  };

  let targetCamPos = cameraModes.rover.pos.clone();
  let targetCamLook = cameraModes.rover.look.clone();
  
  camera.position.copy(targetCamPos);
  camera.lookAt(targetCamLook);

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  if (renderer.toneMapping !== undefined) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
  }

  // 2. Realistic Lighting Setup
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambientLight);

  // Main Sunlight
  const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.5);
  sunLight.position.set(8, 14, 8);
  scene.add(sunLight);

  // Aquatic Sky Fill Light
  const skyFillLight = new THREE.DirectionalLight(0x38bdf8, 0.85);
  skyFillLight.position.set(-8, 10, -6);
  scene.add(skyFillLight);

  // Subsurface Green/Cyan Optical Glow
  const scanGlowLight = new THREE.PointLight(0x06b6d4, 2.5, 7);
  scanGlowLight.position.set(0, -0.8, 0);
  scene.add(scanGlowLight);

  // 3. Ultra-Realistic Undulating Water Mesh
  const waterWidth = 30;
  const waterDepth = 30;
  const waterSegments = 70;
  const waterGeo = new THREE.PlaneGeometry(waterWidth, waterDepth, waterSegments, waterSegments);
  waterGeo.rotateX(-Math.PI / 2);

  // Store original positions for dynamic wave simulation
  const originalPositions = waterGeo.attributes.position.array.slice();

  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.12,
    metalness: 0.2,
    transparent: true,
    opacity: 0.80,
    flatShading: true
  });

  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.y = 0;
  scene.add(waterMesh);

  // Riverbed Sand Layer below
  const riverbedGeo = new THREE.PlaneGeometry(30, 30);
  riverbedGeo.rotateX(-Math.PI / 2);
  const riverbedMat = new THREE.MeshStandardMaterial({
    color: 0xcfd8dc,
    roughness: 0.95,
    metalness: 0.05
  });
  const riverbedMesh = new THREE.Mesh(riverbedGeo, riverbedMat);
  riverbedMesh.position.y = -2.4;
  scene.add(riverbedMesh);

  // 4. Build the JALDRISHTI ROVER Model
  const roverGroup = new THREE.Group();

  // A. Main Sleek Rover Hull (Aerodynamic White & Carbon)
  const hullGeo = new THREE.BoxGeometry(1.6, 0.45, 3.0);
  const hullMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0.3
  });
  const hullMesh = new THREE.Mesh(hullGeo, hullMat);
  hullMesh.position.set(0, 0.25, 0);
  roverGroup.add(hullMesh);

  // Tapered Bow Nose (Front wedge)
  const bowGeo = new THREE.CylinderGeometry(0.1, 0.8, 1.0, 4);
  bowGeo.rotateY(Math.PI / 4);
  bowGeo.rotateX(Math.PI / 2);
  const bowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.3 });
  const bowMesh = new THREE.Mesh(bowGeo, bowMat);
  bowMesh.position.set(0, 0.25, 1.8);
  roverGroup.add(bowMesh);

  // Emerald Green Racing / Trim Stripe
  const trimGeo = new THREE.BoxGeometry(1.64, 0.08, 3.2);
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    roughness: 0.2,
    metalness: 0.5
  });
  const trimMesh = new THREE.Mesh(trimGeo, trimMat);
  trimMesh.position.set(0, 0.35, 0.1);
  roverGroup.add(trimMesh);

  // Carbon Fiber Lower Hull Bottom
  const bottomGeo = new THREE.BoxGeometry(1.5, 0.2, 2.8);
  const bottomMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
  const bottomMesh = new THREE.Mesh(bottomGeo, bottomMat);
  bottomMesh.position.set(0, 0.05, 0);
  roverGroup.add(bottomMesh);

  // B. Top Solar Photovoltaic Deck (Glossy Deep Blue Cells)
  const solarGeo = new THREE.BoxGeometry(1.3, 0.04, 2.2);
  const solarMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.1,
    metalness: 0.9
  });
  const solarMesh = new THREE.Mesh(solarGeo, solarMat);
  solarMesh.position.set(0, 0.50, -0.1);
  roverGroup.add(solarMesh);

  // C. Sensor Mast & Rotating 360° LiDAR Head
  const mastGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.45, 16);
  const mastMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 });
  const mastMesh = new THREE.Mesh(mastGeo, mastMat);
  mastMesh.position.set(0, 0.72, -0.8);
  roverGroup.add(mastMesh);

  // Rotating LiDAR Head
  const lidarGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.22, 20);
  const lidarMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.1 });
  const lidarHead = new THREE.Mesh(lidarGeo, lidarMat);
  lidarHead.position.set(0, 0.95, -0.8);
  roverGroup.add(lidarHead);

  // Pulsing LED Beacon on LiDAR
  const beaconGeo = new THREE.SphereGeometry(0.06, 16, 16);
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
  const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
  beaconMesh.position.set(0, 1.10, -0.8);
  roverGroup.add(beaconMesh);

  // D. Twin Hydrofoil Side Pontoons (Outrigger Stabilizers)
  const pontoonGeo = new THREE.CylinderGeometry(0.14, 0.14, 2.6, 16);
  pontoonGeo.rotateX(Math.PI / 2);
  const pontoonMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3 });

  const leftPontoon = new THREE.Mesh(pontoonGeo, pontoonMat);
  leftPontoon.position.set(-1.15, 0.12, 0);
  roverGroup.add(leftPontoon);

  const rightPontoon = new THREE.Mesh(pontoonGeo, pontoonMat);
  rightPontoon.position.set(1.15, 0.12, 0);
  roverGroup.add(rightPontoon);

  // Pontoon Nose Cones (Front)
  const coneGeo = new THREE.ConeGeometry(0.14, 0.4, 16);
  coneGeo.rotateX(Math.PI / 2);
  const leftCone = new THREE.Mesh(coneGeo, pontoonMat);
  leftCone.position.set(-1.15, 0.12, 1.5);
  roverGroup.add(leftCone);

  const rightCone = new THREE.Mesh(coneGeo, pontoonMat);
  rightCone.position.set(1.15, 0.12, 1.5);
  roverGroup.add(rightCone);

  // Carbon Struts Connecting Pontoons to Hull
  const strutGeo = new THREE.BoxGeometry(2.5, 0.05, 0.15);
  const strutMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
  
  const frontStrut = new THREE.Mesh(strutGeo, strutMat);
  frontStrut.position.set(0, 0.25, 0.6);
  roverGroup.add(frontStrut);

  const rearStrut = new THREE.Mesh(strutGeo, strutMat);
  rearStrut.position.set(0, 0.25, -0.6);
  roverGroup.add(rearStrut);

  // E. Forward Headlights / Indicator LEDs
  const lightGeo = new THREE.SphereGeometry(0.06, 12, 12);
  const lightMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  
  const leftLight = new THREE.Mesh(lightGeo, lightMat);
  leftLight.position.set(-0.55, 0.30, 2.0);
  roverGroup.add(leftLight);

  const rightLight = new THREE.Mesh(lightGeo, lightMat);
  rightLight.position.set(0.55, 0.30, 2.0);
  roverGroup.add(rightLight);

  // F. Subsurface Optical Multi-Spectral Scanner Housing
  const sensorGeo = new THREE.BoxGeometry(0.6, 0.25, 0.6);
  const sensorMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.2, metalness: 0.8 });
  const sensorMesh = new THREE.Mesh(sensorGeo, sensorMat);
  sensorMesh.position.set(0, -0.08, 0.5);
  roverGroup.add(sensorMesh);

  // G. Multi-Spectral Optical Laser Scan Fan (Cyan 470nm, Emerald 520nm, UV 380nm)
  const laserFanGroup = new THREE.Group();

  // Central Cyan Laser Cone
  const laserGeo1 = new THREE.ConeGeometry(1.2, 2.2, 24, 1, true);
  const laserMat1 = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide
  });
  const laserCone1 = new THREE.Mesh(laserGeo1, laserMat1);
  laserCone1.position.set(0, -1.1, 0.8);
  laserCone1.rotation.x = Math.PI - 0.22;
  laserFanGroup.add(laserCone1);

  // Emerald Laser Cone
  const laserGeo2 = new THREE.ConeGeometry(1.0, 2.1, 24, 1, true);
  const laserMat2 = new THREE.MeshBasicMaterial({
    color: 0x10b981,
    transparent: true,
    opacity: 0.50,
    side: THREE.DoubleSide
  });
  const laserCone2 = new THREE.Mesh(laserGeo2, laserMat2);
  laserCone2.position.set(0.45, -1.05, 0.2);
  laserCone2.rotation.x = Math.PI + 0.15;
  laserCone2.rotation.z = -0.22;
  laserFanGroup.add(laserCone2);

  // Violet/UV Laser Cone
  const laserGeo3 = new THREE.ConeGeometry(0.9, 2.0, 24, 1, true);
  const laserMat3 = new THREE.MeshBasicMaterial({
    color: 0x8b5cf6,
    transparent: true,
    opacity: 0.40,
    side: THREE.DoubleSide
  });
  const laserCone3 = new THREE.Mesh(laserGeo3, laserMat3);
  laserCone3.position.set(-0.45, -1.05, 0.2);
  laserCone3.rotation.x = Math.PI + 0.15;
  laserCone3.rotation.z = 0.22;
  laserFanGroup.add(laserCone3);

  roverGroup.add(laserFanGroup);

  roverGroup.position.set(0, 0, 0);
  scene.add(roverGroup);

  // 5. Realistic Floating Microplastics & Stubble Ash Particle Cloud
  const particleCount = 240;
  const particleGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleColors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = (Math.random() - 0.5) * 9;
    particlePositions[i * 3 + 1] = -Math.random() * 1.6 - 0.05;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 12;

    const rType = Math.random();
    if (rType < 0.45) {
      // Microplastic LDPE Shreds (Cyan / Translucent White)
      particleColors[i * 3] = 0.25;
      particleColors[i * 3 + 1] = 0.85;
      particleColors[i * 3 + 2] = 0.95;
    } else if (rType < 0.75) {
      // Stubble Burn Ash Flecks (Warm Gold / Amber)
      particleColors[i * 3] = 0.95;
      particleColors[i * 3 + 1] = 0.65;
      particleColors[i * 3 + 2] = 0.15;
    } else {
      // Red Plastic Shreds (Pesticide seal residue)
      particleColors[i * 3] = 0.92;
      particleColors[i * 3 + 1] = 0.25;
      particleColors[i * 3 + 2] = 0.35;
    }
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

  const particleMat = new THREE.PointsMaterial({
    size: 0.16,
    vertexColors: true,
    transparent: true,
    opacity: 0.92
  });

  const particleCloud = new THREE.Points(particleGeo, particleMat);
  scene.add(particleCloud);

  // 6. View Mode Switching (3D Views + Photorealistic Image Toggle)
  window.set3DViewMode = function(modeKey) {
    const photoImg = document.getElementById('photoRenderOverlay');

    if (modeKey === 'photo') {
      if (photoImg) photoImg.classList.add('active');
    } else {
      if (photoImg) photoImg.classList.remove('active');
      if (cameraModes[modeKey]) {
        targetCamPos.copy(cameraModes[modeKey].pos);
        targetCamLook.copy(cameraModes[modeKey].look);
      }
    }

    // Update active button classes
    document.querySelectorAll('.vessel-mode-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.mode === modeKey) btn.classList.add('active');
    });
  };

  // 7. Interactive Mouse Parallax
  let mouseX = 0;
  let mouseY = 0;

  function onMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }
  }
  window.addEventListener('mousemove', onMouseMove);

  // 8. Dynamic Animation Loop
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    // Wave Vertex Displacement Physics
    const posAttr = waterGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const u = originalPositions[i * 3];
      const v = originalPositions[i * 3 + 2];
      
      const wave1 = Math.sin(u * 0.7 + time * 1.5) * 0.08;
      const wave2 = Math.cos(v * 0.8 + time * 1.2) * 0.06;
      const wave3 = Math.sin((u + v) * 0.4 + time * 1.8) * 0.04;
      
      posAttr.setY(i, wave1 + wave2 + wave3);
    }
    posAttr.needsUpdate = true;
    waterGeo.computeVertexNormals();

    // JalDrishti Rover Buoyancy Bobbing & Roll
    const roverWave = Math.sin(time * 2.0) * 0.06;
    roverGroup.position.y = roverWave;
    roverGroup.rotation.z = Math.sin(time * 1.3) * 0.035;
    roverGroup.rotation.x = Math.cos(time * 1.0) * 0.025;

    // Spinning LiDAR Head
    lidarHead.rotation.y = time * 2.5;

    // Pulsing Beacon & Laser Intensity
    const pulse = 0.38 + Math.sin(time * 5.0) * 0.22;
    laserMat1.opacity = pulse;
    laserMat2.opacity = 0.42 + Math.cos(time * 4.5) * 0.18;
    laserMat3.opacity = 0.32 + Math.sin(time * 6.0) * 0.15;
    beaconMat.color.setHex(Math.sin(time * 8.0) > 0 ? 0x10b981 : 0x06b6d4);

    // Realistic Fluid Particle Stream Drift
    const pPos = particleGeo.attributes.position;
    for (let i = 0; i < particleCount; i++) {
      let z = pPos.getZ(i);
      z += 0.025;
      if (z > 6.0) z = -6.0;
      pPos.setZ(i, z);

      let y = pPos.getY(i);
      y += Math.sin(time * 2.0 + i) * 0.0015;
      pPos.setY(i, y);
    }
    pPos.needsUpdate = true;

    // Smooth Camera Interpolation
    camera.position.lerp(targetCamPos, 0.05);
    camera.lookAt(targetCamLook);

    // Subtle parallax
    scene.rotation.y = mouseX * 0.12;
    scene.rotation.x = mouseY * 0.06;

    renderer.render(scene, camera);
  }

  animate();

  // Resize Listener
  function handleResize() {
    if (!canvas) return;
    const w = canvas.clientWidth || (canvas.parentElement ? canvas.parentElement.clientWidth : 600);
    const h = canvas.clientHeight || (canvas.parentElement ? canvas.parentElement.clientHeight : 480);
    if (w > 0 && h > 0) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
  }

  window.addEventListener('resize', handleResize);
  setTimeout(handleResize, 100);
  setTimeout(handleResize, 500);
}

// Auto-initialize when ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initJalDrishtiRoverScene);
} else {
  initJalDrishtiRoverScene();
}
window.addEventListener('load', () => {
  if (window.set3DViewMode) window.set3DViewMode('rover');
});
