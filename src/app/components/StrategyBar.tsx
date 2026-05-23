import type { ProcessedDriver, TireCompound } from '../hooks/useOpenF1';

interface StrategyBarProps {
  drivers: ProcessedDriver[];
  currentLap: number;
  totalLaps: number;
  selectedDriverId: string | null;
  onDriverClick: (id: string) => void;
}

const TIRE_HEX: Record<TireCompound, string> = {
  SOFT:'#E10600', MEDIUM:'#FFC906', HARD:'#F0F0F0', INTER:'#39B54A', WET:'#0067FF',
};
const TIRE_LABEL: Record<TireCompound, string> = {
  SOFT:'S', MEDIUM:'M', HARD:'H', INTER:'I', WET:'W',
};

export default function StrategyBar({ drivers, currentLap, totalLaps, selectedDriverId, onDriverClick }: StrategyBarProps) {
  if (!drivers.length || !totalLaps) return null;
  const top10 = drivers.slice(0, 10);
  const pct = (l: number) => `${Math.min(100, (l / totalLaps) * 100)}%`;

  return (
    <div style={{
      flexShrink:0,
      background:'rgba(6,6,6,0.98)',
      borderTop:'1px solid rgba(255,255,255,0.06)',
      fontFamily:'"Helvetica Neue","SF Pro Display",-apple-system,sans-serif',
    }}>
      {/* Header */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'8px 20px 6px',
        borderBottom:'1px solid rgba(255,255,255,0.05)',
      }}>
        <span style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.28)', letterSpacing:'0.22em', textTransform:'uppercase' }}>
          Tyre Strategy
        </span>
        <div style={{ display:'flex', gap:12 }}>
          {(['SOFT','MEDIUM','HARD','INTER','WET'] as TireCompound[]).map(t => (
            <span key={t} style={{ fontSize:9, color:'rgba(255,255,255,0.3)', display:'flex', alignItems:'center', gap:3 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:TIRE_HEX[t], display:'inline-block' }} />
              {t[0]}
            </span>
          ))}
        </div>
      </div>

      <div style={{ padding:'8px 20px 10px' }}>
        {top10.map(driver => {
          const sel = selectedDriverId === driver.id;
          let cursor = 0;
          return (
            <div
              key={driver.id}
              onClick={() => onDriverClick(driver.id)}
              style={{
                display:'flex', alignItems:'center', gap:10,
                marginBottom:4, cursor:'pointer',
                opacity: sel ? 1 : 0.75,
              }}
            >
              {/* Driver label */}
              <div style={{ width:28, textAlign:'right', flexShrink:0 }}>
                <span style={{ fontSize:9, fontWeight:700, color: sel ? '#fff' : 'rgba(255,255,255,0.35)', letterSpacing:'0.04em' }}>
                  {driver.abbreviation}
                </span>
              </div>

              {/* Stint bar */}
              <div style={{
                flex:1, height:12, borderRadius:3, overflow:'hidden', position:'relative',
                background:'rgba(255,255,255,0.04)',
              }}>
                {driver.stints.map((stint, i) => {
                  const left = pct(cursor);
                  const width = pct(Math.min(Math.max(stint.laps,0), totalLaps - cursor));
                  cursor += stint.laps;
                  if (parseFloat(width) <= 0) return null;
                  return (
                    <div key={i} style={{
                      position:'absolute', top:0, left, height:'100%', width,
                      background: TIRE_HEX[stint.compound],
                      opacity: 0.88,
                      borderRight: i < driver.stints.length - 1 ? '1.5px solid rgba(0,0,0,0.7)' : 'none',
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      {parseFloat(width) > 7 && (
                        <span style={{ fontSize:7, fontWeight:900, color:'rgba(0,0,0,0.65)' }}>
                          {TIRE_LABEL[stint.compound]}
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* Current lap cursor */}
                {currentLap > 0 && (
                  <div style={{
                    position:'absolute', top:0, left:pct(currentLap),
                    width:1.5, height:'100%',
                    background:'rgba(255,255,255,0.8)', zIndex:2,
                  }} />
                )}
              </div>

              {/* Current tire dot */}
              <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0, width:32 }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:TIRE_HEX[driver.tire], flexShrink:0 }} />
                <span style={{ fontSize:9, color:'rgba(255,255,255,0.28)', fontVariantNumeric:'tabular-nums' }}>
                  {driver.tireAge}L
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}