/* ==========================================================================
   JALDRISHTI - LIVE AREA HYDROLOGY & NEARBY WATER RESOURCES EXPLORER
   - Live GPS Geolocation & Reverse Geocoding for Exact Area/City Names.
   - Dynamic Nearby Water Resources list ranked by distance with live telemetry.
   - Comprehensive Indian river/lake/canal database across Maharashtra, Punjab,
     Haryana, Delhi, Uttarakhand, Karnataka, and Telangana.
   - Interactive map clicking to inspect any locality's rivers and lakes.
   ========================================================================== */

(function initAreaWaterResourcesMap() {
  const mapElement = document.getElementById('canal-map');
  if (!mapElement) return;

  // 1. Initialize Map
  const map = L.map('canal-map', {
    zoomControl: true,
    scrollWheelZoom: false
  }).setView([18.5204, 73.8567], 11);

  // High-Contrast Hydrology Basemap (CartoDB Voyager)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> & JalDrishti Hydrology',
    maxZoom: 18
  }).addTo(map);

  // 2. Custom Icon Factory
  function createCustomIcon(color, pulse = false, iconType = 'water') {
    if (iconType === 'user') {
      return L.divIcon({
        className: 'custom-user-gps-marker',
        html: `<div style="
          width: 26px;
          height: 26px;
          background: #0284c7;
          border: 3px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 16px #0284c7, 0 4px 12px rgba(0,0,0,0.35);
          animation: gpsPulse 1.8s infinite;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="width: 10px; height: 10px; background: #38bdf8; border-radius: 50%;"></div>
        </div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });
    }

    return L.divIcon({
      className: 'custom-map-marker',
      html: `<div style="
        width: 20px; 
        height: 20px; 
        background: ${color}; 
        border: 2px solid #ffffff; 
        border-radius: 50%; 
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-size: 10px;
        font-weight: 800;
        ${pulse ? 'animation: pulseGlow 1.5s infinite;' : ''}
      ">💧</div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  }

  // 3. Indian Rivers, Lakes, Reservoirs & Canals Database
  const waterBodies = [
    // Maharashtra & Western River Basins
    {
      id: 'RIVER-MH-01',
      name: 'Mula River (Sangam Reach)',
      type: 'River Catchment',
      icon: '🌊',
      lat: 18.5314,
      lng: 73.8446,
      area: 'Shivajinagar / Pune',
      region: 'Pune, Maharashtra',
      plastic: '780 fragments/L (LDPE Mulch & Packaging)',
      burnIndex: 'Moderate (PAH 0.42)',
      upstreamSource: 'Old Pune Agricultural Fringe',
      statusColor: '#e11d48'
    },
    {
      id: 'RIVER-MH-02',
      name: 'Mutha River (Deccan Reach)',
      type: 'River Catchment',
      icon: '🌊',
      lat: 18.5167,
      lng: 73.8562,
      area: 'Deccan Gymkhana / Pune',
      region: 'Pune, Maharashtra',
      plastic: '840 fragments/L (Degraded Polymers)',
      burnIndex: 'Moderate (PAH 0.38)',
      upstreamSource: 'Sinhagad Agro Catchment',
      statusColor: '#e11d48'
    },
    {
      id: 'RIVER-MH-03',
      name: 'Pawana River (Dapodi-Pimpri Reach)',
      type: 'River Catchment',
      icon: '🌊',
      lat: 18.6279,
      lng: 73.8009,
      area: 'PCMC / Pimpri-Chinchwad',
      region: 'Maharashtra',
      plastic: '920 fragments/L (Mulch & Packaging)',
      burnIndex: 'High (PAH 0.65)',
      upstreamSource: 'Maval Agricultural Belt',
      statusColor: '#e11d48'
    },
    {
      id: 'LAKE-MH-01',
      name: 'Khadakwasla Dam & Reservoir',
      type: 'Freshwater Dam & Lake',
      icon: '🏞️',
      lat: 18.4312,
      lng: 73.7619,
      area: 'Khadakwasla / Pune Catchment',
      region: 'Pune Drinking Water Intake',
      plastic: '65 fragments/L (Intake Baseline)',
      burnIndex: 'Low (PAH 0.04)',
      upstreamSource: 'Western Ghats Catchment',
      statusColor: '#059669'
    },
    {
      id: 'LAKE-MH-02',
      name: 'Pashan Lake & Wetland Basin',
      type: 'Urban Freshwater Lake',
      icon: '🏞️',
      lat: 18.5372,
      lng: 73.7885,
      area: 'Pashan / Baner, Pune',
      region: 'Pune, Maharashtra',
      plastic: '520 fragments/L (Microfibers)',
      burnIndex: 'Moderate (PAH 0.28)',
      upstreamSource: 'Ramnadi Feeder Stream',
      statusColor: '#d97706'
    },
    {
      id: 'RIVER-MH-04',
      name: 'Godavari River (Ramkund Reach)',
      type: 'Major River Basin',
      icon: '🌊',
      lat: 19.9975,
      lng: 73.7898,
      area: 'Panchavati / Nashik',
      region: 'Nashik, Maharashtra',
      plastic: '680 fragments/L (Plastic Residue)',
      burnIndex: 'High (PAH 0.58)',
      upstreamSource: 'Trimbak Agro-Valley Reach',
      statusColor: '#d97706'
    },
    {
      id: 'RIVER-MH-05',
      name: 'Krishna River Basin (Sangli Ghat)',
      type: 'Major River Basin',
      icon: '🌊',
      lat: 16.8524,
      lng: 74.5815,
      area: 'Sangli City Reach',
      region: 'Sangli, Maharashtra',
      plastic: '610 fragments/L (Sugarcane Mulch)',
      burnIndex: 'High (PAH 0.72)',
      upstreamSource: 'Upper Krishna Agro Basin',
      statusColor: '#d97706'
    },

    // Northern River & Canal Networks
    {
      id: 'CANAL-PB-01',
      name: 'Sirhind Feeder Canal (Lock Gate #4)',
      type: 'Primary Irrigation Canal',
      icon: '🛶',
      lat: 30.2104,
      lng: 74.9455,
      area: 'Firozpur / Bathinda Reach',
      region: 'Punjab Irrigation Network',
      plastic: '890 fragments/L (LDPE Mulch)',
      burnIndex: 'High (PAH 0.84)',
      upstreamSource: 'Cluster 14B - Firozpur Paddy Belt',
      statusColor: '#e11d48'
    },
    {
      id: 'CANAL-HR-01',
      name: 'Western Yamuna Canal (Karnal Distributary)',
      type: 'Main Irrigation Canal',
      icon: '🛶',
      lat: 29.6857,
      lng: 76.9905,
      area: 'Karnal / Munak Reach',
      region: 'Haryana Canal Network',
      plastic: '620 fragments/L (HDPE Bottles)',
      burnIndex: 'Critical (PAH 0.91)',
      upstreamSource: 'Cluster 09A - Kaithal Stubble Belt',
      statusColor: '#d97706'
    },
    {
      id: 'CANAL-PB-02',
      name: 'Bhakra Main Canal (Patiala Lock #2)',
      type: 'Inter-State Feeder Canal',
      icon: '🛶',
      lat: 30.3398,
      lng: 76.3869,
      area: 'Patiala Reach',
      region: 'Punjab / Haryana',
      plastic: '45 fragments/L (Trace Baseline)',
      burnIndex: 'Low (PAH 0.08)',
      upstreamSource: 'Cluster 03C - Nangal Dam Headworks',
      statusColor: '#059669'
    },
    {
      id: 'RIVER-PB-01',
      name: 'Sutlej River (Harike Wetland Headworks)',
      type: 'Major River Confluence',
      icon: '🌊',
      lat: 31.1500,
      lng: 74.9500,
      area: 'Harike / Tarn Taran',
      region: 'Punjab Wetland Ecosystem',
      plastic: '740 fragments/L (Mulch & Microfiber)',
      burnIndex: 'High (PAH 0.79)',
      upstreamSource: 'Ludhiana Buddha Nullah Confluence',
      statusColor: '#e11d48'
    },
    {
      id: 'RIVER-DL-01',
      name: 'Yamuna River (Okhla Barrage)',
      type: 'Major River Basin',
      icon: '🌊',
      lat: 28.5433,
      lng: 77.3056,
      area: 'Okhla / South Delhi',
      region: 'Delhi NCR',
      plastic: '1,280 fragments/L (Extreme Polymer Density)',
      burnIndex: 'High (PAH 0.88)',
      upstreamSource: 'Upper Yamuna Agricultural & Urban Inflows',
      statusColor: '#e11d48'
    },
    {
      id: 'RIVER-UK-01',
      name: 'Ganga River (Haridwar Canal Intake)',
      type: 'Holy River Basin',
      icon: '🌊',
      lat: 29.9457,
      lng: 78.1642,
      area: 'Har Ki Pauri / Haridwar',
      region: 'Uttarakhand Headworks',
      plastic: '110 fragments/L (Baseline Monitoring)',
      burnIndex: 'Low (PAH 0.06)',
      upstreamSource: 'Upper Himalayan Catchment',
      statusColor: '#059669'
    },
    {
      id: 'LAKE-CH-01',
      name: 'Sukhna Lake Basin',
      type: 'Freshwater Lake & Wetland',
      icon: '🏞️',
      lat: 30.7421,
      lng: 76.8188,
      area: 'Sector 1 / Chandigarh',
      region: 'Chandigarh / Shivalik',
      plastic: '95 fragments/L (Protected Basin)',
      burnIndex: 'Low (PAH 0.05)',
      upstreamSource: 'Kansal Watershed',
      statusColor: '#059669'
    },

    // Central & Southern Basins
    {
      id: 'RIVER-KA-01',
      name: 'Cauvery River (KRS Dam Intake)',
      type: 'Major River Basin',
      icon: '🌊',
      lat: 12.4244,
      lng: 76.5724,
      area: 'Mandya / Mysuru Reach',
      region: 'Karnataka Catchment',
      plastic: '340 fragments/L (Agricultural Feeder)',
      burnIndex: 'Low (PAH 0.12)',
      upstreamSource: 'Kodagu Upstream Catchment',
      statusColor: '#0284c7'
    },
    {
      id: 'LAKE-TS-01',
      name: 'Hussain Sagar Lake Basin',
      type: 'Major Lake & Reservoir',
      icon: '🏞️',
      lat: 17.4239,
      lng: 78.4738,
      area: 'Tank Bund / Hyderabad',
      region: 'Hyderabad, Telangana',
      plastic: '810 fragments/L (Microfibers & Film)',
      burnIndex: 'Moderate (PAH 0.35)',
      upstreamSource: 'Picket Nala Feeder Basin',
      statusColor: '#d97706'
    }
  ];

  // 4. Map Layers
  const waterMarkersLayer = L.layerGroup().addTo(map);
  const connectionLinesLayer = L.layerGroup().addTo(map);
  let userGpsMarker = null;
  let userAccuracyCircle = null;

  // 5. Haversine Distance Calculator (km)
  function getDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // 6. Select & Display Water Body in Detail Card
  function selectWaterBodyDetails(node, distanceKm = null) {
    const idEl = document.getElementById('node-id-display');
    if (idEl) {
      idEl.textContent = `${node.icon} ${node.name}`;
      idEl.style.color = node.statusColor;
    }
    const pEl = document.getElementById('node-plastic-display');
    if (pEl) {
      pEl.textContent = node.plastic;
      pEl.style.color = node.statusColor;
    }

    const bEl = document.getElementById('node-burn-display');
    if (bEl) bEl.textContent = node.burnIndex;

    const tEl = document.getElementById('node-type-display');
    if (tEl) tEl.textContent = `${node.type} • ${node.area}`;

    const sEl = document.getElementById('node-source-display');
    if (sEl) sEl.textContent = node.upstreamSource;

    const distBadge = document.getElementById('nearest-distance-badge');
    if (distBadge && distanceKm !== null) {
      distBadge.textContent = `Proximity: ${distanceKm < 1 ? (distanceKm * 1000).toFixed(0) + ' m' : distanceKm.toFixed(1) + ' km'}`;
    }
  }

  // 7. Update Nearby Water Resources List in Side Panel
  function updateNearbyWaterList(userLat, userLng, areaName) {
    const listContainer = document.getElementById('nearby-water-list');
    if (!listContainer) return;

    // Calculate distance to all water bodies and sort ascending
    const sortedWaters = waterBodies.map(node => {
      const dist = getDistanceKm(userLat, userLng, node.lat, node.lng);
      return { ...node, distanceKm: dist };
    }).sort((a, b) => a.distanceKm - b.distanceKm);

    // Select top 4-5 closest water resources
    const topNearby = sortedWaters.slice(0, 5);

    // Update count badge
    const countBadge = document.getElementById('water-count-badge');
    if (countBadge) countBadge.textContent = `${topNearby.length} Nearby Resources`;

    // Clear and populate list
    listContainer.innerHTML = '';
    connectionLinesLayer.clearLayers();

    topNearby.forEach((node, index) => {
      const isClosest = index === 0;
      const formattedDist = node.distanceKm < 1 ? 
        `${(node.distanceKm * 1000).toFixed(0)} meters away` : 
        `${node.distanceKm.toFixed(1)} km away`;

      const card = document.createElement('div');
      card.style.cssText = `
        background: ${isClosest ? 'rgba(2, 132, 199, 0.08)' : '#ffffff'};
        border: 1px solid ${isClosest ? 'rgba(2, 132, 199, 0.4)' : 'var(--border-glass-strong)'};
        border-radius: var(--radius-sm);
        padding: 0.75rem 0.9rem;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        justify-content: space-between;
        align-items: center;
      `;

      card.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.65rem;">
          <div style="font-size: 1.25rem;">${node.icon}</div>
          <div>
            <div style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary); line-height: 1.2;">
              ${node.name}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem;">
              ${node.type} • <strong style="color: #0284c7;">${formattedDist}</strong>
            </div>
          </div>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 0.7rem; font-weight: 800; background: ${node.statusColor === '#e11d48' ? '#fee2e2' : '#ecfdf5'}; color: ${node.statusColor}; padding: 0.15rem 0.5rem; border-radius: 9999px;">
            ${node.statusColor === '#e11d48' ? 'HIGH RISK' : 'BASELINE'}
          </span>
        </div>
      `;

      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateX(4px)';
        card.style.borderColor = '#0284c7';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'none';
        card.style.borderColor = isClosest ? 'rgba(2, 132, 199, 0.4)' : 'var(--border-glass-strong)';
      });

      card.addEventListener('click', () => {
        map.flyTo([node.lat, node.lng], 14, { duration: 1.2 });
        selectWaterBodyDetails(node, node.distanceKm);
      });

      listContainer.appendChild(card);

      // Draw connection vectors on map to closest 3 resources
      if (index < 3) {
        L.polyline([
          [userLat, userLng],
          [node.lat, node.lng]
        ], {
          color: index === 0 ? '#0284c7' : '#94a3b8',
          weight: index === 0 ? 2.5 : 1.5,
          dashArray: '5, 8',
          opacity: index === 0 ? 0.85 : 0.45
        }).addTo(connectionLinesLayer);
      }
    });

    // Select the closest one in the bottom details
    if (topNearby.length > 0) {
      selectWaterBodyDetails(topNearby[0], topNearby[0].distanceKm);
    }
  }

  // 8. Render Water Markers with Permanent Name Tooltips
  function renderAllWaterMarkers() {
    waterMarkersLayer.clearLayers();

    waterBodies.forEach(node => {
      const marker = L.marker([node.lat, node.lng], {
        icon: createCustomIcon(node.statusColor, node.statusColor === '#e11d48')
      });

      // Permanent tooltip showing water resource name
      marker.bindTooltip(`<strong>${node.icon} ${node.name}</strong>`, {
        permanent: false,
        direction: 'top',
        offset: [0, -10]
      });

      marker.bindPopup(`
        <div style="font-family: 'Inter', sans-serif; padding: 4px; min-width: 220px;">
          <div style="font-size: 10px; font-weight: 800; color: ${node.statusColor}; text-transform: uppercase;">${node.type}</div>
          <strong style="color: #0f172a; font-size: 13px; font-weight: 800;">${node.icon} ${node.name}</strong><br>
          <span style="font-size: 11px; color: #64748b;">📍 Area: ${node.area} (${node.region})</span><br>
          <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #e2e8f0;">
            <span style="font-size: 12px; color: #334155;"><strong>Plastic Load:</strong> <span style="color: ${node.statusColor}; font-weight: 700;">${node.plastic}</span></span><br>
            <span style="font-size: 12px; color: #334155;"><strong>Burn PAH Index:</strong> ${node.burnIndex}</span><br>
            <span style="font-size: 11px; color: #0284c7;"><strong>Inflow:</strong> ${node.upstreamSource}</span>
          </div>
        </div>
      `);

      marker.on('click', () => {
        selectWaterBodyDetails(node);
      });

      waterMarkersLayer.addLayer(marker);
    });
  }

  renderAllWaterMarkers();

  // 9. Reverse Geocode Coordinates to Exact Area Name
  function updateAreaLocation(lat, lng, customAreaName = null) {
    const areaTitle = document.getElementById('current-area-name');
    const areaDesc = document.getElementById('current-area-desc');
    const coordsInd = document.getElementById('map-coords-indicator');

    if (coordsInd) {
      coordsInd.textContent = `Lat: ${lat.toFixed(4)}° N, Long: ${lng.toFixed(4)}° E`;
    }

    if (customAreaName) {
      if (areaTitle) areaTitle.textContent = customAreaName;
      if (areaDesc) areaDesc.textContent = `Active river catchment & irrigation canals in ${customAreaName}`;
      updateNearbyWaterList(lat, lng, customAreaName);
      return;
    }

    if (areaTitle) areaTitle.textContent = 'Identifying Area Name...';

    // Fetch locality via OpenStreetMap Reverse Geocoding API
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
      .then(res => res.json())
      .then(data => {
        if (data && data.address) {
          const addr = data.address;
          const locality = addr.suburb || addr.neighbourhood || addr.city_district || addr.village || addr.town || addr.city || 'Local Catchment';
          const city = addr.city || addr.state_district || addr.county || '';
          const state = addr.state || 'India';
          const fullArea = `${locality}${city ? ', ' + city : ''}, ${state}`;

          if (areaTitle) areaTitle.textContent = fullArea;
          if (areaDesc) areaDesc.textContent = `Monitored drainage basin for ${locality} agricultural and municipal water channels`;
          updateNearbyWaterList(lat, lng, fullArea);
        } else {
          fallbackAreaName(lat, lng);
        }
      })
      .catch(() => {
        fallbackAreaName(lat, lng);
      });
  }

  function fallbackAreaName(lat, lng) {
    // Determine closest known area
    let closest = waterBodies[0];
    let minD = Infinity;
    waterBodies.forEach(w => {
      const d = getDistanceKm(lat, lng, w.lat, w.lng);
      if (d < minD) { minD = d; closest = w; }
    });

    const areaTitle = document.getElementById('current-area-name');
    const areaDesc = document.getElementById('current-area-desc');
    const fallbackName = minD < 25 ? `${closest.area}, ${closest.region}` : `Catchment Basin (${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E)`;

    if (areaTitle) areaTitle.textContent = fallbackName;
    if (areaDesc) areaDesc.textContent = `Hydrological monitoring network for nearby rivers and water bodies`;
    updateNearbyWaterList(lat, lng, fallbackName);
  }

  // 10. Place User Location Marker on Map
  function setMapUserLocation(lat, lng, label = 'YOUR LOCATION') {
    if (userGpsMarker) map.removeLayer(userGpsMarker);
    if (userAccuracyCircle) map.removeLayer(userAccuracyCircle);

    userGpsMarker = L.marker([lat, lng], {
      icon: createCustomIcon('#0284c7', true, 'user')
    }).addTo(map);

    userGpsMarker.bindPopup(`
      <div style="font-family: 'Inter', sans-serif; padding: 4px;">
        <strong style="color: #0284c7; font-size: 13px;">📍 ${label}</strong><br>
        <span style="font-size: 11px; color: #475569;">Latitude: ${lat.toFixed(4)}° N, Longitude: ${lng.toFixed(4)}° E</span><br>
        <span style="font-size: 11px; color: #059669; font-weight: 700;">Displaying all nearby rivers & water bodies below</span>
      </div>
    `).openPopup();

    userAccuracyCircle = L.circle([lat, lng], {
      radius: 400,
      color: '#38bdf8',
      fillColor: '#38bdf8',
      fillOpacity: 0.12,
      weight: 1.5
    }).addTo(map);

    map.flyTo([lat, lng], 12, { duration: 1.5 });
    updateAreaLocation(lat, lng);
  }

  // 11. Live GPS Detection Handler
  function handleGpsSuccess(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    setMapUserLocation(lat, lng, 'LIVE GPS DETECTED AREA');
  }

  function handleGpsError() {
    // Fast IP-based Location Fallback
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data && data.latitude && data.longitude) {
          const area = `${data.city || 'Local Area'}, ${data.region || 'Maharashtra'}`;
          setMapUserLocation(data.latitude, data.longitude, `AREA: ${area}`);
        } else {
          setMapUserLocation(18.5204, 73.8567, 'PUNE BASIN (Default)');
        }
      })
      .catch(() => {
        setMapUserLocation(18.5204, 73.8567, 'PUNE BASIN (Default)');
      });
  }

  function detectLiveGPS() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(handleGpsSuccess, handleGpsError, {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0
      });
    } else {
      handleGpsError();
    }
  }

  // Hook up GPS Button
  const gpsBtn = document.getElementById('btn-gps-locate');
  if (gpsBtn) {
    gpsBtn.addEventListener('click', detectLiveGPS);
  }

  // 12. Preset Region Switcher
  const regionSelect = document.getElementById('region-preset-select');
  if (regionSelect) {
    regionSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'auto') {
        detectLiveGPS();
      } else if (val === 'pune') {
        setMapUserLocation(18.5204, 73.8567, 'PUNE & PCMC BASIN');
      } else if (val === 'punjab') {
        setMapUserLocation(30.2104, 74.9455, 'FIROZPUR / SIRHIND CANAL BASIN');
      } else if (val === 'haryana') {
        setMapUserLocation(29.6857, 76.9905, 'KARNAL / YAMUNA CANAL BASIN');
      } else if (val === 'delhi') {
        setMapUserLocation(28.5433, 77.3056, 'DELHI NCR / OKHLA BASIN');
      } else if (val === 'nashik') {
        setMapUserLocation(19.9975, 73.7898, 'NASHIK / GODAVARI BASIN');
      } else if (val === 'haridwar') {
        setMapUserLocation(29.9457, 78.1642, 'HARIDWAR / GANGA BASIN');
      } else if (val === 'hyderabad') {
        setMapUserLocation(17.4239, 78.4738, 'HYDERABAD / HUSSAIN SAGAR');
      }
    });
  }

  // 13. Interactive Map Clicking to Inspect Any Area
  map.on('click', (e) => {
    const clickLat = e.latlng.lat;
    const clickLng = e.latlng.lng;
    setMapUserLocation(clickLat, clickLng, 'INSPECTED AREA');
  });

  // Initial Auto-Detection
  detectLiveGPS();

  // 14. Sentinel-2 Thermal Stubble Fire Hotspots Layer
  const fireHotspots = L.layerGroup();
  const fireLocations = [
    [30.4100, 75.1200], [30.1500, 74.8800], [29.8500, 76.8000], [30.5500, 74.3200],
    [19.8500, 74.2200], [18.7200, 74.1500]
  ];

  fireLocations.forEach(loc => {
    L.circleMarker(loc, {
      radius: 8,
      fillColor: '#ea580c',
      color: '#ffffff',
      weight: 2,
      opacity: 0.9,
      fillOpacity: 0.8
    }).bindTooltip('🔥 Sentinel-2 Thermal Stubble Fire Hotspot', { permanent: false }).addTo(fireHotspots);
  });

  fireHotspots.addTo(map);

  const toggleHotspots = document.getElementById('toggle-hotspots');
  if (toggleHotspots) {
    toggleHotspots.addEventListener('change', (e) => {
      if (e.target.checked) map.addLayer(fireHotspots);
      else map.removeLayer(fireHotspots);
    });
  }
})();
