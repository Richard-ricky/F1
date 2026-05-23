import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

interface Race { round:number; short:string; name:string; flag:string; date:string; done:boolean; winner:string|null; }
interface WdcDriver { pos:number; code:string; name:string; team:string; pts:number; color:string; }
interface TimingRow { pos:number; no:string; code:string; team:string; gap:string; s1:string; s2:string; s3:string; tyre:string; laps:number; color:string; }
interface NewsItem { tag:string; headline:string; body:string; time:string; source:string; url:string; }

const RACES: Race[] = [
  { round:1,  short:"AUS", name:"Australian",   flag:"AU", date:"2026-03-08", done:true,  winner:"Russell"   },
  { round:2,  short:"CHN", name:"Chinese",      flag:"CN", date:"2026-03-15", done:true,  winner:"Antonelli" },
  { round:3,  short:"JPN", name:"Japanese",     flag:"JP", date:"2026-03-29", done:true,  winner:"Antonelli" },
  { round:4,  short:"MIA", name:"Miami",        flag:"US", date:"2026-05-03", done:true,  winner:"Antonelli" },
  { round:5,  short:"CAN", name:"Canadian",     flag:"CA", date:"2026-05-24", done:false, winner:null },
  { round:6,  short:"MON", name:"Monaco",       flag:"MC", date:"2026-06-07", done:false, winner:null },
  { round:7,  short:"ESP", name:"Spanish",      flag:"ES", date:"2026-06-14", done:false, winner:null },
  { round:8,  short:"AUT", name:"Austrian",     flag:"AT", date:"2026-06-28", done:false, winner:null },
  { round:9,  short:"GBR", name:"British",      flag:"GB", date:"2026-07-06", done:false, winner:null },
  { round:10, short:"HUN", name:"Hungarian",    flag:"HU", date:"2026-07-19", done:false, winner:null },
  { round:11, short:"BEL", name:"Belgian",      flag:"BE", date:"2026-08-02", done:false, winner:null },
  { round:12, short:"NED", name:"Dutch",        flag:"NL", date:"2026-08-23", done:false, winner:null },
  { round:13, short:"ITA", name:"Italian",      flag:"IT", date:"2026-09-06", done:false, winner:null },
  { round:14, short:"MAD", name:"Madrid",       flag:"ES", date:"2026-09-13", done:false, winner:null },
  { round:15, short:"AZE", name:"Azerbaijan",   flag:"AZ", date:"2026-09-26", done:false, winner:null },
  { round:16, short:"SGP", name:"Singapore",    flag:"SG", date:"2026-10-11", done:false, winner:null },
  { round:17, short:"USA", name:"United States",flag:"US", date:"2026-10-25", done:false, winner:null },
  { round:18, short:"MEX", name:"Mexican",      flag:"MX", date:"2026-11-01", done:false, winner:null },
  { round:19, short:"BRA", name:"Brazilian",    flag:"BR", date:"2026-11-15", done:false, winner:null },
  { round:20, short:"LVS", name:"Las Vegas",    flag:"US", date:"2026-11-21", done:false, winner:null },
  { round:21, short:"QAT", name:"Qatar",        flag:"QA", date:"2026-11-29", done:false, winner:null },
  { round:22, short:"UAE", name:"Abu Dhabi",    flag:"AE", date:"2026-12-06", done:false, winner:null },
];

const WDC: WdcDriver[] = [
  { pos:1, code:"ANT", name:"K. Antonelli", team:"Mercedes", pts:77, color:"#00D2BE" },
  { pos:2, code:"RUS", name:"G. Russell",   team:"Mercedes", pts:62, color:"#00D2BE" },
  { pos:3, code:"NOR", name:"L. Norris",    team:"McLaren",  pts:54, color:"#FF8000" },
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
];

const NEWS: NewsItem[] = [
  { tag:"FP1 RESULT", headline:"Antonelli leads Russell in disrupted Canadian GP practice", body:"Mercedes dominated FP1 at Montreal. Three red flags — Lawson car failure, Albon hitting a groundhog, Ocon spinning — extended the session. Antonelli's 1:13.402 left him a tenth clear of Russell.", time:"22 May · 2h ago", source:"Formula1.com", url:"https://www.formula1.com/en/latest/article/fp1-antonelli-leads-russell-as-mercedes-dominate-disrupted-canadian-gp-practice-session.52B0jh2hwB6deh2lcWmGt5" },
  { tag:"TITLE FIGHT", headline:"Antonelli holds 20-point lead heading into Sprint weekend", body:"The 19-year-old Italian leads team-mate Russell after three consecutive victories. Russell won Canada last year and arrives with a major upgrade package.", time:"22 May · 3h ago", source:"Sky Sports F1", url:"https://www.skysports.com/f1/news/12433/13542703" },
  { tag:"UPGRADES", headline:"Mercedes unwrap first major upgrade of the 2026 season", body:"Mercedes have brought a substantial aero package to Montreal. McLaren also arrives with new developments after closing the gap significantly in Miami.", time:"22 May · 4h ago", source:"The Race", url:"https://www.the-race.com/formula-1/canadian-grand-prix-f1-practice-results-2026/" },
  { tag:"INCIDENT", headline:"Albon crashes after hitting groundhog on track", body:"Williams driver Alex Albon struck a groundhog during FP1, damaging his front wing and triggering the second of three red flags in a chaotic session.", time:"22 May · 5h ago", source:"GPFans", url:"https://www.gpfans.com/en/f1-news/1084131" },
  { tag:"WEATHER", headline:"Dry Friday — rain risk grows for Saturday qualifying", body:"FP1 benefits from dry conditions and 17°C. A weather front moves in overnight with a small rain risk for Saturday qualifying threatening to shake up the grid.", time:"22 May · 6h ago", source:"GPFans", url:"https://www.gpfans.com/en/f1-news/1084131" },
  { tag:"SCHEDULE", headline:"Race pushed to 4pm local to avoid Indy 500 clash", body:"Sunday's start time moved to 4:00 pm local (9:00 pm BST) to minimise overlap with the Indianapolis 500 — motorsport's historic triple crown weekend.", time:"21 May · 1d ago", source:"ESPN", url:"https://www.espn.com/f1/story/_/id/48638259" },
];

const TELEMETRY_RAW = [38,42,55,70,85,60,91,74,88,65,78,95,50,83,67,72,89,58,76,93,45,68,82,77,90,63,87,71,84,96];

function getNext(): Race {
  const now = new Date();
  return RACES.find(r => new Date(r.date) >= now) ?? RACES[RACES.length - 1];
}
function countdown(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return { d:0, h:0, m:0, s:0 };
  return { d:Math.floor(diff/86400000), h:Math.floor((diff%86400000)/3600000), m:Math.floor((diff%3600000)/60000), s:Math.floor((diff%60000)/1000) };
}
const pad = (n: number) => String(n).padStart(2,"0");
const tyreColor = (t: string) => t==="M"?"#FFD700":t==="H"?"#ccc":"#E8002D";

export interface LandingProps { onEnter: () => void; }

function Landing({ onEnter }: LandingProps) {
  const next = getNext();
  const done = RACES.filter(r => r.done).length;
  const [cd, setCd] = useState(countdown(next.date));
  const [telOff, setTelOff] = useState(0);
  const [flashSec, setFlashSec] = useState(0);
  const [tab, setTab] = useState<"timing"|"news">("timing");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setCd(countdown(next.date)), 1000);
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
  const telPath = tel.map((v, i) => `${i===0?"M":"L"}${(i/29)*300},${55-(v/100)*50}`).join(" ");
  const telArea = `${telPath} L300,55 L0,55 Z`;

  return (
    <div style={{
      width:"100vw", height:"100vh",
      background:"#0A0A0A", color:"#fff",
      fontFamily:"'Arial Narrow','Arial',sans-serif",
      overflow:"hidden", display:"flex", flexDirection:"column",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@200;300;400;500;600;700&family=DM+Mono:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        ::-webkit-scrollbar { width:3px; background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); }
        @keyframes live-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      {/* ── TOP BAR ── */}
      <div style={{
        height: isMobile ? 52 : 48, flexShrink:0,
        borderBottom:"1px solid rgba(255,255,255,0.08)",
        background:"rgba(10,10,10,0.98)",
        display:"flex", alignItems:"stretch",
      }}>
        <div style={{
          width: isMobile ? 56 : 200, display:"flex", alignItems:"center",
          paddingLeft: isMobile ? 16 : 24,
          borderRight:"1px solid rgba(255,255,255,0.08)", flexShrink:0,
        }}>
          <span style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize: isMobile ? 18 : 22, letterSpacing:"-0.02em" }}>
            F1<span style={{ color:"#E8002D" }}>·</span>{!isMobile && "2026"}
          </span>
        </div>

        {/* Center — race name on mobile */}
        <div style={{ flex:1, display:"flex", alignItems:"center", padding:"0 16px", overflow:"hidden" }}>
          {isMobile ? (
            <div style={{ display:"flex", flexDirection:"column" }}>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:"rgba(255,255,255,0.3)", letterSpacing:"0.18em", textTransform:"uppercase" }}>
                RND {String(next.round).padStart(2,"0")} / 22
              </span>
              <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:14, fontWeight:600, color:"#fff", letterSpacing:"0.04em", textTransform:"uppercase" }}>
                {next.name} Grand Prix
              </span>
            </div>
          ) : (
            <div style={{ display:"flex", gap:24 }}>
              {["LIVE","SCHEDULE","STANDINGS","REPLAY"].map((item, i) => (
                <button key={item} onClick={i===0 ? onEnter : undefined} style={{
                  background:"none", border:"none", cursor: i===0 ? "pointer" : "default",
                  padding:"0", color: i===0 ? "#fff" : "rgba(255,255,255,0.35)",
                  fontFamily:"'Oswald',sans-serif", fontWeight:400, fontSize:12,
                  letterSpacing:"0.15em", textTransform:"uppercase",
                  borderBottom: i===0 ? "2px solid #E8002D" : "2px solid transparent",
                  paddingBottom: 2,
                }}>{item}</button>
              ))}
            </div>
          )}
        </div>

        {/* Right */}
        <div style={{ display:"flex", alignItems:"center", gap:8, paddingRight: isMobile ? 12 : 24, borderLeft:"1px solid rgba(255,255,255,0.06)", paddingLeft: isMobile ? 12 : 24, flexShrink:0 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", animation:"live-pulse 1.5s ease-in-out infinite" }}/>
          {!isMobile && <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"rgba(255,255,255,0.4)", letterSpacing:"0.1em" }}>LIVE DATA</span>}
          {isMobile && (
            <motion.button
              whileTap={{ scale:0.96 }}
              onClick={onEnter}
              style={{
                background:"#E8002D", border:"none", color:"#fff",
                padding:"6px 14px", fontFamily:"'Oswald',sans-serif",
                fontSize:11, fontWeight:600, letterSpacing:"0.12em",
                textTransform:"uppercase", cursor:"pointer",
              }}
            >ENTER</motion.button>
          )}
        </div>
      </div>

      {/* ── BODY ── */}
      {isMobile ? (
        // ════ MOBILE LAYOUT: single column, scrollable ════
        <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column" }}>

          {/* Hero block */}
          <div style={{ padding:"20px 20px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
            {/* Round tag */}
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:"rgba(255,255,255,0.25)", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:8 }}>
              GILLES VILLENEUVE · MONTRÉAL
            </div>
            {/* Big name */}
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:52, fontWeight:700, lineHeight:0.85, letterSpacing:"-0.02em", textTransform:"uppercase", color:"#fff", marginBottom:4 }}>
              {next.name}
            </div>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:52, fontWeight:200, lineHeight:0.85, letterSpacing:"-0.02em", textTransform:"uppercase", color:"rgba(255,255,255,0.1)", WebkitTextStroke:"1px rgba(255,255,255,0.12)", marginBottom:20 }}>
              GRAND PRIX
            </div>

            {/* Meta row */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px 0", paddingTop:16, borderTop:"1px solid rgba(255,255,255,0.07)", marginBottom:20 }}>
              {[
                { l:"DATE", v: new Date(next.date).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}) },
                { l:"LAPS", v:"70 × 4.361 km" },
              ].map(x => (
                <div key={x.l}>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:"rgba(255,255,255,0.2)", letterSpacing:"0.2em", marginBottom:2 }}>{x.l}</div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"rgba(255,255,255,0.6)" }}>{x.v}</div>
                </div>
              ))}
            </div>

            {/* Countdown */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:"rgba(255,255,255,0.2)", letterSpacing:"0.2em", marginBottom:10, textTransform:"uppercase" }}>Race begins in</div>
              <div style={{ display:"flex", alignItems:"baseline", gap:0 }}>
                {[{v:cd.d,l:"D"},{v:cd.h,l:"H"},{v:cd.m,l:"M"},{v:cd.s,l:"S"}].map((item, i) => (
                  <div key={item.l} style={{ display:"flex", alignItems:"baseline" }}>
                    {i > 0 && <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:24, fontWeight:200, color:"rgba(255,255,255,0.1)", margin:"0 4px" }}>:</span>}
                    <div style={{ display:"flex", alignItems:"baseline", gap:2 }}>
                      <div style={{ overflow:"hidden", height:44 }}>
                        <AnimatePresence mode="popLayout">
                          <motion.span key={pad(item.v)}
                            initial={{ y:-30, opacity:0 }} animate={{ y:0, opacity:1 }} exit={{ y:30, opacity:0 }}
                            transition={{ duration:0.18, ease:"easeOut" }}
                            style={{ fontFamily:"'Oswald',sans-serif", fontSize:40, fontWeight:600, color:"#fff", lineHeight:1, letterSpacing:"-0.04em", fontVariantNumeric:"tabular-nums", display:"block" }}
                          >{pad(item.v)}</motion.span>
                        </AnimatePresence>
                      </div>
                      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:"rgba(255,255,255,0.2)", letterSpacing:"0.1em" }}>{item.l}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <motion.button
              whileHover={{ background:"#fff", color:"#0A0A0A" }}
              whileTap={{ scale:0.97 }}
              onClick={onEnter}
              style={{
                width:"100%", background:"transparent",
                border:"1px solid rgba(255,255,255,0.4)", color:"#fff",
                padding:"14px", fontFamily:"'Oswald',sans-serif",
                fontSize:13, fontWeight:400, letterSpacing:"0.2em",
                textTransform:"uppercase", cursor:"pointer", transition:"all 0.2s",
                marginBottom:16,
              }}
            >Open Live Dashboard</motion.button>

            {/* WDC mini */}
            <div style={{ display:"flex", gap:0, borderTop:"1px solid rgba(255,255,255,0.05)", paddingTop:14 }}>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:"rgba(255,255,255,0.15)", letterSpacing:"0.15em", marginRight:16, alignSelf:"center", flexShrink:0 }}>WDC</div>
              {WDC.map((d, i) => (
                <div key={d.code} style={{ flex:1, paddingLeft: i>0 ? 12 : 0, borderLeft: i>0 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:"rgba(255,255,255,0.2)", marginBottom:2 }}>P{d.pos}</div>
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:16, fontWeight:600, color:"#fff" }}>{d.code}</div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:d.color, fontWeight:500 }}>{d.pts}pts</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tab switcher — Timing | News */}
          <div style={{ display:"flex", borderBottom:"1px solid rgba(255,255,255,0.06)", flexShrink:0 }}>
            {(["timing","news"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex:1, height:44, background:"none", border:"none",
                cursor:"pointer", fontFamily:"'Oswald',sans-serif",
                fontSize:12, fontWeight:500, letterSpacing:"0.15em", textTransform:"uppercase",
                color: tab===t ? "#fff" : "rgba(255,255,255,0.3)",
                borderBottom: tab===t ? "2px solid #E8002D" : "2px solid transparent",
                transition:"all 0.15s",
              }}>{t==="timing" ? "⏱ Live Timing" : "📰 News"}</button>
            ))}
          </div>

          {/* Tab content */}
          {tab === "timing" ? (
            <div style={{ flex:1 }}>
              {/* Timing header */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px 8px", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <div style={{ width:5, height:5, borderRadius:"50%", background:"#E8002D", animation:"live-pulse 1.2s ease-in-out infinite" }}/>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:"rgba(255,255,255,0.4)", letterSpacing:"0.12em" }}>LIVE · LAP 14/70</span>
                </div>
                <div style={{ display:"flex", gap:12 }}>
                  {[{l:"TRK",v:"+32°C"},{l:"SC",v:"NONE"}].map(x => (
                    <div key={x.l}>
                      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:"rgba(255,255,255,0.2)" }}>{x.l} </span>
                      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.6)" }}>{x.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile timing rows — simplified 3-col layout */}
              {TIMING.map((row, i) => (
                <div key={row.no} style={{
                  display:"grid", gridTemplateColumns:"32px 1fr auto auto",
                  alignItems:"center", gap:0, padding:"0 16px", height:46,
                  background: row.pos===1 ? "rgba(255,255,255,0.02)" : i%2===0 ? "rgba(255,255,255,0.008)" : "transparent",
                  borderBottom:"1px solid rgba(255,255,255,0.03)",
                  borderLeft:`3px solid ${row.pos<=3 ? row.color : "transparent"}`,
                }}>
                  {/* Pos + code */}
                  <div>
                    <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:16, fontWeight:600, color: row.pos<=3 ? "#fff" : "rgba(255,255,255,0.3)", lineHeight:1 }}>{row.pos}</div>
                  </div>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:16, fontWeight:500, color:"#fff", letterSpacing:"0.04em" }}>{row.code}</span>
                      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:row.color, opacity:0.7 }}>#{row.no}</span>
                    </div>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:"rgba(255,255,255,0.2)", marginTop:1 }}>{row.team}</div>
                  </div>
                  {/* Gap */}
                  <div style={{ textAlign:"right", paddingRight:12 }}>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color: row.pos===1 ? row.color : "rgba(255,255,255,0.45)" }}>{row.gap}</div>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:"rgba(255,255,255,0.2)", marginTop:1 }}>L{row.laps}</div>
                  </div>
                  {/* Tyre */}
                  <div style={{
                    width:28, height:28, borderRadius:"50%", flexShrink:0,
                    background:`${tyreColor(row.tyre)}15`,
                    border:`1.5px solid ${tyreColor(row.tyre)}50`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontFamily:"'DM Mono',monospace", fontSize:9, fontWeight:600,
                    color:tyreColor(row.tyre),
                  }}>{row.tyre}</div>
                </div>
              ))}

              {/* Telemetry strip */}
              <div style={{ padding:"12px 16px 8px", borderTop:"1px solid rgba(255,255,255,0.06)", background:"rgba(0,0,0,0.2)" }}>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:"rgba(255,255,255,0.2)", letterSpacing:"0.12em", marginBottom:6 }}>RUS · THROTTLE %</div>
                <svg viewBox="0 0 300 44" width="100%" height="44" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="tgm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E8002D" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="#E8002D" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  <path d={`${telPath} L300,55 L0,55 Z`} fill="url(#tgm)"/>
                  <path d={telPath} fill="none" stroke="#E8002D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx={300} cy={55-(tel[tel.length-1]/100)*50} r="3" fill="#E8002D"/>
                </svg>
              </div>
            </div>
          ) : (
            // News tab
            <div style={{ flex:1 }}>
              {NEWS.map((item, i) => (
                <div key={i} onClick={() => window.open(item.url,"_blank")} style={{
                  padding:"14px 16px", borderBottom:"1px solid rgba(255,255,255,0.04)",
                  cursor:"pointer", background:"transparent", active: { background:"rgba(255,255,255,0.03)" },
                } as any}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:"#E8002D", background:"rgba(232,0,45,0.1)", border:"1px solid rgba(232,0,45,0.2)", padding:"2px 7px", letterSpacing:"0.12em" }}>
                      {item.tag}
                    </span>
                    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:"rgba(255,255,255,0.2)" }}>{item.time}</span>
                  </div>
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:15, fontWeight:500, color:"#fff", lineHeight:1.2, marginBottom:5 }}>
                    {item.headline}
                  </div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.35)", lineHeight:1.55 }}>
                    {item.body}
                  </div>
                  <div style={{ marginTop:6, fontFamily:"'DM Mono',monospace", fontSize:7.5, color:"rgba(255,255,255,0.2)" }}>
                    ↗ {item.source}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Season strip — horizontal scroll */}
          <div style={{ height:44, flexShrink:0, borderTop:"1px solid rgba(255,255,255,0.06)", background:"rgba(10,10,10,0.97)", display:"flex", alignItems:"stretch", overflowX:"auto" }}>
            {RACES.map(race => {
              const isNext = race.round === next.round;
              return (
                <div key={race.round} style={{
                  display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center",
                  flexShrink:0, minWidth: isNext ? 72 : 48, padding:"0 4px",
                  borderRight:"1px solid rgba(255,255,255,0.04)",
                  background: isNext ? "rgba(232,0,45,0.08)" : "transparent",
                  borderTop: isNext ? "2px solid #E8002D" : "2px solid transparent",
                }}>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:6, color: isNext ? "#E8002D" : race.done ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.25)", marginBottom:1 }}>
                    {isNext ? "NEXT" : `R${race.round}`}
                  </div>
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:10, fontWeight:500, color: isNext ? "#fff" : race.done ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.5)" }}>
                    {race.short}
                  </div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:6, color:"rgba(255,255,255,0.15)", marginTop:1 }}>
                    {race.done && race.winner ? race.winner.slice(0,3).toUpperCase() : new Date(race.date).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      ) : (
        // ════ DESKTOP LAYOUT: original 3-column ════
        <>
          <div style={{ flex:1, minHeight:0, display:"grid", gridTemplateColumns:"1fr 1fr 300px" }}>

            {/* COL 1: Hero */}
            <div style={{ borderRight:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
              <div style={{ padding:"16px 32px 0", flexShrink:0 }}>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.25)", letterSpacing:"0.2em", textTransform:"uppercase" }}>
                  RND {String(next.round).padStart(2,"0")} / 22 &nbsp;·&nbsp; CIRCUIT GILLES VILLENEUVE
                </span>
              </div>
              <div style={{ flex:1, overflowY:"auto", padding:"10px 32px 16px", display:"flex", flexDirection:"column" }}>
                <motion.div initial={{ opacity:0, y:32 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2, duration:0.9, ease:[0.16,1,0.3,1] }} style={{ marginBottom:4 }}>
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:"clamp(52px,6vw,88px)", fontWeight:700, lineHeight:0.85, letterSpacing:"-0.03em", textTransform:"uppercase", color:"#fff" }}>{next.name}</div>
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:"clamp(52px,6vw,88px)", fontWeight:200, lineHeight:0.85, letterSpacing:"-0.03em", textTransform:"uppercase", color:"rgba(255,255,255,0.1)", WebkitTextStroke:"1px rgba(255,255,255,0.12)" }}>GRAND PRIX</div>
                </motion.div>
                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }} style={{ marginTop:20, paddingTop:16, borderTop:"1px solid rgba(255,255,255,0.07)", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 0" }}>
                  {[
                    { l:"DATE", v: new Date(next.date).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}) },
                    { l:"CIRCUIT", v:"Île Notre-Dame, Montréal" },
                    { l:"LAPS", v:"70 × 4.361 km" },
                    { l:"TOTAL", v:"305.270 km" },
                  ].map(x => (
                    <div key={x.l}>
                      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:"rgba(255,255,255,0.2)", letterSpacing:"0.2em", marginBottom:2 }}>{x.l}</div>
                      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"rgba(255,255,255,0.6)" }}>{x.v}</div>
                    </div>
                  ))}
                </motion.div>
                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.65 }} style={{ marginTop:20 }}>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:"rgba(255,255,255,0.2)", letterSpacing:"0.2em", marginBottom:10 }}>RACE BEGINS IN</div>
                  <div style={{ display:"flex", alignItems:"baseline" }}>
                    {[{v:cd.d,l:"D"},{v:cd.h,l:"H"},{v:cd.m,l:"M"},{v:cd.s,l:"S"}].map((item, i) => (
                      <div key={item.l} style={{ display:"flex", alignItems:"baseline" }}>
                        {i > 0 && <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:32, fontWeight:200, color:"rgba(255,255,255,0.1)", margin:"0 6px" }}>:</span>}
                        <div style={{ display:"flex", alignItems:"baseline", gap:3 }}>
                          <div style={{ overflow:"hidden", height:52 }}>
                            <AnimatePresence mode="popLayout">
                              <motion.span key={pad(item.v)} initial={{ y:-36, opacity:0 }} animate={{ y:0, opacity:1 }} exit={{ y:36, opacity:0 }} transition={{ duration:0.18, ease:"easeOut" }}
                                style={{ fontFamily:"'Oswald',sans-serif", fontSize:48, fontWeight:600, color:"#fff", lineHeight:1, letterSpacing:"-0.04em", fontVariantNumeric:"tabular-nums", display:"block" }}
                              >{pad(item.v)}</motion.span>
                            </AnimatePresence>
                          </div>
                          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:"rgba(255,255,255,0.2)" }}>{item.l}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.8 }} style={{ marginTop:20, display:"flex", gap:16, alignItems:"center" }}>
                  <motion.button whileHover={{ background:"#fff", color:"#0A0A0A" }} whileTap={{ scale:0.97 }} onClick={onEnter}
                    style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.5)", color:"#fff", padding:"12px 32px", fontFamily:"'Oswald',sans-serif", fontSize:12, fontWeight:400, letterSpacing:"0.18em", textTransform:"uppercase", cursor:"pointer", transition:"all 0.2s", flexShrink:0 }}>
                    Open Dashboard
                  </motion.button>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.2)" }}>{done}/22 complete</span>
                </motion.div>
                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.95 }} style={{ marginTop:20, paddingTop:16, borderTop:"1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:"rgba(255,255,255,0.15)", letterSpacing:"0.2em", marginBottom:10 }}>WDC — TOP 3</div>
                  <div style={{ display:"flex" }}>
                    {WDC.map((d, i) => (
                      <div key={d.code} style={{ flex:1, paddingLeft: i>0 ? 14 : 0, borderLeft: i>0 ? "1px solid rgba(255,255,255,0.06)" : "none", padding:"8px 0", display:"flex", flexDirection:"column", alignItems:"center" }}>
                        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:"rgba(255,255,255,0.2)", marginBottom:3 }}>P{d.pos} · {d.team}</div>
                        <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:18, fontWeight:600, color:"#fff" }}>{d.code}</div>
                        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:d.color, marginTop:1, fontWeight:500 }}>{d.pts} pts</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>

            {/* COL 2: Live Timing */}
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3, duration:0.8 }}
              style={{ display:"flex", flexDirection:"column", overflow:"hidden", borderRight:"1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ height:48, flexShrink:0, borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:"#E8002D", animation:"live-pulse 1.2s ease-in-out infinite" }}/>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.4)", letterSpacing:"0.15em" }}>LIVE TIMING — LAP 14/70</span>
                </div>
                <div style={{ display:"flex", gap:16 }}>
                  {[{l:"TRACK",v:"+32°C"},{l:"SC",v:"NONE"}].map(x => (
                    <div key={x.l} style={{ textAlign:"right" }}>
                      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:"rgba(255,255,255,0.2)" }}>{x.l}</div>
                      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"rgba(255,255,255,0.6)" }}>{x.v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"28px 36px 56px 1fr 70px 70px 70px 20px", gap:0, padding:"8px 24px", borderBottom:"1px solid rgba(255,255,255,0.04)", flexShrink:0 }}>
                {["","NO","DRV","GAP","S1","S2","S3","T"].map((h,i) => (
                  <span key={i} style={{ fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:"0.15em", color:"rgba(255,255,255,0.18)", textAlign: i>=4?"right":"left" }}>{h}</span>
                ))}
              </div>
              <div style={{ flex:1, overflowY:"auto" }}>
                {TIMING.map((row, i) => (
                  <div key={row.no} style={{ display:"grid", gridTemplateColumns:"28px 36px 56px 1fr 70px 70px 70px 20px", alignItems:"center", gap:0, padding:"0 24px", height:38, background: row.pos===1?"rgba(255,255,255,0.02)":i%2===0?"rgba(255,255,255,0.008)":"transparent", borderBottom:"1px solid rgba(255,255,255,0.028)", borderLeft:`3px solid ${row.pos<=3?row.color:"transparent"}` }}>
                    <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, fontWeight:500, color:row.pos<=3?"#fff":"rgba(255,255,255,0.3)" }}>{row.pos}</span>
                    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:row.color, opacity:0.75 }}>{row.no}</span>
                    <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:14, fontWeight:500, color:"#fff", letterSpacing:"0.05em" }}>{row.code}</span>
                    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, fontWeight:500, color:row.pos===1?row.color:"rgba(255,255,255,0.45)" }}>{row.gap}</span>
                    {[row.s1,row.s2,row.s3].map((s,si) => (
                      <span key={si} style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:flashSec===si?"#fff":"rgba(255,255,255,0.22)", textAlign:"right", transition:"color 0.2s" }}>{s}</span>
                    ))}
                    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:8, textAlign:"right", color:tyreColor(row.tyre), fontWeight:500 }}>{row.tyre}</span>
                  </div>
                ))}
              </div>
              <div style={{ height:88, flexShrink:0, borderTop:"1px solid rgba(255,255,255,0.06)", padding:"10px 24px 0", background:"rgba(0,0,0,0.2)" }}>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:"rgba(255,255,255,0.2)", letterSpacing:"0.15em", marginBottom:6 }}>RUS · THROTTLE %</div>
                <svg viewBox="0 0 300 55" width="100%" height="50" preserveAspectRatio="none">
                  <defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#E8002D" stopOpacity="0.3"/><stop offset="100%" stopColor="#E8002D" stopOpacity="0"/></linearGradient></defs>
                  {[25,50,75].map(y => <line key={y} x1="0" y1={55-(y/100)*50} x2="300" y2={55-(y/100)*50} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>)}
                  <path d={telArea} fill="url(#tg)"/><path d={telPath} fill="none" stroke="#E8002D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx={300} cy={55-(tel[tel.length-1]/100)*50} r="3" fill="#E8002D"/>
                </svg>
              </div>
            </motion.div>

            {/* COL 3: News */}
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5, duration:0.8 }}
              style={{ display:"flex", flexDirection:"column", overflow:"hidden", background:"rgba(0,0,0,0.15)" }}>
              <div style={{ height:48, flexShrink:0, borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 18px" }}>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.35)", letterSpacing:"0.18em" }}>LATEST NEWS</span>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:"#E8002D", letterSpacing:"0.1em" }}>CAN GP 2026</span>
              </div>
              <div style={{ flex:1, overflowY:"auto" }}>
                {NEWS.map((item, i) => (
                  <div key={i} onClick={() => window.open(item.url,"_blank")} style={{ padding:"14px 18px", borderBottom:"1px solid rgba(255,255,255,0.04)", cursor:"pointer" }}
                    onMouseEnter={e => (e.currentTarget.style.background="rgba(232,0,45,0.03)")}
                    onMouseLeave={e => (e.currentTarget.style.background="transparent")}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:"#E8002D", background:"rgba(232,0,45,0.1)", border:"1px solid rgba(232,0,45,0.2)", padding:"2px 7px", letterSpacing:"0.12em" }}>{item.tag}</span>
                      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:"rgba(255,255,255,0.2)" }}>{item.time}</span>
                    </div>
                    <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:13, fontWeight:500, color:"#fff", lineHeight:1.25, marginBottom:5 }}>{item.headline}</div>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8.5, color:"rgba(255,255,255,0.35)", lineHeight:1.6 }}>{item.body}</div>
                    <div style={{ marginTop:6, fontFamily:"'DM Mono',monospace", fontSize:7.5, color:"rgba(255,255,255,0.2)" }}>↗ {item.source}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Desktop bottom season strip */}
          <div style={{ height:48, flexShrink:0, borderTop:"1px solid rgba(255,255,255,0.06)", background:"rgba(10,10,10,0.97)", display:"flex", alignItems:"stretch", overflow:"hidden" }}>
            <div style={{ width:200, display:"flex", alignItems:"center", paddingLeft:24, flexShrink:0, borderRight:"1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.2)", letterSpacing:"0.12em" }}>2026 · 22 ROUNDS</span>
            </div>
            <div style={{ flex:1, overflow:"hidden", display:"flex", alignItems:"stretch" }}>
              {RACES.map(race => {
                const isNext = race.round === next.round;
                return (
                  <div key={race.round} style={{ display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", flexShrink:0, minWidth: isNext ? 80 : 52, padding:"0 6px", borderRight:"1px solid rgba(255,255,255,0.04)", background: isNext?"rgba(232,0,45,0.08)":"transparent", borderTop: isNext?"2px solid #E8002D":"2px solid transparent" }}>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, letterSpacing:"0.1em", marginBottom:1, color: isNext?"#E8002D":race.done?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.25)" }}>{isNext?"NEXT":`R${race.round}`}</div>
                    <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:11, fontWeight:500, color: isNext?"#fff":race.done?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.5)" }}>{race.short}</div>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:"rgba(255,255,255,0.15)", marginTop:1 }}>
                      {race.done && race.winner ? race.winner.slice(0,3).toUpperCase() : new Date(race.date).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Landing;

