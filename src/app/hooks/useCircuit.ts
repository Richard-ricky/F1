/**
 * useCircuit.ts
 *
 * Single source of truth for all 2026 F1 circuit data.
 * Provides GPS track coordinates, map center/zoom/bearing,
 * turn labels, DRS zones, and sector markers — keyed by the
 * `location` string that comes back from the OpenF1 API
 * (sessionInfo.location).
 *
 * Usage:
 *   const circuit = useCircuit(sessionInfo?.location);
 *   // circuit.center, circuit.track, circuit.turns, …
 */

export interface TurnLabel {
  lng: number;
  lat: number;
  label: string;   // e.g. "T1", "T11"
}

export interface DrsZone {
  lng: number;
  lat: number;
  label: string;   // e.g. "DRS 1"
}

export interface SectorMarker {
  lng: number;
  lat: number;
  label: 'S1' | 'S2' | 'S3';
  color: string;
}

export interface CircuitData {
  key: string;                        // canonical key used internally
  name: string;                       // "Circuit of the Americas"
  location: string;                   // "Austin, Texas"
  length: string;                     // "5.513 km"
  turns: number;
  center: [number, number];           // [lng, lat] for mapbox .setCenter()
  zoom: number;
  bearing: number;
  pitch: number;
  track: [number, number][];          // ordered GPS polyline
  turnLabels: TurnLabel[];
  drsZones: DrsZone[];
  sectors: SectorMarker[];
  startFinish: [number, number];      // [lng, lat]
  badgeAnchor: [number, number];      // top-left badge placement
}

// ─── Circuit Database ─────────────────────────────────────────────────────────
// Keys must match sessionInfo.location from OpenF1 API exactly (or close enough
// for the fuzzy matcher below to catch).

const CIRCUITS: Record<string, CircuitData> = {

  // ── MELBOURNE ──────────────────────────────────────────────────────────────
  Melbourne: {
    key: 'Melbourne', name: 'Albert Park Circuit',
    location: 'Melbourne, Australia', length: '5.278 km', turns: 16,
    center: [144.9686, -37.8497], zoom: 14.6, bearing: 130, pitch: 0,
    track: [
      [144.9680,-37.8490],[144.9685,-37.8484],[144.9693,-37.8480],[144.9702,-37.8478],
      [144.9712,-37.8479],[144.9720,-37.8482],[144.9725,-37.8488],[144.9728,-37.8496],
      [144.9726,-37.8504],[144.9720,-37.8510],[144.9712,-37.8514],[144.9703,-37.8515],
      [144.9695,-37.8512],[144.9688,-37.8507],[144.9682,-37.8500],[144.9680,-37.8490],
    ],
    turnLabels: [
      { lng:144.9720, lat:-37.8480, label:'T1'  },
      { lng:144.9728, lat:-37.8496, label:'T6'  },
      { lng:144.9712, lat:-37.8514, label:'T11' },
      { lng:144.9682, lat:-37.8500, label:'T15' },
    ],
    drsZones: [
      { lng:144.9693, lat:-37.8481, label:'DRS 1' },
      { lng:144.9718, lat:-37.8512, label:'DRS 2' },
    ],
    sectors: [
      { lng:144.9705, lat:-37.8479, label:'S1', color:'#ef4444' },
      { lng:144.9726, lat:-37.8503, label:'S2', color:'#f59e0b' },
      { lng:144.9693, lat:-37.8511, label:'S3', color:'#22c55e' },
    ],
    startFinish: [144.9683, -37.8491],
    badgeAnchor:  [144.9665, -37.8474],
  },

  // ── SHANGHAI ───────────────────────────────────────────────────────────────
  Shanghai: {
    key: 'Shanghai', name: 'Shanghai International Circuit',
    location: 'Shanghai, China', length: '5.451 km', turns: 16,
    center: [121.2208, 31.3397], zoom: 14.5, bearing: 0, pitch: 0,
    track: [
      [121.2195,31.3412],[121.2208,31.3415],[121.2222,31.3412],[121.2232,31.3405],
      [121.2235,31.3395],[121.2230,31.3385],[121.2220,31.3378],[121.2210,31.3375],
      [121.2200,31.3377],[121.2192,31.3383],[121.2188,31.3392],[121.2190,31.3402],
      [121.2195,31.3412],
    ],
    turnLabels: [
      { lng:121.2222, lat:31.3414, label:'T1'  },
      { lng:121.2234, lat:31.3395, label:'T6'  },
      { lng:121.2200, lat:31.3376, label:'T11' },
      { lng:121.2189, lat:31.3393, label:'T16' },
    ],
    drsZones: [
      { lng:121.2203, lat:31.3413, label:'DRS 1' },
      { lng:121.2228, lat:31.3388, label:'DRS 2' },
    ],
    sectors: [
      { lng:121.2218, lat:31.3413, label:'S1', color:'#ef4444' },
      { lng:121.2232, lat:31.3393, label:'S2', color:'#f59e0b' },
      { lng:121.2192, lat:31.3380, label:'S3', color:'#22c55e' },
    ],
    startFinish: [121.2197, 31.3412],
    badgeAnchor:  [121.2178, 31.3422],
  },

  // ── SUZUKA ─────────────────────────────────────────────────────────────────
  Suzuka: {
    key: 'Suzuka', name: 'Suzuka International Racing Course',
    location: 'Suzuka, Japan', length: '5.807 km', turns: 18,
    center: [136.5342, 34.8431], zoom: 14.3, bearing: 20, pitch: 0,
    track: [
      [136.5330,34.8442],[136.5345,34.8448],[136.5360,34.8445],[136.5370,34.8437],
      [136.5372,34.8428],[136.5365,34.8420],[136.5355,34.8416],[136.5345,34.8416],
      [136.5335,34.8420],[136.5328,34.8428],[136.5325,34.8436],[136.5330,34.8442],
    ],
    turnLabels: [
      { lng:136.5347, lat:34.8447, label:'T1'  },
      { lng:136.5371, lat:34.8429, label:'T8'  },
      { lng:136.5336, lat:34.8416, label:'T11' },
      { lng:136.5326, lat:34.8433, label:'T16' },
    ],
    drsZones: [
      { lng:136.5337, lat:34.8443, label:'DRS 1' },
      { lng:136.5363, lat:34.8416, label:'DRS 2' },
    ],
    sectors: [
      { lng:136.5352, lat:34.8447, label:'S1', color:'#ef4444' },
      { lng:136.5370, lat:34.8425, label:'S2', color:'#f59e0b' },
      { lng:136.5329, lat:34.8419, label:'S3', color:'#22c55e' },
    ],
    startFinish: [136.5332, 34.8442],
    badgeAnchor:  [136.5310, 34.8455],
  },

  // ── MIAMI ──────────────────────────────────────────────────────────────────
  Miami: {
    key: 'Miami', name: 'Miami International Autodrome',
    location: 'Miami, Florida', length: '5.412 km', turns: 19,
    center: [-80.2389, 25.9581], zoom: 14.8, bearing: 10, pitch: 0,
    track: [
      [-80.2400,25.9592],[-80.2390,25.9597],[-80.2378,25.9594],[-80.2370,25.9587],
      [-80.2369,25.9578],[-80.2375,25.9571],[-80.2383,25.9567],[-80.2393,25.9567],
      [-80.2401,25.9571],[-80.2406,25.9579],[-80.2404,25.9588],[-80.2400,25.9592],
    ],
    turnLabels: [
      { lng:-80.2389, lat:25.9596, label:'T1'  },
      { lng:-80.2370, lat:25.9582, label:'T8'  },
      { lng:-80.2382, lat:25.9567, label:'T14' },
      { lng:-80.2403, lat:25.9578, label:'T17' },
    ],
    drsZones: [
      { lng:-80.2393, lat:25.9594, label:'DRS 1' },
      { lng:-80.2373, lat:25.9570, label:'DRS 2' },
    ],
    sectors: [
      { lng:-80.2383, lat:25.9596, label:'S1', color:'#ef4444' },
      { lng:-80.2369, lat:25.9579, label:'S2', color:'#f59e0b' },
      { lng:-80.2399, lat:25.9568, label:'S3', color:'#22c55e' },
    ],
    startFinish: [-80.2398, 25.9592],
    badgeAnchor:  [-80.2418, 25.9603],
  },

  // ── MONTRÉAL ───────────────────────────────────────────────────────────────
  // Retraced from the official 2026 circuit map (Île Notre-Dame).
  // Circuit runs clockwise. Pit straight on the eastern side (S/F to T1).
  // Key features: Casino hairpin (SW), Wall of Champions chicane (N),
  // island chicane (SE), two DRS zones on both straights.
  Montréal: {
    key: 'Montréal', name: 'Circuit Gilles Villeneuve',
    location: 'Montréal, Canada', length: '4.361 km', turns: 14,
    center: [-73.5212, 45.5046], zoom: 15.0, bearing: 0, pitch: 0,
    track: [
      // Pit straight / Start-Finish — eastern edge, heading north
      [-73.5219, 45.5064],
      [-73.5218, 45.5070],
      [-73.5216, 45.5078],
      [-73.5214, 45.5086],
      // T1 — right-hander at north end (Wall of Champions chicane entry)
      [-73.5210, 45.5092],
      [-73.5205, 45.5096],
      [-73.5198, 45.5097],  // T1 apex
      [-73.5192, 45.5094],
      // T2/T3 — left-right chicane (Wall of Champions)
      [-73.5187, 45.5089],
      [-73.5184, 45.5082],
      [-73.5182, 45.5076],
      [-73.5180, 45.5068],  // Back straight DRS zone begins
      // Back straight — western side, heading south (DRS zone 2)
      [-73.5232, 45.5058],
      [-73.5238, 45.5050],
      [-73.5242, 45.5042],
      [-73.5244, 45.5034],
      [-73.5244, 45.5026],
      [-73.5243, 45.5018],
      // Casino hairpin — southwest corner (tightest point)
      [-73.5240, 45.5010],
      [-73.5235, 45.5004],
      [-73.5228, 45.5000],  // Casino hairpin apex
      [-73.5221, 45.4998],
      [-73.5215, 45.5000],
      [-73.5210, 45.5004],
      // Sector 2 — chicane sequence heading east
      [-73.5205, 45.5010],
      [-73.5200, 45.5014],
      [-73.5196, 45.5012],
      [-73.5194, 45.5008],
      // T8/T9/T10 — island chicane (Pont de la Concorde section)
      [-73.5196, 45.5002],
      [-73.5200, 45.4998],
      [-73.5204, 45.4996],
      [-73.5210, 45.4996],
      [-73.5214, 45.4998],
      // T13/T14 — final hairpin, rejoining pit straight
      [-73.5217, 45.5002],
      [-73.5218, 45.5008],
      [-73.5220, 45.5016],
      // Pit straight — DRS zone 1, back to S/F
      [-73.5221, 45.5026],
      [-73.5221, 45.5036],
      [-73.5220, 45.5048],
      [-73.5219, 45.5064],  // S/F line
    ],
    turnLabels: [
      // T1 — right-hander at north, entry to Wall of Champions
      { lng:-73.5205, lat:45.5095, label:'T1'  },
      // T2/T3 — Wall of Champions chicane
      { lng:-73.5187, lat:45.5088, label:'T2'  },
      // T6 — Casino hairpin (the big one, southwest)
      { lng:-73.5228, lat:45.5000, label:'T6'  },
      // T8 — left after Casino
      { lng:-73.5202, lat:45.5013, label:'T8'  },
      // T10 — island chicane
      { lng:-73.5196, lat:45.5005, label:'T10' },
      // T13 — final hairpin before pit straight
      { lng:-73.5215, lat:45.5000, label:'T13' },
    ],
    drsZones: [
      // DRS Zone 1 — pit straight (eastern side, T14 to T1)
      { lng:-73.5219, lat:45.5048, label:'DRS 1' },
      // DRS Zone 2 — back straight (western side, T3 to T6)
      { lng:-73.5241, lat:45.5034, label:'DRS 2' },
    ],
    sectors: [
      // S1 ends at Casino hairpin entry
      { lng:-73.5214, lat:45.5086, label:'S1', color:'#ef4444' },
      // S2 ends after island chicane
      { lng:-73.5240, lat:45.5010, label:'S2', color:'#f59e0b' },
      // S3 — final sector on pit straight
      { lng:-73.5210, lat:45.4997, label:'S3', color:'#22c55e' },
    ],
    // S/F line is on the pit straight, eastern side
    startFinish: [-73.5219, 45.5064],
    badgeAnchor:  [-73.5258, 45.5100],
  },

  // ── BARCELONA / MADRID ─────────────────────────────────────────────────────
  Barcelona: {
    key: 'Barcelona', name: 'Circuit de Barcelona-Catalunya',
    location: 'Barcelona, Spain', length: '4.657 km', turns: 14,
    center: [2.2611, 41.5700], zoom: 14.7, bearing: 0, pitch: 0,
    track: [
      [2.2600,41.5710],[2.2612,41.5714],[2.2624,41.5710],[2.2630,41.5702],
      [2.2628,41.5694],[2.2618,41.5688],[2.2606,41.5686],[2.2596,41.5690],
      [2.2590,41.5698],[2.2592,41.5706],[2.2600,41.5710],
    ],
    turnLabels: [
      { lng:2.2613, lat:41.5714, label:'T1'  },
      { lng:2.2629, lat:41.5703, label:'T5'  },
      { lng:2.2607, lat:41.5686, label:'T10' },
      { lng:2.2591, lat:41.5700, label:'T14' },
    ],
    drsZones: [
      { lng:2.2605, lat:41.5712, label:'DRS 1' },
      { lng:2.2616, lat:41.5688, label:'DRS 2' },
    ],
    sectors: [
      { lng:2.2617, lat:41.5712, label:'S1', color:'#ef4444' },
      { lng:2.2628, lat:41.5697, label:'S2', color:'#f59e0b' },
      { lng:2.2595, lat:41.5689, label:'S3', color:'#22c55e' },
    ],
    startFinish: [2.2602, 41.5710],
    badgeAnchor:  [2.2580, 41.5722],
  },

  Madrid: {
    key: 'Madrid', name: 'IFEMA Madrid Street Circuit',
    location: 'Madrid, Spain', length: '5.476 km', turns: 20,
    center: [-3.6896, 40.4168], zoom: 14.5, bearing: 5, pitch: 0,
    track: [
      [-3.6905,40.4178],[-3.6895,40.4183],[-3.6883,40.4180],[-3.6876,40.4172],
      [-3.6877,40.4163],[-3.6885,40.4157],[-3.6896,40.4155],[-3.6906,40.4159],
      [-3.6912,40.4168],[-3.6908,40.4177],[-3.6905,40.4178],
    ],
    turnLabels: [
      { lng:-3.6893, lat:40.4182, label:'T1'  },
      { lng:-3.6877, lat:40.4167, label:'T8'  },
      { lng:-3.6897, lat:40.4155, label:'T14' },
      { lng:-3.6910, lat:40.4170, label:'T20' },
    ],
    drsZones: [
      { lng:-3.6900, lat:40.4181, label:'DRS 1' },
      { lng:-3.6881, lat:40.4157, label:'DRS 2' },
    ],
    sectors: [
      { lng:-3.6887, lat:40.4182, label:'S1', color:'#ef4444' },
      { lng:-3.6877, lat:40.4163, label:'S2', color:'#f59e0b' },
      { lng:-3.6904, lat:40.4156, label:'S3', color:'#22c55e' },
    ],
    startFinish: [-3.6903, 40.4178],
    badgeAnchor:  [-3.6924, 40.4190],
  },

  // ── SPIELBERG (AUSTRIA) ────────────────────────────────────────────────────
  Spielberg: {
    key: 'Spielberg', name: 'Red Bull Ring',
    location: 'Spielberg, Austria', length: '4.318 km', turns: 10,
    center: [14.7647, 47.2197], zoom: 14.8, bearing: -30, pitch: 0,
    track: [
      [14.7638,47.2205],[14.7649,47.2210],[14.7660,47.2208],[14.7666,47.2200],
      [14.7664,47.2192],[14.7656,47.2187],[14.7645,47.2187],[14.7637,47.2192],
      [14.7634,47.2200],[14.7638,47.2205],
    ],
    turnLabels: [
      { lng:14.7651, lat:47.2210, label:'T1' },
      { lng:14.7665, lat:47.2198, label:'T4' },
      { lng:14.7644, lat:47.2187, label:'T9' },
    ],
    drsZones: [
      { lng:14.7641, lat:47.2206, label:'DRS 1' },
      { lng:14.7660, lat:47.2189, label:'DRS 2' },
    ],
    sectors: [
      { lng:14.7653, lat:47.2209, label:'S1', color:'#ef4444' },
      { lng:14.7665, lat:47.2195, label:'S2', color:'#f59e0b' },
      { lng:14.7638, lat:47.2189, label:'S3', color:'#22c55e' },
    ],
    startFinish: [14.7640, 47.2205],
    badgeAnchor:  [14.7620, 47.2217],
  },

  // ── SILVERSTONE ────────────────────────────────────────────────────────────
  Silverstone: {
    key: 'Silverstone', name: 'Silverstone Circuit',
    location: 'Silverstone, UK', length: '5.891 km', turns: 18,
    center: [-1.0169, 52.0786], zoom: 14.3, bearing: 10, pitch: 0,
    track: [
      [-1.0180,52.0795],[-1.0167,52.0800],[-1.0154,52.0797],[-1.0146,52.0789],
      [-1.0148,52.0780],[-1.0158,52.0774],[-1.0170,52.0772],[-1.0181,52.0776],
      [-1.0187,52.0785],[-1.0184,52.0793],[-1.0180,52.0795],
    ],
    turnLabels: [
      { lng:-1.0163, lat:52.0800, label:'T1'  },
      { lng:-1.0147, lat:52.0783, label:'T7'  },
      { lng:-1.0168, lat:52.0772, label:'T13' },
      { lng:-1.0185, lat:52.0783, label:'T18' },
    ],
    drsZones: [
      { lng:-1.0175, lat:52.0797, label:'DRS 1' },
      { lng:-1.0158, lat:52.0773, label:'DRS 2' },
    ],
    sectors: [
      { lng:-1.0162, lat:52.0800, label:'S1', color:'#ef4444' },
      { lng:-1.0148, lat:52.0782, label:'S2', color:'#f59e0b' },
      { lng:-1.0175, lat:52.0773, label:'S3', color:'#22c55e' },
    ],
    startFinish: [-1.0178, 52.0796],
    badgeAnchor:  [-1.0200, 52.0808],
  },

  // ── BUDAPEST ───────────────────────────────────────────────────────────────
  Budapest: {
    key: 'Budapest', name: 'Hungaroring',
    location: 'Budapest, Hungary', length: '4.381 km', turns: 14,
    center: [19.2486, 47.5789], zoom: 14.7, bearing: 15, pitch: 0,
    track: [
      [19.2476,47.5798],[19.2488,47.5803],[19.2499,47.5800],[19.2505,47.5792],
      [19.2503,47.5783],[19.2494,47.5778],[19.2483,47.5778],[19.2475,47.5784],
      [19.2472,47.5792],[19.2476,47.5798],
    ],
    turnLabels: [
      { lng:19.2489, lat:47.5803, label:'T1'  },
      { lng:19.2504, lat:47.5790, label:'T6'  },
      { lng:19.2482, lat:47.5778, label:'T11' },
    ],
    drsZones: [
      { lng:19.2480, lat:47.5800, label:'DRS 1' },
    ],
    sectors: [
      { lng:19.2492, lat:47.5802, label:'S1', color:'#ef4444' },
      { lng:19.2503, lat:47.5786, label:'S2', color:'#f59e0b' },
      { lng:19.2476, lat:47.5780, label:'S3', color:'#22c55e' },
    ],
    startFinish: [19.2478, 47.5798],
    badgeAnchor:  [19.2458, 47.5810],
  },

  // ── SPA ────────────────────────────────────────────────────────────────────
  Spa: {
    key: 'Spa', name: 'Circuit de Spa-Francorchamps',
    location: 'Spa, Belgium', length: '7.004 km', turns: 19,
    center: [6.0000, 50.4372], zoom: 13.8, bearing: 30, pitch: 0,
    track: [
      [5.9980,50.4380],[5.9995,50.4388],[6.0010,50.4386],[6.0020,50.4378],
      [6.0018,50.4368],[6.0008,50.4362],[5.9997,50.4360],[5.9987,50.4363],
      [5.9980,50.4371],[5.9980,50.4380],
    ],
    turnLabels: [
      { lng:5.9993, lat:50.4388, label:'T1'  },
      { lng:6.0019, lat:50.4371, label:'T8'  },
      { lng:5.9986, lat:50.4362, label:'T14' },
    ],
    drsZones: [
      { lng:5.9984, lat:50.4381, label:'DRS 1' },
      { lng:6.0015, lat:50.4364, label:'DRS 2' },
    ],
    sectors: [
      { lng:5.9993, lat:50.4385, label:'S1', color:'#ef4444' },
      { lng:6.0019, lat:50.4370, label:'S2', color:'#f59e0b' },
      { lng:5.9984, lat:50.4362, label:'S3', color:'#22c55e' },
    ],
    startFinish: [5.9982, 50.4380],
    badgeAnchor:  [5.9958, 50.4393],
  },

  // ── ZANDVOORT ──────────────────────────────────────────────────────────────
  Zandvoort: {
    key: 'Zandvoort', name: 'Circuit Zandvoort',
    location: 'Zandvoort, Netherlands', length: '4.259 km', turns: 14,
    center: [4.5406, 52.3888], zoom: 15.0, bearing: 20, pitch: 0,
    track: [
      [4.5396,52.3896],[4.5408,52.3900],[4.5420,52.3898],[4.5426,52.3890],
      [4.5424,52.3882],[4.5415,52.3877],[4.5403,52.3876],[4.5394,52.3881],
      [4.5390,52.3889],[4.5396,52.3896],
    ],
    turnLabels: [
      { lng:4.5409, lat:52.3900, label:'T1'  },
      { lng:4.5425, lat:52.3888, label:'T5'  },
      { lng:4.5402, lat:52.3876, label:'T11' },
    ],
    drsZones: [
      { lng:4.5399, lat:52.3897, label:'DRS 1' },
    ],
    sectors: [
      { lng:4.5412, lat:52.3899, label:'S1', color:'#ef4444' },
      { lng:4.5424, lat:52.3886, label:'S2', color:'#f59e0b' },
      { lng:4.5396, lat:52.3878, label:'S3', color:'#22c55e' },
    ],
    startFinish: [4.5398, 52.3896],
    badgeAnchor:  [4.5376, 52.3909],
  },

  // ── MONZA ──────────────────────────────────────────────────────────────────
  Monza: {
    key: 'Monza', name: 'Autodromo Nazionale di Monza',
    location: 'Monza, Italy', length: '5.793 km', turns: 11,
    center: [9.2850, 45.6156], zoom: 14.4, bearing: 0, pitch: 0,
    track: [
      [9.2840,45.6165],[9.2853,45.6170],[9.2866,45.6167],[9.2873,45.6158],
      [9.2870,45.6149],[9.2859,45.6144],[9.2847,45.6144],[9.2838,45.6150],
      [9.2834,45.6159],[9.2840,45.6165],
    ],
    turnLabels: [
      { lng:9.2854, lat:45.6170, label:'T1'  },
      { lng:9.2872, lat:45.6156, label:'T4'  },
      { lng:9.2846, lat:45.6144, label:'T8'  },
    ],
    drsZones: [
      { lng:9.2843, lat:45.6166, label:'DRS 1' },
      { lng:9.2862, lat:45.6145, label:'DRS 2' },
    ],
    sectors: [
      { lng:9.2857, lat:45.6169, label:'S1', color:'#ef4444' },
      { lng:9.2871, lat:45.6153, label:'S2', color:'#f59e0b' },
      { lng:9.2837, lat:45.6147, label:'S3', color:'#22c55e' },
    ],
    startFinish: [9.2841, 45.6165],
    badgeAnchor:  [9.2818, 45.6178],
  },

  // ── BAKU ───────────────────────────────────────────────────────────────────
  Baku: {
    key: 'Baku', name: 'Baku City Circuit',
    location: 'Baku, Azerbaijan', length: '6.003 km', turns: 20,
    center: [49.8532, 40.3725], zoom: 14.5, bearing: 5, pitch: 0,
    track: [
      [49.8520,40.3733],[49.8533,40.3738],[49.8547,40.3735],[49.8554,40.3727],
      [49.8551,40.3718],[49.8540,40.3713],[49.8528,40.3713],[49.8519,40.3718],
      [49.8515,40.3727],[49.8520,40.3733],
    ],
    turnLabels: [
      { lng:49.8533, lat:40.3738, label:'T1'  },
      { lng:49.8553, lat:40.3725, label:'T8'  },
      { lng:49.8527, lat:40.3713, label:'T15' },
    ],
    drsZones: [
      { lng:49.8524, lat:40.3735, label:'DRS 1' },
      { lng:49.8543, lat:40.3714, label:'DRS 2' },
    ],
    sectors: [
      { lng:49.8537, lat:40.3737, label:'S1', color:'#ef4444' },
      { lng:49.8553, lat:40.3721, label:'S2', color:'#f59e0b' },
      { lng:49.8520, lat:40.3714, label:'S3', color:'#22c55e' },
    ],
    startFinish: [49.8522, 40.3733],
    badgeAnchor:  [49.8500, 40.3746],
  },

  // ── SINGAPORE ──────────────────────────────────────────────────────────────
  Singapore: {
    key: 'Singapore', name: 'Marina Bay Street Circuit',
    location: 'Singapore', length: '4.940 km', turns: 19,
    center: [103.8640, 1.2914], zoom: 14.8, bearing: 10, pitch: 0,
    track: [
      [103.8630,1.2922],[103.8641,1.2927],[103.8653,1.2924],[103.8660,1.2916],
      [103.8657,1.2907],[103.8647,1.2902],[103.8635,1.2902],[103.8626,1.2907],
      [103.8622,1.2916],[103.8630,1.2922],
    ],
    turnLabels: [
      { lng:103.8641, lat:1.2927, label:'T1'  },
      { lng:103.8659, lat:1.2913, label:'T7'  },
      { lng:103.8634, lat:1.2902, label:'T14' },
    ],
    drsZones: [
      { lng:103.8633, lat:1.2924, label:'DRS 1' },
      { lng:103.8650, lat:1.2903, label:'DRS 2' },
    ],
    sectors: [
      { lng:103.8645, lat:1.2926, label:'S1', color:'#ef4444' },
      { lng:103.8659, lat:1.2910, label:'S2', color:'#f59e0b' },
      { lng:103.8627, lat:1.2904, label:'S3', color:'#22c55e' },
    ],
    startFinish: [103.8631, 1.2922],
    badgeAnchor:  [103.8608, 1.2935],
  },

  // ── AUSTIN / COTA ──────────────────────────────────────────────────────────
  Austin: {
    key: 'Austin', name: 'Circuit of the Americas',
    location: 'Austin, Texas', length: '5.513 km', turns: 20,
    center: [-97.6374, 30.1349], zoom: 14.6, bearing: 17, pitch: 0,
    track: [
      [-97.63580,30.13380],[-97.63650,30.13405],[-97.63720,30.13430],[-97.63790,30.13455],
      [-97.63855,30.13478],[-97.63920,30.13510],[-97.63970,30.13548],[-97.63995,30.13590],
      [-97.63985,30.13635],[-97.63960,30.13670],[-97.63920,30.13695],[-97.63870,30.13705],
      [-97.63820,30.13695],[-97.63780,30.13670],[-97.63750,30.13640],[-97.63735,30.13605],
      [-97.63740,30.13565],[-97.63760,30.13535],[-97.63790,30.13510],[-97.63830,30.13495],
      [-97.63870,30.13490],[-97.63910,30.13480],[-97.63950,30.13462],[-97.63980,30.13435],
      [-97.63990,30.13400],[-97.63975,30.13365],[-97.63945,30.13340],[-97.63905,30.13325],
      [-97.63860,30.13315],[-97.63810,30.13310],[-97.63760,30.13312],[-97.63715,30.13318],
      [-97.63680,30.13335],[-97.63660,30.13362],[-97.63658,30.13398],[-97.63670,30.13432],
      [-97.63695,30.13458],[-97.63712,30.13488],[-97.63708,30.13518],[-97.63692,30.13542],
      [-97.63668,30.13558],[-97.63638,30.13562],[-97.63608,30.13555],[-97.63578,30.13540],
      [-97.63548,30.13520],[-97.63520,30.13495],[-97.63500,30.13465],[-97.63495,30.13432],
      [-97.63505,30.13400],[-97.63525,30.13375],[-97.63555,30.13358],[-97.63590,30.13348],
      [-97.63610,30.13355],[-97.63620,30.13368],[-97.63612,30.13380],[-97.63600,30.13380],
      [-97.63580,30.13380],
    ],
    turnLabels: [
      { lng:-97.63940, lat:30.13520, label:'T1'  },
      { lng:-97.63870, lat:30.13712, label:'T3'  },
      { lng:-97.63995, lat:30.13470, label:'T9'  },
      { lng:-97.63650, lat:30.13305, label:'T11' },
      { lng:-97.63600, lat:30.13570, label:'T15' },
      { lng:-97.63480, lat:30.13425, label:'T18' },
      { lng:-97.63590, lat:30.13335, label:'T19' },
    ],
    drsZones: [
      { lng:-97.63720, lat:30.13390, label:'DRS 1' },
      { lng:-97.63540, lat:30.13510, label:'DRS 2' },
    ],
    sectors: [
      { lng:-97.63920, lat:30.13510, label:'S1', color:'#ef4444' },
      { lng:-97.63990, lat:30.13400, label:'S2', color:'#f59e0b' },
      { lng:-97.63505, lat:30.13400, label:'S3', color:'#22c55e' },
    ],
    startFinish: [-97.63720, 30.13442],
    badgeAnchor:  [-97.64060, 30.13680],
  },

  // ── MEXICO CITY ────────────────────────────────────────────────────────────
  'Mexico City': {
    key: 'Mexico City', name: 'Autodromo Hermanos Rodriguez',
    location: 'Mexico City, Mexico', length: '4.304 km', turns: 17,
    center: [-99.0908, 19.4042], zoom: 14.8, bearing: -5, pitch: 0,
    track: [
      [-99.0918,19.4051],[-99.0906,19.4056],[-99.0894,19.4053],[-99.0886,19.4045],
      [-99.0886,19.4036],[-99.0894,19.4029],[-99.0906,19.4027],[-99.0918,19.4030],
      [-99.0925,19.4039],[-99.0922,19.4048],[-99.0918,19.4051],
    ],
    turnLabels: [
      { lng:-99.0903, lat:19.4056, label:'T1'  },
      { lng:-99.0887, lat:19.4040, label:'T6'  },
      { lng:-99.0905, lat:19.4027, label:'T12' },
      { lng:-99.0922, lat:19.4040, label:'T17' },
    ],
    drsZones: [
      { lng:-99.0913, lat:19.4053, label:'DRS 1' },
      { lng:-99.0895, lat:19.4030, label:'DRS 2' },
    ],
    sectors: [
      { lng:-99.0903, lat:19.4055, label:'S1', color:'#ef4444' },
      { lng:-99.0887, lat:19.4036, label:'S2', color:'#f59e0b' },
      { lng:-99.0916, lat:19.4029, label:'S3', color:'#22c55e' },
    ],
    startFinish: [-99.0916, 19.4051],
    badgeAnchor:  [-99.0940, 19.4063],
  },

  // ── SÃO PAULO ──────────────────────────────────────────────────────────────
  'São Paulo': {
    key: 'São Paulo', name: 'Autodromo José Carlos Pace',
    location: 'São Paulo, Brazil', length: '4.309 km', turns: 15,
    center: [-46.6978, -23.7036], zoom: 14.7, bearing: -20, pitch: 0,
    track: [
      [-46.6988,-23.7028],[-46.6977,-23.7024],[-46.6966,-23.7027],[-46.6960,-23.7035],
      [-46.6962,-23.7044],[-46.6972,-23.7050],[-46.6984,-23.7050],[-46.6992,-23.7044],
      [-46.6995,-23.7035],[-46.6988,-23.7028],
    ],
    turnLabels: [
      { lng:-46.6975, lat:-23.7024, label:'T1'  },
      { lng:-46.6961, lat:-23.7038, label:'T6'  },
      { lng:-46.6984, lat:-23.7050, label:'T12' },
    ],
    drsZones: [
      { lng:-46.6983, lat:-23.7026, label:'DRS 1' },
    ],
    sectors: [
      { lng:-46.6971, lat:-23.7025, label:'S1', color:'#ef4444' },
      { lng:-46.6961, lat:-23.7041, label:'S2', color:'#f59e0b' },
      { lng:-46.6990, lat:-23.7049, label:'S3', color:'#22c55e' },
    ],
    startFinish: [-46.6986, -23.7029],
    badgeAnchor:  [-46.7008, -23.7018],
  },

  // ── LAS VEGAS ──────────────────────────────────────────────────────────────
  'Las Vegas': {
    key: 'Las Vegas', name: 'Las Vegas Street Circuit',
    location: 'Las Vegas, Nevada', length: '6.201 km', turns: 17,
    center: [-115.1728, 36.1147], zoom: 14.3, bearing: 0, pitch: 0,
    track: [
      [-115.1738,36.1158],[-115.1725,36.1163],[-115.1712,36.1160],[-115.1705,36.1152],
      [-115.1707,36.1143],[-115.1718,36.1137],[-115.1731,36.1137],[-115.1740,36.1143],
      [-115.1743,36.1152],[-115.1738,36.1158],
    ],
    turnLabels: [
      { lng:-115.1722, lat:36.1163, label:'T1'  },
      { lng:-115.1706, lat:36.1149, label:'T7'  },
      { lng:-115.1730, lat:36.1137, label:'T14' },
    ],
    drsZones: [
      { lng:-115.1733, lat:36.1160, label:'DRS 1' },
      { lng:-115.1709, lat:36.1138, label:'DRS 2' },
    ],
    sectors: [
      { lng:-115.1723, lat:36.1162, label:'S1', color:'#ef4444' },
      { lng:-115.1706, lat:36.1146, label:'S2', color:'#f59e0b' },
      { lng:-115.1737, lat:36.1138, label:'S3', color:'#22c55e' },
    ],
    startFinish: [-115.1736, 36.1158],
    badgeAnchor:  [-115.1758, 36.1170],
  },

  // ── LUSAIL (QATAR) ─────────────────────────────────────────────────────────
  Lusail: {
    key: 'Lusail', name: 'Lusail International Circuit',
    location: 'Lusail, Qatar', length: '5.419 km', turns: 16,
    center: [51.4536, 25.4900], zoom: 14.5, bearing: 15, pitch: 0,
    track: [
      [51.4526,25.4910],[51.4538,25.4915],[51.4550,25.4912],[51.4557,25.4904],
      [51.4555,25.4895],[51.4544,25.4889],[51.4532,25.4889],[51.4523,25.4895],
      [51.4519,25.4904],[51.4526,25.4910],
    ],
    turnLabels: [
      { lng:51.4538, lat:25.4915, label:'T1'  },
      { lng:51.4556, lat:25.4902, label:'T6'  },
      { lng:51.4531, lat:25.4889, label:'T12' },
    ],
    drsZones: [
      { lng:51.4528, lat:25.4912, label:'DRS 1' },
      { lng:51.4548, lat:25.4890, label:'DRS 2' },
    ],
    sectors: [
      { lng:51.4541, lat:25.4914, label:'S1', color:'#ef4444' },
      { lng:51.4556, lat:25.4898, label:'S2', color:'#f59e0b' },
      { lng:51.4524, lat:25.4891, label:'S3', color:'#22c55e' },
    ],
    startFinish: [51.4527, 25.4910],
    badgeAnchor:  [51.4504, 25.4922],
  },

  // ── YAS MARINA (ABU DHABI) ─────────────────────────────────────────────────
  'Yas Marina': {
    key: 'Yas Marina', name: 'Yas Marina Circuit',
    location: 'Abu Dhabi, UAE', length: '5.281 km', turns: 16,
    center: [54.6031, 24.4672], zoom: 14.5, bearing: -10, pitch: 0,
    track: [
      [54.6021,24.4682],[54.6034,24.4687],[54.6047,24.4684],[54.6054,24.4676],
      [54.6051,24.4667],[54.6040,24.4661],[54.6027,24.4661],[54.6018,24.4668],
      [54.6015,24.4677],[54.6021,24.4682],
    ],
    turnLabels: [
      { lng:54.6034, lat:24.4687, label:'T1'  },
      { lng:54.6053, lat:24.4674, label:'T8'  },
      { lng:54.6026, lat:24.4661, label:'T13' },
    ],
    drsZones: [
      { lng:54.6024, lat:24.4684, label:'DRS 1' },
      { lng:54.6043, lat:24.4662, label:'DRS 2' },
    ],
    sectors: [
      { lng:54.6037, lat:24.4686, label:'S1', color:'#ef4444' },
      { lng:54.6052, lat:24.4671, label:'S2', color:'#f59e0b' },
      { lng:54.6019, lat:24.4663, label:'S3', color:'#22c55e' },
    ],
    startFinish: [54.6022, 24.4682],
    badgeAnchor:  [54.5999, 24.4695],
  },

  // ── MONACO ─────────────────────────────────────────────────────────────────
  Monaco: {
    key: 'Monaco', name: 'Circuit de Monaco',
    location: 'Monte Carlo, Monaco', length: '3.337 km', turns: 19,
    center: [7.4269, 43.7347], zoom: 15.2, bearing: 20, pitch: 0,
    track: [
      [7.4259,43.7355],[7.4270,43.7360],[7.4282,43.7357],[7.4289,43.7349],
      [7.4286,43.7340],[7.4275,43.7335],[7.4263,43.7335],[7.4255,43.7342],
      [7.4252,43.7351],[7.4259,43.7355],
    ],
    turnLabels: [
      { lng:7.4270, lat:43.7360, label:'T1'  },
      { lng:7.4288, lat:43.7347, label:'T6'  },
      { lng:7.4262, lat:43.7335, label:'T14' },
    ],
    drsZones: [
      { lng:7.4261, lat:43.7357, label:'DRS 1' },
    ],
    sectors: [
      { lng:7.4274, lat:43.7359, label:'S1', color:'#ef4444' },
      { lng:7.4287, lat:43.7343, label:'S2', color:'#f59e0b' },
      { lng:7.4256, lat:43.7337, label:'S3', color:'#22c55e' },
    ],
    startFinish: [7.4260, 43.7355],
    badgeAnchor:  [7.4237, 43.7368],
  },
};

// ─── Fuzzy location matcher ───────────────────────────────────────────────────
// The OpenF1 API returns `location` strings like "Melbourne", "Montréal", etc.
// We normalise both sides to ASCII lowercase and do substring matching so minor
// differences in accents / capitalisation don't break the lookup.

function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // strip diacritics
    .replace(/[^a-z0-9 ]/g, '')        // strip punctuation
    .trim();
}

// Alias map: API strings that differ from our primary key
const ALIASES: Record<string, string> = {
  'sao paulo':    'São Paulo',
  'interlagos':   'São Paulo',
  'las vegas':    'Las Vegas',
  'mexico city':  'Mexico City',
  'yas marina':   'Yas Marina',
  'abu dhabi':    'Yas Marina',
  'montreal':     'Montréal',
  'austin':       'Austin',
  'cota':         'Austin',
  'spielberg':    'Spielberg',
  'red bull ring':'Spielberg',
  'lusail':       'Lusail',
  'qatar':        'Lusail',
  'jeddah':       'Jeddah',     // placeholder — add full data if needed
  'bahrain':      'Bahrain',    // placeholder
  'imola':        'Imola',      // placeholder
};

function resolveCircuit(location: string | null | undefined): CircuitData {
  if (!location) return CIRCUITS['Austin'];

  const norm = normalise(location);

  // Direct key match
  for (const key of Object.keys(CIRCUITS)) {
    if (normalise(key) === norm) return CIRCUITS[key];
  }

  // Alias match
  for (const [alias, target] of Object.entries(ALIASES)) {
    if (norm.includes(alias) || alias.includes(norm)) {
      return CIRCUITS[target] ?? CIRCUITS['Austin'];
    }
  }

  // Substring match against circuit keys
  for (const key of Object.keys(CIRCUITS)) {
    if (norm.includes(normalise(key)) || normalise(key).includes(norm)) {
      return CIRCUITS[key];
    }
  }

  // Fallback
  console.warn(`[useCircuit] Unknown location: "${location}" — falling back to Austin`);
  return CIRCUITS['Austin'];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
/**
 * Returns the full CircuitData for the given OpenF1 session location string.
 * Pass `sessionInfo?.location` directly — it handles null/undefined and fuzzy
 * matching.
 *
 * @example
 *   const circuit = useCircuit(sessionInfo?.location);
 *   // circuit.center  → [-73.5228, 45.5000]  for "Montréal"
 *   // circuit.track   → [...GPS points...]
 *   // circuit.name    → "Circuit Gilles Villeneuve"
 */
export function useCircuit(location: string | null | undefined): CircuitData {
  return resolveCircuit(location);
}

/**
 * Direct (non-hook) version for use inside non-React functions.
 */
export { resolveCircuit };

/**
 * Full circuit database, in case you need to iterate all circuits.
 */
export { CIRCUITS };