/* ==========================================================================
   JALDRISHTI - APPLICATION CONTROLLER (TICKER, CALCULATOR & NAVIGATION)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Live System Status Ticker Animation
  const ticker = document.getElementById('live-system-ticker');
  const tickerMessages = [
    'SYSTEM STATUS: 18 Autonomous JalDrishti Rovers Online • Sentinel-2 Orbit Pass Synchronized',
    'WATER REALITY: 890 microplastic fragments/L detected in Sirhind Feeder Canal (Lock #4)',
    'SOURCE IDENTIFIED: Upstream paddy burn ash plume traced to Firozpur Cluster 14B',
    'EARLY WARNING: Automated intake advisory triggered for downstream drinking reservoirs',
    'OPEN DATA API: CPCB Class-B GeoJSON feed live • 0.03s latency'
  ];

  let tickerIndex = 0;
  if (ticker) {
    setInterval(() => {
      tickerIndex = (tickerIndex + 1) % tickerMessages.length;
      ticker.style.opacity = '0';
      setTimeout(() => {
        ticker.textContent = tickerMessages[tickerIndex];
        ticker.style.opacity = '1';
      }, 300);
    }, 5000);
  }

  // 2. Regional Cost & Impact Calculator Logic
  const kmSlider = document.getElementById('km-slider');
  const kmDisplay = document.getElementById('km-display');
  const plasticRemovedDisplay = document.getElementById('plastic-removed-display');
  const savingsDisplay = document.getElementById('savings-display');
  const nodeCountDisplay = document.getElementById('node-count-display');

  if (kmSlider) {
    kmSlider.addEventListener('input', (e) => {
      const km = parseInt(e.target.value, 10);
      kmDisplay.textContent = `${km} km`;

      // Calculation formulas
      const nodesNeeded = Math.ceil(km / 12);
      const plasticKg = Math.round(km * 48); // ~48 kg microplastics filtered per km annually
      const commercialCost = nodesNeeded * 800000;
      const jalDrishtiCost = nodesNeeded * 4500;
      const savingsLakhs = Math.round((commercialCost - jalDrishtiCost) / 100000);

      nodeCountDisplay.textContent = `${nodesNeeded} JalDrishti Rovers`;
      plasticRemovedDisplay.textContent = `${plasticKg.toLocaleString()} kg/yr`;
      savingsDisplay.textContent = `₹${savingsLakhs} Lakhs Saved`;
    });
  }

  // 3. Highlight Active Nav Item on Scroll
  const sections = document.querySelectorAll('section, header');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (window.scrollY >= (sectionTop - 150)) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
});
