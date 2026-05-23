import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';

// ── Pages ─────────────────────────────────────────────────────────────────────
import LandingPage from './components/LandingPage';

// ── Components ────────────────────────────────────────────────────────────────
import TopBar               from './components/TopBar';
import Leaderboard          from './components/Leaderboard';
import VectorTrackMap       from './components/VectorTrackMap';
import RaceMap              from './components/RaceMap';
import AccurateRaceMap      from './components/AccurateRaceMap';
import DriverTelemetry      from './components/DriverTelemetry';
import AdvancedTelemetry    from './components/AdvancedTelemetry';
import HighlightsFeed       from './components/HighlightsFeed';
import SessionInfo          from './components/SessionInfo';
import StrategyBar          from './components/StrategyBar';
import HeadToHead           from './components/HeadToHead';
import GapPredictor         from './components/GapPredictors';
import TyreDegradationPanel from './components/TyreDegradation';
import ShortcutsOverlay     from './components/ShortcutsOverlay';
import { ErrorBoundary }    from './components/ErrorBoundary';

// ── Hooks ─────────────────────────────────────────────────────────────────────
import { useOpenF1Live }          from './hooks/useOpenF1';
import { useReplayEngine }        from './hooks/useReplayEngine';
import { useInterpolatedDrivers } from './hooks/Useinterpolateddrivers';
import { useTyreDegradation }     from './hooks/useTyreDegradation';
import { useGapPredictor }        from './hooks/useGapPredictor';
import { useKeyboardShortcuts }   from './hooks/Usekeyboardshortcuts';
import { usePWA }                 from './hooks/Usepwa';

// ── Types ─────────────────────────────────────────────────────────────────────
type ViewMode   = 'live' | 'replay' | 'history';
type MapStyle   = 'vector' | 'satellite' | 'track';
type RightPanel = 'timing' | 'highlights' | 'session' | 'strategy' | 'gaps' | 'tyres';

const font          = '"Barlow","Helvetica Neue",-apple-system,sans-serif';
const fontCondensed = '"Barlow Condensed","Helvetica Neue",sans-serif';

// ── Inline SVG icons ──────────────────────────────────────────────────────────
const IconLive    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0"/><path d="M7.5 12a4.5 4.5 0 1 0 9 0 4.5 4.5 0 0 0-9 0"/></svg>;
const IconReplay  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3"/></svg>;
const IconHistory = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconClose   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

// ── Panel config ──────────────────────────────────────────────────────────────
const PANELS: { id: RightPanel; icon: string; label: string }[] = [
  { id: 'timing',     icon: '⏱', label: 'Timing'      },
  { id: 'highlights', icon: '📺', label: 'Clips'       },
  { id: 'session',    icon: '📅', label: 'Schedule'    },
  { id: 'strategy',   icon: '🔧', label: 'Strategy'    },
  { id: 'gaps',       icon: '📊', label: 'Predictions' },
  { id: 'tyres',      icon: '🔴', label: 'Tyres'       },
];

export default function App() {
  // ── State ─────────────────────────────────────────────────────────────────
  const [showLanding,   setShowLanding]   = useState(true);
  const [viewMode,      setViewMode]      = useState<ViewMode>('live');
  const [mapStyle,      setMapStyle]      = useState<MapStyle>('vector');
  const [rightPanel,    setRightPanel]    = useState<RightPanel>('timing');
  const [panelOpen,     setPanelOpen]     = useState(false);   // mobile: drawer open
  const [selectedId,    setSelectedId]    = useState<string | null>(null);
  const [advTelemetry,  setAdvTelemetry]  = useState(false);
  const [showH2H,       setShowH2H]       = useState(false);
  const [showHelp,      setShowHelp]      = useState(false);
  const [sessionOpen,   setSessionOpen]   = useState(false);
  const [chosenSession, setChosenSession] = useState<number | null>(null);
  const [isMobile,      setIsMobile]      = useState(false);
  const replaySpeedRef = useRef(1);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Data ──────────────────────────────────────────────────────────────────
  const live   = useOpenF1Live(2000);
  const replay = useReplayEngine();
  const pwa    = usePWA();

  useEffect(() => {
    if (chosenSession) replay.loadSession(chosenSession);
  }, [chosenSession]);

  const isReplay    = viewMode === 'replay';
  const isLoading   = !isReplay && live.loading;
  const rawDrivers  = isReplay ? replay.replayDrivers     : live.mapDrivers;
  const leaderboard = isReplay ? replay.replayLeaderboard : live.leaderboard;
  const events      = isReplay ? replay.replayEvents      : live.raceEvents;
  const curLap      = isReplay ? replay.currentLap        : live.currentLap;
  const totalLaps   = isReplay ? replay.totalLaps         : live.totalLaps;

  const drivers   = useInterpolatedDrivers(rawDrivers, 2000);
  const tyreDeg   = useTyreDegradation(leaderboard, curLap, totalLaps);
  const gapPreds  = useGapPredictor(leaderboard, curLap, totalLaps);

  const selectedDriver    = drivers.find(d => d.id === selectedId) ?? null;
  const selectedTelemetry = selectedId ? live.telemetryMap[selectedId] : null;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDriverClick = useCallback((id: string) => {
    setSelectedId(prev => prev === id ? null : id);
    setAdvTelemetry(false);
    setShowH2H(false);
  }, []);

  const handleDriverSelect = useCallback((d: { id: string } | null) => {
    setSelectedId(d?.id ?? null);
    setAdvTelemetry(false);
    setShowH2H(false);
  }, []);

  // Open a panel and show the drawer (mobile) or sidebar (desktop)
  const openPanel = (id: RightPanel) => {
    setRightPanel(id);
    setPanelOpen(true);
  };

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useKeyboardShortcuts({
    onMapVector:       () => setMapStyle('vector'),
    onMapSatellite:    () => setMapStyle('satellite'),
    onMapTrack:        () => setMapStyle('track'),
    onPanelTiming:     () => openPanel('timing'),
    onPanelHighlights: () => openPanel('highlights'),
    onPanelSession:    () => openPanel('session'),
    onPanelStrategy:   () => openPanel('strategy'),
    onPlayPause:   () => replay.isPlaying ? replay.pause() : replay.play(),
    onSeekBack:    () => replay.seekTo(Math.max(0, replay.progress - 0.02)),
    onSeekForward: () => replay.seekTo(Math.min(1, replay.progress + 0.02)),
    onSpeedUp: () => {
      const s = [1,2,5,10];
      const next = s[Math.min(s.length-1, s.indexOf(replaySpeedRef.current)+1)];
      replaySpeedRef.current = next; replay.setSpeed(next);
    },
    onSpeedDown: () => {
      const s = [1,2,5,10];
      const next = s[Math.max(0, s.indexOf(replaySpeedRef.current)-1)];
      replaySpeedRef.current = next; replay.setSpeed(next);
    },
    onCloseTelemetry: () => { setSelectedId(null); setAdvTelemetry(false); setShowH2H(false); },
    onToggleHelp:     () => setShowHelp(p => !p),
  });

  // ── Style helpers ─────────────────────────────────────────────────────────
  const chip = (active: boolean, accentBg = 'rgba(255,255,255,0.1)', accentColor = '#fff'): React.CSSProperties => ({
    padding: '5px 12px', borderRadius: 3,
    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
    cursor: 'pointer', fontFamily: font, border: 'none',
    background: active ? accentBg : 'transparent',
    color: active ? accentColor : 'rgba(255,255,255,0.3)',
    transition: 'all 0.15s',
  });

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: isMobile ? '0 12px' : '0 18px', height: '100%',
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: isMobile ? 10 : 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
    cursor: 'pointer', fontFamily: font, border: 'none', background: 'transparent',
    color: active ? '#fff' : 'rgba(255,255,255,0.32)',
    borderBottom: active ? '2px solid #E10600' : '2px solid transparent',
    transition: 'all 0.15s', flexShrink: 0,
  });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Landing ── */}
      <AnimatePresence>
        {showLanding && (
          <motion.div key="landing" style={{ position: 'fixed', inset: 0, zIndex: 200 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: [0.4,0,0.2,1] }}>
            <LandingPage onEnter={() => setShowLanding(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <ShortcutsOverlay visible={showHelp} onClose={() => setShowHelp(false)} />

      {/* Offline banner */}
      {pwa.isOffline && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 90,
          background: 'rgba(251,191,36,0.08)', borderBottom: '1px solid rgba(251,191,36,0.22)',
          padding: '6px 24px', textAlign: 'center',
          fontSize: 11, fontWeight: 600, color: '#fbbf24', fontFamily: font, letterSpacing: '0.1em',
        }}>
          ⚡ Offline — showing last cached session data
        </div>
      )}

      {/* ── App shell ── */}
      <div style={{
        width: '100vw', height: '100vh', background: '#06060A',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: font,
        paddingTop: pwa.isOffline ? 32 : 0,
      }}>

        {/* ══════════════ TOP BAR ══════════════ */}
        <div style={{
          height: isMobile ? 48 : 52, flexShrink: 0,
          display: 'flex', alignItems: 'stretch',
          background: 'rgba(4,4,8,0.98)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          {/* Logo */}
          <div style={{
            width: isMobile ? 60 : 200, flexShrink: 0,
            display: 'flex', alignItems: 'center',
            padding: isMobile ? '0 12px' : '0 20px', gap: 10,
            borderRight: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{
              width: 28, height: 28, background: '#E10600', flexShrink: 0,
              clipPath: 'polygon(14% 0%,100% 0%,86% 100%,0% 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 10 }}>F1</span>
            </div>
            {!isMobile && (
              <div>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1.1, fontFamily: fontCondensed }}>Timing</div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: font }}>2026 Season</div>
              </div>
            )}
          </div>

          {/* Session info */}
          <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
            <ErrorBoundary label="Top Bar">
              <TopBar
                sessionInfo={live.sessionInfo}
                isLive={live.isLive}
                dataSource={isReplay ? 'Replay' : 'Simulated'}
              />
            </ErrorBoundary>
          </div>

          {/* Right controls */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 12,
            padding: isMobile ? '0 10px' : '0 20px',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}>
            {viewMode === 'live' && live.isLive && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#E10600', boxShadow: '0 0 8px #E10600' }} />
                {!isMobile && <span style={{ fontSize: 9, fontWeight: 800, color: '#E10600', letterSpacing: '0.18em' }}>LIVE</span>}
              </div>
            )}
            {pwa.isInstallable && !pwa.isInstalled && !isMobile && (
              <button onClick={pwa.install} style={{
                padding: '5px 12px', borderRadius: 3, fontSize: 10, fontWeight: 600,
                letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
                fontFamily: font, background: 'transparent',
                border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.45)',
              }}>Install</button>
            )}
            <button onClick={() => setShowHelp(true)} style={{
              width: 26, height: 26, borderRadius: 5,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 12, fontFamily: font,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>?</button>
          </div>
        </div>

        {/* ══════════════ VIEW TABS + TOOLBAR ══════════════ */}
        <div style={{
          height: isMobile ? 38 : 40, flexShrink: 0,
          display: 'flex', alignItems: 'stretch',
          background: 'rgba(5,5,9,0.99)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          overflowX: 'auto', overflowY: 'hidden',
        }}>
          {/* View mode tabs */}
          <div style={{ display: 'flex', alignItems: 'stretch', borderRight: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
            {([
              ['live',    'Live',    <IconLive />],
              ['replay',  'Replay',  <IconReplay />],
              ['history', 'History', <IconHistory />],
            ] as [ViewMode, string, React.ReactNode][]).map(([m, l, icon]) => (
              <button key={m} onClick={() => setViewMode(m)} style={tabBtn(viewMode === m)}>
                {icon}
                {!isMobile && l}
              </button>
            ))}
          </div>

          {/* Map style chips */}
          {viewMode !== 'history' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '0 12px', borderRight: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
              {!isMobile && <span style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.15em', textTransform: 'uppercase', marginRight: 6 }}>Map</span>}
              {([['vector','Dark'],['satellite','3D'],['track','Circuit']] as [MapStyle,string][]).map(([s, l]) => (
                <button key={s} onClick={() => setMapStyle(s)} style={chip(mapStyle === s)}>{l}</button>
              ))}
            </div>
          )}

          {/* H2H */}
          {viewMode !== 'history' && (
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px', borderRight: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
              <button onClick={() => setShowH2H(p => !p)} style={chip(showH2H,'rgba(177,79,255,0.15)','#B14FFF')}>H2H</button>
            </div>
          )}

          {/* Panel quick-access buttons — desktop shows icons+label, mobile icons only */}
          {viewMode !== 'history' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '0 10px', marginLeft: 'auto', flexShrink: 0 }}>
              {PANELS.map(p => (
                <button
                  key={p.id}
                  onClick={() => { openPanel(p.id); }}
                  title={p.label}
                  style={{
                    padding: isMobile ? '5px 8px' : '5px 12px',
                    borderRadius: 3, border: 'none', cursor: 'pointer', fontFamily: font,
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                    background: (panelOpen && rightPanel === p.id) ? 'rgba(225,6,0,0.12)' : 'transparent',
                    color: (panelOpen && rightPanel === p.id) ? '#E10600' : 'rgba(255,255,255,0.3)',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 13 }}>{p.icon}</span>
                  {!isMobile && p.label}
                </button>
              ))}
            </div>
          )}

          {/* Replay controls */}
          {viewMode === 'replay' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', borderLeft: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
              <div style={{ position: 'relative' }}>
                <button onClick={() => setSessionOpen(p => !p)} style={{
                  ...chip(false), border: '1px solid rgba(255,255,255,0.1)', padding: '5px 12px',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  {chosenSession ? (replay.sessions.find(s => s.session_key === chosenSession)?.location ?? 'Race') : 'Select Race'}
                  <span style={{ fontSize: 7, opacity: 0.4 }}>▼</span>
                </button>
                {sessionOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 60,
                    background: 'rgba(6,6,10,0.99)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6, minWidth: 220, maxHeight: 280, overflowY: 'auto',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                  }}>
                    {replay.loadingSessions
                      ? <div style={{ padding: '14px 18px', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Loading…</div>
                      : replay.sessions.map(s => (
                        <button key={s.session_key}
                          onClick={() => { setChosenSession(s.session_key); setSessionOpen(false); }}
                          style={{
                            display: 'block', width: '100%', textAlign: 'left',
                            padding: '10px 18px', background: 'transparent', border: 'none',
                            cursor: 'pointer', color: 'rgba(255,255,255,0.65)', fontFamily: font,
                            borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12,
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <span style={{ fontWeight: 700, color: '#fff' }}>{s.location}</span>
                          <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 6, fontSize: 10 }}>
                            {new Date(s.date_start).toLocaleDateString(undefined,{month:'short',day:'numeric'})} · {s.year}
                          </span>
                        </button>
                      ))
                    }
                  </div>
                )}
              </div>
              <button onClick={replay.isPlaying ? replay.pause : replay.play} style={{
                width: 28, height: 28, borderRadius: 4, border: 'none',
                background: replay.isPlaying ? 'rgba(225,6,0,0.15)' : 'rgba(255,255,255,0.07)',
                color: replay.isPlaying ? '#ff6060' : '#fff',
                cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{replay.isPlaying ? '⏸' : '▶'}</button>
              <div style={{ display: 'flex', gap: 2 }}>
                {[1,2,5,10].map(s => (
                  <button key={s} onClick={() => { replay.setSpeed(s); replaySpeedRef.current = s; }}
                    style={{ ...chip(replay.speed === s), padding: '4px 8px', fontSize: 9 }}>{s}×</button>
                ))}
              </div>
              {!isMobile && (
                <>
                  <input type="range" min={0} max={1000}
                    value={Math.round(replay.progress * 1000)}
                    onChange={e => replay.seekTo(+e.target.value / 1000)}
                    style={{ width: 100, accentColor: '#E10600', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                    L{curLap}/{totalLaps}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Replay progress strip */}
        {viewMode === 'replay' && (
          <div style={{ height: 2, flexShrink: 0, background: 'rgba(255,255,255,0.04)' }}>
            <div style={{ width: `${replay.progress * 100}%`, height: '100%', background: 'linear-gradient(90deg,#E10600,#ff4500)', transition: 'width 0.15s' }} />
          </div>
        )}

        {/* ══════════════ HISTORY VIEW ══════════════ */}
        {viewMode === 'history' && (
          <ErrorBoundary label="History">
            <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '24px 20px' : '48px 56px' }}>
              <div style={{ maxWidth: 980, margin: '0 auto' }}>
                <div style={{ marginBottom: 32 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#E10600', letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: 10 }}>Results Archive</div>
                  <div style={{ fontSize: isMobile ? 28 : 42, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', fontFamily: fontCondensed }}>2026 Season</div>
                </div>
                {replay.loadingSessions
                  ? <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>Loading sessions…</div>
                  : replay.sessions.length === 0
                  ? <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>No 2026 sessions available yet from OpenF1.</div>
                  : (
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
                      {replay.sessions.map(s => (
                        <button key={s.session_key}
                          onClick={() => { setChosenSession(s.session_key); setViewMode('replay'); }}
                          style={{
                            textAlign: 'left', padding: '20px 24px', borderRadius: 6, cursor: 'pointer',
                            background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
                            fontFamily: font, transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
                        >
                          <div style={{ fontSize: 9, color: '#E10600', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>Race Session</div>
                          <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 4, fontFamily: fontCondensed }}>{s.location}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>{s.circuit_short_name}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                              {new Date(s.date_start).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}
                            </div>
                            <div style={{ fontSize: 10, color: '#E10600', fontWeight: 700, letterSpacing: '0.1em' }}>Watch →</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )
                }
              </div>
            </div>
          </ErrorBoundary>
        )}

        {/* ══════════════ MAIN DASHBOARD ══════════════ */}
        {viewMode !== 'history' && (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0, position: 'relative' }}>

  
            {/* ── Loading overlay — shown until first real OpenF1 data arrives ── */}
            {isLoading && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 80,
                background: 'rgba(6,6,10,0.92)', backdropFilter: 'blur(8px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 16,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.08)',
                  borderTop: '2px solid #E10600',
                  animation: 'spin 0.9s linear infinite',
                }} />
                <div style={{ fontFamily: font, fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
                  Connecting to OpenF1
                </div>
                <div style={{ fontFamily: font, fontSize: 10, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.08em' }}>
                  {live.sessionInfo?.meetingName ?? 'Fetching live session…'}
                </div>
              </div>
            )}

            {/* ── MAP (full width — no left leaderboard column) ── */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>

              {/* Map canvas */}
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <ErrorBoundary label="Track Map">
                  {mapStyle === 'vector'    && <VectorTrackMap  drivers={drivers} onDriverClick={handleDriverSelect} selectedDriverId={selectedId} battles={live.battles} location={live.sessionInfo?.location} />}
                  {mapStyle === 'satellite' && <RaceMap         drivers={drivers} onDriverSelect={handleDriverSelect} selectedDriver={selectedDriver} location={live.sessionInfo?.location} />}
                  {mapStyle === 'track'     && <AccurateRaceMap drivers={drivers} onDriverSelect={handleDriverSelect} selectedDriver={selectedDriver} location={live.sessionInfo?.location} />}
                </ErrorBoundary>

                {/* H2H overlay */}
                <AnimatePresence>
                  {showH2H && (
                    <motion.div key="h2h" style={{ position: 'absolute', inset: 0, zIndex: 40 }}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      <ErrorBoundary label="H2H">
                        <HeadToHead drivers={leaderboard} telemetryMap={live.telemetryMap} onClose={() => setShowH2H(false)} />
                      </ErrorBoundary>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Telemetry overlay */}
                <AnimatePresence>
                  {selectedDriver && selectedTelemetry && !showH2H && (
                    advTelemetry
                      ? <AdvancedTelemetry key="adv"
                          driver={{ abbreviation: selectedDriver.abbreviation, fullName: selectedDriver.fullName, team: selectedDriver.team, teamColor: selectedDriver.teamColor, number: selectedDriver.number }}
                          telemetry={selectedTelemetry}
                          onClose={() => { setSelectedId(null); setAdvTelemetry(false); }}
                        />
                      : <DriverTelemetry key="basic"
                          driver={{ abbreviation: selectedDriver.abbreviation, fullName: selectedDriver.fullName, team: selectedDriver.team, teamColor: selectedDriver.teamColor, number: selectedDriver.number }}
                          telemetry={selectedTelemetry}
                          onClose={() => setSelectedId(null)}
                        />
                  )}
                </AnimatePresence>

                {/* Full telemetry upgrade pill */}
                {selectedDriver && selectedTelemetry && !advTelemetry && !showH2H && (
                  <button onClick={() => setAdvTelemetry(true)} style={{
                    position: 'absolute', bottom: 16, right: panelOpen && !isMobile ? 336 : 16, zIndex: 20,
                    background: 'rgba(4,4,8,0.92)', border: '1px solid rgba(255,255,255,0.14)',
                    color: 'rgba(255,255,255,0.6)', padding: '9px 16px',
                    borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                    letterSpacing: '0.08em', fontFamily: font, backdropFilter: 'blur(12px)',
                    transition: 'all 0.2s',
                  }}>Full Telemetry →</button>
                )}

                {/* Lap counter badge — bottom-left of map */}
                {curLap > 0 && (
                  <div style={{
                    position: 'absolute', bottom: 16, left: 16, zIndex: 20,
                    background: 'rgba(4,4,8,0.88)', border: '1px solid rgba(255,255,255,0.1)',
                    padding: '6px 14px', backdropFilter: 'blur(12px)',
                    fontFamily: font, display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#E10600' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>LAP</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{curLap}<span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, fontWeight: 400 }}>/{totalLaps}</span></span>
                  </div>
                )}
              </div>

              {/* Strategy bar */}
              {rightPanel !== 'strategy' && (
                <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(4,4,8,0.8)' }}>
                  <ErrorBoundary label="Strategy Bar">
                    <StrategyBar drivers={leaderboard} currentLap={curLap} totalLaps={totalLaps} selectedDriverId={selectedId} onDriverClick={handleDriverClick} />
                  </ErrorBoundary>
                </div>
              )}
            </div>

            {/* ── SIDE PANEL (desktop: inline sidebar / mobile: bottom drawer) ── */}
            <AnimatePresence>
              {panelOpen && (
                <>
                  {/* Mobile backdrop */}
                  {isMobile && (
                    <motion.div
                      key="backdrop"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={() => setPanelOpen(false)}
                      style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50 }}
                    />
                  )}

                  <motion.div
                    key="panel"
                    initial={isMobile ? { y: '100%' } : { x: 320 }}
                    animate={isMobile ? { y: 0 } : { x: 0 }}
                    exit={isMobile ? { y: '100%' } : { x: 320 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    style={{
                      // Desktop: right sidebar
                      // Mobile: bottom sheet
                      ...(isMobile ? {
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        height: '72vh', zIndex: 60,
                        borderTopLeftRadius: 16, borderTopRightRadius: 16,
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                      } : {
                        position: 'relative',
                        width: 320, flexShrink: 0,
                        borderLeft: '1px solid rgba(255,255,255,0.06)',
                      }),
                      background: 'rgba(4,4,8,0.97)',
                      display: 'flex', flexDirection: 'column',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Panel tab strip */}
                    <div style={{
                      display: 'flex', alignItems: 'stretch', flexShrink: 0,
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      background: 'rgba(3,3,7,0.8)',
                      overflowX: 'auto',
                    }}>
                      {/* Mobile drag handle */}
                      {isMobile && (
                        <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 36, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
                      )}
                      {PANELS.map(p => (
                        <button
                          key={p.id}
                          onClick={() => setRightPanel(p.id)}
                          style={{
                            flex: 1, minWidth: isMobile ? 52 : 44, height: isMobile ? 52 : 44,
                            border: 'none', cursor: 'pointer', background: 'transparent',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                            color: rightPanel === p.id ? '#E10600' : 'rgba(255,255,255,0.28)',
                            borderBottom: rightPanel === p.id ? '2px solid #E10600' : '2px solid transparent',
                            transition: 'all 0.15s', flexShrink: 0,
                          }}
                        >
                          <span style={{ fontSize: 15 }}>{p.icon}</span>
                          <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: font }}>{p.label}</span>
                        </button>
                      ))}
                      {/* Close button */}
                      <button
                        onClick={() => setPanelOpen(false)}
                        style={{
                          width: 44, flexShrink: 0, border: 'none', cursor: 'pointer',
                          background: 'transparent', color: 'rgba(255,255,255,0.3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderLeft: '1px solid rgba(255,255,255,0.05)',
                        }}
                      ><IconClose /></button>
                    </div>

                    {/* Panel label */}
                    <div style={{
                      height: 36, flexShrink: 0,
                      display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10,
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}>
                      <div style={{ width: 2, height: 14, background: '#E10600', borderRadius: 1 }} />
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontFamily: font }}>
                        {PANELS.find(p => p.id === rightPanel)?.label}
                      </span>
                      {rightPanel === 'timing' && curLap > 0 && (
                        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.25)', fontVariantNumeric: 'tabular-nums' }}>
                          L{curLap}/{totalLaps}
                        </span>
                      )}
                    </div>

                    {/* Panel content */}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <ErrorBoundary label="Panel">
                        {rightPanel === 'timing'     && <Leaderboard positions={leaderboard} onDriverClick={handleDriverClick} selectedDriverId={selectedId} battles={live.battles} currentLap={curLap} totalLaps={totalLaps} />}
                        {rightPanel === 'highlights' && <HighlightsFeed events={events} raceName={live.sessionInfo?.location} raceYear={2026} />}
                        {rightPanel === 'session'    && <SessionInfo weather={live.weatherInfo} />}
                        {rightPanel === 'strategy'   && <StrategyBar drivers={leaderboard} currentLap={curLap} totalLaps={totalLaps} selectedDriverId={selectedId} onDriverClick={handleDriverClick} />}
                        {rightPanel === 'gaps'       && <GapPredictor predictions={gapPreds} drivers={leaderboard} onDriverClick={handleDriverClick} />}
                        {rightPanel === 'tyres'      && <TyreDegradationPanel data={tyreDeg} drivers={leaderboard} onDriverClick={handleDriverClick} />}
                      </ErrorBoundary>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; height: 3px; background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
    </>
  );
}