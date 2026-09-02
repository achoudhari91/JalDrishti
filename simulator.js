/* ==========================================================================
   JALDRISHTI - SPECTRAL SENSOR & AI CLASSIFIER SIMULATOR
   Interactive Chart.js optical absorbance graph across 380nm - 940nm.
   Light Theme Enhanced with Crisp Data Curves and Readouts.
   ========================================================================== */

(function initSpectralSimulator() {
  const ctx = document.getElementById('spectralChart');
  if (!ctx) return;

  // Wavelength spectrum labels (380nm to 940nm)
  const wavelengths = ['380nm', '410nm', '470nm', '520nm', '590nm', '660nm', '730nm', '850nm', '940nm'];

  // Absorbance Profile Presets
  const sampleProfiles = {
    mulch: {
      label: 'Microplastic Mulch Film (LDPE)',
      borderColor: '#e11d48',
      backgroundColor: 'rgba(225, 29, 72, 0.12)',
      data: [0.35, 0.78, 0.42, 0.38, 0.45, 0.52, 0.68, 0.92, 0.84],
      confidence: '97.8% Confidence',
      status: 'CRITICAL HAZARD',
      statusColor: '#e11d48',
      polymer: 'Low-Density Polyethylene (LDPE Film Shreds)',
      hazard: 'Severe Microplastic Density (>840 fragments/L carrying toxic plasticizer additives)',
      action: 'Alert dispatched to Sirhind Canal Division. Deploy physical floating skimmer net at Lock #4.'
    },
    stubble: {
      label: 'Stubble Burn Ash (PAH Residue)',
      borderColor: '#d97706',
      backgroundColor: 'rgba(217, 119, 6, 0.12)',
      data: [0.94, 0.82, 0.65, 0.48, 0.35, 0.88, 0.54, 0.32, 0.22],
      confidence: '94.2% Confidence',
      status: 'HIGH TOXICITY ASH',
      statusColor: '#d97706',
      polymer: 'Polycyclic Aromatic Hydrocarbons (PAH) + Fine Carbon Ash',
      hazard: 'Elevated Carcinogenic Ash Concentration from upstream rice paddy burning washed into canal',
      action: 'Notify Municipal Drinking Water Intake. Divert raw intake to secondary sedimentation basin.'
    },
    pesticide: {
      label: 'Pesticide Container Runoff',
      borderColor: '#0284c7',
      backgroundColor: 'rgba(2, 132, 199, 0.12)',
      data: [0.45, 0.52, 0.88, 0.96, 0.72, 0.41, 0.84, 0.45, 0.38],
      confidence: '91.5% Confidence',
      status: 'CHEMICAL RUNOFF',
      statusColor: '#0284c7',
      polymer: 'Organophosphate Residue + HDPE Container Micro-shreds',
      hazard: 'Acute agrochemical surge exceeding CPCB Class-B aquatic life safety threshold',
      action: 'Issue advisory to downstream aquaculture farms. Trigger automated water sample grabber.'
    },
    clean: {
      label: 'Clean Canal Water Baseline',
      borderColor: '#059669',
      backgroundColor: 'rgba(5, 150, 105, 0.12)',
      data: [0.08, 0.10, 0.12, 0.09, 0.11, 0.10, 0.08, 0.07, 0.06],
      confidence: '99.1% Confidence',
      status: 'SAFE / OPTIMAL',
      statusColor: '#059669',
      polymer: 'Standard Natural Canal Silt Baseline',
      hazard: 'Zero hazardous agricultural microplastics or stubble ash detected',
      action: 'Canal water quality compliant with Jal Shakti standards. Regular autonomous vessel sweep continues.'
    }
  };

  // Initialize Chart.js Chart in Light Theme
  const spectralChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: wavelengths,
      datasets: [{
        label: sampleProfiles.mulch.label,
        data: sampleProfiles.mulch.data,
        borderColor: sampleProfiles.mulch.borderColor,
        backgroundColor: sampleProfiles.mulch.backgroundColor,
        borderWidth: 3,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: sampleProfiles.mulch.borderColor,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: { 
            color: '#0f172a', 
            font: { family: 'Inter', size: 13, weight: '600' },
            boxWidth: 14,
            boxHeight: 14,
            usePointStyle: true
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleFont: { family: 'Outfit', size: 13 },
          bodyFont: { family: 'Inter', size: 12 },
          padding: 10,
          callbacks: {
            label: function(context) {
              return ` Optical Absorbance (AU): ${context.parsed.y}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(226, 232, 240, 0.8)' },
          ticks: { color: '#475569', font: { family: 'Inter', weight: '500' } }
        },
        y: {
          min: 0,
          max: 1.1,
          grid: { color: 'rgba(226, 232, 240, 0.8)' },
          ticks: { color: '#475569', font: { family: 'Inter', weight: '500' } },
          title: { display: true, text: 'Optical Absorbance (AU)', color: '#0f172a', font: { family: 'Inter', weight: '700' } }
        }
      }
    }
  });

  // Switch Sample Button Handlers
  const sampleBtns = document.querySelectorAll('.sample-btn');
  sampleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sampleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const sampleKey = btn.dataset.sample;
      const profile = sampleProfiles[sampleKey];
      if (!profile) return;

      // Update Chart Dataset
      spectralChart.data.datasets[0].label = profile.label;
      spectralChart.data.datasets[0].data = profile.data;
      spectralChart.data.datasets[0].borderColor = profile.borderColor;
      spectralChart.data.datasets[0].backgroundColor = profile.backgroundColor;
      spectralChart.data.datasets[0].pointBackgroundColor = profile.borderColor;
      spectralChart.update();

      // Update Readout Panel
      const confBadge = document.getElementById('sim-confidence');
      if (confBadge) {
        confBadge.textContent = profile.confidence;
        confBadge.className = sampleKey === 'clean' ? 'confidence-badge confidence-safe' : 'confidence-badge confidence-danger';
      }
      
      const statusEl = document.getElementById('sim-status');
      if (statusEl) {
        statusEl.textContent = profile.status;
        statusEl.style.color = profile.statusColor;
      }

      const polyEl = document.getElementById('sim-polymer');
      if (polyEl) polyEl.textContent = profile.polymer;

      const hazEl = document.getElementById('sim-hazard');
      if (hazEl) hazEl.textContent = profile.hazard;

      const recEl = document.getElementById('sim-rec');
      if (recEl) recEl.textContent = profile.action;
    });
  });
})();
