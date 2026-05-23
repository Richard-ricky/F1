import type { GapPrediction } from '../hooks/useGapPredictor';
import type { ProcessedDriver } from '../hooks/useOpenF1';

interface GapPredictorProps {
  predictions:   GapPrediction[];
  drivers:       ProcessedDriver[];
  onDriverClick: (id: string) => void;
}

const font = '"Helvetica Neue","SF Pro Display",-apple-system,sans-serif';

/**
 * Shows live gap predictions — who will catch whom before race end,
 * DRS windows, and pit stop threat warnings.
 * Place in: src/app/components/GapPredictor.tsx
 */
export default function GapPredictor({ predictions, drivers, onDriverClick }: GapPredictorProps) {
  const byDriver = Object.fromEntries(drivers.map(d => [d.id, d]));
  const interesting = predictions.filter(p => p.drsRange || p.willCatch || p.pitThreat);

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', fontFamily:font }}>
      {/* Header */}
      <div style={{ padding:'12px 16px 10px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
        <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'0.2em', textTransform:'uppercase' }}>
          Race Predictions
        </div>
        <div style={{ fontSize:9, color:'rgba(255,255,255,0.2)', marginTop:2 }}>
          Gap trends · DRS windows · Pit threats
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto' }}>
        {interesting.length === 0 && (
          <div style={{ padding:28, textAlign:'center', color:'rgba(255,255,255,0.2)', fontSize:11, lineHeight:1.6 }}>
            No active battles or threats.<br />
            <span style={{ fontSize:10 }}>Updates as gaps close during the race.</span>
          </div>
        )}

        {interesting.map(p => {
          const driver = byDriver[p.driverId];
          const target = p.targetId ? byDriver[p.targetId] : null;
          if (!driver) return null;

          return (
            <div
              key={p.driverId}
              onClick={() => onDriverClick(p.driverId)}
              style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)', cursor:'pointer', transition:'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              {/* Driver row */}
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <div style={{ width:2, height:24, borderRadius:1, background:driver.teamColor, flexShrink:0 }} />
                <span style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{driver.abbreviation}</span>
                {target && (
                  <>
                    <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)' }}>→</span>
                    <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.5)' }}>{target.abbreviation}</span>
                  </>
                )}
                <div style={{ marginLeft:'auto', display:'flex', gap:5 }}>
                  {p.drsRange && (
                    <span style={{ fontSize:8, fontWeight:800, padding:'2px 6px', borderRadius:3, background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.28)', color:'#22c55e', letterSpacing:'0.1em' }}>DRS</span>
                  )}
                  {p.pitThreat && (
                    <span style={{ fontSize:8, fontWeight:800, padding:'2px 6px', borderRadius:3, background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.22)', color:'#fbbf24', letterSpacing:'0.1em' }}>PIT</span>
                  )}
                  {p.willCatch && (
                    <span style={{ fontSize:8, fontWeight:800, padding:'2px 6px', borderRadius:3, background:'rgba(225,6,0,0.08)', border:'1px solid rgba(225,6,0,0.28)', color:'#ff6060', letterSpacing:'0.1em' }}>CATCH</span>
                  )}
                </div>
              </div>

              {/* Details */}
              <div style={{ paddingLeft:10, display:'flex', flexDirection:'column', gap:3 }}>
                {target && (
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>
                    Gap: <span style={{ color:'#fff', fontWeight:600, fontVariantNumeric:'tabular-nums' }}>
                      {p.currentGap.toFixed(3)}s
                    </span>
                    {p.gapTrend > 0 && (
                      <span style={{ color:'#22c55e', marginLeft:6, fontSize:9 }}>↓ {p.gapTrend.toFixed(3)}s/lap</span>
                    )}
                    {p.gapTrend < 0 && (
                      <span style={{ color:'#ef4444', marginLeft:6, fontSize:9 }}>↑ {Math.abs(p.gapTrend).toFixed(3)}s/lap</span>
                    )}
                  </div>
                )}
                {p.willCatch && p.lapsToOvertake !== null && (
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>
                    Projected catch in <span style={{ color:'#ff6060', fontWeight:700 }}>
                      {p.lapsToOvertake} lap{p.lapsToOvertake !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {p.pitThreat && target && (
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>
                    <span style={{ color:'#fbbf24' }}>{target.abbreviation}</span> on aged tyres — pit window likely
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* All gaps table */}
        <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,0.05)', marginTop:4 }}>
          <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.2)', letterSpacing:'0.18em', textTransform:'uppercase', marginBottom:10 }}>All Gaps</div>
          {predictions.slice(1).map(p => {
            const d = byDriver[p.driverId];
            if (!d) return null;
            return (
              <div key={p.driverId} style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                <span style={{ width:28, fontSize:11, fontWeight:700, color:d.teamColor, flexShrink:0 }}>{d.abbreviation}</span>
                <div style={{ flex:1, height:2, background:'rgba(255,255,255,0.04)', borderRadius:1 }}>
                  <div style={{ width:`${Math.min(100,(1/Math.max(0.1,p.currentGap))*15)}%`, height:'100%', background:p.drsRange?'#22c55e':'rgba(255,255,255,0.18)', borderRadius:1 }} />
                </div>
                <span style={{ fontSize:10, color:'rgba(255,255,255,0.35)', fontVariantNumeric:'tabular-nums', width:52, textAlign:'right', flexShrink:0 }}>
                  {p.currentGap > 0 ? `+${p.currentGap.toFixed(2)}s` : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}