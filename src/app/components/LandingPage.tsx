import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

// ─── Shared Data ──────────────────────────────────────────────────────────────
interface Race { round:number; short:string; name:string; flag:string; date:string; done:boolean; winner:string|null; }
interface Driver { pos:number; code:string; name:string; team:string; pts:number; gap:string; color:string; }
interface TimingRow { pos:number; no:string; code:string; team:string; gap:string; s1:string; s2:string; s3:string; tyre:string; laps:number; color:string; }

const RACES: Race[] = [
  { round:1,  short:"AUS", name:"Australian",  flag:"AU", date:"2026-03-08", done:true,  winner:"Russell"   },
  { round:2,  short:"CHN", name:"Chinese",     flag:"CN", date:"2026-03-15", done:true,  winner:"Antonelli" },
  { round:3,  short:"JPN", name:"Japanese",    flag:"JP", date:"2026-03-29", done:true,  winner:"Antonelli" },
  { round:4,  short:"MIA", name:"Miami",       flag:"US", date:"2026-05-03", done:true,  winner:"Antonelli" },
  { round:5,  short:"CAN", name:"Canadian",    flag:"CA", date:"2026-05-24", done:false, winner:null },
  { round:6,  short:"MON", name:"Monaco",      flag:"MC", date:"2026-06-07", done:false, winner:null },
  { round:7,  short:"ESP", name:"Spanish",     flag:"ES", date:"2026-06-14", done:false, winner:null },
  { round:8,  short:"AUT", name:"Austrian",    flag:"AT", date:"2026-06-28", done:false, winner:null },
  { round:9,  short:"GBR", name:"British",     flag:"GB", date:"2026-07-06", done:false, winner:null },
  { round:10, short:"HUN", name:"Hungarian",   flag:"HU", date:"2026-07-19", done:false, winner:null },
  { round:11, short:"BEL", name:"Belgian",     flag:"BE", date:"2026-08-02", done:false, winner:null },
  { round:12, short:"NED", name:"Dutch",       flag:"NL", date:"2026-08-23", done:false, winner:null },
  { round:13, short:"ITA", name:"Italian",     flag:"IT", date:"2026-09-06", done:false, winner:null },
  { round:14, short:"MAD", name:"Madrid",      flag:"ES", date:"2026-09-13", done:false, winner:null },
  { round:15, short:"AZE", name:"Azerbaijan",  flag:"AZ", date:"2026-09-26", done:false, winner:null },
  { round:16, short:"SGP", name:"Singapore",   flag:"SG", date:"2026-10-11", done:false, winner:null },
  { round:17, short:"USA", name:"United States",flag:"US",date:"2026-10-25", done:false, winner:null },
  { round:18, short:"MEX", name:"Mexican",     flag:"MX", date:"2026-11-01", done:false, winner:null },
  { round:19, short:"BRA", name:"Brazilian",   flag:"BR", date:"2026-11-15", done:false, winner:null },
  { round:20, short:"LVS", name:"Las Vegas",   flag:"US", date:"2026-11-21", done:false, winner:null },
  { round:21, short:"QAT", name:"Qatar",       flag:"QA", date:"2026-11-29", done:false, winner:null },
  { round:22, short:"UAE", name:"Abu Dhabi",   flag:"AE", date:"2026-12-06", done:false, winner:null },
];

const WDC: Driver[] = [
  { pos:1, code:"ANT", name:"A. Antonelli", team:"Mercedes", pts:77,  gap:"—",     color:"#00D2BE" },
  { pos:2, code:"RUS", name:"G. Russell",   team:"Mercedes", pts:62,  gap:"-15",   color:"#00D2BE" },
  { pos:3, code:"NOR", name:"L. Norris",    team:"McLaren",  pts:54,  gap:"-23",   color:"#FF8000" },
  { pos:4, code:"LEC", name:"C. Leclerc",   team:"Ferrari",  pts:41,  gap:"-36",   color:"#E8002D" },
  { pos:5, code:"HAM", name:"L. Hamilton",  team:"Ferrari",  pts:38,  gap:"-39",   color:"#E8002D" },
  { pos:6, code:"VER", name:"M. Verstappen",team:"Red Bull", pts:29,  gap:"-48",   color:"#3671C6" },
];

const TIMING: TimingRow[] = [
  { pos:1, no:"63", code:"RUS", team:"Mercedes", gap:"LEADER",  s1:"24.431",s2:"28.114",s3:"20.302", tyre:"M", laps:14, color:"#00D2BE" },
  { pos:2, no:"12", code:"ANT", team:"Mercedes", gap:"+1.847",  s1:"24.512",s2:"28.201",s3:"20.389", tyre:"M", laps:14, color:"#00D2BE" },
  { pos:3, no:"4",  code:"NOR", team:"McLaren",  gap:"+3.211",  s1:"24.680",s2:"28.390",s3:"20.511", tyre:"H", laps:14, color:"#FF8000" },
  { pos:4, no:"16", code:"LEC", team:"Ferrari",  gap:"+5.780",  s1:"24.721",s2:"28.445",s3:"20.590", tyre:"H", laps:14, color:"#E8002D" },
  { pos:5, no:"44", code:"HAM", team:"Ferrari",  gap:"+8.023",  s1:"24.802",s2:"28.511",s3:"20.644", tyre:"M", laps:13, color:"#E8002D" },
  { pos:6, no:"1",  code:"VER", team:"Red Bull", gap:"+11.445", s1:"24.890",s2:"28.602",s3:"20.710", tyre:"H", laps:14, color:"#3671C6" },
  { pos:7, no:"55", code:"SAI", team:"Williams", gap:"+14.211", s1:"25.001",s2:"28.710",s3:"20.800", tyre:"M", laps:13, color:"#37BEDD" },
  { pos:8, no:"81", code:"PIA", team:"McLaren",  gap:"+17.880", s1:"25.102",s2:"28.802",s3:"20.901", tyre:"H", laps:14, color:"#FF8000" },
  { pos:9, no:"14", code:"ALO", team:"Aston",    gap:"+22.331", s1:"25.201",s2:"28.911",s3:"21.001", tyre:"H", laps:13, color:"#358C75" },
  { pos:10,no:"23", code:"ALB", team:"Williams", gap:"+25.771", s1:"25.310",s2:"29.020",s3:"21.111", tyre:"M", laps:14, color:"#37BEDD" },
];

const TELEMETRY_RAW = [38,42,55,70,85,60,91,74,88,65,78,95,50,83,67,72,89,58,76,93,45,68,82,77,90,63,87,71,84,96,52,79,69,88,75,93,61,86,73,95];

function getNext(): Race {
  const now = new Date();
  return RACES.find(r => new Date(r.date) >= now) ?? RACES[RACES.length - 1];
}
function countdown(dateStr: string): {d:number;h:number;m:number;s:number} {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return { d:0, h:0, m:0, s:0 };
  return { d:Math.floor(diff/86400000), h:Math.floor((diff%86400000)/3600000), m:Math.floor((diff%3600000)/60000), s:Math.floor((diff%60000)/1000) };
}
const pad = (n: number): string => String(n).padStart(2,"0");

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
export interface LandingProps { onEnter: () => void; }

function Landing({ onEnter }: LandingProps) {
  const next = getNext();
  const done = RACES.filter(r => r.done).length;
  const [cd, setCd] = useState(countdown(next.date));
  const [sec, setSec] = useState(0);
  const [telOff, setTelOff] = useState(0);
  const [flashSec, setFlashSec] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => { setCd(countdown(next.date)); setSec(s => s+1); }, 1000);
    return () => clearInterval(iv);
  }, [next.date]);

  useEffect(() => {
    const iv = setInterval(() => setTelOff(o => (o+1) % TELEMETRY_RAW.length), 100);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setFlashSec(s => (s+1) % 3), 1600);
    return () => clearInterval(iv);
  }, []);

  const tel = [...TELEMETRY_RAW.slice(telOff), ...TELEMETRY_RAW.slice(0, telOff)].slice(0, 30);
  const telPath = tel.map((v, i) => `${i === 0 ? "M" : "L"}${(i / 29) * 300},${55 - (v / 100) * 50}`).join(" ");
  const telArea = `${telPath} L300,55 L0,55 Z`;

  const tyreColor = (t: string): string => t === "M" ? "#FFD700" : t === "H" ? "#ccc" : "#E8002D";

  return (
    <div style={{
      minHeight:"100vh", background:"#0A0A0A", color:"#fff",
      fontFamily:"'Arial Narrow','Arial',sans-serif",
      overflow:"hidden", position:"relative",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@200;300;400;500;600;700&family=DM+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { display: none; }
        @keyframes live-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes tick-in { from{transform:translateY(-100%);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes tick-out { from{transform:translateY(0);opacity:1} to{transform:translateY(100%);opacity:0} }
        @keyframes h-scroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }
      `}</style>

      {/* Noise texture overlay */}
      <div style={{
        position:"fixed", inset:0, zIndex:0, pointerEvents:"none", opacity:0.03,
        backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundSize:"200px",
      }}/>

      {/* Top bar — raw, editorial */}
      <div style={{
        position:"fixed", top:0, left:0, right:0, zIndex:100,
        height:48, borderBottom:"1px solid rgba(255,255,255,0.08)",
        background:"rgba(10,10,10,0.96)",
        display:"flex", alignItems:"stretch",
      }}>
        {/* Logo cell */}
        <div style={{
          width:200, display:"flex", alignItems:"center", paddingLeft:24,
          borderRight:"1px solid rgba(255,255,255,0.08)",
        }}>
          <span style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:22, letterSpacing:"-0.02em", color:"#fff" }}>
            F1<span style={{ color:"#E8002D" }}>·</span>2026
          </span>
        </div>

        {/* Nav */}
        <div style={{ display:"flex", alignItems:"stretch", flex:1 }}>
          {["LIVE","SCHEDULE","STANDINGS","REPLAY"].map((item, i) => (
            <button key={item} onClick={i===0 ? onEnter : undefined} style={{
              background:"none", border:"none", cursor:"pointer",
              padding:"0 24px", color: i===0 ? "#fff" : "rgba(255,255,255,0.35)",
              fontFamily:"'Oswald',sans-serif", fontWeight:400, fontSize:12,
              letterSpacing:"0.15em", textTransform:"uppercase",
              borderBottom: i===0 ? "2px solid #E8002D" : "2px solid transparent",
              transition:"color 0.15s",
            }}>{item}</button>
          ))}
        </div>

        {/* Status */}
        <div style={{
          display:"flex", alignItems:"center", gap:8, paddingRight:24,
          borderLeft:"1px solid rgba(255,255,255,0.08)", paddingLeft:24,
        }}>
          <div style={{
            width:6, height:6, borderRadius:"50%", background:"#22c55e",
            animation:"live-pulse 1.5s ease-in-out infinite",
          }}/>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"rgba(255,255,255,0.4)", letterSpacing:"0.1em" }}>
            LIVE DATA
          </span>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ paddingTop:48, display:"grid", gridTemplateColumns:"1fr 1fr", minHeight:"100vh" }}>

        {/* ── LEFT: Hero ── */}
        <div style={{
          borderRight:"1px solid rgba(255,255,255,0.06)",
          display:"flex", flexDirection:"column",
          padding:"0 0 0 0",
          position:"relative",
        }}>

          {/* Round tag */}
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2 }}
            style={{
              padding:"14px 32px 0",
              display:"flex", alignItems:"center", gap:12,
            }}
          >
            <span style={{
              fontFamily:"'DM Mono',monospace", fontSize:9,
              color:"rgba(255,255,255,0.25)", letterSpacing:"0.2em", textTransform:"uppercase",
            }}>
              RND {String(next.round).padStart(2,"0")} / 22 &nbsp;·&nbsp; CIRCUIT GILLES VILLENEUVE
            </span>
          </motion.div>

          {/* BIG NAME */}
          <div style={{ padding:"12px 32px 0", flex:1, display:"flex", flexDirection:"column", justifyContent:"center" }}>
            <motion.div
              initial={{ opacity:0, y:32 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:0.3, duration:0.9, ease:[0.16,1,0.3,1] }}
            >
              <div style={{
                fontFamily:"'Oswald',sans-serif",
                fontSize:"clamp(64px,7.5vw,100px)",
                fontWeight:700,
                lineHeight:0.85,
                letterSpacing:"-0.03em",
                textTransform:"uppercase",
                color:"#fff",
              }}>
                {next.name}
              </div>
              <div style={{
                fontFamily:"'Oswald',sans-serif",
                fontSize:"clamp(64px,7.5vw,100px)",
                fontWeight:200,
                lineHeight:0.85,
                letterSpacing:"-0.03em",
                textTransform:"uppercase",
                color:"rgba(255,255,255,0.1)",
                WebkitTextStroke:"1px rgba(255,255,255,0.12)",
              }}>
                GRAND PRIX
              </div>
            </motion.div>

            {/* Date / Circuit meta */}
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.6 }}
              style={{
                marginTop:28, paddingTop:20,
                borderTop:"1px solid rgba(255,255,255,0.07)",
                display:"grid", gridTemplateColumns:"1fr 1fr",
                gap:"12px 0",
              }}
            >
              {[
                { l:"DATE", v: new Date(next.date).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}) },
                { l:"CIRCUIT", v:"Île Notre-Dame, Montréal" },
                { l:"LAPS", v:"70 × 4.361 km" },
                { l:"TOTAL", v:"305.270 km" },
              ].map(x => (
                <div key={x.l}>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:"rgba(255,255,255,0.2)", letterSpacing:"0.2em", marginBottom:3 }}>{x.l}</div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"rgba(255,255,255,0.6)" }}>{x.v}</div>
                </div>
              ))}
            </motion.div>

            {/* Countdown */}
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.75 }}
              style={{ marginTop:32 }}
            >
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:"rgba(255,255,255,0.2)", letterSpacing:"0.2em", marginBottom:14, textTransform:"uppercase" }}>
                Race begins in
              </div>
              <div style={{ display:"flex", alignItems:"baseline", gap:0 }}>
                {[{v:cd.d,l:"D"},{v:cd.h,l:"H"},{v:cd.m,l:"M"},{v:cd.s,l:"S"}].map((item, i) => (
                  <div key={item.l} style={{ display:"flex", alignItems:"baseline" }}>
                    {i > 0 && <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:40, fontWeight:200, color:"rgba(255,255,255,0.1)", margin:"0 8px" }}>:</span>}
                    <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                      <div style={{ overflow:"hidden", height:60, display:"flex", alignItems:"center" }}>
                        <AnimatePresence mode="popLayout">
                          <motion.span
                            key={pad(item.v)}
                            initial={{ y:-40, opacity:0 }}
                            animate={{ y:0, opacity:1 }}
                            exit={{ y:40, opacity:0 }}
                            transition={{ duration:0.2, ease:"easeOut" }}
                            style={{
                              fontFamily:"'Oswald',sans-serif",
                              fontSize:56, fontWeight:600,
                              color:"#fff", lineHeight:1,
                              letterSpacing:"-0.04em",
                              fontVariantNumeric:"tabular-nums",
                            }}
                          >{pad(item.v)}</motion.span>
                        </AnimatePresence>
                      </div>
                      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.2)", letterSpacing:"0.1em" }}>{item.l}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.9 }}
              style={{ marginTop:36, display:"flex", gap:16, alignItems:"center" }}
            >
              <motion.button
                whileHover={{ background:"#fff", color:"#0A0A0A" }}
                whileTap={{ scale:0.97 }}
                onClick={onEnter}
                style={{
                  background:"transparent",
                  border:"1px solid rgba(255,255,255,0.5)",
                  color:"#fff", padding:"13px 36px",
                  fontFamily:"'Oswald',sans-serif",
                  fontSize:12, fontWeight:400, letterSpacing:"0.18em",
                  textTransform:"uppercase", cursor:"pointer",
                  transition:"all 0.2s",
                }}
              >
                Open Live Dashboard
              </motion.button>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.2)" }}>
                {done}/22 complete
              </span>
            </motion.div>

            {/* WDC mini */}
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.1 }}
              style={{ marginTop:40, paddingTop:24, borderTop:"1px solid rgba(255,255,255,0.05)" }}
            >
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:"rgba(255,255,255,0.15)", letterSpacing:"0.2em", marginBottom:12 }}>
                WDC — TOP 3
              </div>
              <div style={{ display:"flex", gap:0 }}>
                {WDC.slice(0,3).map((d,i) => (
                  <div key={d.code} style={{
                    flex:1, padding:"10px 0 10px",
                    borderLeft: i>0 ? "1px solid rgba(255,255,255,0.06)" : "none",
                    paddingLeft: i>0 ? 16 : 0,
                  }}>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:"rgba(255,255,255,0.2)", marginBottom:4 }}>P{d.pos} · {d.team}</div>
                    <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:20, fontWeight:600, color:"#fff", letterSpacing:"0.04em" }}>{d.code}</div>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:d.color, marginTop:2, fontWeight:500 }}>{d.pts} pts</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── RIGHT: Live Timing Preview ── */}
        <motion.div
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.4, duration:0.8 }}
          style={{
            display:"flex", flexDirection:"column",
            overflow:"hidden",
          }}
        >
          {/* Timing header */}
          <div style={{
            height:48, borderBottom:"1px solid rgba(255,255,255,0.06)",
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"0 28px",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:"#E8002D", animation:"live-pulse 1.2s ease-in-out infinite" }}/>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.4)", letterSpacing:"0.15em" }}>LIVE TIMING — LAP 14/70</span>
            </div>
            <div style={{ display:"flex", gap:20 }}>
              {[{l:"TRACK",v:"+32°C"},{l:"AIR",v:"+24°C"},{l:"SC",v:"NONE"}].map(x => (
                <div key={x.l} style={{ textAlign:"right" }}>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:"rgba(255,255,255,0.2)", letterSpacing:"0.15em" }}>{x.l}</div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"rgba(255,255,255,0.6)" }}>{x.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Timing col headers */}
          <div style={{
            display:"grid",
            gridTemplateColumns:"28px 36px 56px 1fr 70px 70px 70px 20px",
            gap:0, padding:"8px 28px",
            borderBottom:"1px solid rgba(255,255,255,0.04)",
          }}>
            {["","NO","DRV","GAP","S1","S2","S3","T"].map((h,i) => (
              <span key={i} style={{
                fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:"0.15em",
                color:"rgba(255,255,255,0.18)", textAlign: i >= 4 ? "right" : "left",
              }}>{h}</span>
            ))}
          </div>

          {/* Timing rows */}
          <div style={{ flex:1, overflowY:"auto" }}>
            {TIMING.map((row, i) => (
              <motion.div
                key={row.no}
                initial={{ opacity:0, x:20 }}
                animate={{ opacity:1, x:0 }}
                transition={{ delay:0.6 + i*0.04 }}
                style={{
                  display:"grid",
                  gridTemplateColumns:"28px 36px 56px 1fr 70px 70px 70px 20px",
                  alignItems:"center",
                  gap:0, padding:"0 28px",
                  height:36,
                  background: row.pos===1 ? "rgba(255,255,255,0.025)" : "transparent",
                  borderBottom:"1px solid rgba(255,255,255,0.03)",
                  borderLeft: `2px solid ${row.pos<=3 ? row.color : "transparent"}`,
                }}
              >
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"rgba(255,255,255,0.25)", fontWeight: row.pos<=3 ? 500 : 300 }}>
                  {row.pos}
                </span>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:row.color, opacity:0.7 }}>
                  {row.no}
                </span>
                <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:14, fontWeight:500, color:"#fff", letterSpacing:"0.05em" }}>
                  {row.code}
                </span>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color: row.pos===1 ? row.color : "rgba(255,255,255,0.35)" }}>
                  {row.gap}
                </span>
                {[row.s1, row.s2, row.s3].map((s, si) => (
                  <span key={si} style={{
                    fontFamily:"'DM Mono',monospace", fontSize:9,
                    color: flashSec === si ? "#fff" : "rgba(255,255,255,0.2)",
                    textAlign:"right",
                    transition:"color 0.2s",
                  }}>{s}</span>
                ))}
                <span style={{
                  fontFamily:"'DM Mono',monospace", fontSize:9, textAlign:"right",
                  color: tyreColor(row.tyre), fontWeight:500,
                }}>{row.tyre}</span>
              </motion.div>
            ))}
          </div>

          {/* Telemetry strip */}
          <div style={{
            height:100,
            borderTop:"1px solid rgba(255,255,255,0.06)",
            padding:"14px 28px 0",
            background:"rgba(0,0,0,0.2)",
          }}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:"rgba(255,255,255,0.2)", letterSpacing:"0.15em", marginBottom:10 }}>
              RUS · THROTTLE %
            </div>
            <svg viewBox="0 0 300 60" width="100%" height="55" preserveAspectRatio="none">
              <defs>
                <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E8002D" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#E8002D" stopOpacity="0"/>
                </linearGradient>
              </defs>
              {[20,40,60,80].map(y => (
                <line key={y} x1="0" y1={55-(y/100)*50} x2="300" y2={55-(y/100)*50}
                  stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
              ))}
              <path d={telArea} fill="url(#tg)"/>
              <path d={telPath} fill="none" stroke="#E8002D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx={300} cy={55-(tel[tel.length-1]/100)*50} r="3" fill="#E8002D"/>
            </svg>
          </div>
        </motion.div>
      </div>

      {/* Bottom: Season strip */}
      <div style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:100,
        height:48, borderTop:"1px solid rgba(255,255,255,0.06)",
        background:"rgba(10,10,10,0.97)",
        display:"flex", alignItems:"stretch", overflow:"hidden",
      }}>
        <div style={{
          width:200, display:"flex", alignItems:"center", paddingLeft:24, flexShrink:0,
          borderRight:"1px solid rgba(255,255,255,0.06)",
        }}>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.2)", letterSpacing:"0.12em" }}>
            2026 · 22 ROUNDS
          </span>
        </div>
        <div style={{ flex:1, overflow:"hidden", position:"relative" }}>
          <div style={{ display:"flex", alignItems:"stretch", height:"100%" }}>
            {RACES.map(race => {
              const isNext = race.round === next.round;
              return (
                <div key={race.round} style={{
                  display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center",
                  flexShrink:0, minWidth: isNext ? 80 : 54, padding:"0 8px",
                  borderRight:"1px solid rgba(255,255,255,0.04)",
                  background: isNext ? "rgba(232,0,45,0.08)" : "transparent",
                  borderTop: isNext ? "2px solid #E8002D" : "2px solid transparent",
                  position:"relative",
                }}>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, letterSpacing:"0.1em", marginBottom:2,
                    color: isNext ? "#E8002D" : race.done ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.25)" }}>
                    {isNext ? "NEXT" : `R${race.round}`}
                  </div>
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, fontWeight:500,
                    color: isNext ? "#fff" : race.done ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.5)" }}>
                    {race.short}
                  </div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:"rgba(255,255,255,0.15)", marginTop:1 }}>
                    {race.done && race.winner ? race.winner.slice(0,3).toUpperCase() : new Date(race.date).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Default export matches: import LandingPage from './components/LandingPage'
export default Landing;