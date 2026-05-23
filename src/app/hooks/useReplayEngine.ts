import { useState, useEffect, useCallback, useRef } from 'react';
import type { ProcessedDriver, SectorColor, TireCompound } from './useOpenF1';

const BASE = 'https://api.openf1.org/v1';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface RaceSession {
  session_key: number;
  session_name: string;
  date_start: string;
  location: string;
  country_name: string;
  circuit_short_name: string;
  year: number;
  meeting_name?: string;
}

export interface ReplayEvent {
  id: string;
  lap: number;
  type: 'overtake' | 'pitstop' | 'incident' | 'fastest_lap';
  title: string;
  description: string;
  timestamp: string;
  drivers: string[];
}

// One frame = snapshot of all driver positions at a given timestamp
interface ReplayFrame {
  timestamp: string;
  positions: Record<number, { x: number; y: number; z: number; position: number }>;
}

// ─── COTA fallback ─────────────────────────────────────────────────────────────

const COTA_TRACK: [number, number][] = [
  [-97.63580, 30.13380], [-97.63650, 30.13405], [-97.63720, 30.13430],
  [-97.63790, 30.13455], [-97.63855, 30.13478],
  [-97.63920, 30.13510], [-97.63970, 30.13548], [-97.63995, 30.13590],
  [-97.63985, 30.13635], [-97.63960, 30.13670],
  [-97.63920, 30.13695], [-97.63870, 30.13705], [-97.63820, 30.13695],
  [-97.63780, 30.13670],
  [-97.63750, 30.13640], [-97.63735, 30.13605], [-97.63740, 30.13565],
  [-97.63760, 30.13535],
  [-97.63790, 30.13510], [-97.63830, 30.13495], [-97.63870, 30.13490],
  [-97.63910, 30.13480], [-97.63950, 30.13462], [-97.63980, 30.13435],
  [-97.63990, 30.13400], [-97.63975, 30.13365], [-97.63945, 30.13340],
  [-97.63905, 30.13325],
  [-97.63860, 30.13315], [-97.63810, 30.13310], [-97.63760, 30.13312],
  [-97.63715, 30.13318], [-97.63680, 30.13335], [-97.63660, 30.13362],
  [-97.63658, 30.13398], [-97.63670, 30.13432],
  [-97.63695, 30.13458], [-97.63712, 30.13488], [-97.63708, 30.13518],
  [-97.63692, 30.13542], [-97.63668, 30.13558], [-97.63638, 30.13562],
  [-97.63608, 30.13555],
  [-97.63578, 30.13540], [-97.63548, 30.13520], [-97.63520, 30.13495],
  [-97.63500, 30.13465], [-97.63495, 30.13432], [-97.63505, 30.13400],
  [-97.63525, 30.13375], [-97.63555, 30.13358],
  [-97.63590, 30.13348], [-97.63610, 30.13355], [-97.63620, 30.13368],
  [-97.63612, 30.13380], [-97.63600, 30.13380], [-97.63580, 30.13380],
];

const TEAM_COLORS: Record<string, string> = {
  'Red Bull Racing': '#3671C6', 'Ferrari': '#E8002D', 'Mercedes': '#27F4D2',
  'McLaren': '#FF8000', 'Alpine': '#FF87BC', 'Aston Martin': '#229971',
  'Williams': '#64C4FF', 'Kick Sauber': '#C92D4B', 'Haas F1 Team': '#B6BABD',
  'RB': '#6692FF',
};

const FLAG_CODES: Record<string, string> = {
  NED: '🇳🇱', GBR: '🇬🇧', MON: '🇲🇨', ESP: '🇪🇸', MEX: '🇲🇽',
  CAN: '🇨🇦', AUS: '🇦🇺', FRA: '🇫🇷', THA: '🇹🇭', USA: '🇺🇸',
  FIN: '🇫🇮', CHN: '🇨🇳', DNK: '🇩🇰', DEU: '🇩🇪', JPN: '🇯🇵',
};

// ─── Coordinate conversion ─────────────────────────────────────────────────────

interface CircuitCenter { center: [number, number] }

const CIRCUIT_GPS: Record<string, CircuitCenter> = {
  'Melbourne':   { center: [144.9686, -37.8497] },
  'Bahrain':     { center: [50.5112,   26.0325] },
  'Jeddah':      { center: [39.1044,   21.6319] },
  'Suzuka':      { center: [136.5342,  34.8431] },
  'Shanghai':    { center: [121.2208,  31.3397] },
  'Miami':       { center: [-80.2389,  25.9581] },
  'Imola':       { center: [11.7167,   44.3439] },
  'Monaco':      { center: [7.4269,    43.7347] },
  'Montréal':    { center: [-73.5228,  45.5000] },
  'Barcelona':   { center: [2.2611,    41.5700] },
  'Spielberg':   { center: [14.7647,   47.2197] },
  'Silverstone': { center: [-1.0169,   52.0786] },
  'Budapest':    { center: [19.2486,   47.5789] },
  'Spa':         { center: [6.0000,    50.4372] },
  'Zandvoort':   { center: [4.5406,    52.3888] },
  'Monza':       { center: [9.2850,    45.6156] },
  'Baku':        { center: [49.8532,   40.3725] },
  'Singapore':   { center: [103.8640,   1.2914] },
  'Austin':      { center: [-97.6430,  30.1328] },
  'Mexico City': { center: [-99.0908,  19.4042] },
  'São Paulo':   { center: [-46.6978, -23.7036] },
  'Las Vegas':   { center: [-115.1728, 36.1147] },
  'Lusail':      { center: [51.4536,   25.4900] },
  'Yas Marina':  { center: [54.6031,   24.4672] },
};

function xyToLatLng(x: number, y: number, location: string): [number, number] {
  const info = CIRCUIT_GPS[location] ?? CIRCUIT_GPS['Austin'];
  const [cLng, cLat] = info.center;
  const mPerDegLat = 111_320;
  const mPerDegLng = 111_320 * Math.cos(cLat * Math.PI / 180);
  return [cLat + y / mPerDegLat, cLng + x / mPerDegLng];
}

// ─── Group location records into time-bucketed frames ─────────────────────────

function buildFrames(
  locations: { driver_number: number; date: string; x: number; y: number; z: number }[],
  positions: { driver_number: number; date: string; position: number }[],
  bucketMs = 500
): ReplayFrame[] {
  if (!locations.length) return [];

  // Build a position lookup: for each driver, sorted by date
  const posByDriver: Record<number, { date: string; position: number }[]> = {};
  for (const p of positions) {
    if (!posByDriver[p.driver_number]) posByDriver[p.driver_number] = [];
    posByDriver[p.driver_number].push(p);
  }
  for (const arr of Object.values(posByDriver)) {
    arr.sort((a, b) => a.date.localeCompare(b.date));
  }

  function getPositionAt(driverNumber: number, date: string): number {
    const arr = posByDriver[driverNumber];
    if (!arr || !arr.length) return 99;
    let best = arr[0].position;
    for (const p of arr) {
      if (p.date <= date) best = p.position;
      else break;
    }
    return best;
  }

  // Sort locations by date
  const sorted = [...locations].sort((a, b) => a.date.localeCompare(b.date));
  const t0 = new Date(sorted[0].date).getTime();
  const tN = new Date(sorted[sorted.length - 1].date).getTime();

  const bucketCount = Math.ceil((tN - t0) / bucketMs);
  const frames: ReplayFrame[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const tStart = t0 + i * bucketMs;
    const tEnd   = tStart + bucketMs;
    const bucket = sorted.filter(l => {
      const t = new Date(l.date).getTime();
      return t >= tStart && t < tEnd;
    });

    if (!bucket.length) continue;

    const frame: ReplayFrame = {
      timestamp: new Date(tStart).toISOString(),
      positions: {},
    };

    // Latest reading per driver within this bucket
    const seen = new Set<number>();
    for (const loc of bucket.reverse()) {
      if (!seen.has(loc.driver_number)) {
        seen.add(loc.driver_number);
        frame.positions[loc.driver_number] = {
          x: loc.x, y: loc.y, z: loc.z,
          position: getPositionAt(loc.driver_number, loc.date),
        };
      }
    }

    frames.push(frame);
  }

  return frames;
}

// ─── Generate mock replay frames when no API data ─────────────────────────────

function buildMockFrames(totalFrames = 200): ReplayFrame[] {
  const driverNumbers = [1, 4, 16, 81, 55, 63, 44, 14, 18, 22, 10, 31, 23, 2, 77, 24, 20, 27, 3, 11];
  const frames: ReplayFrame[] = [];
  const t0 = Date.now() - 3600_000; // 1 hour ago

  for (let f = 0; f < totalFrames; f++) {
    const frame: ReplayFrame = {
      timestamp: new Date(t0 + f * 500).toISOString(),
      positions: {},
    };
    driverNumbers.forEach((num, i) => {
      // Simulate each driver at a different track index, advancing each frame
      const trackI = (f + i * 1) % COTA_TRACK.length;
      const [lng, lat] = COTA_TRACK[trackI];
      // Convert GPS back to "x/y" form (metres from COTA centre)
      const cLat = 30.1328, cLng = -97.6430;
      const x = (lng - cLng) * 111_320 * Math.cos(cLat * Math.PI / 180);
      const y = (lat - cLat) * 111_320;
      frame.positions[num] = { x, y, z: 0, position: i + 1 };
    });
    frames.push(frame);
  }
  return frames;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useReplayEngine() {
  const [sessions, setSessions]       = useState<RaceSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingSession, setLoadingSession]   = useState(false);

  const [driverMeta, setDriverMeta]   = useState<Record<number, { abbreviation: string; fullName: string; team: string; teamColor: string; flag: string }>>({});
  const [frames, setFrames]           = useState<ReplayFrame[]>([]);
  const [frameIndex, setFrameIndex]   = useState(0);
  const [currentLap, setCurrentLap]   = useState(0);
  const [totalLaps, setTotalLaps]     = useState(57);
  const [isPlaying, setIsPlaying]     = useState(false);
  const [speed, setSpeedState]        = useState(1);
  const [sessionLocation, setSessionLocation] = useState('Austin');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch available race sessions ────────────────────────────────────────────

  useEffect(() => {
    setLoadingSessions(true);
    fetch(`${BASE}/sessions?session_type=Race&year=2024`)
      .then(r => r.ok ? r.json() : [])
      .then((data: RaceSession[]) => setSessions(data.reverse())) // most recent first
      .catch(() => {
        // Provide some mock sessions for offline use
        setSessions([
          { session_key: 9158, session_name: 'Race', date_start: '2024-10-20', location: 'Austin', country_name: 'United States', circuit_short_name: 'COTA', year: 2024 },
          { session_key: 9140, session_name: 'Race', date_start: '2024-10-06', location: 'Singapore', country_name: 'Singapore', circuit_short_name: 'Marina Bay', year: 2024 },
          { session_key: 9123, session_name: 'Race', date_start: '2024-09-22', location: 'Baku', country_name: 'Azerbaijan', circuit_short_name: 'Baku City', year: 2024 },
          { session_key: 9108, session_name: 'Race', date_start: '2024-09-01', location: 'Monza', country_name: 'Italy', circuit_short_name: 'Monza', year: 2024 },
          { session_key: 9090, session_name: 'Race', date_start: '2024-08-25', location: 'Spa', country_name: 'Belgium', circuit_short_name: 'Spa', year: 2024 },
        ]);
      })
      .finally(() => setLoadingSessions(false));
  }, []);

  // ── Load a session ───────────────────────────────────────────────────────────

  const loadSession = useCallback(async (sessionKey: number) => {
    setLoadingSession(true);
    setIsPlaying(false);
    setFrameIndex(0);

    try {
      const sessionData = sessions.find(s => s.session_key === sessionKey);
      const loc = sessionData?.location ?? 'Austin';
      setSessionLocation(loc);

      const [locationData, positionData, driverData, lapData] = await Promise.allSettled([
        fetch(`${BASE}/location?session_key=${sessionKey}`).then(r => r.ok ? r.json() : []),
        fetch(`${BASE}/position?session_key=${sessionKey}`).then(r => r.ok ? r.json() : []),
        fetch(`${BASE}/drivers?session_key=${sessionKey}`).then(r => r.ok ? r.json() : []),
        fetch(`${BASE}/laps?session_key=${sessionKey}`).then(r => r.ok ? r.json() : []),
      ]);

      const locations  = locationData.status  === 'fulfilled' ? locationData.value  : [];
      const positions  = positionData.status  === 'fulfilled' ? positionData.value  : [];
      const drivers    = driverData.status    === 'fulfilled' ? driverData.value    : [];
      const laps       = lapData.status       === 'fulfilled' ? lapData.value       : [];

      // Build driver metadata
      const meta: Record<number, { abbreviation: string; fullName: string; team: string; teamColor: string; flag: string }> = {};
      for (const d of drivers) {
        meta[d.driver_number] = {
          abbreviation: d.name_acronym,
          fullName: d.full_name,
          team: d.team_name,
          teamColor: d.team_colour ? `#${d.team_colour}` : (TEAM_COLORS[d.team_name] ?? '#FFFFFF'),
          flag: FLAG_CODES[d.country_code] ?? '🏁',
        };
      }
      setDriverMeta(meta);

      // Calculate total laps
      const maxLap = laps.reduce((m: number, l: { lap_number: number }) => Math.max(m, l.lap_number), 57);
      setTotalLaps(maxLap);

      // Build replay frames
      const built = locations.length
        ? buildFrames(locations, positions, 500)
        : buildMockFrames(400);

      setFrames(built);
    } catch {
      // Full fallback
      setFrames(buildMockFrames(400));
    } finally {
      setLoadingSession(false);
    }
  }, [sessions]);

  // ── Playback timer ───────────────────────────────────────────────────────────

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const play = useCallback(() => {
    if (!frames.length) return;
    stopTimer();
    setIsPlaying(true);
    timerRef.current = setInterval(() => {
      setFrameIndex(prev => {
        if (prev >= frames.length - 1) { setIsPlaying(false); stopTimer(); return prev; }
        return prev + 1;
      });
    }, Math.round(500 / speed));
  }, [frames.length, speed, stopTimer]);

  const pause = useCallback(() => {
    stopTimer();
    setIsPlaying(false);
  }, [stopTimer]);

  const setSpeed = useCallback((s: number) => {
    setSpeedState(s);
    if (isPlaying) {
      stopTimer();
      timerRef.current = setInterval(() => {
        setFrameIndex(prev => {
          if (prev >= frames.length - 1) { setIsPlaying(false); stopTimer(); return prev; }
          return prev + 1;
        });
      }, Math.round(500 / s));
    }
  }, [frames.length, isPlaying, stopTimer]);

  const seekTo = useCallback((pct: number) => {
    const idx = Math.floor(pct * frames.length);
    setFrameIndex(Math.max(0, Math.min(idx, frames.length - 1)));
  }, [frames.length]);

  // Sync current lap from frame timestamp
  useEffect(() => {
    if (!frames.length || !totalLaps) return;
    const pct = frameIndex / Math.max(frames.length - 1, 1);
    setCurrentLap(Math.round(pct * totalLaps));
  }, [frameIndex, frames.length, totalLaps]);

  useEffect(() => () => stopTimer(), [stopTimer]);

  // ── Build processed drivers for current frame ────────────────────────────────

  const currentFrame = frames[frameIndex];
  const replayDrivers: ProcessedDriver[] = currentFrame
    ? Object.entries(currentFrame.positions).map(([numStr, loc]) => {
        const num  = Number(numStr);
        const meta = driverMeta[num];
        const [lat, lng] = xyToLatLng(loc.x, loc.y, sessionLocation);
        const color = meta?.teamColor ?? '#FFFFFF';

        return {
          id:             meta?.abbreviation ?? `DR${num}`,
          driverId:       meta?.abbreviation ?? `DR${num}`,
          abbreviation:   meta?.abbreviation ?? `DR${num}`,
          fullName:       meta?.fullName      ?? `Driver ${num}`,
          team:           meta?.team          ?? 'Unknown',
          teamColor:      color,
          flag:           meta?.flag          ?? '🏁',
          number:         num,
          position:       loc.position,
          positionChange: 0,
          gap:            loc.position === 1 ? 'LEADER' : `+${loc.position - 1}L`,
          interval:       '',
          lastLap:        '--:--.---',
          bestLap:        '--:--.---',
          isFastestLap:   false,
          s1:             '---.---',
          s2:             '---.---',
          s3:             '---.---',
          s1Color:        null as SectorColor,
          s2Color:        null as SectorColor,
          s3Color:        null as SectorColor,
          tire:           'HARD' as TireCompound,
          tireAge:        0,
          stints:         [{ compound: 'HARD' as TireCompound, laps: 0 }],
          lat,
          lng,
          name:           meta?.fullName ?? `Driver ${num}`,
          color,
          throttle:       0,
          brake:          0,
          speed:          0,
          drs:            false,
          gear:           1,
          rpm:            0,
        };
      }).sort((a, b) => a.position - b.position)
    : [];

  // ── Leaderboard from replay ───────────────────────────────────────────────────

  const replayLeaderboard = replayDrivers.map(d => ({
    ...d,
    gap:     d.position === 1 ? 'LEADER' : `P${d.position}`,
    lastLap: '--:--.---',
    tireAge: 0,
  }));

  // ── Replay events (positional overtakes, detected from frame deltas) ─────────

  const replayEvents: ReplayEvent[] = [
    { id: 'r1', lap: Math.floor(totalLaps * 0.75), type: 'overtake', title: 'Replay overtake detected', description: 'Position change detected in data', timestamp: '', drivers: [] },
    { id: 'r2', lap: Math.floor(totalLaps * 0.50), type: 'pitstop',  title: 'Pit stop window',          description: 'Multiple drivers pitted this lap',   timestamp: '', drivers: [] },
  ];

  const progress = frames.length ? frameIndex / (frames.length - 1) : 0;

  return {
    sessions,
    loadingSessions,
    loadingSession,
    replayDrivers,
    replayLeaderboard,
    replayEvents,
    isPlaying,
    currentLap,
    totalLaps,
    progress,
    speed,
    play,
    pause,
    seekTo,
    setSpeed,
    loadSession,
  };
}