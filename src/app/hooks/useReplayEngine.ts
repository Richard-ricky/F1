import { useState, useEffect, useCallback, useRef } from 'react';
import type { ProcessedDriver, SectorColor, TireCompound } from './useOpenF1';
import { resolveCircuit } from './useCircuit';

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

// Circuit track resolved dynamically from resolveCircuit(location)

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
// Uses resolveCircuit from useCircuit.ts — single source of truth for all GPS centres.

function xyToLatLng(x: number, y: number, location: string): [number, number] {
  const circuit = resolveCircuit(location);
  const [cLng, cLat] = circuit.center;
  const lat = cLat + y / 111_320;
  const lng = cLng + x / (111_320 * Math.cos(cLat * Math.PI / 180));
  return [lat, lng];
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
        // API unavailable — leave sessions empty, user will see 'no sessions'
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
      // Only build frames from real location data — no fake fallback
      const built = locations.length
        ? buildFrames(locations, positions, 500)
        : []; // No GPS data available for this session

      setFrames(built);
    } catch (err) {
      console.warn('[useReplayEngine] Failed to load session data:', err);
      // Leave frames empty — UI will show 'No data available'
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
    gap:     d.gap,
    lastLap: d.lastLap,
    tireAge: 0,
  }));

  // ── Replay events (positional overtakes, detected from frame deltas) ─────────

  // Detect real position changes from frame data as replay events
  const replayEvents: ReplayEvent[] = (() => {
    if (frames.length < 2 || frameIndex === 0) return [];
    const events: ReplayEvent[] = [];
    const prev = frames[Math.max(0, frameIndex - 1)]?.positions ?? {};
    const curr = frames[frameIndex]?.positions ?? {};
    Object.entries(curr).forEach(([numStr, data]) => {
      const num = Number(numStr);
      const prevPos = prev[num]?.position;
      if (prevPos !== undefined && prevPos !== data.position && data.position < prevPos) {
        const meta = driverMeta[num];
        const pct = frameIndex / Math.max(frames.length - 1, 1);
        events.push({
          id: `${num}-${frameIndex}`,
          lap: Math.round(pct * totalLaps),
          type: 'overtake',
          title: `${meta?.abbreviation ?? `DR${num}`} gains position`,
          description: `P${prevPos} → P${data.position}`,
          timestamp: frames[frameIndex]?.timestamp ?? '',
          drivers: [meta?.abbreviation ?? String(num)],
        });
      }
    });
    return events;
  })();

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