/* ==========================================================================
   JALDRISHTI ROVER - REAL-TIME AUTONOMOUS WATER NAVIGATION & 180° SCANNING ENGINE
   - Straight forward cruise navigation (0.5 knots).
   - Dynamic U-turn toward mouse pointer location upon hover / pointing.
   - Compact rover model footprint with agile hydrodynamics.
   - Full 180° forward multi-spectral optical laser scanning arc.
   - Comprehensive chemical & element identification of Indian river/canal particles:
     * LDPE Agricultural Mulch Film (470nm)
     * Paddy Stubble Ash [PAH Carbon] (380nm)
     * Organophosphate Pesticide Residue (520nm)
     * Polypropylene Woven Sack Microfibers (410nm)
     * HDPE Chemical Container Fragments (490nm)
     * Mineral River Silt & Clay Sediment (650nm)
     * Phytoplankton & Algal Biomass (680nm)
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

  // 2. Compact Rover State & Physics
  const rover = {
    x: width * 0.3,
    y: height * 0.5,
    vx: 0,
    vy: 0,
    speed: 0.7, // Ultra smooth 0.5 kts precision scanning speed
    cruiseSpeed: 0.7,
    turnSpeed: 0.055, // Smooth U-turn turning capability
    angle: 0, // Radians
    length: 52, // Compact size (~35% smaller)
    width: 24,
    wakeTimer: 0,
    laserSweepAngle: 0,
    laserSweepDir: 1,
    isUturning: false
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
      badgeColor: 'rgba(16, 185, 129, 0.9)',
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
      risk: 'NATURAL BIOMASS',
      shape: 'bio_cluster'
    }
  ];

  // 4. Populate River Stream with Floating Elements
  const particleCount = 115;
  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    const elType = riverElementTypes[Math.floor(Math.random() * riverElementTypes.length)];
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: -(0.25 + Math.random() * 0.35), // Canal stream current flows right-to-left
      vy: (Math.random() - 0.5) * 0.12,
      size: 3.0 + Math.random() * 4.0,
      elData: elType,
      scanned: false,
      scanTimer: 0,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.03
    });
  }

  // 5. Foaming Propeller Wake Trail
  const wakePuffs = [];

  function addWakePuff(x, y, angle, speed) {
    const rearDist = rover.length * 0.45;
    const rearX = x - Math.cos(angle) * rearDist;
    const rearY = y - Math.sin(angle) * rearDist;

    // Twin prop wake trails (left and right)
    const perpX = -Math.sin(angle) * (rover.width * 0.35);
    const perpY = Math.cos(angle) * (rover.width * 0.35);

    wakePuffs.push({
      x: rearX + perpX,
      y: rearY + perpY,
      radius: 2.5 + Math.random() * 2.0,
      maxRadius: 16 + Math.random() * 5,
      alpha: 0.7,
      decay: 0.015,
      vx: -Math.cos(angle) * (speed * 0.2) + (Math.random() - 0.5) * 0.25,
      vy: -Math.sin(angle) * (speed * 0.2) + (Math.random() - 0.5) * 0.25
    });

    wakePuffs.push({
      x: rearX - perpX,
      y: rearY - perpY,
      radius: 2.5 + Math.random() * 2.0,
      maxRadius: 16 + Math.random() * 5,
      alpha: 0.7,
      decay: 0.015,
      vx: -Math.cos(angle) * (speed * 0.2) + (Math.random() - 0.5) * 0.25,
      vy: -Math.sin(angle) * (speed * 0.2) + (Math.random() - 0.5) * 0.25
    });
  }

  // 6. Detection Alert Ping Bursts with Detailed Chemical Classification
  const alertPings = [];

  function triggerDetectionPing(x, y, elData) {
    const confidence = (elData.confBase + (Math.random() * 1.5 - 0.5)).toFixed(1);

    alertPings.push({
      x: x,
      y: y,
      name: elData.name,
      category: elData.category,
      peak: elData.peak,
      conf: confidence + '%',
      risk: elData.risk,
      color: elData.color,
      radius: 6,
      maxRadius: 32,
      alpha: 1.0,
      decay: 0.018
    });

    detectedCount++;
    const detDisplay = document.getElementById('hud-detected-count');
    if (detDisplay) detDisplay.textContent = detectedCount.toLocaleString();

    // Increment individual element count and update UI
    if (elementCounts[elData.id] !== undefined) {
      elementCounts[elData.id]++;
      const elCountDisplay = document.getElementById(`count-${elData.id}`);
      if (elCountDisplay) {
        elCountDisplay.textContent = elementCounts[elData.id].toLocaleString();
      }

      const elCard = document.getElementById(`card-${elData.id}`);
      if (elCard) {
        elCard.classList.remove('active-pulse');
        void elCard.offsetWidth; // Force CSS reflow
        elCard.classList.add('active-pulse');
      }
    }

    // Update last scanned element
    lastScannedElement = {
      name: elData.name,
      category: elData.category,
      peak: elData.peak,
      conf: confidence + '%',
      risk: elData.risk,
      color: elData.color
    };

    // Dynamically update ticker with detected element
    const ticker = document.getElementById('live-system-ticker');
    if (ticker && Math.random() < 0.35) {
      ticker.textContent = `SPECTRAL IDENTIFICATION: ${elData.name} • ${elData.peak} • Conf: ${confidence}% [${elData.risk}]`;
    }
  }

  // 7. Navigation Logic: Straight Cruise with Mouse Point U-turn
  function updateRoverNavigation() {
    if (isMouseOver && mouseTarget) {
      // Calculate angle to mouse target
      const dx = mouseTarget.x - rover.x;
      const dy = mouseTarget.y - rover.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 30) {
        const targetAngle = Math.atan2(dy, dx);
        let diff = targetAngle - rover.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        // Check if a sharp U-turn is happening
        if (Math.abs(diff) > Math.PI * 0.5) {
          rover.isUturning = true;
          rover.speed = rover.cruiseSpeed * 1.1; // Gentle power into U-turn
        } else {
          rover.isUturning = false;
          rover.speed = rover.cruiseSpeed;
        }

        // Steer with smooth hydrodynamic turning arc
        rover.angle += diff * rover.turnSpeed;
      } else {
        // Near mouse pointer: continue forward in current straight heading
        rover.isUturning = false;
        rover.speed = rover.cruiseSpeed;
      }
    } else {
      // Normal straight cruising
      rover.isUturning = false;
      rover.speed = rover.cruiseSpeed;
    }

    // Straight forward motion physics
    rover.vx = Math.cos(rover.angle) * rover.speed;
    rover.vy = Math.sin(rover.angle) * rover.speed;
    rover.x += rover.vx;
    rover.y += rover.vy;

    // Boundary Bounce (Smooth reflective U-turn when reaching edge of canal)
    const margin = 35;
    if (rover.x < margin) {
      rover.x = margin;
      rover.angle = Math.PI - rover.angle;
    }
    if (rover.x > width - margin) {
      rover.x = width - margin;
      rover.angle = Math.PI - rover.angle;
    }
    if (rover.y < margin) {
      rover.y = margin;
      rover.angle = -rover.angle;
    }
    if (rover.y > height - margin) {
      rover.y = height - margin;
      rover.angle = -rover.angle;
    }

    // Emit foaming wake
    rover.wakeTimer++;
    if (rover.wakeTimer % 2 === 0 && rover.speed > 0.4) {
      addWakePuff(rover.x, rover.y, rover.angle, rover.speed);
    }

    // Oscillating secondary laser scan ray across the 180° forward arc
    rover.laserSweepAngle += 0.04 * rover.laserSweepDir;
    if (rover.laserSweepAngle > Math.PI * 0.44) rover.laserSweepDir = -1;
    if (rover.laserSweepAngle < -Math.PI * 0.44) rover.laserSweepDir = 1;

    // Telemetry updates
    areaScanned += rover.speed * 0.12;
    const areaDisplay = document.getElementById('hud-area-scanned');
    if (areaDisplay) areaDisplay.textContent = Math.floor(areaScanned) + ' m²';

    const speedDisplay = document.getElementById('hud-rover-speed');
    if (speedDisplay) speedDisplay.textContent = (rover.speed * 0.72).toFixed(1) + ' kts';
  }

  // 8. Update Particles & 180° Laser Arc Detection Collision
  function updateParticles() {
    const bowX = rover.x + Math.cos(rover.angle) * (rover.length * 0.42);
    const bowY = rover.y + Math.sin(rover.angle) * (rover.length * 0.42);
    const laserReach = 160; // Deep water optical penetration reach

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed;

      // Wrap particles around canal bounds
      if (p.x < -20) { p.x = width + 20; p.y = Math.random() * height; p.scanned = false; }
      if (p.y < -20) p.y = height + 20;
      if (p.y > height + 20) p.y = -20;

      // Check if particle is inside the FULL 180° FORWARD LASER ARC
      const dx = p.x - bowX;
      const dy = p.y - bowY;
      const dist = Math.hypot(dx, dy);

      if (dist < laserReach) {
        const angleToP = Math.atan2(dy, dx);
        let angleDiff = angleToP - rover.angle;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

        // 180-Degree Forward Arc condition: |angleDiff| <= 90° (Math.PI / 2)
        if (Math.abs(angleDiff) <= Math.PI * 0.5) {
          if (!p.scanned) {
            p.scanned = true;
            p.scanTimer = 32; // Highlight glow timer
            triggerDetectionPing(p.x, p.y, p.elData);
          }
        }
      }

      if (p.scanTimer > 0) p.scanTimer--;
    }
  }

  // 9. Render Engine
  function drawWaterBackground() {
    // Deep canal water gradient
    const waterGrad = ctx.createLinearGradient(0, 0, 0, height);
    waterGrad.addColorStop(0, '#0284c7');
    waterGrad.addColorStop(0.5, '#0369a1');
    waterGrad.addColorStop(1, '#075985');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, 0, width, height);

    // Dynamic water flow streamlines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
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

    // Sunlight Caustic Refraction Glimmers
    ctx.fillStyle = 'rgba(224, 242, 254, 0.05)';
    for (let i = 0; i < 8; i++) {
      const cx = (simTime * 20 + i * 110) % (width + 100) - 50;
      const cy = (height * 0.15 + i * 42) % height;
      ctx.beginPath();
      ctx.arc(cx, cy, 20 + Math.sin(simTime + i) * 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

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

      // Outer ripple ring
      ctx.strokeStyle = `rgba(224, 242, 254, ${w.alpha * 0.45})`;
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }
  }

  function drawParticles() {
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
        // Translucent Plastic Mulch Shred
        ctx.fillStyle = p.scanTimer > 0 ? '#67e8f9' : 'rgba(224, 242, 254, 0.8)';
        ctx.beginPath();
        ctx.moveTo(-p.size, -p.size * 0.6);
        ctx.lineTo(p.size * 0.8, -p.size);
        ctx.lineTo(p.size, p.size * 0.7);
        ctx.lineTo(-p.size * 0.4, p.size * 0.9);
        ctx.closePath();
        ctx.fill();
      } else if (el.shape === 'ash_speck') {
        // Porous Stubble Burn Carbon Ash Speck
        ctx.fillStyle = p.scanTimer > 0 ? '#fbbf24' : 'rgba(245, 158, 11, 0.85)';
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.55, 0, Math.PI * 2);
        ctx.fill();
      } else if (el.shape === 'fiber') {
        // Synthetic Woven Microfiber Thread
        ctx.strokeStyle = p.scanTimer > 0 ? '#c084fc' : 'rgba(168, 85, 247, 0.85)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-p.size * 1.2, -p.size * 0.4);
        ctx.bezierCurveTo(-p.size * 0.2, p.size * 0.6, p.size * 0.2, -p.size * 0.6, p.size * 1.2, p.size * 0.4);
        ctx.stroke();
      } else if (el.shape === 'silt_grain') {
        // Earthy Mineral River Silt Grain
        ctx.fillStyle = p.scanTimer > 0 ? '#fde047' : 'rgba(202, 138, 4, 0.85)';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 0.6, p.size * 0.4, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (el.shape === 'bio_cluster') {
        // Phytoplankton & Organic Algal Cluster
        ctx.fillStyle = p.scanTimer > 0 ? '#bef264' : 'rgba(132, 204, 22, 0.8)';
        ctx.beginPath();
        ctx.arc(-p.size * 0.3, 0, p.size * 0.35, 0, Math.PI * 2);
        ctx.arc(p.size * 0.3, 0, p.size * 0.35, 0, Math.PI * 2);
        ctx.arc(0, -p.size * 0.3, p.size * 0.35, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Jagged Plastic / Pesticide Container Flake
        ctx.fillStyle = p.scanTimer > 0 ? el.color : 'rgba(244, 63, 94, 0.8)';
        ctx.fillRect(-p.size * 0.5, -p.size * 0.35, p.size, p.size * 0.7);
      }

      ctx.restore();
    }
  }

  // FULL 180-DEGREE MULTI-SPECTRAL OPTICAL SCANNING FAN
  function drawLaserFan() {
    const bowX = rover.x + Math.cos(rover.angle) * (rover.length * 0.42);
    const bowY = rover.y + Math.sin(rover.angle) * (rover.length * 0.42);
    const laserReach = 160;
    const startAngle = rover.angle - Math.PI * 0.5; // -90° (Left beam)
    const endAngle = rover.angle + Math.PI * 0.5;   // +90° (Right beam)

    ctx.save();

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

    // Left 90° Wing Beam
    ctx.beginPath();
    ctx.moveTo(bowX, bowY);
    ctx.lineTo(bowX + Math.cos(startAngle) * laserReach, bowY + Math.sin(startAngle) * laserReach);
    ctx.stroke();

    // Right 90° Wing Beam
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

    ctx.restore();
  }

  // COMPACT JALDRISHTI ROVER MODEL
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

    // 1. Water Drop Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;

    // 2. Twin Stabilizing Outrigger Floats (Pontoons) - Compact Size
    ctx.fillStyle = '#1e293b';
    // Left Pontoon
    ctx.beginPath();
    ctx.roundRect(-rover.length * 0.4, -rover.width * 0.6, rover.length * 0.8, 6, 3);
    ctx.fill();
    // Right Pontoon
    ctx.beginPath();
    ctx.roundRect(-rover.length * 0.4, rover.width * 0.6 - 6, rover.length * 0.8, 6, 3);
    ctx.fill();

    // Carbon Connection Struts
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-rover.length * 0.2, -rover.width * 0.6, 4, rover.width * 1.2);
    ctx.fillRect(rover.length * 0.15, -rover.width * 0.6, 4, rover.width * 1.2);

    // 3. Main Rover Hull (Aerodynamic White with Tapered Nose)
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(rover.length * 0.48, 0); // Nose tip
    ctx.lineTo(rover.length * 0.32, -rover.width * 0.42); // Bow left
    ctx.lineTo(-rover.length * 0.42, -rover.width * 0.38); // Stern left
    ctx.lineTo(-rover.length * 0.46, 0); // Stern center
    ctx.lineTo(-rover.length * 0.42, rover.width * 0.38); // Stern right
    ctx.lineTo(rover.length * 0.32, rover.width * 0.42); // Bow right
    ctx.closePath();
    ctx.fill();

    // Hull Border Outline
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 4. Emerald Green Racing Trim
    ctx.fillStyle = '#10b981';
    ctx.fillRect(-rover.length * 0.32, -rover.width * 0.36, rover.length * 0.62, 2.5);
    ctx.fillRect(-rover.length * 0.32, rover.width * 0.36 - 2.5, rover.length * 0.62, 2.5);

    // 5. Monocrystalline Solar Top Deck (Deep Blue Cells)
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-rover.length * 0.22, -rover.width * 0.24, rover.length * 0.42, rover.width * 0.48);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 0.6;
    ctx.strokeRect(-rover.length * 0.22, -rover.width * 0.24, rover.length * 0.42, rover.width * 0.48);

    // 6. Rotating 360° LiDAR Navigation Turret
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-rover.length * 0.26, 0, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Pulsing Navigation Beacon LED
    const beaconGlow = Math.sin(simTime * 8) > 0;
    ctx.fillStyle = beaconGlow ? '#10b981' : '#06b6d4';
    ctx.shadowBlur = 8;
    ctx.shadowColor = ctx.fillStyle;
    ctx.beginPath();
    ctx.arc(-rover.length * 0.26, 0, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // 7. Subsurface Optical Sensor Node (At Bow)
    ctx.fillStyle = '#06b6d4';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#06b6d4';
    ctx.beginPath();
    ctx.arc(rover.length * 0.42, 0, 3.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Draw Mouse Target Reticle when pointer is over water
  function drawMouseTarget() {
    if (!isMouseOver || !mouseTarget) return;

    ctx.save();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#10b981';

    // Outer Target Circle
    ctx.beginPath();
    ctx.arc(mouseTarget.x, mouseTarget.y, 14 + Math.sin(simTime * 6) * 3, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshair Lines
    ctx.beginPath();
    ctx.moveTo(mouseTarget.x - 8, mouseTarget.y);
    ctx.lineTo(mouseTarget.x + 8, mouseTarget.y);
    ctx.moveTo(mouseTarget.x, mouseTarget.y - 8);
    ctx.lineTo(mouseTarget.x, mouseTarget.y + 8);
    ctx.stroke();

    ctx.restore();
  }

  // Clean, Unobtrusive Particle Glowing Highlights (No Text Blocking Canvas)
  function drawAlertPings() {
    for (let i = alertPings.length - 1; i >= 0; i--) {
      const ping = alertPings[i];
      ping.radius += 0.8;
      ping.alpha -= ping.decay;

      if (ping.alpha <= 0) {
        alertPings.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = ping.alpha;

      // 1. Sleek Expanding Glowing Reticle Ring
      ctx.strokeStyle = ping.color;
      ctx.lineWidth = 1.8;
      ctx.shadowBlur = 14;
      ctx.shadowColor = ping.color;
      ctx.beginPath();
      ctx.arc(ping.x, ping.y, ping.radius, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Secondary Subtle Pulse Ring
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(ping.x, ping.y, ping.radius * 0.6, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
  }

  // 11. Mouse Pointer Tracking for Dynamic U-Turn
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseTarget = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    isMouseOver = true;

    const ticker = document.getElementById('live-system-ticker');
    if (ticker) {
      ticker.textContent = 'AUTONOMOUS U-TURN: Executing Hydrodynamic U-Turn Arc to Target Mouse Coordinates • 180° Optical Scan Active';
    }
  });

  canvas.addEventListener('mouseleave', () => {
    isMouseOver = false;
    mouseTarget = null;
    const ticker = document.getElementById('live-system-ticker');
    if (ticker) {
      ticker.textContent = 'PATROL MODE: Straight Cruise Navigation along Canal Channel • 180° Subsurface Laser Scanning';
    }
  });

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseTarget = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    isMouseOver = true;
  });

  // 12. Navigation Mode API
  window.setRoverNavSimulationMode = function(modeKey) {
    const ticker = document.getElementById('live-system-ticker');

    if (modeKey === 'straight') {
      isMouseOver = false;
      mouseTarget = null;
      if (ticker) ticker.textContent = 'PATROL MODE: Continuous Straight Canal Cruise • Full 180° Optical Laser Water Scanning';
    } else if (modeKey === 'uturn') {
      // Trigger immediate 180° U-turn
      rover.angle += Math.PI;
      if (ticker) ticker.textContent = 'MANEUVER: Instant 180° U-Turn Executed • Reversing Canal Patrol Direction';
    }

    document.querySelectorAll('.vessel-mode-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.mode === modeKey) btn.classList.add('active');
    });
  };

  // 13. Master Animation Loop (Clean, Unblocked View)
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
