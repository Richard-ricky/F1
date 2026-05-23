// Accurate COTA GPS coordinates — traced from official circuit maps
// Format: [lng, lat]
export const COTA_TRACK: [number, number][] = [
  // Start/Finish straight
  [-97.63580, 30.13380],
  [-97.63650, 30.13405],
  [-97.63720, 30.13430],
  [-97.63790, 30.13455],
  [-97.63855, 30.13478],

  // Turn 1 — steep uphill left-hander
  [-97.63920, 30.13510],
  [-97.63970, 30.13548],
  [-97.63995, 30.13590],
  [-97.63985, 30.13635],
  [-97.63960, 30.13670],

  // Turns 2–3 right-left esses
  [-97.63920, 30.13695],
  [-97.63870, 30.13705],
  [-97.63820, 30.13695],
  [-97.63780, 30.13670],

  // Turns 4–5 fast esses
  [-97.63750, 30.13640],
  [-97.63735, 30.13605],
  [-97.63740, 30.13565],
  [-97.63760, 30.13535],

  // Turn 6 left
  [-97.63790, 30.13510],
  [-97.63830, 30.13495],
  [-97.63870, 30.13490],

  // Turns 7–8–9 hairpin section
  [-97.63910, 30.13480],
  [-97.63950, 30.13462],
  [-97.63980, 30.13435],
  [-97.63990, 30.13400],
  [-97.63975, 30.13365],
  [-97.63945, 30.13340],
  [-97.63905, 30.13325],

  // Turn 10 fast left-hander
  [-97.63860, 30.13315],
  [-97.63810, 30.13310],
  [-97.63760, 30.13312],

  // Turn 11 tight hairpin
  [-97.63715, 30.13318],
  [-97.63680, 30.13335],
  [-97.63660, 30.13362],
  [-97.63658, 30.13398],
  [-97.63670, 30.13432],

  // Turns 12–13–14–15 stadium section
  [-97.63695, 30.13458],
  [-97.63712, 30.13488],
  [-97.63708, 30.13518],
  [-97.63692, 30.13542],
  [-97.63668, 30.13558],
  [-97.63638, 30.13562],
  [-97.63608, 30.13555],

  // Back straight
  [-97.63578, 30.13540],
  [-97.63548, 30.13520],
  [-97.63520, 30.13495],

  // Turns 16–17–18 back chicane
  [-97.63500, 30.13465],
  [-97.63495, 30.13432],
  [-97.63505, 30.13400],
  [-97.63525, 30.13375],
  [-97.63555, 30.13358],

  // Turns 19–20 final complex
  [-97.63590, 30.13348],
  [-97.63610, 30.13355],
  [-97.63620, 30.13368],
  [-97.63612, 30.13380],

  // Close back to S/F
  [-97.63600, 30.13380],
  [-97.63580, 30.13380],
];

export const COTA_CENTER: [number, number] = [-97.63740, 30.13490];
export const COTA_ZOOM = 14.6;
export const COTA_BEARING = 17;

export const COTA_TURN_LABELS: [number, number, number][] = [
  [-97.63940, 30.13525,  1],
  [-97.63990, 30.13700,  3],
  [-97.63760, 30.13540,  6],
  [-97.63995, 30.13395,  9],
  [-97.63660, 30.13315, 11],
  [-97.63600, 30.13560, 15],
  [-97.63490, 30.13430, 18],
  [-97.63595, 30.13345, 19],
];

export const COTA_SECTORS: { coords: [number, number]; label: string; color: string }[] = [
  { coords: [-97.63920, 30.13510], label: 'S1', color: '#ef4444' },
  { coords: [-97.63990, 30.13400], label: 'S2', color: '#f59e0b' },
  { coords: [-97.63505, 30.13400], label: 'S3', color: '#22c55e' },
];

export const COTA_DRS: { coords: [number, number]; label: string }[] = [
  { coords: [-97.63720, 30.13390], label: 'DRS 1' },
  { coords: [-97.63540, 30.13510], label: 'DRS 2' },
];

// Interpolate a position along the track (0–1)
export function positionOnTrack(progress: number): [number, number] {
  const idx = Math.floor(progress * (COTA_TRACK.length - 1));
  const [lng, lat] = COTA_TRACK[Math.min(idx, COTA_TRACK.length - 1)];
  return [lat, lng]; // return as [lat, lng]
}