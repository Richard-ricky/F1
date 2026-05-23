import { useState, useEffect, useCallback, useRef } from 'react';

const BASE = 'https://api.openf1.org/v1';

// ─── API Types ────────────────────────────────────────────────────────────────

export interface ApiDriver {
  driver_number: number; broadcast_name: string; full_name: string;
  name_acronym: string; team_name: string; team_colour: string;
  country_code: string; headshot_url?: string;
}
export interface ApiPosition {
  driver_number: number; position: number; date: string; session_key: number;
}
export interface ApiLocation {
  driver_number: number; date: string; x: number; y: number; z: number; session_key: number;
}
export interface ApiCarData {
  driver_number: number; date: string; speed: number; throttle: number;
  brake: number; gear: number; rpm: number; drs: number; session_key: number;
}
export interface ApiStint {
  driver_number: number; lap_start: number; lap_end: number | null;
  compound: string; tyre_age_at_start: number; session_key: number;
}
export interface ApiLap {
  driver_number: number; lap_number: number; lap_duration: number | null;
  is_pit_out_lap: boolean;
  duration_sector_1: number | null; duration_sector_2: number | null;
  duration_sector_3: number | null;
  date_start: string; session_key: number;
}
export interface ApiWeather {
  date: string; air_temperature: number; track_temperature: number;
  wind_speed: number; wind_direction: number; humidity: number;
  pressure: number; rainfall: number; session_key: number;
}
export interface ApiSession {
  session_key: number; session_name: string; date_start: string; date_end: string;
  session_type: string; meeting_key: number;
  location: string; country_name: string; circuit_short_name: string; year: number;
}
export interface ApiInterval {
  driver_number: number; date: string;
  gap_to_leader: number | null; interval: number | null; session_key: number;
}
export interface ApiRaceControl {
  date: string; lap_number: number | null; category: string;
  flag: string | null; message: string; session_key: number;
  driver_number: number | null;
}
export interface ApiRadio {
  date: string; driver_number: number; recording_url: string; session_key: number;
}

// ─── App types ────────────────────────────────────────────────────────────────

export type TireCompound = 'SOFT' | 'MEDIUM' | 'HARD' | 'INTER' | 'WET';
export type SectorColor  = 'purple' | 'green' | 'yellow' | null;

export interface ProcessedDriver {
  id: string; driverId: string; abbreviation: string; fullName: string;
  team: string; teamColor: string; flag: string; number: number; headshotUrl?: string;
  position: number; positionChange: number;
  gap: string; interval: string;
  lastLap: string; bestLap: string; isFastestLap: boolean;
  s1: string; s2: string; s3: string;
  s1Color: SectorColor; s2Color: SectorColor; s3Color: SectorColor;
  tire: TireCompound; tireAge: number;
  stints: { compound: TireCompound; laps: number }[];
  lat: number; lng: number; name: string; color: string; heading?: number;
  throttle: number; brake: number; speed: number; drs: boolean; gear: number; rpm: number;
  lapHistory?: number[];
}

export interface ProcessedTelemetry {
  speed: number; throttle: number; brake: number; gear: number; rpm: number; drs: boolean;
  tireWear: { fl: number; fr: number; rl: number; rr: number };
  steeringAngle: number;
  gForce: { x: number; y: number; z: number };
  lapHistory: number[];
  sectorHistory: { lap: number; s1: number | null; s2: number | null; s3: number | null }[];
}

export interface SessionInfo {
  meetingName: string; circuitName: string; location: string; country: string;
  flag: 'green' | 'yellow' | 'safety-car' | 'red' | 'finished';
  currentLap: number; totalLaps: number; sessionType: string; sessionKey: number;
}

export interface WeatherInfo {
  airTemp: number; trackTemp: number; windSpeed: number; windDirection: number;
  humidity: number; pressure: number; rainfall: boolean; conditions: string;
}

export interface RaceEvent {
  id: string; lap: number;
  type: 'overtake' | 'pitstop' | 'incident' | 'fastest_lap' | 'safety_car' | 'flag';
  title: string; description: string; timestamp: string; drivers: string[];
}

export interface RadioMessage {
  id: string; driverNumber: number; driverAbbr: string;
  teamColor: string; date: string; url: string;
}

// ─── Circuit XY → GPS ─────────────────────────────────────────────────────────

const CIRCUIT_CENTRES: Record<string, [number, number]> = {
  Melbourne:    [144.9686, -37.8497], Bahrain:      [50.5112,   26.0325],
  Jeddah:       [39.1044,   21.6319], Suzuka:       [136.5342,  34.8431],
  Shanghai:     [121.2208,  31.3397], Miami:        [-80.2389,  25.9581],
  Imola:        [11.7167,   44.3439], Monaco:       [7.4269,    43.7347],
  Montréal:     [-73.5228,  45.5000], Barcelona:    [2.2611,    41.5700],
  Spielberg:    [14.7647,   47.2197], Silverstone:  [-1.0169,   52.0786],
  Budapest:     [19.2486,   47.5789], Spa:          [6.0000,    50.4372],
  Zandvoort:    [4.5406,    52.3888], Monza:        [9.2850,    45.6156],
  Baku:         [49.8532,   40.3725], Singapore:    [103.8640,   1.2914],
  Austin:       [-97.6374,  30.1349], 'Mexico City':[-99.0908,  19.4042],
  'São Paulo':  [-46.6978, -23.7036], 'Las Vegas':  [-115.1728, 36.1147],
  Lusail:       [51.4536,   25.4900], 'Yas Marina': [54.6031,   24.4672],
  Madrid:       [-3.6896,   40.4168],
};

export function circuitXYToLatLng(x: number, y: number, location: string): [number, number] {
  const centre = CIRCUIT_CENTRES[location] ?? CIRCUIT_CENTRES['Austin'];
  const [cLng, cLat] = centre;
  return [cLat + y / 111_320, cLng + x / (111_320 * Math.cos(cLat * Math.PI / 180))];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FLAG_CODES: Record<string, string> = {
  NED:'🇳🇱', GBR:'🇬🇧', MON:'🇲🇨', ESP:'🇪🇸', MEX:'🇲🇽', CAN:'🇨🇦',
  AUS:'🇦🇺', FRA:'🇫🇷', THA:'🇹🇭', USA:'🇺🇸', FIN:'🇫🇮', CHN:'🇨🇳',
  DNK:'🇩🇰', DEU:'🇩🇪', JPN:'🇯🇵', BRA:'🇧🇷', ITA:'🇮🇹', BEL:'🇧🇪',
  NZL:'🇳🇿', POL:'🇵🇱', AUT:'🇦🇹',
};
const TEAM_COLORS: Record<string, string> = {
  'Red Bull Racing':'#3671C6', Ferrari:'#E8002D', Mercedes:'#27F4D2',
  McLaren:'#FF8000', Alpine:'#FF87BC', 'Aston Martin':'#229971',
  Williams:'#64C4FF', 'Kick Sauber':'#C92D4B', 'Haas F1 Team':'#B6BABD', RB:'#6692FF',
};
const COMPOUND_MAP: Record<string, TireCompound> = {
  SOFT:'SOFT', MEDIUM:'MEDIUM', HARD:'HARD', INTERMEDIATE:'INTER', INTER:'INTER', WET:'WET',
};
const fmtTime = (s: number | null) => {
  if (!s || s <= 0) return '--:--.---';
  return `${Math.floor(s/60)}:${(s%60).toFixed(3).padStart(6,'0')}`;
};
const fmtSec = (s: number | null) => (s && s > 0 ? s.toFixed(3) : '---.---');
const getColor = (d: ApiDriver) => d.team_colour ? `#${d.team_colour}` : (TEAM_COLORS[d.team_name] ?? '#FFF');

async function apiFetch<T>(path: string): Promise<T[]> {
  const r = await fetch(`${BASE}${path}`);
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}
function byDriver<T extends { date: string; driver_number: number }>(arr: T[]): Record<number, T> {
  return arr.reduce((acc, r) => {
    if (!acc[r.driver_number] || r.date > acc[r.driver_number].date) acc[r.driver_number] = r;
    return acc;
  }, {} as Record<number, T>);
}

// ─── COTA fallback coords ─────────────────────────────────────────────────────

const COTA: [number, number][] = [
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
];

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_RAW = [
  {id:'VER',full:'Max Verstappen',      team:'Red Bull Racing', cc:'NED',num:1, pos:1, gap:'LEADER', lap:'1:38.452',s1:'28.312',s2:'39.821',s3:'30.319',tire:'HARD'   as TireCompound,age:12},
  {id:'NOR',full:'Lando Norris',        team:'McLaren',         cc:'GBR',num:4, pos:2, gap:'+2.341', lap:'1:38.789',s1:'28.502',s2:'39.945',s3:'30.342',tire:'MEDIUM' as TireCompound,age:8 },
  {id:'LEC',full:'Charles Leclerc',     team:'Ferrari',         cc:'MON',num:16,pos:3, gap:'+4.125', lap:'1:38.891',s1:'28.612',s2:'40.012',s3:'30.267',tire:'HARD'   as TireCompound,age:14},
  {id:'PIA',full:'Oscar Piastri',       team:'McLaren',         cc:'AUS',num:81,pos:4, gap:'+5.233', lap:'1:39.012',s1:'28.701',s2:'40.102',s3:'30.209',tire:'MEDIUM' as TireCompound,age:8 },
  {id:'SAI',full:'Carlos Sainz',        team:'Ferrari',         cc:'ESP',num:55,pos:5, gap:'+8.456', lap:'1:38.234',s1:'28.201',s2:'39.712',s3:'30.321',tire:'HARD'   as TireCompound,age:15},
  {id:'RUS',full:'George Russell',      team:'Mercedes',        cc:'GBR',num:63,pos:6, gap:'+11.231',lap:'1:39.333',s1:'28.812',s2:'40.201',s3:'30.320',tire:'MEDIUM' as TireCompound,age:5 },
  {id:'HAM',full:'Lewis Hamilton',      team:'Mercedes',        cc:'GBR',num:44,pos:7, gap:'+13.512',lap:'1:39.512',s1:'28.901',s2:'40.312',s3:'30.299',tire:'SOFT'   as TireCompound,age:3 },
  {id:'ALO',full:'Fernando Alonso',     team:'Aston Martin',    cc:'ESP',num:14,pos:8, gap:'+18.734',lap:'1:39.801',s1:'29.102',s2:'40.412',s3:'30.287',tire:'MEDIUM' as TireCompound,age:10},
  {id:'STR',full:'Lance Stroll',        team:'Aston Martin',    cc:'CAN',num:18,pos:9, gap:'+22.103',lap:'1:40.012',s1:'29.301',s2:'40.512',s3:'30.199',tire:'HARD'   as TireCompound,age:16},
  {id:'TSU',full:'Yuki Tsunoda',        team:'RB',              cc:'JPN',num:22,pos:10,gap:'+25.301',lap:'1:40.231',s1:'29.412',s2:'40.612',s3:'30.207',tire:'MEDIUM' as TireCompound,age:7 },
  {id:'GAS',full:'Pierre Gasly',        team:'Alpine',          cc:'FRA',num:10,pos:11,gap:'+29.812',lap:'1:40.445',s1:'29.512',s2:'40.712',s3:'30.221',tire:'SOFT'   as TireCompound,age:4 },
  {id:'OCO',full:'Esteban Ocon',        team:'Alpine',          cc:'FRA',num:31,pos:12,gap:'+33.201',lap:'1:40.612',s1:'29.612',s2:'40.812',s3:'30.188',tire:'MEDIUM' as TireCompound,age:9 },
  {id:'ALB',full:'Alexander Albon',     team:'Williams',        cc:'THA',num:23,pos:13,gap:'+38.923',lap:'1:40.834',s1:'29.712',s2:'40.912',s3:'30.210',tire:'HARD'   as TireCompound,age:18},
  {id:'SAR',full:'Logan Sargeant',      team:'Williams',        cc:'USA',num:2, pos:14,gap:'+45.112',lap:'1:41.023',s1:'29.812',s2:'41.012',s3:'30.199',tire:'MEDIUM' as TireCompound,age:11},
  {id:'BOT',full:'Valtteri Bottas',     team:'Kick Sauber',     cc:'FIN',num:77,pos:15,gap:'+51.734',lap:'1:41.234',s1:'29.912',s2:'41.112',s3:'30.210',tire:'HARD'   as TireCompound,age:20},
  {id:'ZHO',full:'Guanyu Zhou',         team:'Kick Sauber',     cc:'CHN',num:24,pos:16,gap:'+56.301',lap:'1:41.456',s1:'30.012',s2:'41.212',s3:'30.232',tire:'MEDIUM' as TireCompound,age:6 },
  {id:'MAG',full:'Kevin Magnussen',     team:'Haas F1 Team',    cc:'DNK',num:20,pos:17,gap:'+61.523',lap:'1:41.678',s1:'30.112',s2:'41.312',s3:'30.254',tire:'HARD'   as TireCompound,age:22},
  {id:'HUL',full:'Nico Hülkenberg',     team:'Haas F1 Team',    cc:'DEU',num:27,pos:18,gap:'+67.234',lap:'1:41.890',s1:'30.212',s2:'41.412',s3:'30.266',tire:'MEDIUM' as TireCompound,age:8 },
  {id:'RIC',full:'Daniel Ricciardo',    team:'RB',              cc:'AUS',num:3, pos:19,gap:'+72.412',lap:'1:42.012',s1:'30.312',s2:'41.512',s3:'30.188',tire:'SOFT'   as TireCompound,age:2 },
  {id:'PER',full:'Sergio Pérez',        team:'Red Bull Racing', cc:'MEX',num:11,pos:20,gap:'+78.923',lap:'1:42.234',s1:'30.412',s2:'41.612',s3:'30.210',tire:'HARD'   as TireCompound,age:15},
];

function makeMock(offset: number): ProcessedDriver[] {
  const bestS1 = Math.min(...MOCK_RAW.map(d => +d.s1));
  const bestS2 = Math.min(...MOCK_RAW.map(d => +d.s2));
  const bestS3 = Math.min(...MOCK_RAW.map(d => +d.s3));
  const sc = (v: number, best: number): SectorColor =>
    v <= best + 0.001 ? 'purple' : v <= best + 0.3 ? 'green' : 'yellow';

  return MOCK_RAW.map((d, i) => {
    const [lng, lat] = COTA[(offset + i) % COTA.length];
    const color = TEAM_COLORS[d.team] ?? '#FFF';
    return {
      id:d.id, driverId:d.id, abbreviation:d.id, fullName:d.full,
      team:d.team, teamColor:color, flag:FLAG_CODES[d.cc]??'🏁', number:d.num,
      position:d.pos, positionChange:0, gap:d.gap, interval:d.gap,
      lastLap:d.lap, bestLap:d.lap, isFastestLap:d.id==='SAI',
      s1:d.s1, s2:d.s2, s3:d.s3,
      s1Color:sc(+d.s1,bestS1), s2Color:sc(+d.s2,bestS2), s3Color:sc(+d.s3,bestS3),
      tire:d.tire, tireAge:d.age,
      stints:[{compound:'SOFT' as TireCompound,laps:15},{compound:'MEDIUM' as TireCompound,laps:18},{compound:d.tire,laps:d.age}],
      lat, lng, name:d.full, color,
      throttle:80, brake:0, speed:280, drs:false, gear:7, rpm:11000,
      lapHistory:[98.2,98.5,98.1,98.3,98.4,98.0,98.2,98.1],
    };
  });
}

// ─── Legacy hook ──────────────────────────────────────────────────────────────

export function useOpenF1(sessionKey?: string, pollingInterval = 5000) {
  const [drivers,   setDrivers]   = useState<ApiDriver[]>([]);
  const [positions, setPositions] = useState<ApiPosition[]>([]);
  const [stints,    setStints]    = useState<ApiStint[]>([]);
  const [locations, setLocations] = useState<ApiLocation[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const sk = sessionKey || 'latest';

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.allSettled([
        apiFetch<ApiDriver>(`/drivers?session_key=${sk}`).then(setDrivers).catch(e=>setError(String(e))),
        apiFetch<ApiPosition>(`/position?session_key=${sk}`).then(setPositions).catch(()=>{}),
        apiFetch<ApiStint>(`/stints?session_key=${sk}`).then(setStints).catch(()=>{}),
        apiFetch<ApiLocation>(`/location?session_key=${sk}`).then(setLocations).catch(()=>{}),
      ]);
      setLoading(false);
    };
    init();
    const iv = setInterval(() => {
      apiFetch<ApiPosition>(`/position?session_key=${sk}`).then(setPositions).catch(()=>{});
    }, pollingInterval);
    return () => clearInterval(iv);
  }, [sk, pollingInterval]);

  return { drivers, positions, stints, locations, loading, error };
}

// ─── Main live hook ────────────────────────────────────────────────────────────
// FIXED: Staggered polling — split endpoints across different intervals
// to avoid hammering the API and getting 429 rate-limited.
//
// Poll schedule:
//   Every 3s:  position, intervals (race-critical, low payload)
//   Every 5s:  location/car_data (heavier, still important)
//   Every 10s: laps, stints, weather, race_control (slow-changing)
//   Every 30s: team_radio (very slow-changing)
//   Once:      drivers, session (static for a session)

export function useOpenF1Live(pollMs = 3000) {
  const [drivers,      setDrivers]      = useState<ApiDriver[]>([]);
  const [posMap,       setPosMap]       = useState<Record<number,ApiPosition>>({});
  const [locMap,       setLocMap]       = useState<Record<number,ApiLocation>>({});
  const [carMap,       setCarMap]       = useState<Record<number,ApiCarData>>({});
  const [stintMap,     setStintMap]     = useState<Record<number,ApiStint>>({});
  const [allStints,    setAllStints]    = useState<ApiStint[]>([]);
  const [lapMap,       setLapMap]       = useState<Record<number,ApiLap>>({});
  const [allLaps,      setAllLaps]      = useState<ApiLap[]>([]);
  const [intervalMap,  setIntervalMap]  = useState<Record<number,ApiInterval>>({});
  const [weather,      setWeather]      = useState<ApiWeather|null>(null);
  const [sessionInfo,  setSessionInfo]  = useState<SessionInfo|null>(null);
  const [raceControl,  setRaceControl]  = useState<ApiRaceControl[]>([]);
  const [radioMsgs,    setRadioMsgs]    = useState<ApiRadio[]>([]);
  const [isLive,       setIsLive]       = useState(false);
  const [trackOffset,  setTrackOffset]  = useState(0);
  const prevPosRef = useRef<Record<number,number>>({});
  const skRef      = useRef<number|string>('latest');

  // Session (once on mount)
  useEffect(() => {
    apiFetch<ApiSession>('/sessions?session_key=latest').then(([s]) => {
      if (!s) return;
      skRef.current = s.session_key;
      const now = Date.now();
      setIsLive(new Date(s.date_start).getTime() <= now && now <= new Date(s.date_end).getTime());
      setSessionInfo({
        meetingName:`${s.location} Grand Prix`, circuitName:s.circuit_short_name,
        location:s.location, country:s.country_name, flag:'green',
        currentLap:0, totalLaps:57, sessionType:s.session_type, sessionKey:s.session_key,
      });
    }).catch(() => setSessionInfo({
      meetingName:'United States Grand Prix', circuitName:'COTA',
      location:'Austin', country:'United States', flag:'green',
      currentLap:42, totalLaps:56, sessionType:'Race', sessionKey:0,
    }));
  }, []);

  // Drivers (once on mount)
  useEffect(() => {
    apiFetch<ApiDriver>('/drivers?session_key=latest').then(setDrivers).catch(()=>{});
  }, []);

  // Simulated movement when no live GPS
  useEffect(() => {
    const iv = setInterval(() => setTrackOffset(p => (p+1)%COTA.length), 2500);
    return () => clearInterval(iv);
  }, []);

  // FAST poll (3s): positions + intervals only
  useEffect(() => {
    const poll = async () => {
      const sk = skRef.current;
      await Promise.allSettled([
        apiFetch<ApiPosition>(`/position?session_key=${sk}`)
          .then(d => setPosMap(byDriver(d))),
        apiFetch<ApiInterval>(`/intervals?session_key=${sk}`)
          .then(d => setIntervalMap(byDriver(d))),
      ]);
    };
    poll();
    const iv = setInterval(poll, 3000);
    return () => clearInterval(iv);
  }, []);

  // MEDIUM poll (6s): location + car_data
  useEffect(() => {
    const poll = async () => {
      const sk = skRef.current;
      await Promise.allSettled([
        apiFetch<ApiLocation>(`/location?session_key=${sk}`)
          .then(d => setLocMap(byDriver(d))),
        apiFetch<ApiCarData>(`/car_data?session_key=${sk}`)
          .then(d => setCarMap(byDriver(d))),
      ]);
    };
    setTimeout(poll, 1500); // offset by 1.5s to stagger from fast poll
    const iv = setInterval(poll, 6000);
    return () => clearInterval(iv);
  }, []);

  // SLOW poll (12s): laps, stints, weather, race_control
  useEffect(() => {
    const poll = async () => {
      const sk = skRef.current;
      await Promise.allSettled([
        apiFetch<ApiLap>(`/laps?session_key=${sk}`).then(d => {
          setAllLaps(d);
          setLapMap(d.reduce((acc,l) => {
            if (!acc[l.driver_number]||l.lap_number>acc[l.driver_number].lap_number) acc[l.driver_number]=l;
            return acc;
          }, {} as Record<number,ApiLap>));
        }),
        apiFetch<ApiStint>(`/stints?session_key=${sk}`).then(d => {
          setAllStints(d);
          setStintMap(d.reduce((acc,s) => {
            if (!acc[s.driver_number]||s.lap_start>acc[s.driver_number].lap_start) acc[s.driver_number]=s;
            return acc;
          }, {} as Record<number,ApiStint>));
        }),
        apiFetch<ApiWeather>(`/weather?session_key=${sk}`)
          .then(d => { if(d.length) setWeather(d[d.length-1]); }),
        apiFetch<ApiRaceControl>(`/race_control?session_key=${sk}`)
          .then(setRaceControl),
      ]);
    };
    setTimeout(poll, 3000); // offset by 3s
    const iv = setInterval(poll, 12000);
    return () => clearInterval(iv);
  }, []);

  // VERY SLOW poll (30s): team radio
  useEffect(() => {
    const poll = () =>
      apiFetch<ApiRadio>(`/team_radio?session_key=${skRef.current}`)
        .then(d => setRadioMsgs(d.slice(-20)))
        .catch(()=>{});
    setTimeout(poll, 8000);
    const iv = setInterval(poll, 30000);
    return () => clearInterval(iv);
  }, []);

  // Update flag from race control
  useEffect(() => {
    if (!raceControl.length) return;
    const latest = [...raceControl].reverse().find(r=>r.flag);
    if (!latest?.flag) return;
    const map: Record<string,SessionInfo['flag']> = {
      GREEN:'green', YELLOW:'yellow', RED:'red', SAFETY_CAR:'safety-car', CHEQUERED:'finished',
    };
    setSessionInfo(p => p ? {...p, flag:map[latest.flag!.toUpperCase()]??'green'} : p);
  }, [raceControl.length]);

  // Real lap counter
  const currentLap = Object.values(lapMap).length
    ? Math.max(...Object.values(lapMap).map(l=>l.lap_number))
    : (sessionInfo?.currentLap ?? 0);

  useEffect(() => {
    if (currentLap > 0) setSessionInfo(p => p ? {...p,currentLap} : p);
  }, [currentLap]);

  // Best sectors globally
  const bestS = allLaps.reduce((b,l) => ({
    s1: l.duration_sector_1 && l.duration_sector_1<b.s1 ? l.duration_sector_1 : b.s1,
    s2: l.duration_sector_2 && l.duration_sector_2<b.s2 ? l.duration_sector_2 : b.s2,
    s3: l.duration_sector_3 && l.duration_sector_3<b.s3 ? l.duration_sector_3 : b.s3,
  }), {s1:Infinity,s2:Infinity,s3:Infinity});

  const fastestNum = Object.entries(lapMap).reduce((best,[num,l]) =>
    l.lap_duration && l.lap_duration < best.t ? {num:+num,t:l.lap_duration} : best
  , {num:-1,t:Infinity}).num;

  const sc = (v:number|null, best:number): SectorColor => {
    if (!v||v<=0) return null;
    if (v<=best+0.001) return 'purple';
    if (v<=best+0.300) return 'green';
    return 'yellow';
  };

  // Build processed drivers
  const mapDrivers: ProcessedDriver[] = (() => {
    if (!drivers.length) return makeMock(trackOffset);
    return drivers.map((d,i) => {
      const pos   = posMap[d.driver_number];
      const loc   = locMap[d.driver_number];
      const car   = carMap[d.driver_number];
      const stint = stintMap[d.driver_number];
      const lap   = lapMap[d.driver_number];
      const intv  = intervalMap[d.driver_number];
      const position = pos?.position ?? i+1;
      const prev     = prevPosRef.current[d.driver_number] ?? position;

      let lat=30.1349, lng=-97.6374;
      if (loc?.x!=null && loc?.y!=null) {
        [lat,lng] = circuitXYToLatLng(loc.x, loc.y, sessionInfo?.location??'Austin');
      } else {
        const ti=(trackOffset+i)%COTA.length; [lng,lat]=COTA[ti];
      }

      const tire    = COMPOUND_MAP[(stint?.compound??'').toUpperCase()]??'HARD';
      const tireAge = stint&&lap ? Math.max(0,lap.lap_number-stint.lap_start) : 0;

      const dStints = allStints
        .filter(s=>s.driver_number===d.driver_number)
        .sort((a,b)=>a.lap_start-b.lap_start)
        .map(s=>({compound:COMPOUND_MAP[(s.compound??'').toUpperCase()]??'HARD' as TireCompound, laps:(s.lap_end??currentLap)-s.lap_start}));

      let gap='LEADER';
      if (intv?.gap_to_leader!=null && position>1)
        gap = intv.gap_to_leader<60 ? `+${intv.gap_to_leader.toFixed(3)}` : `+${Math.floor(intv.gap_to_leader/60)}L`;

      const driverBestLap = allLaps
        .filter(l=>l.driver_number===d.driver_number&&l.lap_duration)
        .reduce((b,l)=>l.lap_duration!<b?l.lap_duration!:b, Infinity);

      const dLaps = allLaps.filter(l=>l.driver_number===d.driver_number&&l.lap_duration)
        .sort((a,b)=>a.lap_number-b.lap_number).slice(-8).map(l=>l.lap_duration!);

      const color = getColor(d);
      return {
        id:d.name_acronym, driverId:d.name_acronym, abbreviation:d.name_acronym,
        fullName:d.full_name, team:d.team_name, teamColor:color,
        flag:FLAG_CODES[d.country_code]??'🏁', number:d.driver_number, headshotUrl:d.headshot_url,
        position, positionChange:prev-position, gap, interval:gap,
        lastLap:fmtTime(lap?.lap_duration??null),
        bestLap:fmtTime(isFinite(driverBestLap)?driverBestLap:null),
        isFastestLap:d.driver_number===fastestNum,
        s1:fmtSec(lap?.duration_sector_1??null), s2:fmtSec(lap?.duration_sector_2??null), s3:fmtSec(lap?.duration_sector_3??null),
        s1Color:sc(lap?.duration_sector_1??null,bestS.s1),
        s2Color:sc(lap?.duration_sector_2??null,bestS.s2),
        s3Color:sc(lap?.duration_sector_3??null,bestS.s3),
        tire, tireAge, stints:dStints.length?dStints:[{compound:tire,laps:tireAge}],
        lat, lng, name:d.full_name, color,
        throttle:car?.throttle??0, brake:car?.brake??0, speed:car?.speed??0,
        drs:(car?.drs??0)>0, gear:car?.gear??1, rpm:car?.rpm??0,
        lapHistory:dLaps,
      };
    }).sort((a,b)=>a.position-b.position);
  })();

  useEffect(() => {
    prevPosRef.current = Object.fromEntries(mapDrivers.map(d=>[d.number,d.position]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapDrivers.map(d=>`${d.number}:${d.position}`).join()]);

  // Telemetry map
  const telemetryMap: Record<string,ProcessedTelemetry> = {};
  for (const d of mapDrivers) {
    const car   = carMap[d.number];
    const dLaps = allLaps.filter(l=>l.driver_number===d.number&&l.lap_duration)
      .sort((a,b)=>a.lap_number-b.lap_number);
    telemetryMap[d.id] = {
      speed:car?.speed??d.speed, throttle:car?.throttle??d.throttle,
      brake:car?.brake??0, gear:car?.gear??d.gear, rpm:car?.rpm??d.rpm,
      drs:(car?.drs??0)>0,
      tireWear:{fl:Math.max(0,80-d.tireAge*0.8),fr:Math.max(0,78-d.tireAge*0.9),rl:Math.max(0,82-d.tireAge*0.7),rr:Math.max(0,79-d.tireAge*0.85)},
      steeringAngle:0,
      gForce:{x:(car?.brake??0)>20?-((car?.brake??0)/100)*5.5:((car?.throttle??d.throttle)/100)*1.2,y:0,z:((car?.speed??d.speed)/350)*1.5},
      lapHistory:dLaps.slice(-8).map(l=>l.lap_duration!),
      sectorHistory:dLaps.slice(-8).map(l=>({lap:l.lap_number,s1:l.duration_sector_1,s2:l.duration_sector_2,s3:l.duration_sector_3})),
    };
  }

  // Weather
  const weatherInfo: WeatherInfo = weather ? {
    airTemp:weather.air_temperature, trackTemp:weather.track_temperature,
    windSpeed:weather.wind_speed, windDirection:weather.wind_direction,
    humidity:weather.humidity, pressure:weather.pressure, rainfall:weather.rainfall>0,
    conditions:weather.rainfall>0?'🌧 Wet':weather.air_temperature>32?'☀ Hot':'⛅ Clear',
  } : {airTemp:24,trackTemp:32,windSpeed:12,windDirection:270,humidity:45,pressure:1013,rainfall:false,conditions:'⛅ Clear'};

  // Race events
  const rcEvents: RaceEvent[] = raceControl.filter(r=>r.lap_number).slice(-15).reverse().map((r,i)=>({
    id:String(i), lap:r.lap_number??0,
    type:(r.category==='SafetyCar'?'safety_car':r.flag==='YELLOW'?'incident':r.flag==='RED'?'flag':'incident') as RaceEvent['type'],
    title:r.message.slice(0,60), description:r.message,
    timestamp:new Date(r.date).toLocaleTimeString(), drivers:r.driver_number?[String(r.driver_number)]:[],
  }));

  const fallbackEvents: RaceEvent[] = [
    {id:'1',lap:42,type:'overtake',    title:'Overtake – NOR on LEC',  description:'Norris makes a bold move into Turn 1',       timestamp:'14:32:15',drivers:['NOR','LEC']},
    {id:'2',lap:41,type:'fastest_lap', title:'Fastest Lap – SAI',       description:'Sainz sets purple in S2 & S3: 1:37.234',    timestamp:'14:30:42',drivers:['SAI']},
    {id:'3',lap:40,type:'pitstop',     title:'Pit Stop – RUS',          description:'Russell pits for Mediums – 2.3s stop',       timestamp:'14:28:18',drivers:['RUS']},
    {id:'4',lap:38,type:'incident',    title:'Track Limits – PER',      description:'Pérez exceeds limits at T19',                timestamp:'14:24:55',drivers:['PER']},
    {id:'5',lap:35,type:'pitstop',     title:'Double Stack – Ferrari',  description:'LEC 2.8s · SAI 3.1s, both onto Hards',       timestamp:'14:18:09',drivers:['LEC','SAI']},
    {id:'6',lap:33,type:'incident',    title:'Yellow Flag – Sector 2',  description:'Debris at Turn 9, marshals clearing',        timestamp:'14:14:22',drivers:[]},
    {id:'7',lap:28,type:'pitstop',     title:'Pit Stop – VER',          description:'Verstappen pits from lead – 2.1s for Hards', timestamp:'14:04:45',drivers:['VER']},
  ];
  const activeEvents = rcEvents.length ? rcEvents : fallbackEvents;

  const radioMessages: RadioMessage[] = radioMsgs.map(r => {
    const drv = mapDrivers.find(d=>d.number===r.driver_number);
    return {id:r.date,driverNumber:r.driver_number,driverAbbr:drv?.abbreviation??String(r.driver_number),teamColor:drv?.teamColor??'#fff',date:r.date,url:r.recording_url};
  }).reverse();

  const battles = mapDrivers.reduce((acc,d,i,arr) => {
    if (i===0) return acc;
    const gap = intervalMap[d.number]?.interval ?? 99;
    if (gap<=1.0) acc.push({driver1:arr[i-1].id,driver2:d.id,gap});
    return acc;
  }, [] as {driver1:string;driver2:string;gap:number}[]);

  const notifications = activeEvents.slice(0,3).map(e=>({id:e.id,type:e.type as any,title:e.title,timestamp:e.timestamp,lap:e.lap}));

  return {
    mapDrivers, leaderboard:mapDrivers, telemetryMap,
    raceEvents:activeEvents, notifications, sessionInfo, weatherInfo,
    isLive, battles, radioMessages, currentLap,
    totalLaps:sessionInfo?.totalLaps??56,
    drivers, positions:Object.values(posMap),
    locations:Object.values(locMap), stints:Object.values(stintMap),
    loading:false, error:null,
  };
}