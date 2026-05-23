import { Calendar, Clock, MapPin, Cloud, Wind, Droplets, Thermometer, Radio } from 'lucide-react';
import { useF1Sessions } from '../hooks/useF1Sessions';
import type { WeatherInfo } from '../hooks/useOpenF1';

interface SessionInfoProps {
  weather?: WeatherInfo;
}

// 2025 F1 Calendar fallback
const F1_CALENDAR_2025 = [
  { round:1,  name:'Australian GP',    circuit:'Albert Park',              country:'🇦🇺', date:'Mar 16' },
  { round:2,  name:'Chinese GP',       circuit:'Shanghai International',   country:'🇨🇳', date:'Mar 23' },
  { round:3,  name:'Japanese GP',      circuit:'Suzuka',                   country:'🇯🇵', date:'Apr 6'  },
  { round:4,  name:'Bahrain GP',       circuit:'Bahrain International',    country:'🇧🇭', date:'Apr 13' },
  { round:5,  name:'Saudi Arabian GP', circuit:'Jeddah Corniche',          country:'🇸🇦', date:'Apr 20' },
  { round:6,  name:'Miami GP',         circuit:'Miami International',      country:'🇺🇸', date:'May 4'  },
  { round:7,  name:'Emilia Romagna GP',circuit:'Imola',                    country:'🇮🇹', date:'May 18' },
  { round:8,  name:'Monaco GP',        circuit:'Circuit de Monaco',        country:'🇲🇨', date:'May 25' },
  { round:9,  name:'Spanish GP',       circuit:'Barcelona-Catalunya',      country:'🇪🇸', date:'Jun 1'  },
  { round:10, name:'Canadian GP',      circuit:'Gilles Villeneuve',        country:'🇨🇦', date:'Jun 15' },
  { round:11, name:'Austrian GP',      circuit:'Red Bull Ring',            country:'🇦🇹', date:'Jun 29' },
  { round:12, name:'British GP',       circuit:'Silverstone',              country:'🇬🇧', date:'Jul 6'  },
  { round:13, name:'Belgian GP',       circuit:'Spa-Francorchamps',        country:'🇧🇪', date:'Jul 27' },
  { round:14, name:'Hungarian GP',     circuit:'Hungaroring',              country:'🇭🇺', date:'Aug 3'  },
  { round:15, name:'Dutch GP',         circuit:'Zandvoort',                country:'🇳🇱', date:'Aug 31' },
  { round:16, name:'Italian GP',       circuit:'Monza',                    country:'🇮🇹', date:'Sep 7'  },
  { round:17, name:'Azerbaijan GP',    circuit:'Baku City Circuit',        country:'🇦🇿', date:'Sep 21' },
  { round:18, name:'Singapore GP',     circuit:'Marina Bay Street',        country:'🇸🇬', date:'Oct 5'  },
  { round:19, name:'US GP',            circuit:'Circuit of the Americas',  country:'🇺🇸', date:'Oct 19' },
  { round:20, name:'Mexican GP',       circuit:'Hermanos Rodríguez',       country:'🇲🇽', date:'Oct 26' },
  { round:21, name:'Brazilian GP',     circuit:'Interlagos',               country:'🇧🇷', date:'Nov 9'  },
  { round:22, name:'Las Vegas GP',     circuit:'Las Vegas Street',         country:'🇺🇸', date:'Nov 22' },
  { round:23, name:'Qatar GP',         circuit:'Lusail International',     country:'🇶🇦', date:'Nov 30' },
  { round:24, name:'Abu Dhabi GP',     circuit:'Yas Marina',               country:'🇦🇪', date:'Dec 7'  },
];

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

        {/* ── Upcoming Sessions from API ── */}
        {upcomingSessions.length > 0 && (
          <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background:'rgba(255,255,255,0.03)' }}>
            <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-bold text-cyan-400 tracking-widest">UPCOMING SESSIONS</span>
            </div>
            <div className="divide-y divide-white/5">
              {upcomingSessions.slice(0,4).map(s => (
                <div key={s.session_key} className="px-4 py-3">
                  <div className="text-[11px] font-bold text-white">{s.session_name}</div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-white/50">
                    <MapPin className="w-3 h-3" />{s.circuit_short_name}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-white/50">
                    <Calendar className="w-3 h-3" />
                    {new Date(s.date_start).toLocaleDateString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 2025 Race Calendar ── */}
        <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background:'rgba(255,255,255,0.03)' }}>
          <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-bold text-cyan-400 tracking-widest">2025 SEASON CALENDAR</span>
          </div>
          <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
            {F1_CALENDAR_2025.map(race => (
              <div key={race.round} className="px-4 py-2.5 flex items-center gap-3 hover:bg-white/3 transition-colors">
                <div className="w-5 text-[10px] font-black text-white/30">{race.round}</div>
                <div className="text-lg leading-none">{race.country}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-white truncate">{race.name}</div>
                  <div className="text-[9px] text-white/35 truncate">{race.circuit}</div>
                </div>
                <div className="text-[10px] font-bold text-white/50 shrink-0">{race.date}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}