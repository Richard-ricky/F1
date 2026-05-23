import type { TyreDegradationData } from '../hooks/useTyreDegradation';
import type { ProcessedDriver, TireCompound } from '../hooks/useOpenF1';

interface TyreDegradationPanelProps {
  data:          Record<string, TyreDegradationData>;
  drivers:       ProcessedDriver[];
  onDriverClick: (id: string) => void;
}

const TIRE_HEX: Record<TireCompound, string> = {
  SOFT:'#E10600', MEDIUM:'#FFC906', HARD:'#F0F0F0', INTER:'#39B54A', WET:'#0067FF',
};
const font = '"Helvetica Neue","SF Pro Display",-apple-system,sans-serif';

function PerformanceRing({ value, color }: { value: number; color: string }) {
  const r    = 14;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  const stroke = value > 60 ? color : value > 30 ? '#fbbf24' : '#ef4444';
  return (
    <svg width={36} height={36} style={{ flexShrink:0 }}>
      <circle cx={18} cy={18} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3} />
      <circle cx={18} cy={18} r={r} fill="none" stroke={stroke} strokeWidth={3}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round" transform="rotate(-90 18 18)"
        style={{ transition:'stroke-dasharray 0.5s ease' }} />
      <text x={18} y={22} textAnchor="middle" fontSize={9} fontWeight={700}
        fill="rgba(255,255,255,0.65)" fontFamily={font}>
        {Math.round(value)}
      </text>
    </svg>
  );
}

/**
 * Shows tyre degradation model per driver with pit window recommendations.
 * Place in: src/app/components/TyreDegradationPanel.tsx
 */
export default function TyreDegradationPanel({ data, drivers, onDriverClick }: TyreDegradationPanelProps) {
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', fontFamily:font }}>
      <div style={{ padding:'12px 16px 10px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
        <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'0.2em', textTransform:'uppercase' }}>
          Tyre Degradation
        </div>
        <div style={{ fontSize:9, color:'rgba(255,255,255,0.2)', marginTop:2 }}>
          Performance index · Pit window model
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto' }}>
        {drivers.slice(0,10).map(driver => {
          const deg = data[driver.id];
          if (!deg) return null;
          return (
            <div
              key={driver.id}
              onClick={() => onDriverClick(driver.id)}
              style={{ padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)', cursor:'pointer', transition:'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <PerformanceRing value={deg.performance} color={TIRE_HEX[driver.tire]} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:'#fff' }}>{driver.abbreviation}</span>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:TIRE_HEX[driver.tire], flexShrink:0 }} />
                    <span style={{ fontSize:9, color:'rgba(255,255,255,0.3)' }}>
                      {driver.tire} · {driver.tireAge}L
                    </span>
                    {deg.pitWindowOpen && (
                      <span style={{ fontSize:8, fontWeight:800, padding:'1px 5px', borderRadius:3, background:'rgba(251,191,36,0.1)', border:'1px solid rgba(251,191,36,0.22)', color:'#fbbf24', letterSpacing:'0.1em', marginLeft:'auto' }}>
                        PIT NOW
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize:9, color: deg.lapsRemaining <= 5 ? '#ef4444' : deg.lapsRemaining <= 10 ? '#fbbf24' : 'rgba(255,255,255,0.3)' }}>
                    {deg.recommendation}
                  </div>
                </div>
              </div>

              {/* Wear bar */}
              <div style={{ marginTop:8, height:2, background:'rgba(255,255,255,0.05)', borderRadius:2 }}>
                <div style={{
                  width:`${100 - deg.performance}%`, height:'100%', borderRadius:2,
                  background: deg.performance > 60 ? TIRE_HEX[driver.tire] : deg.performance > 30 ? '#fbbf24' : '#ef4444',
                  transition:'width 0.5s ease',
                }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding:'8px 16px', borderTop:'1px solid rgba(255,255,255,0.05)', flexShrink:0 }}>
        <div style={{ fontSize:9, color:'rgba(255,255,255,0.18)', lineHeight:1.6 }}>
          S −0.085s/lap · M −0.048s/lap · H −0.028s/lap
        </div>
      </div>
    </div>
  );
}