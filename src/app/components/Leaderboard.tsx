import { useEffect, useRef, useState } from 'react';
import type { ProcessedDriver, TireCompound, SectorColor } from '../hooks/useOpenF1';

export type { TireCompound };
export type DriverPosition = ProcessedDriver;

interface LeaderboardProps {
  positions: ProcessedDriver[];
  onDriverClick: (id: string) => void;
  selectedDriverId: string | null;
  battles?: { driver1: string; driver2: string; gap: number }[];
  currentLap?: number;
  totalLaps?: number;
}

const TIRE_HEX: Record<TireCompound, string> = {
  SOFT:'#E10600', MEDIUM:'#FFC906', HARD:'#F0F0F0', INTER:'#39B54A', WET:'#0067FF',
};

const SECTOR_HEX: Record<NonNullable<SectorColor>, string> = {
  purple:'#B14FFF', green:'#22C55E', yellow:'#FFC906',
};

function Sparkline({ laps }: { laps: number[] }) {
  if (laps.length < 2) return null;
  const min = Math.min(...laps);
  const max = Math.max(...laps);
  const span = (max - min) || 0.001;
  const W = 44, H = 14;
  const pts = laps.map((l,i) => `${(i/(laps.length-1))*W},${H - ((l-min)/span)*H}`).join(' ');
  const last = pts.split(' ').at(-1)!.split(',').map(Number);
  return (
    <svg width={W} height={H} style={{ display:'block' }}>
      <polyline points={pts} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" strokeLinejoin="round"/>
      <circle cx={last[0]} cy={last[1]} r="2" fill="rgba(255,255,255,0.6)" />
    </svg>
  );
}

export default function Leaderboard({ positions, onDriverClick, selectedDriverId, battles=[], currentLap, totalLaps }: LeaderboardProps) {
  const [flash, setFlash] = useState<Set<string>>(new Set());
  const prevPos = useRef<Record<string,number>>({});

  useEffect(() => {
    const changed: string[] = [];
    positions.forEach(p => {
      if (prevPos.current[p.driverId] !== undefined && prevPos.current[p.driverId] !== p.position) {
        changed.push(p.driverId);
      }
      prevPos.current[p.driverId] = p.position;
    });
    if (!changed.length) return;
    setFlash(new Set(changed));
    const t = setTimeout(() => setFlash(new Set()), 1800);
    return () => clearTimeout(t);
  }, [positions.map(p=>`${p.driverId}:${p.position}`).join()]);

  const battleSet = new Set(battles.flatMap(b=>[b.driver1,b.driver2]));

  return (
    <div style={{
      height:'100%', display:'flex', flexDirection:'column',
      background:'rgba(8,8,8,0.96)',
      borderRight:'1px solid rgba(255,255,255,0.06)',
      fontFamily:'"Helvetica Neue","SF Pro Display",-apple-system,sans-serif',
    }}>
      {/* Header */}
      <div style={{
        padding:'12px 16px 10px',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        flexShrink:0,
        display:'flex', alignItems:'baseline', justifyContent:'space-between',
      }}>
        <span style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.35)', letterSpacing:'0.2em', textTransform:'uppercase' }}>
          Standings
        </span>
        {currentLap ? (
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)', fontVariantNumeric:'tabular-nums' }}>
            L{currentLap}/{totalLaps}
          </span>
        ) : null}
      </div>

      {/* Column headers */}
      <div style={{
        display:'grid',
        gridTemplateColumns:'28px 14px 36px 1fr 56px 40px',
        gap:0, padding:'6px 16px',
        fontSize:9, fontWeight:600, color:'rgba(255,255,255,0.2)',
        letterSpacing:'0.18em', textTransform:'uppercase',
        borderBottom:'1px solid rgba(255,255,255,0.04)',
        flexShrink:0,
      }}>
        <span>Pos</span><span></span><span>No.</span><span>Driver</span>
        <span>Gap</span><span>Tire</span>
      </div>

      {/* Driver rows */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {positions.length === 0 && (
          <div style={{ padding:24, textAlign:'center', color:'rgba(255,255,255,0.15)', fontSize:12 }}>
            Waiting for session data…
          </div>
        )}

        {positions.map(driver => {
          const sel      = selectedDriverId === driver.driverId;
          const flashing = flash.has(driver.driverId);
          const inBattle = battleSet.has(driver.id);

          return (
            <div key={driver.driverId}>
              <div
                onClick={() => onDriverClick(driver.driverId)}
                style={{
                  display:'grid',
                  gridTemplateColumns:'28px 14px 36px 1fr 56px 40px',
                  padding:'9px 16px',
                  borderBottom:'1px solid rgba(255,255,255,0.04)',
                  cursor:'pointer',
                  background: sel ? 'rgba(255,255,255,0.05)' : flashing ? 'rgba(225,6,0,0.06)' : 'transparent',
                  borderLeft: inBattle ? '2px solid rgba(255,200,0,0.5)' : sel ? '2px solid rgba(255,255,255,0.2)' : '2px solid transparent',
                  transition:'background 0.15s',
                }}
                onMouseEnter={e => { if(!sel) e.currentTarget.style.background='rgba(255,255,255,0.03)'; }}
                onMouseLeave={e => { if(!sel) e.currentTarget.style.background='transparent'; }}
              >
                {/* Position */}
                <div style={{ display:'flex', alignItems:'center' }}>
                  <span style={{
                    fontSize:13, fontWeight:700, lineHeight:1,
                    color: driver.position <= 3 ? '#fff' : 'rgba(255,255,255,0.55)',
                    fontVariantNumeric:'tabular-nums',
                  }}>
                    {driver.position}
                  </span>
                </div>

                {/* Change indicator */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {driver.positionChange > 0 && <span style={{ fontSize:8, color:'#22c55e' }}>▲</span>}
                  {driver.positionChange < 0 && <span style={{ fontSize:8, color:'#ef4444' }}>▼</span>}
                </div>

                {/* Number */}
                <div style={{ display:'flex', alignItems:'center' }}>
                  <span style={{ fontSize:11, fontWeight:600, color:driver.teamColor, fontVariantNumeric:'tabular-nums' }}>
                    {driver.number}
                  </span>
                </div>

                {/* Driver */}
                <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', gap:2, overflow:'hidden' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:2, height:16, borderRadius:1, background:driver.teamColor, flexShrink:0 }} />
                    <div style={{ display:'flex', alignItems:'center', gap:4, minWidth:0 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:'#fff', letterSpacing:'-0.01em' }}>
                        {driver.abbreviation}
                      </span>
                      {driver.isFastestLap && (
                        <span style={{ fontSize:9, color:'#B14FFF', fontWeight:700 }}>⬡</span>
                      )}
                      {driver.drs && (
                        <span style={{ fontSize:8, color:'#22c55e', fontWeight:800, letterSpacing:'0.06em' }}>DRS</span>
                      )}
                      {inBattle && (
                        <span style={{ fontSize:8, color:'#FFC906', fontWeight:700 }}>⚡</span>
                      )}
                    </div>
                  </div>

                  {/* Sector times */}
                  <div style={{ display:'flex', gap:4, paddingLeft:8 }}>
                    {[
                      { val:driver.s1, col:driver.s1Color },
                      { val:driver.s2, col:driver.s2Color },
                      { val:driver.s3, col:driver.s3Color },
                    ].map((s,i) => (
                      <span key={i} style={{
                        fontSize:9, fontVariantNumeric:'tabular-nums',
                        color: s.col ? SECTOR_HEX[s.col] : 'rgba(255,255,255,0.2)',
                        fontWeight: s.col === 'purple' ? 700 : 400,
                      }}>
                        {s.val}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Gap */}
                <div style={{ display:'flex', alignItems:'center' }}>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontVariantNumeric:'tabular-nums', letterSpacing:'-0.01em' }}>
                    {driver.gap}
                  </span>
                </div>

                {/* Tire */}
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <div style={{
                    width:10, height:10, borderRadius:'50%',
                    background:TIRE_HEX[driver.tire],
                    flexShrink:0,
                    boxShadow:`0 0 5px ${TIRE_HEX[driver.tire]}60`,
                  }} />
                  <span style={{ fontSize:9, color:'rgba(255,255,255,0.3)', fontVariantNumeric:'tabular-nums' }}>
                    {driver.tireAge}
                  </span>
                </div>
              </div>

              {/* Expanded row — lap sparkline when selected */}
              {sel && (
                <div style={{
                  padding:'8px 16px 10px 46px',
                  background:'rgba(255,255,255,0.02)',
                  borderBottom:'1px solid rgba(255,255,255,0.04)',
                  display:'flex', alignItems:'center', gap:16,
                }}>
                  <Sparkline laps={(driver as any).lapHistory ?? []} />
                  <div style={{ display:'flex', gap:16 }}>
                    <div>
                      <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:'0.12em', marginBottom:2 }}>LAST LAP</div>
                      <div style={{ fontSize:12, fontWeight:600, color:'#fff', fontVariantNumeric:'tabular-nums' }}>{driver.lastLap}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:'0.12em', marginBottom:2 }}>BEST LAP</div>
                      <div style={{ fontSize:12, fontWeight:600, color:'#B14FFF', fontVariantNumeric:'tabular-nums' }}>{driver.bestLap}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:'0.12em', marginBottom:2 }}>TEAM</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>{driver.team}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        padding:'8px 16px',
        borderTop:'1px solid rgba(255,255,255,0.05)',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        flexShrink:0,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <div style={{ width:5, height:5, borderRadius:'50%', background:'#22c55e' }} className="animate-pulse" />
          <span style={{ fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:'0.14em', textTransform:'uppercase' }}>
            OpenF1 · 2s
          </span>
        </div>
        {battles.length > 0 && (
          <span style={{ fontSize:9, color:'#FFC906', fontWeight:700, letterSpacing:'0.1em' }}>
            ⚡ {battles.length} DRS BATTLE{battles.length>1?'S':''}
          </span>
        )}
      </div>
    </div>
  );
}