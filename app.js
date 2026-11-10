/**
 * Smart Ambulance Routing - AI-Based Emergency Hospital Selection & Routing
 * Project by: Monika.R.K, Sahana.S, Rubini.P, Nigidha.B
 * Institution: J.J. College of Engineering and Technology (Sowdambikaa Group of Institutions)
 */

// Global State
const state = {
  activeTab: 'dispatch',
  trafficMode: 'moderate', // 'light', 'moderate', 'heavy'
  selectedBloodGroup: 'O+',
  emergencyCase: 'accident',
  priority: 'critical',
  isAudioEnabled: true,
  timerSeconds: 480, // 8 minutes
  timerInterval: null,
  isDriving: false,
  driveAnimationId: null,
  selectedHospitalId: 'hosp-b', // Default to AI Recommended optimal hospital
  routesData: {}, // Cache of computed routes: { [id]: { coords, distanceKm, travelTimeMin, isLiveApi } }
  routeLayers: {}, // Map of hospitalId -> { line, bufferLine }
  weights: {
    facility: 25,
    bed: 20,
    specialist: 15,
    equipment: 15,
    blood: 10,
    travel: 10,
    traffic: 5
  }
};

// Hospital Database (Modeled on Slide 7 & Real-world scenario in Tiruchirappalli)
const hospitalsData = [
  {
    id: 'hosp-b',
    name: 'Hospital B (Kaveri Super Specialty Medical Center)',
    shortName: 'Hospital B',
    isBestChoice: true,
    lat: 10.8250,
    lng: 78.6850,
    distanceKm: 0, // Dynamically calculated
    baseTravelTimeMin: 0, // Dynamically calculated
    rating: '⭐ 4.9 Super Specialty',
    beds: {
      icuTotal: 24,
      icuAvailable: 6,
      emergencyAvailable: 10
    },
    specialists: {
      accident: 'Dr. R. Monika (Trauma Surgeon - ON DUTY)',
      cardiac: 'Dr. S. Sahana (Chief Cardiologist - ON DUTY)',
      stroke: 'Dr. P. Rubini (Senior Neurologist - ON DUTY)',
      burn: 'Dr. B. Nigidha (Plastic/Burn Specialist - ON DUTY)',
      respiratory: 'Dr. K. Anand (Pulmonologist - ON DUTY)'
    },
    equipment: {
      ctScan: true,
      mri: true,
      cathLab: true,
      ventilators: 8,
      otAvailable: true
    },
    bloodStock: {
      'O+': 18, 'O-': 6, 'A+': 14, 'A-': 4,
      'B+': 12, 'B-': 3, 'AB+': 8, 'AB-': 2
    },
    readinessRaw: {
      facility: 96,
      bed: 92,
      specialist: 100,
      equipment: 95,
      blood: 90,
      travel: 80,
      traffic: 85
    }
  },
  {
    id: 'hosp-a',
    name: 'Hospital A (Trichy Metro Emergency Care)',
    shortName: 'Hospital A',
    isBestChoice: false,
    lat: 10.8020,
    lng: 78.6950,
    distanceKm: 0, // Dynamically calculated
    baseTravelTimeMin: 0, // Dynamically calculated
    rating: '3.8 Community Clinic',
    beds: {
      icuTotal: 6,
      icuAvailable: 0, // CRITICAL: ICU FULL!
      emergencyAvailable: 2
    },
    specialists: {
      accident: 'General MO Only (No Neuro/Trauma Specialist)',
      cardiac: 'Cardiologist On Leave',
      stroke: 'No Neurologist Available',
      burn: 'No Burn Unit',
      respiratory: 'General Physician'
    },
    equipment: {
      ctScan: false, // Under Maintenance
      mri: false,
      cathLab: false,
      ventilators: 1,
      otAvailable: false
    },
    bloodStock: {
      'O+': 2, 'O-': 0, 'A+': 3, 'A-': 0,
      'B+': 1, 'B-': 0, 'AB+': 0, 'AB-': 0
    },
    readinessRaw: {
      facility: 60,
      bed: 40,
      specialist: 50,
      equipment: 55,
      blood: 40,
      travel: 98,
      traffic: 70
    }
  },
  {
    id: 'hosp-c',
    name: 'Hospital C (Apollo Apex Care Hospital)',
    shortName: 'Hospital C',
    isBestChoice: false,
    lat: 10.7600,
    lng: 78.7200,
    distanceKm: 0, // Dynamically calculated
    baseTravelTimeMin: 0, // Dynamically calculated
    rating: '4.6 Multi-Specialty',
    beds: {
      icuTotal: 30,
      icuAvailable: 4,
      emergencyAvailable: 5
    },
    specialists: {
      accident: 'Trauma Team Available',
      cardiac: 'Cardiologist Available',
      stroke: 'Neurologist on Call (30 min)',
      burn: 'Burn Ward Partial',
      respiratory: 'Pulmonologist Available'
    },
    equipment: {
      ctScan: true,
      mri: true,
      cathLab: true,
      ventilators: 5,
      otAvailable: true
    },
    bloodStock: {
      'O+': 9, 'O-': 2, 'A+': 8, 'A-': 2,
      'B+': 7, 'B-': 1, 'AB+': 5, 'AB-': 1
    },
    readinessRaw: {
      facility: 88,
      bed: 80,
      specialist: 75,
      equipment: 85,
      blood: 75,
      travel: 55,
      traffic: 60
    }
  }
];

// Blood Banks Database (Slide 8)
const bloodBanksData = [
  {
    id: 'bb-1',
    name: 'Kaveri Hospital Central Blood Depot',
    location: 'Cantonment, Tiruchirappalli',
    lat: 10.8240,
    lng: 78.6860,
    distanceKm: 6.1,
    travelTimeMin: 12,
    stock: { 'O+': 24, 'O-': 8, 'A+': 18, 'A-': 5, 'B+': 16, 'B-': 4, 'AB+': 10, 'AB-': 3 },
    contact: '+91 431 2400010'
  },
  {
    id: 'bb-2',
    name: 'Trichy District Red Cross Blood Center',
    location: 'Thillai Nagar, Tiruchirappalli',
    lat: 10.8100,
    lng: 78.6980,
    distanceKm: 4.1,
    travelTimeMin: 9,
    stock: { 'O+': 14, 'O-': 3, 'A+': 12, 'A-': 2, 'B+': 10, 'B-': 2, 'AB+': 6, 'AB-': 1 },
    contact: '+91 431 2760542'
  },
  {
    id: 'bb-3',
    name: 'Apollo Apex Regional Blood Bank',
    location: 'Old Thanjavur Rd, Tiruchirappalli',
    lat: 10.7620,
    lng: 78.7180,
    distanceKm: 9.3,
    travelTimeMin: 18,
    stock: { 'O+': 8, 'O-': 1, 'A+': 9, 'A-': 1, 'B+': 7, 'B-': 1, 'AB+': 4, 'AB-': 0 },
    contact: '+91 431 2689900'
  },
  {
    id: 'bb-4',
    name: 'City Lifeline Emergency Blood Bank',
    location: 'Near Metro Junction, Trichy',
    lat: 10.8030,
    lng: 78.6940,
    distanceKm: 3.1,
    travelTimeMin: 7,
    stock: { 'O+': 0, 'O-': 0, 'A+': 2, 'A-': 0, 'B+': 1, 'B-': 0, 'AB+': 0, 'AB-': 0 },
    contact: '+91 431 2415522'
  }
];

// Leaflet Map & Markers Variables
let map = null;
let ambulanceMarker = null;
let hospitalMarkers = [];

// Waypoints for Ambulance Starting Point (Accident Location)
const ambulanceStartCoords = [10.7905, 78.6900];

// Fallback high-resolution road waypoints for each hospital (used if OSRM API is blocked/offline)
const fallbackRouteCoords = {
  'hosp-a': [
    [10.7905, 78.6900],
    [10.7940, 78.6920],
    [10.7980, 78.6935],
    [10.8020, 78.6950]
  ],
  'hosp-b': [
    [10.7905, 78.6900],
    [10.7940, 78.6920],
    [10.8010, 78.6945],
    [10.8080, 78.6910],
    [10.8140, 78.6880],
    [10.8200, 78.6860],
    [10.8250, 78.6850]
  ],
  'hosp-c': [
    [10.7905, 78.6900],
    [10.7850, 78.6950],
    [10.7800, 78.7050],
    [10.7720, 78.7120],
    [10.7600, 78.7200]
  ]
};

// Web Audio API Synth for Emergency Pre-Alert Siren
let audioCtx = null;
function playAlertChime() {
  if (!state.isAudioEnabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    const now = audioCtx.currentTime;

    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1174, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.55);
  } catch (e) {
    console.warn("Audio Context not allowed without interaction", e);
  }
}

// ==========================================
// MATHEMATICAL DISTANCE & ETA CALCULATORS
// (NO dummy or hardcoded values!)
// ==========================================
function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculatePathDistanceKm(coords) {
  let totalDist = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    totalDist += calculateHaversineDistanceKm(coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1]);
  }
  // Realistic urban road tortuosity/turn multiplier (1.20)
  return totalDist * 1.20;
}

// ==========================================
// ASYNCHRONOUS OSRM ROUTE FETCHING & CACHING
// ==========================================
async function fetchOrCalculateRoute(hospitalId) {
  const hosp = hospitalsData.find(h => h.id === hospitalId);
  if (!hosp) return null;

  // Check in-memory cache
  if (state.routesData[hospitalId]) {
    // Recalculate duration if traffic mode changed
    const cached = state.routesData[hospitalId];
    let trafficFactor = 1.0;
    if (state.trafficMode === 'light') trafficFactor = 0.8;
    if (state.trafficMode === 'heavy') trafficFactor = 1.5;
    cached.travelTimeMin = Math.max(2, Math.round(cached.baseDurationMin * trafficFactor));
    return cached;
  }

  const startLng = ambulanceStartCoords[1];
  const startLat = ambulanceStartCoords[0];
  const endLng = hosp.lng;
  const endLat = hosp.lat;

  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const primaryRoute = data.routes[0];
      const latLngs = primaryRoute.geometry.coordinates.map(c => [c[1], c[0]]);
      const distanceKm = Number((primaryRoute.distance / 1000).toFixed(2));
      const baseDurationMin = Math.round(primaryRoute.duration / 60);

      let trafficFactor = 1.0;
      if (state.trafficMode === 'light') trafficFactor = 0.8;
      if (state.trafficMode === 'heavy') trafficFactor = 1.5;
      const travelTimeMin = Math.max(2, Math.round(baseDurationMin * trafficFactor));

      state.routesData[hospitalId] = {
        coords: latLngs,
        distanceKm: distanceKm,
        baseDurationMin: baseDurationMin,
        travelTimeMin: travelTimeMin,
        isLiveApi: true
      };

      updateApiStatusBadge(true);
      return state.routesData[hospitalId];
    } else {
      throw new Error("No routes found in OSRM response");
    }
  } catch (err) {
    console.warn(`[Route Routing API] Fallback to geodetic model for ${hospitalId}:`, err.message);
    updateApiStatusBadge(false);

    // Geodesic fallback calculation
    const fallbackCoords = fallbackRouteCoords[hospitalId] || [ambulanceStartCoords, [hosp.lat, hosp.lng]];
    const distanceKm = Number(calculatePathDistanceKm(fallbackCoords).toFixed(2));

    let speedKmh = 45;
    if (state.trafficMode === 'light') speedKmh = 55;
    if (state.trafficMode === 'heavy') speedKmh = 25;

    const baseDurationMin = Math.round((distanceKm / 45) * 60);
    const travelTimeMin = Math.max(2, Math.round((distanceKm / speedKmh) * 60));

    state.routesData[hospitalId] = {
      coords: fallbackCoords,
      distanceKm: distanceKm,
      baseDurationMin: baseDurationMin,
      travelTimeMin: travelTimeMin,
      isLiveApi: false
    };

    return state.routesData[hospitalId];
  }
}

function updateApiStatusBadge(isOnline) {
  const badge = document.getElementById('route-routing-api-status');
  if (!badge) return;

  if (isOnline) {
    badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span><span>OSRM Live Routing</span>`;
    badge.className = "text-[10px] px-2 py-0.5 rounded bg-slate-700 text-emerald-400 font-mono flex items-center";
  } else {
    badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5"></span><span>Geodetic Physics Routing</span>`;
    badge.className = "text-[10px] px-2 py-0.5 rounded bg-slate-700 text-amber-300 font-mono flex items-center";
  }
}

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  initMap();
  renderBloodFilterButtons();
  renderBloodBankTable();
  startPreAlertTimer();

  // Pre-calculate routes and initialize AI scoring with real distance & ETA
  await initAllRoutes();
  runAIScoring();
  
  // Select default AI winner route (Hospital B)
  selectRoute('hosp-b');
});

// ==========================================
// TAB SWITCHING
// ==========================================
function switchTab(tabId) {
  state.activeTab = tabId;

  document.querySelectorAll('.tab-pane').forEach(el => {
    el.classList.add('hidden');
    el.classList.remove('block');
  });
  const targetPane = document.getElementById(`tab-${tabId}`);
  if (targetPane) {
    targetPane.classList.remove('hidden');
    targetPane.classList.add('block');
  }

  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.classList.remove('active-tab');
    btn.classList.add('text-slate-600');
  });
  const currentBtn = document.getElementById(`tab-btn-${tabId}`);
  if (currentBtn) {
    currentBtn.classList.add('active-tab');
    currentBtn.classList.remove('text-slate-600');
  }

  if (tabId === 'dispatch' && map) {
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }

  if (tabId === 'prealert') {
    playAlertChime();
  }
}

// ==========================================
// LEAFLET MAP & INTERACTIVE ROUTE INITIALIZATION
// ==========================================
function initMap() {
  const mapElement = document.getElementById('map');
  if (!mapElement) return;

  map = L.map('map', {
    zoomControl: true,
    attributionControl: false
  }).setView([10.8050, 78.6950], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(map);

  const ambulanceIcon = L.divIcon({
    className: 'leaflet-div-icon',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="pulse-ring bg-red-500"></div>
        <div class="custom-marker w-10 h-10 bg-red-600 text-white border-2 border-white shadow-lg">
          <i class="fa-solid fa-truck-medical text-sm"></i>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });

  const hospitalIconB = L.divIcon({
    className: 'leaflet-div-icon',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="pulse-ring bg-emerald-500"></div>
        <div class="custom-marker w-11 h-11 bg-emerald-600 text-white border-2 border-white shadow-lg route-clickable">
          <i class="fa-solid fa-hospital text-base"></i>
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });

  const hospitalIconGeneral = (color, text) => L.divIcon({
    className: 'leaflet-div-icon',
    html: `
      <div class="custom-marker w-8 h-8 ${color} text-white border-2 border-white shadow-md route-clickable">
        <span class="text-xs font-bold">${text}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  // Add Ambulance Marker
  ambulanceMarker = L.marker(ambulanceStartCoords, { icon: ambulanceIcon, zIndexOffset: 1000 }).addTo(map);
  ambulanceMarker.bindPopup(`
    <div class="text-xs font-sans">
      <strong class="text-red-600 font-bold block text-sm">🚨 AMBULANCE #108-TN</strong>
      <span class="text-slate-600">Location: Collectorate Roundabout, Trichy</span>
      <div class="mt-1 font-semibold text-slate-800">Status: Ready for Emergency Dispatch</div>
    </div>
  `);

  // Add Hospital Markers with interactive route selection on click
  hospitalsData.forEach(hosp => {
    const icon = hosp.isBestChoice ? hospitalIconB : hospitalIconGeneral(hosp.id === 'hosp-a' ? 'bg-amber-500' : 'bg-blue-600', hosp.shortName.slice(-1));
    const marker = L.marker([hosp.lat, hosp.lng], { icon: icon }).addTo(map);

    marker.on('click', () => {
      selectRoute(hosp.id);
    });

    marker.bindPopup(`
      <div class="text-xs font-sans space-y-1">
        <div class="flex items-center justify-between gap-2">
          <strong class="font-bold text-slate-900">${hosp.name}</strong>
          ${hosp.isBestChoice ? '<span class="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[10px]">AI MATCH 92%</span>' : ''}
        </div>
        <p class="text-slate-600" id="popup-dist-${hosp.id}">Calculating road distance...</p>
        <p class="text-slate-700 font-medium">ICU Beds: ${hosp.beds.icuAvailable} of ${hosp.beds.icuTotal} available</p>
        <button onclick="selectRoute('${hosp.id}')" class="mt-2 w-full py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded transition shadow-xs">
          Select This Route
        </button>
      </div>
    `);
    hospitalMarkers.push(marker);
  });
}

// Calculate and draw all routes on the map with click handlers
async function initAllRoutes() {
  // Clear previous layers
  Object.values(state.routeLayers).forEach(layerObj => {
    if (layerObj.line) map.removeLayer(layerObj.line);
    if (layerObj.bufferLine) map.removeLayer(layerObj.bufferLine);
  });
  state.routeLayers = {};

  const routeColors = {
    'hosp-a': '#f59e0b', // Amber
    'hosp-b': '#10b981', // Emerald
    'hosp-c': '#3b82f6'  // Blue
  };

  for (const hosp of hospitalsData) {
    const route = await fetchOrCalculateRoute(hosp.id);
    if (!route) continue;

    hosp.distanceKm = route.distanceKm;
    hosp.baseTravelTimeMin = route.travelTimeMin;

    // Invisible thick buffer line for effortless clicking/touch
    const bufferLine = L.polyline(route.coords, {
      color: '#000000',
      weight: 24,
      opacity: 0.0001,
      interactive: true,
      className: 'route-clickable'
    }).addTo(map);

    // Visible styled polyline
    const line = L.polyline(route.coords, {
      color: routeColors[hosp.id] || '#64748b',
      weight: hosp.id === state.selectedHospitalId ? 7 : 4,
      opacity: hosp.id === state.selectedHospitalId ? 1.0 : 0.55,
      dashArray: hosp.id === state.selectedHospitalId ? null : '5, 8',
      interactive: true,
      className: 'route-clickable'
    }).addTo(map);

    const tooltipContent = `<strong>${hosp.shortName}</strong>: ${route.distanceKm} km (${route.travelTimeMin} min)<br><span class="text-[10px] text-blue-300">Click to select route</span>`;
    line.bindTooltip(tooltipContent, { sticky: true });
    bufferLine.bindTooltip(tooltipContent, { sticky: true });

    // Click handler on both visible and buffer line
    const handleClick = () => {
      selectRoute(hosp.id);
    };
    line.on('click', handleClick);
    bufferLine.on('click', handleClick);

    line.on('mouseover', () => {
      if (hosp.id !== state.selectedHospitalId) {
        line.setStyle({ weight: 6, opacity: 0.9 });
      }
    });

    line.on('mouseout', () => {
      if (hosp.id !== state.selectedHospitalId) {
        line.setStyle({ weight: 4, opacity: 0.55 });
      }
    });

    state.routeLayers[hosp.id] = { line, bufferLine, color: routeColors[hosp.id] };

    // Update popup distance text if open
    const popupDist = document.getElementById(`popup-dist-${hosp.id}`);
    if (popupDist) {
      popupDist.textContent = `Road Distance: ${route.distanceKm} km | ETA: ${route.travelTimeMin} min`;
    }
  }
}

// ==========================================
// ROUTE SELECTION WORKFLOW
// ==========================================
async function selectRoute(hospitalId) {
  state.selectedHospitalId = hospitalId;
  const hosp = hospitalsData.find(h => h.id === hospitalId);
  if (!hosp) return;

  const route = await fetchOrCalculateRoute(hospitalId);
  if (!route) return;

  // Highlight selected route on map
  highlightRouteOnMap(hospitalId);

  // Update Navigation HUD with real distance and ETA
  const navDest = document.getElementById('nav-hud-destination');
  const navDist = document.getElementById('nav-hud-distance');
  const navEta = document.getElementById('nav-hud-eta');
  const statusEl = document.getElementById('route-selection-status');

  if (navDest) {
    navDest.textContent = `${hosp.shortName} (${hosp.finalScore || 90}%)`;
    navDest.className = hosp.isBestChoice ? "font-bold text-emerald-600 truncate block" : "font-bold text-blue-600 truncate block";
  }
  if (navDist) navDist.textContent = `${route.distanceKm} km`;
  if (navEta) navEta.textContent = `${route.travelTimeMin} mins`;

  if (statusEl) {
    statusEl.innerHTML = `<span class="text-emerald-400 font-bold">${hosp.name}</span> <span class="text-slate-300 font-mono text-[11px]">(${route.distanceKm} km • ETA: ${route.travelTimeMin} mins)</span>`;
    statusEl.className = "font-bold text-emerald-400";
  }

  // Highlight hospital ranking card
  highlightSelectedHospitalCard(hospitalId);

  // Update Pre-Alert HUD
  updatePreAlertHUD(hosp);
}

// Highlight the active route polyline and dim others
function highlightRouteOnMap(selectedId) {
  Object.keys(state.routeLayers).forEach(id => {
    const layerObj = state.routeLayers[id];
    if (!layerObj || !layerObj.line) return;

    if (id === selectedId) {
      layerObj.line.setStyle({
        color: layerObj.color,
        weight: 7,
        opacity: 1.0,
        dashArray: null
      });
      layerObj.line.bringToFront();
    } else {
      layerObj.line.setStyle({
        color: '#64748b',
        weight: 3,
        opacity: 0.35,
        dashArray: '5, 8'
      });
    }
  });

  if (ambulanceMarker) {
    ambulanceMarker.bringToFront();
  }
}

// Clear route selection
function clearRouteSelection() {
  state.selectedHospitalId = null;

  // Reset route lines to neutral
  Object.keys(state.routeLayers).forEach(id => {
    const layerObj = state.routeLayers[id];
    if (layerObj && layerObj.line) {
      layerObj.line.setStyle({
        color: layerObj.color,
        weight: 4,
        opacity: 0.6,
        dashArray: '5, 8'
      });
    }
  });

  // Reset status bar
  const statusEl = document.getElementById('route-selection-status');
  if (statusEl) {
    statusEl.textContent = "No route selected";
    statusEl.className = "font-bold text-slate-400";
  }

  // Reset HUD
  const navDest = document.getElementById('nav-hud-destination');
  const navDist = document.getElementById('nav-hud-distance');
  const navEta = document.getElementById('nav-hud-eta');

  if (navDest) navDest.textContent = "No route selected";
  if (navDist) navDist.textContent = "--";
  if (navEta) navEta.textContent = "--";

  // Remove card highlights
  document.querySelectorAll('.hospital-card').forEach(card => {
    card.classList.remove('route-active-card');
  });
}

function highlightSelectedHospitalCard(hospitalId) {
  document.querySelectorAll('.hospital-card').forEach(card => {
    const cardId = card.getAttribute('data-hosp-id');
    if (cardId === hospitalId) {
      card.classList.add('route-active-card');
    } else {
      card.classList.remove('route-active-card');
    }
  });
}

// ==========================================
// START EMERGENCY ACTION WORKFLOW
// ==========================================
async function startEmergency() {
  // Check if route is selected
  if (!state.selectedHospitalId) {
    const statusEl = document.getElementById('route-selection-status');
    if (statusEl) {
      statusEl.innerHTML = `⚠️ <span class="text-rose-400 font-bold">No route selected. Please click a hospital or route line on the map.</span>`;
      statusEl.className = "font-bold text-rose-400";
    }
    alert("⚠️ No route selected!\n\nPlease select a hospital or click any route on the map before starting emergency.");
    return;
  }

  const hospitalId = state.selectedHospitalId;
  const hosp = hospitalsData.find(h => h.id === hospitalId);
  const route = await fetchOrCalculateRoute(hospitalId);

  if (!route) {
    alert("Could not compute route coordinates. Please check connection and try again.");
    return;
  }

  // Ensure route is highlighted
  highlightRouteOnMap(hospitalId);

  // Update distance and ETA
  const navDist = document.getElementById('nav-hud-distance');
  const navEta = document.getElementById('nav-hud-eta');
  if (navDist) navDist.textContent = `${route.distanceKm} km`;
  if (navEta) navEta.textContent = `${route.travelTimeMin} mins`;

  // Start animated transit along route coordinates
  startAmbulanceAnimation(route.coords, hosp);
}

// Alias for backward compatibility
function startAmbulanceAnimation(customCoords, customHosp) {
  if (state.isDriving || !map || !ambulanceMarker) return;

  const targetHosp = customHosp || hospitalsData.find(h => h.id === state.selectedHospitalId) || hospitalsData[0];
  const waypoints = customCoords || (state.routesData[targetHosp.id]?.coords) || fallbackRouteCoords[targetHosp.id];

  if (!waypoints || waypoints.length === 0) {
    alert("No route coordinates available to drive.");
    return;
  }

  state.isDriving = true;
  switchTab('dispatch');
  playAlertChime();

  const statusEl = document.getElementById('route-selection-status');
  if (statusEl) {
    statusEl.innerHTML = `🚑 <span class="text-yellow-400 animate-pulse font-bold">Ambulance Dispatched! En route to ${targetHosp.shortName}...</span>`;
  }

  let step = 0;
  const totalSteps = waypoints.length;
  // Animation duration around ~6 seconds
  const intervalMs = Math.max(80, Math.floor(6000 / totalSteps));

  const interval = setInterval(() => {
    if (step < totalSteps) {
      const coord = waypoints[step];
      ambulanceMarker.setLatLng(coord);

      if (step % 2 === 0) {
        map.panTo(coord, { animate: true, duration: 0.25 });
      }

      // Live countdown of distance and ETA
      const remainingRatio = (totalSteps - step) / totalSteps;
      const currentDist = (targetHosp.distanceKm * remainingRatio).toFixed(1);
      const currentEta = Math.max(1, Math.round(targetHosp.baseTravelTimeMin * remainingRatio));

      const navDist = document.getElementById('nav-hud-distance');
      const navEta = document.getElementById('nav-hud-eta');
      if (navDist) navDist.textContent = `${currentDist} km`;
      if (navEta) navEta.textContent = `${currentEta} mins`;

      step++;
    } else {
      clearInterval(interval);
      state.isDriving = false;

      if (typeof confetti === 'function') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      if (statusEl) {
        statusEl.innerHTML = `✅ <span class="text-emerald-400 font-bold">Ambulance Arrived safely at ${targetHosp.name}!</span>`;
      }

      ambulanceMarker.bindPopup(`
        <div class="text-xs font-sans">
          <strong class="text-emerald-600 font-bold block text-sm">✅ ARRIVED AT ${targetHosp.shortName.toUpperCase()}</strong>
          <span class="text-slate-700">ICU Bed & Trauma Specialists Standing By!</span>
        </div>
      `).openPopup();
    }
  }, intervalMs);
}

// ==========================================
// AI SCORING ENGINE (Slide 7 & 6)
// ==========================================
function runAIScoring() {
  const emergencyType = document.getElementById('select-emergency-type')?.value || state.emergencyCase;
  const bloodGroup = document.getElementById('select-blood-group')?.value || state.selectedBloodGroup;
  const priority = document.getElementById('select-priority')?.value || state.priority;

  state.emergencyCase = emergencyType;
  state.selectedBloodGroup = bloodGroup;
  state.priority = priority;

  const reqIcu = document.getElementById('req-icu')?.checked ?? true;
  const reqSpecialist = document.getElementById('req-specialist')?.checked ?? true;
  const reqCtScan = document.getElementById('req-ctscan')?.checked ?? true;
  const reqBlood = document.getElementById('req-blood')?.checked ?? true;

  const totalWeight = Object.values(state.weights).reduce((a, b) => a + b, 0);

  const scoredHospitals = hospitalsData.map(hosp => {
    let fScore = hosp.readinessRaw.facility;
    let bScore = hosp.readinessRaw.bed;
    let sScore = hosp.readinessRaw.specialist;
    let eScore = hosp.readinessRaw.equipment;
    let blScore = hosp.readinessRaw.blood;
    let tScore = hosp.readinessRaw.travel;
    let trScore = hosp.readinessRaw.traffic;

    if (reqIcu && hosp.beds.icuAvailable === 0) {
      bScore = 10;
    }

    if (reqSpecialist && hosp.id === 'hosp-a') {
      sScore = 20;
    }

    if (reqCtScan && !hosp.equipment.ctScan) {
      eScore = 25;
    }

    const availableUnits = hosp.bloodStock[bloodGroup] || 0;
    if (reqBlood) {
      if (availableUnits >= 5) blScore = 100;
      else if (availableUnits > 0) blScore = 50;
      else blScore = 5;
    }

    if (state.trafficMode === 'heavy') {
      trScore = Math.max(10, trScore - 30);
      tScore = Math.max(10, tScore - 20);
    } else if (state.trafficMode === 'light') {
      trScore = Math.min(100, trScore + 15);
      tScore = Math.min(100, tScore + 10);
    }

    const weightedSum = (
      (fScore * state.weights.facility) +
      (bScore * state.weights.bed) +
      (sScore * state.weights.specialist) +
      (eScore * state.weights.equipment) +
      (blScore * state.weights.blood) +
      (tScore * state.weights.travel) +
      (trScore * state.weights.traffic)
    );

    const finalScore = Math.round((weightedSum / totalWeight));

    return {
      ...hosp,
      finalScore: finalScore,
      factors: { fScore, bScore, sScore, eScore, blScore, tScore, trScore }
    };
  });

  scoredHospitals.sort((a, b) => b.finalScore - a.finalScore);

  renderHospitalRankingCards(scoredHospitals);
  renderDetailedScoreTable(scoredHospitals);

  // If selected hospital is defined, update HUD with it, else use top hospital
  const currentHospital = scoredHospitals.find(h => h.id === state.selectedHospitalId) || scoredHospitals[0];
  updatePreAlertHUD(currentHospital);
}

// Render Hospital Cards with interactive click selection
function renderHospitalRankingCards(hospitals) {
  const container = document.getElementById('hospital-ranking-cards');
  if (!container) return;

  container.innerHTML = hospitals.map((hosp, index) => {
    const isWinner = index === 0;
    const isSelected = hosp.id === state.selectedHospitalId;
    const badgeColor = isWinner 
      ? 'bg-emerald-500 text-white' 
      : (hosp.finalScore >= 70 ? 'bg-blue-600 text-white' : 'bg-amber-500 text-white');

    const cardBorder = isSelected
      ? 'border-2 border-emerald-500 bg-emerald-50/30 shadow-md ring-2 ring-emerald-200 route-active-card'
      : (isWinner 
          ? 'border-2 border-emerald-400/60 bg-emerald-50/10 shadow-sm' 
          : 'border border-slate-200 bg-white hover:border-blue-300');

    return `
      <div onclick="selectRoute('${hosp.id}')" data-hosp-id="${hosp.id}" class="hospital-card p-4 rounded-xl ${cardBorder} transition-all cursor-pointer">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <span class="w-6 h-6 rounded-full ${badgeColor} text-xs font-bold flex items-center justify-center">
              ${index + 1}
            </span>
            <h4 class="font-bold text-slate-900 text-sm">${hosp.shortName}</h4>
            ${isWinner ? '<span class="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wide">⭐ AI Best Choice</span>' : ''}
            ${isSelected ? '<span class="bg-blue-100 text-blue-800 font-bold text-[10px] px-2 py-0.5 rounded-full border border-blue-200">Selected Route</span>' : ''}
          </div>

          <div class="text-right">
            <span class="text-2xl font-black ${isWinner ? 'text-emerald-600' : 'text-slate-700'} font-mono">${hosp.finalScore}%</span>
          </div>
        </div>

        <p class="text-xs text-slate-500 mt-0.5">${hosp.name}</p>

        <div class="w-full bg-slate-100 rounded-full h-2.5 mt-2.5 overflow-hidden">
          <div class="h-2.5 rounded-full ${isWinner ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : (hosp.finalScore >= 70 ? 'bg-blue-500' : 'bg-amber-400')}" style="width: ${hosp.finalScore}%"></div>
        </div>

        <div class="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
          <div>
            <span class="text-slate-400 block text-[10px] uppercase font-semibold">Road Distance</span>
            <span class="font-bold text-slate-800">${hosp.distanceKm > 0 ? hosp.distanceKm + ' km' : 'Calculating...'}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[10px] uppercase font-semibold">Travel ETA</span>
            <span class="font-bold text-slate-800">${hosp.baseTravelTimeMin > 0 ? hosp.baseTravelTimeMin + ' mins' : 'Calculating...'}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[10px] uppercase font-semibold">ICU Readiness</span>
            <span class="font-bold ${hosp.beds.icuAvailable > 0 ? 'text-emerald-600' : 'text-rose-600'}">
              ${hosp.beds.icuAvailable > 0 ? hosp.beds.icuAvailable + ' Beds Avail' : 'Full (0 Beds)'}
            </span>
          </div>
        </div>

        <div class="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span class="text-[11px] text-blue-600 font-semibold flex items-center">
            <i class="fa-solid fa-hand-pointer mr-1"></i> Click card to select route on map
          </span>
          <button onclick="event.stopPropagation(); selectRoute('${hosp.id}')" class="px-2.5 py-1 text-[11px] font-bold rounded-lg ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} transition">
            ${isSelected ? 'Selected' : 'Select'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Render Detailed Score Table in AI Tab
function renderDetailedScoreTable(hospitals) {
  const tbody = document.getElementById('detailed-score-breakdown-tbody');
  if (!tbody) return;

  tbody.innerHTML = hospitals.map(hosp => `
    <tr class="hover:bg-slate-50 transition cursor-pointer" onclick="selectRoute('${hosp.id}')">
      <td class="py-3 px-4 font-bold text-slate-900">${hosp.name}</td>
      <td class="py-3 px-4">${hosp.distanceKm > 0 ? hosp.distanceKm + ' km' : 'Calculating...'}</td>
      <td class="py-3 px-4">${hosp.baseTravelTimeMin > 0 ? hosp.baseTravelTimeMin + ' min' : 'Calculating...'}</td>
      <td class="py-3 px-4 font-mono font-medium">${hosp.factors.fScore}%</td>
      <td class="py-3 px-4 font-mono font-medium ${hosp.beds.icuAvailable === 0 ? 'text-red-600 font-bold' : ''}">${hosp.factors.bScore}%</td>
      <td class="py-3 px-4 font-mono font-medium">${hosp.factors.sScore}%</td>
      <td class="py-3 px-4 font-mono font-medium">${hosp.factors.eScore}%</td>
      <td class="py-3 px-4">
        <span class="text-base font-extrabold ${hosp.finalScore >= 90 ? 'text-emerald-600' : (hosp.finalScore >= 70 ? 'text-blue-600' : 'text-amber-600')} font-mono">
          ${hosp.finalScore}%
        </span>
      </td>
      <td class="py-3 px-4">
        ${hosp.id === state.selectedHospitalId 
          ? '<span class="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Active Route</span>'
          : '<button class="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 hover:bg-blue-50">Select</button>'
        }
      </td>
    </tr>
  `).join('');
}

// Update HUD Screen (Slide 10)
function updatePreAlertHUD(bestHosp) {
  const hudPriority = document.getElementById('hud-priority-badge');
  const hudEmergency = document.getElementById('hud-emergency-title');
  const hudBlood = document.getElementById('hud-blood-group');

  if (hudPriority) hudPriority.textContent = state.priority.toUpperCase();
  if (hudBlood) hudBlood.textContent = state.selectedBloodGroup;

  const emergencyTitles = {
    accident: 'Severe Road Accident & Polytrauma',
    cardiac: 'Acute Myocardial Infarction / STEMI Arrest',
    stroke: 'Acute Ischemic Stroke (Thrombolysis Window)',
    burn: 'High-Degree Industrial Burn',
    respiratory: 'Acute Respiratory Distress Syndrome'
  };

  if (hudEmergency) {
    hudEmergency.innerHTML = `Emergency Condition: <span class="text-yellow-400 font-bold">${emergencyTitles[state.emergencyCase] || 'Trauma Incident'}</span>`;
  }
}

// Handle Emergency dropdown change
function handleEmergencyChange() {
  const type = document.getElementById('select-emergency-type').value;
  const specialistLabel = document.getElementById('label-specialist');

  const specialistMap = {
    accident: 'Trauma Specialist',
    cardiac: 'Cardiologist On-Duty',
    stroke: 'Neurologist On-Duty',
    burn: 'Burn/Plastic Surgeon',
    respiratory: 'Pulmonologist'
  };

  if (specialistLabel) {
    specialistLabel.textContent = specialistMap[type] || 'Specialist';
  }

  runAIScoring();
}

// Traffic Mode Toggle
async function setTrafficMode(mode) {
  state.trafficMode = mode;
  const badge = document.getElementById('traffic-badge');
  const hudTraffic = document.getElementById('nav-hud-traffic');

  if (mode === 'light') {
    if (badge) {
      badge.textContent = "Green Corridor Active 🟢";
      badge.className = "text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200";
    }
    if (hudTraffic) {
      hudTraffic.textContent = "Green Light Priority Active";
      hudTraffic.className = "font-bold text-emerald-600";
    }
  } else if (mode === 'moderate') {
    if (badge) {
      badge.textContent = "Moderate Traffic on Highway 🟡";
      badge.className = "text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200";
    }
    if (hudTraffic) {
      hudTraffic.textContent = "Moderate Traffic / Optimal Route";
      hudTraffic.className = "font-bold text-blue-600";
    }
  } else if (mode === 'heavy') {
    if (badge) {
      badge.textContent = "Heavy Bottleneck Alert 🔴";
      badge.className = "text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200";
    }
    if (hudTraffic) {
      hudTraffic.textContent = "Dynamic Re-routing Enabled";
      hudTraffic.className = "font-bold text-rose-600";
    }
  }

  // Recalculate routes with new traffic factors
  if (state.selectedHospitalId) {
    await selectRoute(state.selectedHospitalId);
  }
  runAIScoring();
}

// ==========================================
// PRE-ALERT HUD COUNTDOWN TIMER (Slide 10)
// ==========================================
function startPreAlertTimer() {
  if (state.timerInterval) clearInterval(state.timerInterval);

  state.timerInterval = setInterval(() => {
    if (state.timerSeconds > 0) {
      state.timerSeconds--;
      updateTimerDisplay();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minEl = document.getElementById('hud-timer-minutes');
  const secEl = document.getElementById('hud-timer-seconds');
  if (!minEl || !secEl) return;

  const m = Math.floor(state.timerSeconds / 60);
  const s = state.timerSeconds % 60;

  minEl.textContent = String(m).padStart(2, '0');
  secEl.textContent = String(s).padStart(2, '0');
}

function resetPreAlertTimer() {
  state.timerSeconds = 480;
  updateTimerDisplay();
  playAlertChime();
}

function toggleAudioAlert() {
  state.isAudioEnabled = !state.isAudioEnabled;
  const label = document.getElementById('audio-label');
  const icon = document.getElementById('audio-icon');

  if (state.isAudioEnabled) {
    if (label) label.textContent = "Siren Audio: On";
    if (icon) {
      icon.className = "fa-solid fa-volume-high text-red-600";
    }
    playAlertChime();
  } else {
    if (label) label.textContent = "Siren Audio: Muted";
    if (icon) {
      icon.className = "fa-solid fa-volume-xmark text-slate-400";
    }
  }
}

// ==========================================
// BLOOD BANK NETWORK SUPPORT (Slide 8)
// ==========================================
function renderBloodFilterButtons() {
  const container = document.getElementById('blood-filter-buttons');
  if (!container) return;

  const groups = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
  container.innerHTML = groups.map(grp => {
    const isActive = grp === state.selectedBloodGroup;
    return `
      <button onclick="selectBloodGroup('${grp}')" class="px-2.5 py-1 text-xs font-bold rounded-lg border transition ${isActive ? 'bg-red-600 text-white border-red-600 shadow-sm' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'}">
        ${grp}
      </button>
    `;
  }).join('');
}

function selectBloodGroup(group) {
  state.selectedBloodGroup = group;
  renderBloodFilterButtons();
  renderBloodBankTable();
  const selectEl = document.getElementById('select-blood-group');
  if (selectEl) selectEl.value = group;
  runAIScoring();
}

function renderBloodBankTable() {
  const tbody = document.getElementById('blood-bank-tbody');
  const labelGroup = document.getElementById('table-selected-group');
  if (labelGroup) labelGroup.textContent = state.selectedBloodGroup;
  if (!tbody) return;

  const sortedBanks = [...bloodBanksData].sort((a, b) => a.travelTimeMin - b.travelTimeMin);

  tbody.innerHTML = sortedBanks.map(bank => {
    const units = bank.stock[state.selectedBloodGroup] || 0;
    const hasStock = units > 0;
    const isCritical = units > 0 && units <= 3;

    let statusBadge = hasStock
      ? `<span class="px-2.5 py-1 rounded-full text-xs font-bold ${isCritical ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}">
           ${isCritical ? 'Low Stock (' + units + ')' : 'In Stock (' + units + ' Units)'}
         </span>`
      : `<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
           No Stock / Check Alternate
         </span>`;

    return `
      <tr class="hover:bg-slate-50 transition">
        <td class="py-3 px-4">
          <div class="font-bold text-slate-900">${bank.name}</div>
          <div class="text-[11px] text-slate-500">${bank.location} • ${bank.contact}</div>
        </td>
        <td class="py-3 px-4">
          <span class="text-base font-extrabold ${hasStock ? 'text-red-600' : 'text-slate-400'} font-mono">
            ${units} Units
          </span>
        </td>
        <td class="py-3 px-4 font-semibold text-slate-700">${bank.distanceKm} km</td>
        <td class="py-3 px-4">
          <div class="font-bold text-slate-800">${bank.travelTimeMin} mins</div>
          <div class="text-[10px] text-emerald-600 font-medium">Optimal Traffic</div>
        </td>
        <td class="py-3 px-4">
          <div class="flex items-center space-x-2">
            ${statusBadge}
            ${hasStock ? `<button onclick="reserveBloodUnit('${bank.name}')" class="px-2.5 py-1 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-xs transition">Reserve</button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function reserveBloodUnit(bankName) {
  playAlertChime();
  alert(`✅ Emergency Reservation Confirmed!\n\n${state.selectedBloodGroup} blood units reserved at:\n${bankName}\n\nDispatch alert sent to hospital blood transfusion department.`);
}

// ==========================================
// AI WEIGHT ADJUSTMENT SLIDERS (Slide 7)
// ==========================================
function updateWeight(key, value) {
  state.weights[key] = parseInt(value, 10);
  const valEl = document.getElementById(`val-w-${key}`);
  if (valEl) valEl.textContent = `${value}%`;

  const totalSum = Object.values(state.weights).reduce((a, b) => a + b, 0);
  const totalSumEl = document.getElementById('total-weight-sum');
  if (totalSumEl) totalSumEl.textContent = `${totalSum}%`;

  runAIScoring();
}

function resetDefaultWeights() {
  state.weights = {
    facility: 25,
    bed: 20,
    specialist: 15,
    equipment: 15,
    blood: 10,
    travel: 10,
    traffic: 5
  };

  ['facility', 'bed', 'specialist', 'equipment', 'blood', 'travel', 'traffic'].forEach(k => {
    const slider = document.getElementById(`slider-w-${k}`);
    const valEl = document.getElementById(`val-w-${k}`);
    if (slider) slider.value = state.weights[k];
    if (valEl) valEl.textContent = `${state.weights[k]}%`;
  });

  const totalSumEl = document.getElementById('total-weight-sum');
  if (totalSumEl) totalSumEl.textContent = '100%';

  runAIScoring();
}

// Quick 911/108 Emergency Trigger Demo
function triggerEmergencyDemo() {
  playAlertChime();
  switchTab('prealert');

  if (typeof confetti === 'function') {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.4 }
    });
  }
}
