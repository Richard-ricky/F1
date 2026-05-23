import type { SessionInfo } from '../hooks/useOpenF1';

interface TopBarProps {
  sessionInfo: SessionInfo | null;
  isLive: boolean;
  dataSource: string;
}

const FLAG_STYLES: Record<NonNullable<SessionInfo['flag']>, { bg: string; text: string; label: string }> = {
  green:      { bg: 'rgba(34,197,94,0.12)',  text: '#22c55e', label: 'GREEN FLAG'    },
  yellow:     { bg: 'rgba(251,191,36,0.12)', text: '#fbbf24', label: 'YELLOW FLAG'   },
  'safety-car':{ bg:'rgba(249,115,22,0.12)', text: '#f97316', label: 'SAFETY CAR'    },
  red:        { bg: 'rgba(239,68,68,0.12)',  text: '#ef4444', label: 'RED FLAG'      },
  finished:   { bg: 'rgba(255,255,255,0.08)',text: '#ffffff', label: 'CHEQUERED'     },
};

export default function TopBar({ sessionInfo, isLive, dataSource }: TopBarProps) {
  const flagStyle = FLAG_STYLES[sessionInfo?.flag ?? 'green'];
  const lapPct = sessionInfo
    ? Math.min(100, (sessionInfo.currentLap / sessionInfo.totalLaps) * 100)
    : 0;

  return (
    <div style={{
      height: 56,
      background: 'rgba(4,4,4,0.97)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      display: 'flex',
      alignItems: 'stretch',
      fontFamily: '"Helvetica Neue","SF Pro Display",-apple-system,sans-serif',
      flexShrink: 0,
      position: 'relative',
    }}>
      {/* Lap progress bar — 1px line at very bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
        background: 'rgba(255,255,255,0.06)',
      }}>
        <div style={{
          width: `${lapPct}%`, height: '100%',
          background: 'linear-gradient(90deg, #E10600, #ff3d00)',
          transition: 'width 0.5s ease',
        }} />
      </div>

      {/* Left — Race identity */}
      <div style={{ display:'flex', alignItems:'center', gap:16, padding:'0 24px', borderRight:'1px solid rgba(255,255,255,0.06)' }}>
        {/* F1 mark */}
        <div style={{
          width:26, height:26, background:'#E10600', flexShrink:0,
          clipPath:'polygon(12% 0%,100% 0%,88% 100%,0% 100%)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <span style={{ color:'#fff', fontWeight:900, fontSize:9, paddingLeft:1 }}>F1</span>
        </div>
        <div>
          <div style={{ color:'#fff', fontWeight:600, fontSize:13, letterSpacing:'-0.01em', lineHeight:1 }}>
            {sessionInfo?.meetingName ?? 'Formula 1'}
          </div>
          <div style={{ color:'rgba(255,255,255,0.35)', fontSize:10, marginTop:2, letterSpacing:'0.06em' }}>
            {sessionInfo?.sessionType ?? 'Race'} · {sessionInfo?.circuitName ?? '—'}
          </div>
        </div>
      </div>

      {/* Centre — Lap counter */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:20 }}>
        {sessionInfo?.currentLap ? (
          <>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', letterSpacing:'0.18em', textTransform:'uppercase', marginBottom:1 }}>Lap</div>
              <div style={{ fontSize:22, fontWeight:700, color:'#fff', letterSpacing:'-0.04em', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>
                {sessionInfo.currentLap}
                <span style={{ color:'rgba(255,255,255,0.25)', fontSize:14, fontWeight:400 }}>
                  {' '}/{' '}{sessionInfo.totalLaps}
                </span>
              </div>
            </div>

            {/* Progress dots */}
            <div style={{ display:'flex', gap:2, alignItems:'center' }}>
              {Array.from({ length: Math.min(20, sessionInfo.totalLaps) }).map((_, i) => {
                const lapStep = Math.floor((sessionInfo.totalLaps / Math.min(20, sessionInfo.totalLaps)) * i);
                const filled = lapStep < sessionInfo.currentLap;
                return (
                  <div key={i} style={{
                    width: 3, height: filled ? 12 : 6,
                    borderRadius: 2,
                    background: filled ? '#E10600' : 'rgba(255,255,255,0.1)',
                    transition: 'all 0.3s',
                  }} />
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ color:'rgba(255,255,255,0.2)', fontSize:12, letterSpacing:'0.1em' }}>
            WAITING FOR SESSION DATA
          </div>
        )}
      </div>

      {/* Right — Flag + status */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'0 24px', borderLeft:'1px solid rgba(255,255,255,0.06)' }}>
        {/* Live/data indicator */}
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{
            width:6, height:6, borderRadius:'50%',
            background: isLive ? '#22c55e' : '#fbbf24',
            boxShadow: isLive ? '0 0 6px #22c55e' : '0 0 6px #fbbf24',
          }} className={isLive ? 'animate-pulse' : ''} />
          <span style={{ color:'rgba(255,255,255,0.35)', fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:500 }}>
            {isLive ? 'Live' : dataSource}
          </span>
        </div>

        {/* Flag state */}
        <div style={{
          display:'flex', alignItems:'center', gap:6,
          padding:'5px 12px', borderRadius:5,
          background: flagStyle.bg,
          border: `1px solid ${flagStyle.text}30`,
        }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:flagStyle.text }} />
          <span style={{ color:flagStyle.text, fontSize:10, fontWeight:700, letterSpacing:'0.16em' }}>
            {flagStyle.label}
          </span>
        </div>
      </div>
    </div>
  );
}