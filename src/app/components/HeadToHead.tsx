import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { ProcessedDriver, ProcessedTelemetry } from '../hooks/useOpenF1';

interface HeadToHeadProps {
  drivers:      ProcessedDriver[];
  telemetryMap: Record<string, ProcessedTelemetry>;
  onClose:      () => void;
}

const font = '"Helvetica Neue","SF Pro Display",-apple-system,sans-serif';
const SECTOR_COLORS = { purple:'#B14FFF', green:'#22C55E', yellow:'#FFC906' };

function DeltaBar({ delta, max }: { delta: number; max: number }) {
  const pct = Math.min(100, (Math.abs(delta) / max) * 100);
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4, height:6 }}>
      <div style={{ flex:1, height:'100%', background:'rgba(255,255,255,0.05)', borderRadius:3, overflow:'hidden', display:'flex', justifyContent:'flex-end' }}>
        {delta < 0 && <div style={{ width:`${pct}%`, height:'100%', background:'#22c55e', borderRadius:3 }} />}
      </div>
      <div style={{ width:44, textAlign:'center', fontSize:9, fontVariantNumeric:'tabular-nums', fontWeight:700,
        color: delta === 0 ? 'rgba(255,255,255,0.2)' : delta < 0 ? '#22c55e' : '#ef4444' }}>
        {delta === 0 ? '—' : `${delta > 0 ? '+' : ''}${delta.toFixed(3)}`}
      </div>
      <div style={{ flex:1, height:'100%', background:'rgba(255,255,255,0.05)', borderRadius:3, overflow:'hidden' }}>
        {delta > 0 && <div style={{ width:`${pct}%`, height:'100%', background:'#ef4444', borderRadius:3 }} />}
      </div>
    </div>
  );
}

/**
 * Overlays two drivers' lap times, sector times, and live telemetry bars.
 * Place in: src/app/components/HeadToHead.tsx
 */
export default function HeadToHead({ drivers, telemetryMap, onClose }: HeadToHeadProps) {
  const [idA, setIdA] = useState(drivers[0]?.id ?? '');
  const [idB, setIdB] = useState(drivers[1]?.id ?? '');

  const A    = drivers.find(d => d.id === idA);
  const B    = drivers.find(d => d.id === idB);
  const telA = telemetryMap[idA];
  const telB = telemetryMap[idB];

  // Lap history overlay
  const lapData = useMemo(() => {
    if (!telA || !telB) return [];
    const lenA = telA.lapHistory.length;
    const lenB = telB.lapHistory.length;
    const len  = Math.max(lenA, lenB);
    return Array.from({ length: len }, (_, i) => ({
      lap:  `L-${len - i}`,
      [idA]: telA.lapHistory[lenA - len + i] ?? null,
      [idB]: telB.lapHistory[lenB - len + i] ?? null,
    })).filter(d => d[idA] || d[idB]);
  }, [telA, telB, idA, idB]);

  // Sector deltas
  const sectorDeltas = useMemo(() => {
    if (!A || !B) return [];
    return (['s1','s2','s3'] as const).map(k => {
      const vA = parseFloat(A[k]);
      const vB = parseFloat(B[k]);
      return { sector: k.toUpperCase(), vA, vB, delta: isNaN(vA)||isNaN(vB) ? 0 : vA - vB };
    });
  }, [A, B]);

  // Live telemetry bars
  const telRows = useMemo(() => {
    if (!telA || !telB) return [];
    return [
      { label:'Speed',    a:telA.speed,    b:telB.speed,    max:350,  fmt:(v:number)=>`${v}` },
      { label:'Throttle', a:telA.throttle, b:telB.throttle, max:100,  fmt:(v:number)=>`${v}%` },
      { label:'Brake',    a:telA.brake,    b:telB.brake,    max:100,  fmt:(v:number)=>`${v}%` },
      { label:'Gear',     a:telA.gear,     b:telB.gear,     max:8,    fmt:(v:number)=>`${v}` },
      { label:'RPM',      a:telA.rpm,      b:telB.rpm,      max:15000,fmt:(v:number)=>`${(v/1000).toFixed(1)}k` },
    ];
  }, [telA, telB]);

  if (!A || !B) return null;

  const select = (val: string, onChange: (v:string)=>void, exclude: string) => (
    <select value={val} onChange={e => onChange(e.target.value)}
      style={{ background:'rgba(255,255,255,0.06)', border:`1px solid ${drivers.find(d=>d.id===val)?.teamColor ?? '#fff'}40`, borderRadius:6, color:'#fff', padding:'6px 10px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:font, outline:'none' }}>
      {drivers.filter(d => d.id !== exclude).map(d => (
        <option key={d.id} value={d.id} style={{ background:'#111' }}>
          {d.abbreviation} — {d.fullName}
        </option>
      ))}
    </select>
  );

  return (
    <div style={{ position:'absolute', inset:0, zIndex:50, background:'rgba(4,4,4,0.97)', backdropFilter:'blur(20px)', display:'flex', flexDirection:'column', fontFamily:font, overflow:'hidden' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 24px', borderBottom:'1px solid rgba(255,255,255,0.07)', flexShrink:0 }}>
        <span style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.28)', letterSpacing:'0.2em', textTransform:'uppercase' }}>Head to Head</span>
        {select(idA, setIdA, idB)}
        <span style={{ fontSize:14, color:'rgba(255,255,255,0.2)' }}>vs</span>
        {select(idB, setIdB, idA)}
        <button onClick={onClose}
          style={{ marginLeft:'auto', background:'none', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, color:'rgba(255,255,255,0.4)', cursor:'pointer', width:32, height:32, fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:font, transition:'all 0.15s' }}
          onMouseEnter={e=>{e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor='rgba(255,255,255,0.28)';}}
          onMouseLeave={e=>{e.currentTarget.style.color='rgba(255,255,255,0.4)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.1)';}}>
          ×
        </button>
      </div>

      <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 1fr', gridTemplateRows:'auto 1fr auto', overflow:'hidden', gap:1 }}>

        {/* Driver A header */}
        <DriverHeader driver={A} />
        {/* Driver B header */}
        <DriverHeader driver={B} />

        {/* Lap chart — full width */}
        <div style={{ gridColumn:'1/-1', padding:'14px 24px', borderBottom:'1px solid rgba(255,255,255,0.06)', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.22)', letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:10 }}>
            Lap Time History
          </div>
          {lapData.length > 1 ? (
            <ResponsiveContainer width="100%" height={90}>
              <LineChart data={lapData} margin={{ top:4, right:8, left:-20, bottom:0 }}>
                <XAxis dataKey="lap" tick={{ fill:'rgba(255,255,255,0.18)', fontSize:9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'rgba(255,255,255,0.18)', fontSize:9 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${Math.floor(v/60)}:${(v%60).toFixed(0).padStart(2,'0')}`} domain={['auto','auto']} />
                <Tooltip
                  contentStyle={{ background:'rgba(8,8,8,0.95)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, fontSize:10, fontFamily:font }}
                  formatter={(v:number) => [`${Math.floor(v/60)}:${(v%60).toFixed(3).padStart(6,'0')}`,'']}
                  labelStyle={{ color:'rgba(255,255,255,0.35)' }}
                />
                <Line type="monotone" dataKey={idA} stroke={A.teamColor} strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey={idB} stroke={B.teamColor} strokeWidth={2} dot={false} connectNulls strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height:90, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.18)', fontSize:11 }}>
              Lap history builds during the session
            </div>
          )}
        </div>

        {/* Telemetry A */}
        <div style={{ padding:'14px 24px', borderRight:'1px solid rgba(255,255,255,0.06)', overflowY:'auto' }}>
          <TelBars rows={telRows} side="a" color={A.teamColor} />
        </div>

        {/* Telemetry B */}
        <div style={{ padding:'14px 24px', overflowY:'auto' }}>
          <TelBars rows={telRows} side="b" color={B.teamColor} />
        </div>

        {/* Sector deltas — full width */}
        <div style={{ gridColumn:'1/-1', padding:'12px 24px', borderTop:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
          <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.22)', letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:10 }}>
            Sector Delta · {A.abbreviation} vs {B.abbreviation}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
            {sectorDeltas.map(s => (
              <div key={s.sector}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:700 }}>{s.sector}</span>
                  <div style={{ display:'flex', gap:8 }}>
                    <span style={{ fontSize:10, color:A.teamColor, fontVariantNumeric:'tabular-nums' }}>{isNaN(s.vA)?'—':s.vA.toFixed(3)}</span>
                    <span style={{ fontSize:10, color:B.teamColor, fontVariantNumeric:'tabular-nums' }}>{isNaN(s.vB)?'—':s.vB.toFixed(3)}</span>
                  </div>
                </div>
                <DeltaBar delta={s.delta} max={0.5} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DriverHeader({ driver }: { driver: ProcessedDriver }) {
  return (
    <div style={{ padding:'12px 24px', background:'rgba(255,255,255,0.02)', borderBottom:'1px solid rgba(255,255,255,0.06)', borderRight:'1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:3, height:36, borderRadius:2, background:driver.teamColor }} />
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'#fff', letterSpacing:'-0.03em' }}>{driver.abbreviation}</div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginTop:1 }}>{driver.team} · P{driver.position}</div>
        </div>
        <div style={{ marginLeft:'auto', textAlign:'right' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#fff', fontVariantNumeric:'tabular-nums' }}>{driver.lastLap}</div>
          <div style={{ fontSize:9, color:'rgba(255,255,255,0.28)', marginTop:1 }}>Last Lap</div>
        </div>
      </div>
    </div>
  );
}

function TelBars({ rows, side, color }: { rows: { label:string; a:number; b:number; max:number; fmt:(v:number)=>string }[]; side:'a'|'b'; color:string }) {
  return (
    <>
      <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.22)', letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:12 }}>
        Live Telemetry
      </div>
      {rows.map(row => {
        const val = side === 'a' ? row.a : row.b;
        return (
          <div key={row.label} style={{ marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.38)' }}>{row.label}</span>
              <span style={{ fontSize:12, fontWeight:700, color:'#fff', fontVariantNumeric:'tabular-nums' }}>{row.fmt(val)}</span>
            </div>
            <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:2 }}>
              <div style={{ width:`${(val/row.max)*100}%`, height:'100%', background:color, borderRadius:2, transition:'width 0.3s' }} />
            </div>
          </div>
        );
      })}
    </>
  );
}