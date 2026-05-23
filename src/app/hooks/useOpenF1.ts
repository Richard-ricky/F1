import { resolveCircuit } from './useCircuit';
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
  Montréal:     [-73.5212,  45.5046], Barcelona:    [2.2611,    41.5700],
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

// Resolves the GPS polyline for the current circuit — used for XY→LatLng conversion only.
function getCircuitTrack(location?: string | null): [number, number][] {
  return resolveCircuit(location).track as [number, number][];
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
    }).catch(() => {
      // API unavailable — leave sessionInfo as null, show loading state in UI
      console.warn('[useOpenF1Live] Could not fetch session info from OpenF1 API');
    });
  }, []);

  // Drivers (once on mount)
  useEffect(() => {
    apiFetch<ApiDriver>('/drivers?session_key=latest').then(setDrivers).catch(()=>{});
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
    if (!drivers.length) return [];  // No data yet — wait for real OpenF1 response
    return drivers.map((d,i) => {
      const pos   = posMap[d.driver_number];
      const loc   = locMap[d.driver_number];
      const car   = carMap[d.driver_number];
      const stint = stintMap[d.driver_number];
      const lap   = lapMap[d.driver_number];
      const intv  = intervalMap[d.driver_number];
      const position = pos?.position ?? i+1;
      const prev     = prevPosRef.current[d.driver_number] ?? position;

      const _centre = resolveCircuit(sessionInfo?.location).center;
      let lat = _centre[1], lng = _centre[0];
      if (loc?.x != null && loc?.y != null) {
        [lat, lng] = circuitXYToLatLng(loc.x, loc.y, sessionInfo?.location ?? 'Austin');
      }
      // No fake fallback — if OpenF1 has no location data yet, driver stays at circuit centre

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

  // Only show real race control events — no fabricated data
  const activeEvents = rcEvents;

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
    loading:!drivers.length && !sessionInfo, error:null,
  };
}