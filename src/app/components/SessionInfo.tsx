import { Calendar, Clock, MapPin, Cloud, Wind, Droplets, Thermometer, Radio } from 'lucide-react';
import { useF1Sessions } from '../hooks/useF1Sessions';
import type { WeatherInfo } from '../hooks/useOpenF1';

interface SessionInfoProps {
  weather?: WeatherInfo;
}

export default function SessionInfo({ weather }: SessionInfoProps) {
  const { currentSession, upcomingSessions, meetings, loading } = useF1Sessions();

  const liveWeather: WeatherInfo = weather ?? {
    airTemp:24, trackTemp:32, windSpeed:12, windDirection:270,
    humidity:45, pressure:1013, rainfall:false, conditions:'⛅ Clear',
  };

  const windDir = (deg: number) => {
    const dirs = ['N','NE','E','SE','S','SW','W','NW'];
    return dirs[Math.round(deg / 45) % 8];
  };

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const fmtDateTime = (s: string) =>
    new Date(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const now = new Date();

  return (
    <div className="h-full overflow-auto" style={{ scrollbarWidth:'thin', scrollbarColor:'rgba(255,255,255,0.1) transparent' }}>
      <div className="p-4 space-y-4">

        {/* ── Live Session ── */}
        {loading ? (
          <div className="p-4 rounded-xl border border-white/8 text-xs text-white/40 text-center">
            Loading session data…
          </div>
        ) : currentSession ? (
          <div className="p-4 rounded-xl border border-green-500/30" style={{ background:'rgba(16,185,129,0.08)' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <div className="text-[10px] font-bold text-green-400 tracking-widest">LIVE SESSION</div>
            </div>
            <div className="text-base font-bold text-white mb-2">{currentSession.session_name}</div>
            <div className="flex items-center gap-2 text-[11px] text-white/60 mb-1">
              <MapPin className="w-3 h-3" />
              {currentSession.location}, {currentSession.country_name}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-white/60">
              <Clock className="w-3 h-3" />
              {new Date(currentSession.date_start).toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-white/8" style={{ background:'rgba(255,255,255,0.03)' }}>
            <div className="text-[10px] font-bold text-white/40 mb-1">NO LIVE SESSION</div>
            <div className="text-[11px] text-white/30">No race currently in progress</div>
          </div>
        )}

        {/* ── Weather ── */}
        <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background:'rgba(255,255,255,0.03)' }}>
          <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
            <Cloud className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-bold text-cyan-400 tracking-widest">TRACK CONDITIONS</span>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {[
              { icon:Thermometer, label:'Air Temp',   value:`${liveWeather.airTemp}°C`,   color:'#f97316' },
              { icon:Thermometer, label:'Track Temp', value:`${liveWeather.trackTemp}°C`, color:'#ef4444' },
              { icon:Wind,        label:'Wind',       value:`${liveWeather.windSpeed} km/h ${windDir(liveWeather.windDirection)}`, color:'#60a5fa' },
              { icon:Droplets,    label:'Humidity',   value:`${liveWeather.humidity}%`,   color:'#34d399' },
            ].map(w => (
              <div key={w.label} className="flex items-center gap-2">
                <w.icon className="w-3.5 h-3.5 shrink-0" style={{ color:w.color }} />
                <div>
                  <div className="text-[9px] text-white/40">{w.label}</div>
                  <div className="text-[11px] font-bold text-white">{w.value}</div>
                </div>
              </div>
            ))}
            <div className="col-span-2 pt-2 border-t border-white/5">
              <span className="text-[10px] text-white/60">{liveWeather.conditions}</span>
              {liveWeather.rainfall && (
                <span className="ml-2 text-[9px] font-bold text-blue-400 px-2 py-0.5 rounded"
                  style={{ background:'rgba(59,130,246,0.2)' }}>RAIN</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Upcoming Sessions (live from OpenF1) ── */}
        {upcomingSessions.length > 0 && (
          <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background:'rgba(255,255,255,0.03)' }}>
            <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-bold text-cyan-400 tracking-widest">UPCOMING SESSIONS</span>
            </div>
            <div className="divide-y divide-white/5">
              {upcomingSessions.slice(0, 4).map(s => (
                <div key={s.session_key} className="px-4 py-3">
                  <div className="text-[11px] font-bold text-white">{s.session_name}</div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-white/50">
                    <MapPin className="w-3 h-3" />{s.circuit_short_name}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-white/50">
                    <Calendar className="w-3 h-3" />
                    {fmtDateTime(s.date_start)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Season Calendar — live from OpenF1 meetings API ── */}
        <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background:'rgba(255,255,255,0.03)' }}>
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-bold text-cyan-400 tracking-widest">
                {meetings.length > 0
                  ? `${meetings[0]?.year ?? new Date().getFullYear()} SEASON CALENDAR`
                  : 'SEASON CALENDAR'}
              </span>
            </div>
            {meetings.length > 0 && (
              <span className="text-[9px] text-white/30">
                {meetings.length} rounds
              </span>
            )}
          </div>

          {loading ? (
            <div className="px-4 py-6 text-center text-[11px] text-white/30">
              Loading calendar…
            </div>
          ) : meetings.length === 0 ? (
            <div className="px-4 py-6 text-center text-[11px] text-white/30">
              Calendar unavailable — check connection
            </div>
          ) : (
            <div className="divide-y divide-white/5 max-h-80 overflow-y-auto"
              style={{ scrollbarWidth:'thin', scrollbarColor:'rgba(255,255,255,0.08) transparent' }}>
              {meetings.map((m, i) => {
                const isPast   = new Date(m.date_start) < now;
                const isNext   = !isPast && meetings.slice(0, i).every(p => new Date(p.date_start) < now);

                return (
                  <div
                    key={m.meeting_key}
                    className="px-4 py-2.5 flex items-center gap-3 transition-colors"
                    style={{
                      background: isNext ? 'rgba(225,6,0,0.06)' : 'transparent',
                      borderLeft: isNext ? '2px solid #E8002D' : '2px solid transparent',
                      opacity: isPast ? 0.45 : 1,
                    }}
                  >
                    {/* Round number */}
                    <div className="w-5 text-[10px] font-black shrink-0"
                      style={{ color: isNext ? '#E8002D' : 'rgba(255,255,255,0.25)' }}>
                      {i + 1}
                    </div>

                    {/* Country name → derive flag emoji from country_name */}
                    <div className="text-base leading-none shrink-0" title={m.country_name}>
                      {countryFlag(m.country_name)}
                    </div>

                    {/* Meeting name + circuit */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-white truncate flex items-center gap-2">
                        {m.meeting_name}
                        {isNext && (
                          <span className="text-[8px] font-black text-red-400 tracking-widest shrink-0">NEXT</span>
                        )}
                      </div>
                      <div className="text-[9px] truncate" style={{ color:'rgba(255,255,255,0.35)' }}>
                        {m.circuit_short_name}
                      </div>
                    </div>

                    {/* Date */}
                    <div className="text-[10px] font-bold shrink-0"
                      style={{ color: isNext ? '#E8002D' : isPast ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.5)' }}>
                      {fmtDate(m.date_start)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── Country name → flag emoji ────────────────────────────────────────────────
// Converts OpenF1 country_name strings to flag emojis without a lookup table.
// Derives the ISO 3166-1 alpha-2 code from known country names.
function countryFlag(countryName: string): string {
  const map: Record<string, string> = {
    'Australia':'AU', 'China':'CN', 'Japan':'JP', 'Bahrain':'BH',
    'Saudi Arabia':'SA', 'United States':'US', 'Italy':'IT',
    'Monaco':'MC', 'Spain':'ES', 'Canada':'CA', 'Austria':'AT',
    'United Kingdom':'GB', 'Belgium':'BE', 'Hungary':'HU',
    'Netherlands':'NL', 'Azerbaijan':'AZ', 'Singapore':'SG',
    'Mexico':'MX', 'Brazil':'BR', 'United Arab Emirates':'AE',
    'Qatar':'QA', 'France':'FR', 'Portugal':'PT',
  };
  const code = map[countryName];
  if (!code) return '🏁';
  return code.toUpperCase().split('').map(c =>
    String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0))
  ).join('');
}

