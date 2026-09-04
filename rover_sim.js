/* ==========================================================================
   JALDRISHTI ROVER - REAL-TIME AUTONOMOUS WATER NAVIGATION & 180° SCANNING ENGINE
   - Straight forward cruise navigation (0.5 knots).
   - Dynamic U-turn toward mouse pointer location upon hover / pointing.
   - Dual Scanning Modes:
     1. Surface Water Scan (0 - 0.5m): 180° Multi-spectral Optical Laser Fan.
     2. Subsurface Deep Scan (3m - 5m): Volumetric Bathymetric Acoustic LiDAR Cone.
   - Calibrated Depth Markers (1m, 2.5m, 3.5m, 5.0m) detecting submerged plastics & silt.
   - Comprehensive chemical & element identification of Indian river/canal particles.
   ========================================================================== */

(function initJalDrishtiRoverSimulation() {
  const canvas = document.getElementById('roverSimCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    if (!canvas || !canvas.parentElement) return;
    width = canvas.parentElement.clientWidth || window.innerWidth;
    height = canvas.parentElement.clientHeight || 480;
    canvas.width = width;
    canvas.height = height;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // 1. Simulation State & Individual Element Counters
  let mouseTarget = null;
  let isMouseOver = false;
  let detectedCount = 3044;
  let areaScanned = 340;
  let simTime = 0;

  const elementCounts = {
    ldpe_mulch: 382,
    stubble_ash: 214,
    pesticide_film: 128,
    pp_fiber: 196,
    hdpe_fragment: 94,
    river_silt: 1420,
    organic_algae: 610
  };

  let lastScannedElement = {
    name: 'LDPE Agricultural Mulch Film',
    formula: 'Low-Density Polyethylene',
    peak: '470nm (Cyan)',
    conf: '98.4%',
    risk: 'HIGH RISK POLYMER',
    color: '#06b6d4'
  };

  // 2. Compact Rover State, Physics & Dual-Depth Scanning Engine
  const rover = {
    x: width * 0.3,
    y: height * 0.5,
    vx: 0,
    vy: 0,
    speed: 0.7, // 0.5 kts precision scanning speed
    cruiseSpeed: 0.7,
    turnSpeed: 0.055, // Smooth U-turn turning capability
    angle: 0, // Radians
    length: 52, // Compact size (~35% smaller)
    width: 24,
    wakeTimer: 0,
    laserSweepAngle: 0,
    laserSweepDir: 1,
    isUturning: false,
    scanDepthMode: 'surface', // 'surface' (0 - 0.5m) or 'deep' (3m - 5m)
    currentDepth: 0.5,
    targetDepth: 0.5,
    sonarPulse: 0
  };

  // 3. Realistic River & Canal Elements Database
  const riverElementTypes = [
    {
      id: 'ldpe_mulch',
      name: 'LDPE Mulch Film Shreds',
      category: 'Microplastic (Mulch)',
      peak: '470nm (Cyan Absorption)',
      confBase: 98.2,
      color: '#06b6d4',
      badgeColor: 'rgba(6, 182, 212, 0.9)',
      risk: 'HIGH RISK POLYMER',
      shape: 'film'
    },
    {
      id: 'stubble_ash',
      name: 'Paddy Stubble Ash [PAH Carbon]',
      category: 'Combustion Residue',
      peak: '380nm (UV Excitation)',
      confBase: 96.5,
      color: '#f59e0b',
      badgeColor: 'rgba(245, 158, 11, 0.9)',
      risk: 'CARCINOGENIC PAH',
      shape: 'ash_speck'
    },
    {
      id: 'pesticide_film',
      name: 'Organophosphate Pesticide Residue',
      category: 'Agro-Chemical Packaging',
      peak: '520nm (Emerald Peak)',
      confBase: 94.1,
      color: '#f43f5e',
      badgeColor: 'rgba(244, 63, 94, 0.9)',
      risk: 'TOXIC CHEMICAL RUNOFF',
      shape: 'shard'
    },
    {
      id: 'pp_fiber',
      name: 'PP Fertilizer Sack Microfiber',
      category: 'Synthetic Microfiber',
      peak: '410nm (Violet Absorption)',
      confBase: 97.4,
      color: '#a855f7',
      badgeColor: 'rgba(168, 85, 247, 0.9)',
      risk: 'FIBER VECTOR',
      shape: 'fiber'
    },
    {
      id: 'hdpe_fragment',
      name: 'HDPE Chemical Container Flake',
      category: 'Rigid Microplastic',
      peak: '490nm (Teal Peak)',
      confBase: 95.8,
      color: '#10b981',
      badgeColor: 'rgba(168, 85, 247, 0.9)',
      risk: 'NON-BIODEGRADABLE',
      shape: 'shard'
    },
    {
      id: 'river_silt',
      name: 'Mineral River Silt & Clay',
      category: 'Natural Sediment',
      peak: '650nm (Light Scattering)',
      confBase: 99.1,
      color: '#ca8a04',
      badgeColor: 'rgba(202, 138, 4, 0.9)',
      risk: 'NATURAL TURBIDITY',
      shape: 'silt_grain'
    },
    {
      id: 'organic_algae',
      name: 'Phytoplankton & Algal Biomass',
      category: 'Aquatic Organic Matter',
      peak: '680nm (Chlorophyll-a)',
      confBase: 93.6,
      color: '#84cc16',
      badgeColor: 'rgba(132, 204, 22, 0.9)',
      risk: 'EUTROPHICATION TRACER',
      shape: 'bio_cluster'
    }
  ];

  // 4. Particles Array
  const particles = [];
  const PARTICLE_COUNT = 48;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const elType = riverElementTypes[Math.floor(Math.random() * riverElementTypes.length)];
    particles.push({
      x: Math.random() * (width || 800),
      y: Math.random() * (height || 480),
      vx: -(0.15 + Math.random() * 0.35),
      vy: (Math.random() - 0.5) * 0.15,
      size: 4 + Math.random() * 6,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02,
      elData: elType,
      scanned: false,
      scanTimer: 0,
      depthM: (0.3 + Math.random() * 4.6).toFixed(1) // Depth coordinate 0.3m to 4.9m
    });
  }

  // 5. Wake Bubbles & Detection Pings
  const wakePuffs = [];
  const alertPings = [];

  function triggerDetectionPing(x, y, elData) {
    detectedCount++;
    if (elementCounts[elData.id] !== undefined) {
      elementCounts[elData.id]++;
    }

    lastScannedElement = {
      name: elData.name,
      peak: elData.peak,
      conf: (elData.confBase + (Math.random() * 1.5 - 0.7)).toFixed(1) + '%',
      risk: elData.risk,
      color: elData.color
    };

    alertPings.push({
      x: x,
      y: y,
      radius: 4,
      maxRadius: 36,
      color: elData.color,
      alpha: 1.0,
      label: elData.name,
      depthM: rover.scanDepthMode === 'deep' ? `${(3.0 + Math.random() * 1.9).toFixed(1)}m Depth` : 'Surface 0.4m'
    });

    // Update DOM counters
    const hudDetected = document.getElementById('hud-detected-count');
    if (hudDetected) hudDetected.textContent = detectedCount;

    const countCard = document.getElementById(`count-${elData.id}`);
    if (countCard) countCard.textContent = elementCounts[elData.id];

    const cardEl = document.getElementById(`card-${elData.id}`);
    if (cardEl) {
      cardEl.classList.add('particle-card-highlight');
      setTimeout(() => cardEl.classList.remove('particle-card-highlight'), 600);
    }
  }

  // 6. Navigation Control API
  window.setRoverNavSimulationMode = function(modeKey) {
    const ticker = document.getElementById('live-system-ticker');

    if (modeKey === 'straight') {
      isMouseOver = false;
      mouseTarget = null;
      if (ticker) {
        ticker.textContent = rover.scanDepthMode === 'deep' ?
          'PATROL MODE: Straight Canal Cruise • Subsurface Deep Water Scan (3m - 5m Column Active)' :
          'PATROL MODE: Continuous Straight Canal Cruise • Full 180° Optical Laser Water Scanning';
      }
    } else if (modeKey === 'uturn') {
      rover.angle += Math.PI;
      if (ticker) ticker.textContent = 'MANEUVER: Instant 180° U-Turn Executed • Reversing Canal Patrol Direction';
    }

    document.querySelectorAll('.vessel-mode-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.mode === modeKey) btn.classList.add('active');
    });
  };

  // 7. Depth Scanning Mode Control API (User Requested)
  window.setRoverScanDepthMode = function(depthModeKey) {
    rover.scanDepthMode = depthModeKey;
    rover.targetDepth = (depthModeKey === 'deep') ? 4.5 : 0.5;

    const ticker = document.getElementById('live-system-ticker');
    const depthPill = document.getElementById('hud-scan-depth-pill');
    const depthDisplay = document.getElementById('hud-scan-depth');

    if (depthModeKey === 'deep') {
      if (ticker) ticker.textContent = 'SUBSURFACE SCAN ACTIVE: Dual-Frequency Bathymetric Multi-Beam Penetrating 3.0m - 5.0m Canal Water Column';
      if (depthPill) {
        depthPill.style.background = '#0f172a';
        depthPill.style.color = '#38bdf8';
        depthPill.style.borderColor = '#38bdf8';
      }
      if (depthDisplay) {
        depthDisplay.textContent = '4.5m (Subsurface 3m-5m)';
        depthDisplay.style.color = '#38bdf8';
      }
    } else {
      if (ticker) ticker.textContent = 'SURFACE SCAN ACTIVE: 180° Optical Multi-Spectral Laser Profiling Top 0 - 0.5m Water Surface';
      if (depthPill) {
        depthPill.style.background = '#ecfeff';
        depthPill.style.color = '#0284c7';
        depthPill.style.borderColor = 'rgba(2, 132, 199, 0.4)';
      }
      if (depthDisplay) {
        depthDisplay.textContent = '0.5m (Surface)';
        depthDisplay.style.color = '#0284c7';
      }
    }

    // Update button states
    document.querySelectorAll('.vessel-depth-btn').forEach(btn => {
      btn.classList.remove('active', 'active-deep');
      if (btn.dataset.depth === depthModeKey) {
        btn.classList.add(depthModeKey === 'deep' ? 'active-deep' : 'active');
      }
    });
  };

  // 8. Update Rover Navigation & Physics
  function updateRoverNavigation() {
    // Smooth depth interpolation
    rover.currentDepth += (rover.targetDepth - rover.currentDepth) * 0.05;
    rover.sonarPulse += 0.035;
    if (rover.sonarPulse > 1) rover.sonarPulse = 0;

    const depthDisplay = document.getElementById('hud-scan-depth');
    if (depthDisplay) {
      if (rover.scanDepthMode === 'deep') {
        const liveD = (rover.currentDepth + Math.sin(simTime * 2) * 0.3).toFixed(1);
        depthDisplay.textContent = `${liveD}m (3m - 5m Subsurface)`;
      } else {
        depthDisplay.textContent = '0.5m (Surface)';
      }
    }

    // Mouse Tracking U-turn Logic
    if (isMouseOver && mouseTarget) {
      const dx = mouseTarget.x - rover.x;
      const dy = mouseTarget.y - rover.y;
      const targetAngle = Math.atan2(dy, dx);

      let angleDiff = targetAngle - rover.angle;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

      rover.isUturning = Math.abs(angleDiff) > 0.4;
      rover.angle += angleDiff * rover.turnSpeed;
    } else {
      rover.isUturning = false;
    }

    // Forward Propulsion
    rover.vx = Math.cos(rover.angle) * rover.speed;
    rover.vy = Math.sin(rover.angle) * rover.speed;
    rover.x += rover.vx;
    rover.y += rover.vy;

    // Boundary wrapping
    const margin = 50;
    if (rover.x < -margin) rover.x = width + margin;
    if (rover.x > width + margin) rover.x = -margin;
    if (rover.y < -margin) rover.y = height + margin;
    if (rover.y > height + margin) rover.y = -margin;

    // Wake Generation
    rover.wakeTimer++;
    if (rover.wakeTimer % 4 === 0) {
      const sternX = rover.x - Math.cos(rover.angle) * (rover.length * 0.45);
      const sternY = rover.y - Math.sin(rover.angle) * (rover.length * 0.45);
      wakePuffs.push({
        x: sternX,
        y: sternY,
        vx: -rover.vx * 0.3 + (Math.random() - 0.5) * 0.15,
        vy: -rover.vy * 0.3 + (Math.random() - 0.5) * 0.15,
        radius: 3 + Math.random() * 2,
        alpha: 0.8,
        decay: 0.018
      });
    }

    // Laser Sweep Oscillation
    rover.laserSweepAngle += 0.045 * rover.laserSweepDir;
    if (rover.laserSweepAngle > Math.PI * 0.44) rover.laserSweepDir = -1;
    if (rover.laserSweepAngle < -Math.PI * 0.44) rover.laserSweepDir = 1;

    // Telemetry updates
    areaScanned += rover.speed * 0.12;
    const speedDisplay = document.getElementById('hud-rover-speed');
    if (speedDisplay) speedDisplay.textContent = (rover.speed * 0.72).toFixed(1) + ' kts';
  }

  // 9. Update Particles & Detection Collision
  function updateParticles() {
    const bowX = rover.x + Math.cos(rover.angle) * (rover.length * 0.42);
    const bowY = rover.y + Math.sin(rover.angle) * (rover.length * 0.42);
    const isDeep = rover.scanDepthMode === 'deep';
    const laserReach = isDeep ? 245 : 160;
    const maxSpread = isDeep ? (Math.PI * 0.42) : (Math.PI * 0.5);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed;

      // Wrap particles around canal bounds
      if (p.x < -20) { p.x = width + 20; p.y = Math.random() * height; p.scanned = false; }
      if (p.y < -20) p.y = height + 20;
      if (p.y > height + 20) p.y = -20;

      // Check if particle is inside the active optical/acoustic scan zone
      const dx = p.x - bowX;
      const dy = p.y - bowY;
      const dist = Math.hypot(dx, dy);

      if (dist < laserReach) {
        const angleToP = Math.atan2(dy, dx);
        let angleDiff = angleToP - rover.angle;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

        if (Math.abs(angleDiff) <= maxSpread) {
          if (!p.scanned) {
            p.scanned = true;
            p.scanTimer = 34; // Glow duration
            triggerDetectionPing(p.x, p.y, p.elData);
          }
        }
      }

      if (p.scanTimer > 0) p.scanTimer--;
    }
  }

  // 10. Water Background & Bathymetric Gradient
  function drawWaterBackground() {
    const isDeep = rover.scanDepthMode === 'deep';

    // Dynamic water gradient (deeper abyss tint when underwater mode is active)
    const waterGrad = ctx.createLinearGradient(0, 0, 0, height);
    if (isDeep) {
      waterGrad.addColorStop(0, '#024e75');
      waterGrad.addColorStop(0.4, '#033f63');
      waterGrad.addColorStop(1, '#071e3d');
    } else {
      waterGrad.addColorStop(0, '#0284c7');
      waterGrad.addColorStop(0.5, '#0369a1');
      waterGrad.addColorStop(1, '#075985');
    }
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, 0, width, height);

    // Dynamic water flow streamlines
    ctx.strokeStyle = isDeep ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1.2;
    for (let y = 25; y < height; y += 40) {
      ctx.beginPath();
      for (let x = 0; x < width; x += 30) {
        const waveY = y + Math.sin(x * 0.02 + simTime * 1.8 + y) * 5;
        if (x === 0) ctx.moveTo(x, waveY);
        else ctx.lineTo(x, waveY);
      }
      ctx.stroke();
    }

    // Caustic Refraction Glimmers
    ctx.fillStyle = isDeep ? 'rgba(56, 189, 248, 0.03)' : 'rgba(224, 242, 254, 0.05)';
    for (let i = 0; i < 8; i++) {
      const cx = (simTime * 20 + i * 110) % (width + 100) - 50;
      const cy = (height * 0.15 + i * 42) % height;
      ctx.beginPath();
      ctx.arc(cx, cy, 20 + Math.sin(simTime + i) * 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 11. Wake Rendering
  function drawWake() {
    for (let i = wakePuffs.length - 1; i >= 0; i--) {
      const w = wakePuffs[i];
      w.x += w.vx;
      w.y += w.vy;
      w.radius += 0.24;
      w.alpha -= w.decay;

      if (w.alpha <= 0) {
        wakePuffs.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${w.alpha * 0.38})`;
      ctx.fill();

      ctx.strokeStyle = `rgba(224, 242, 254, ${w.alpha * 0.45})`;
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }
  }

  // 12. Particles Rendering with Submerged Depth Indicator
  function drawParticles() {
    const isDeep = rover.scanDepthMode === 'deep';

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const el = p.elData;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      if (p.scanTimer > 0) {
        ctx.shadowBlur = 14;
        ctx.shadowColor = el.color;
      }

      if (el.shape === 'film') {
        ctx.fillStyle = p.scanTimer > 0 ? '#67e8f9' : 'rgba(224, 242, 254, 0.8)';
        ctx.beginPath();
        ctx.moveTo(-p.size, -p.size * 0.6);
        ctx.lineTo(p.size * 0.8, -p.size);
        ctx.lineTo(p.size, p.size * 0.7);
        ctx.lineTo(-p.size * 0.4, p.size * 0.9);
        ctx.closePath();
        ctx.fill();
      } else if (el.shape === 'ash_speck') {
        ctx.fillStyle = p.scanTimer > 0 ? '#fbbf24' : 'rgba(245, 158, 11, 0.85)';
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.55, 0, Math.PI * 2);
        ctx.fill();
      } else if (el.shape === 'fiber') {
        ctx.strokeStyle = p.scanTimer > 0 ? '#c084fc' : 'rgba(168, 85, 247, 0.85)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-p.size * 1.2, -p.size * 0.4);
        ctx.bezierCurveTo(-p.size * 0.2, p.size * 0.6, p.size * 0.2, -p.size * 0.6, p.size * 1.2, p.size * 0.4);
        ctx.stroke();
      } else if (el.shape === 'silt_grain') {
        ctx.fillStyle = p.scanTimer > 0 ? '#fde047' : 'rgba(202, 138, 4, 0.85)';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 0.6, p.size * 0.4, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (el.shape === 'bio_cluster') {
        ctx.fillStyle = p.scanTimer > 0 ? '#bef264' : 'rgba(132, 204, 22, 0.8)';
        ctx.beginPath();
        ctx.arc(-p.size * 0.3, 0, p.size * 0.35, 0, Math.PI * 2);
        ctx.arc(p.size * 0.3, 0, p.size * 0.35, 0, Math.PI * 2);
        ctx.arc(0, -p.size * 0.3, p.size * 0.35, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.scanTimer > 0 ? el.color : 'rgba(244, 63, 94, 0.8)';
        ctx.fillRect(-p.size * 0.5, -p.size * 0.35, p.size, p.size * 0.7);
      }

      ctx.restore();

      // In deep scan mode, draw small depth tag on illuminated particles
      if (isDeep && p.scanTimer > 15) {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.fillRect(p.x + 8, p.y - 12, 48, 13);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 8px Inter, sans-serif';
        ctx.fillText(`-${p.depthM}m`, p.x + 12, p.y - 2);
        ctx.restore();
      }
    }
  }

  // 13. DUAL-MODE SCANNING FAN: SURFACE (180°) OR SUBSURFACE DEEP CONE (3m - 5m)
  function drawLaserFan() {
    const bowX = rover.x + Math.cos(rover.angle) * (rover.length * 0.42);
    const bowY = rover.y + Math.sin(rover.angle) * (rover.length * 0.42);

    ctx.save();

    if (rover.scanDepthMode === 'deep') {
      // =========================================================================
      // MODE 2: SUBSURFACE DEEP SCAN (3m - 5m WATER COLUMN ACOUSTIC-OPTICAL CONE)
      // =========================================================================
      const deepReach = 245; // Represents 5 meters depth reach
      const beamSpread = Math.PI * 0.38; // Conical multi-beam penetration angle

      // 1. Deep Volumetric Depth Gradient
      const coneGrad = ctx.createRadialGradient(bowX, bowY, 12, bowX, bowY, deepReach);
      coneGrad.addColorStop(0, 'rgba(56, 189, 248, 0.95)');
      coneGrad.addColorStop(0.25, 'rgba(2, 132, 199, 0.65)');
      coneGrad.addColorStop(0.65, 'rgba(30, 27, 75, 0.45)');
      coneGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');

      ctx.beginPath();
      ctx.moveTo(bowX, bowY);
      ctx.arc(bowX, bowY, deepReach, rover.angle - beamSpread, rover.angle + beamSpread);
      ctx.closePath();
      ctx.fillStyle = coneGrad;
      ctx.fill();

      // 2. Pulsing Sonar Wavefronts (Echoing downward through water column)
      for (let ring = 1; ring <= 4; ring++) {
        const ringProgress = (rover.sonarPulse + ring * 0.25) % 1;
        const ringDist = ringProgress * deepReach;
        ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - ringProgress) * 0.65})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(bowX, bowY, ringDist, rover.angle - beamSpread, rover.angle + beamSpread);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 3. Calibrated Depth Contour Rings & Depth Level Labels
      const depthMarks = [
        { depthM: '1.0m', dist: deepReach * 0.22, label: 'Upper Layer (Floatables & Mulch)', color: '#38bdf8' },
        { depthM: '2.5m', dist: deepReach * 0.50, label: 'Mid-Column (Suspended Microplastics)', color: '#06b6d4' },
        { depthM: '3.5m', dist: deepReach * 0.72, label: 'Thermocline (Agrochemical Runoff)', color: '#10b981' },
        { depthM: '5.0m', dist: deepReach * 0.96, label: 'Deep Bed (Sinking PAHs & Silt)', color: '#f59e0b' }
      ];

      depthMarks.forEach(dm => {
        // Contour ring arc
        ctx.strokeStyle = dm.color;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(bowX, bowY, dm.dist, rover.angle - beamSpread * 0.95, rover.angle + beamSpread * 0.95);
        ctx.stroke();

        // Depth badge along beam boundary
        const labelAngle = rover.angle + beamSpread * 0.98;
        const lx = bowX + Math.cos(labelAngle) * dm.dist;
        const ly = bowY + Math.sin(labelAngle) * dm.dist;

        ctx.save();
        ctx.translate(lx, ly);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = dm.color;
        ctx.lineWidth = 1;
        ctx.fillRect(4, -9, 138, 16);
        ctx.strokeRect(4, -9, 138, 16);
        ctx.fillStyle = dm.color;
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.fillText(`▼ ${dm.depthM} : ${dm.label}`, 8, 3);
        ctx.restore();
      });

      // 4. Center High-Intensity LiDAR/Sonar Penetration Beam (5.0m Depth)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.4;
      ctx.shadowBlur = 16;
      ctx.shadowColor = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(bowX, bowY);
      ctx.lineTo(bowX + Math.cos(rover.angle) * deepReach, bowY + Math.sin(rover.angle) * deepReach);
      ctx.stroke();

      // 5. Active Oscillating Multi-Beam Sweeper within Cone
      const sweepA = rover.angle + Math.sin(simTime * 3.2) * (beamSpread * 0.85);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = '#a855f7';
      ctx.beginPath();
      ctx.moveTo(bowX, bowY);
      ctx.lineTo(bowX + Math.cos(sweepA) * deepReach, bowY + Math.sin(sweepA) * deepReach);
      ctx.stroke();

      // 6. On-Canvas Deep Subsurface Status Badge
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.4;
      if (ctx.roundRect) ctx.roundRect(14, height - 56, 260, 44, 8);
      else ctx.rect(14, height - 56, 260, 44);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText('⬇️ SUBSURFACE DEEP SCAN (3m - 5m)', 24, height - 35);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '9px Inter, sans-serif';
      const liveDText = (rover.currentDepth + Math.sin(simTime * 2) * 0.3).toFixed(1);
      ctx.fillText(`Active Bathymetric Depth: ${liveDText}m / 5.0m • Multi-Beam Active`, 24, height - 20);
      ctx.restore();

    } else {
      // =========================================================================
      // MODE 1: STANDARD SURFACE WATER SCAN (0 - 0.5m 180° OPTICAL LASER FAN)
      // =========================================================================
      const laserReach = 160;
      const startAngle = rover.angle - Math.PI * 0.5; // -90° (Left beam)
      const endAngle = rover.angle + Math.PI * 0.5;   // +90° (Right beam)

      // 1. Full 180° Multi-Spectral Optical Gradient Fill
      const fanGrad = ctx.createRadialGradient(bowX, bowY, 8, bowX, bowY, laserReach);
      fanGrad.addColorStop(0, 'rgba(6, 182, 212, 0.85)');
      fanGrad.addColorStop(0.35, 'rgba(16, 185, 129, 0.45)');
      fanGrad.addColorStop(0.75, 'rgba(139, 92, 246, 0.25)');
      fanGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');

      ctx.beginPath();
      ctx.moveTo(bowX, bowY);
      ctx.arc(bowX, bowY, laserReach, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = fanGrad;
      ctx.fill();

      // 2. 180° Boundary Arc Outline
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(bowX, bowY, laserReach, startAngle, endAngle);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. 180° Left & Right Perimeter Laser Boundary Beams (Cyan)
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.8;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#06b6d4';

      ctx.beginPath();
      ctx.moveTo(bowX, bowY);
      ctx.lineTo(bowX + Math.cos(startAngle) * laserReach, bowY + Math.sin(startAngle) * laserReach);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(bowX, bowY);
      ctx.lineTo(bowX + Math.cos(endAngle) * laserReach, bowY + Math.sin(endAngle) * laserReach);
      ctx.stroke();

      // 4. Center Forward Laser Beam (0° Bow Angle)
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.0;
      ctx.shadowColor = '#10b981';
      ctx.beginPath();
      ctx.moveTo(bowX, bowY);
      ctx.lineTo(bowX + Math.cos(rover.angle) * laserReach, bowY + Math.sin(rover.angle) * laserReach);
      ctx.stroke();

      // 5. Active Oscillating Laser Sweep Needle across 180° Arc
      const sweepAngle = rover.angle + rover.laserSweepAngle;
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2.2;
      ctx.shadowBlur = 14;
      ctx.shadowColor = '#a855f7';
      ctx.beginPath();
      ctx.moveTo(bowX, bowY);
      ctx.lineTo(bowX + Math.cos(sweepAngle) * laserReach, bowY + Math.sin(sweepAngle) * laserReach);
      ctx.stroke();
    }

    ctx.restore();
  }

  // 14. COMPACT JALDRISHTI ROVER MODEL
  function drawRover() {
    ctx.save();
    ctx.translate(rover.x, rover.y);
    ctx.rotate(rover.angle);

    // Natural Hydrodynamic Roll & Pitch Bobbing
    const rollOffset = Math.sin(simTime * 3.5) * 1.0;
    ctx.translate(0, rollOffset);

    // Dynamic Banking Tilt during U-turns
    if (rover.isUturning) {
      ctx.transform(1, 0, 0.12, 1, 0, 0);
    }

    // 1. Sleek Outrigger Stabilizer Pontoons
    const pontoonW = 7;
    const pontoonL = 38;
    const pontoonSpread = 22;

    ctx.fillStyle = '#0284c7';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;

    // Left Pontoon
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-pontoonL * 0.45, -pontoonSpread - pontoonW * 0.5, pontoonL, pontoonW, 3) :
      ctx.rect(-pontoonL * 0.45, -pontoonSpread - pontoonW * 0.5, pontoonL, pontoonW);
    ctx.fill();
    ctx.stroke();

    // Right Pontoon
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-pontoonL * 0.45, pontoonSpread - pontoonW * 0.5, pontoonL, pontoonW, 3) :
      ctx.rect(-pontoonL * 0.45, pontoonSpread - pontoonW * 0.5, pontoonL, pontoonW);
    ctx.fill();
    ctx.stroke();

    // Carbon fiber connecting struts
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -pontoonSpread);
    ctx.lineTo(0, pontoonSpread);
    ctx.stroke();

    // 2. Main Central Hull (Streamlined Hydrodynamic Vessel)
    const hullGrad = ctx.createLinearGradient(-rover.length * 0.5, 0, rover.length * 0.5, 0);
    hullGrad.addColorStop(0, '#0f172a');
    hullGrad.addColorStop(0.5, '#1e293b');
    hullGrad.addColorStop(1, '#0284c7');

    ctx.fillStyle = hullGrad;
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(rover.length * 0.5, 0); // Sharp Bow
    ctx.bezierCurveTo(rover.length * 0.25, -rover.width * 0.5, -rover.length * 0.35, -rover.width * 0.5, -rover.length * 0.5, -rover.width * 0.35);
    ctx.lineTo(-rover.length * 0.5, rover.width * 0.35); // Square Stern
    ctx.bezierCurveTo(-rover.length * 0.35, rover.width * 0.5, rover.length * 0.25, rover.width * 0.5, rover.length * 0.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Solar Photovoltaic Top Deck Array
    ctx.fillStyle = '#0369a1';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-rover.length * 0.3, -rover.width * 0.3, rover.length * 0.45, rover.width * 0.6, 3) :
      ctx.rect(-rover.length * 0.3, -rover.width * 0.3, rover.length * 0.45, rover.width * 0.6);
    ctx.fill();
    ctx.stroke();

    // Photovoltaic grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(-rover.length * 0.08, -rover.width * 0.3);
    ctx.lineTo(-rover.length * 0.08, rover.width * 0.3);
    ctx.stroke();

    // 4. Center Turret / Sensor Dome
    ctx.fillStyle = '#0ea5e9';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#38bdf8';
    ctx.beginPath();
    ctx.arc(rover.length * 0.18, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    // 5. Quad Spectral LED Emitters at Bow
    const ledColors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];
    for (let k = 0; k < 4; k++) {
      const ledY = (k - 1.5) * 4;
      ctx.fillStyle = ledColors[k];
      ctx.shadowBlur = 6;
      ctx.shadowColor = ledColors[k];
      ctx.beginPath();
      ctx.arc(rover.length * 0.45, ledY, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // 15. Mouse Target Indicator
  function drawMouseTarget() {
    if (!isMouseOver || !mouseTarget) return;

    ctx.save();
    ctx.translate(mouseTarget.x, mouseTarget.y);

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 10 + Math.sin(simTime * 6) * 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 16. Alert Pings Animation
  function drawAlertPings() {
    for (let i = alertPings.length - 1; i >= 0; i--) {
      const ping = alertPings[i];
      ping.radius += 0.8;
      ping.alpha -= 0.024;

      if (ping.alpha <= 0) {
        alertPings.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.strokeStyle = ping.color;
      ctx.lineWidth = 1.8;
      ctx.globalAlpha = ping.alpha;
      ctx.beginPath();
      ctx.arc(ping.x, ping.y, ping.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Particle label with depth info
      if (ping.radius > 12 && ping.alpha > 0.4) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillText(`${ping.label} (${ping.depthM})`, ping.x + ping.radius + 4, ping.y - 2);
      }

      ctx.restore();
    }
  }

  // 17. Mouse Interaction Event Listeners
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseTarget = {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
    isMouseOver = true;

    const ticker = document.getElementById('live-system-ticker');
    if (ticker) {
      ticker.textContent = rover.scanDepthMode === 'deep' ?
        'AUTONOMOUS VECTOR: Navigating to Target Area • Subsurface Multi-Beam Scanning (3m - 5m)' :
        'AUTONOMOUS VECTOR: Steering Toward Target Area • 180° Optical Laser Scanning';
    }
  });

  canvas.addEventListener('mouseleave', () => {
    isMouseOver = false;
    mouseTarget = null;
  });

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);

    alertPings.push({
      x: clickX,
      y: clickY,
      radius: 4,
      maxRadius: 40,
      color: '#38bdf8',
      alpha: 1.0,
      label: rover.scanDepthMode === 'deep' ? 'Subsurface Acoustic Ping (4.2m)' : 'Surface Optical Ping (0.5m)',
      depthM: rover.scanDepthMode === 'deep' ? '4.2m' : '0.5m'
    });
  });

  // 18. Master Animation Loop
  function simLoop() {
    requestAnimationFrame(simLoop);
    simTime += 0.016;

    updateRoverNavigation();
    updateParticles();

    // Render Canvas Layers
    drawWaterBackground();
    drawWake();
    drawParticles();
    drawLaserFan();
    drawRover();
    drawMouseTarget();
    drawAlertPings();
  }

  simLoop();
})();
