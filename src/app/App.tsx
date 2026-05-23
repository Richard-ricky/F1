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
import { useInterpolatedDrivers } from './hooks/useInterpolatedDrivers';
import { useTyreDegradation }     from './hooks/useTyreDegradation';
import { useGapPredictor }        from './hooks/useGapPredictor';
import { useKeyboardShortcuts }   from './hooks/useKeyboardShortcuts';
import { usePWA }                 from './hooks/usePWA';

// ── Types ─────────────────────────────────────────────────────────────────────
type ViewMode   = 'live' | 'replay' | 'history';
type MapStyle   = 'vector' | 'satellite' | 'track';
type RightPanel = 'timing' | 'highlights' | 'session' | 'strategy' | 'gaps' | 'tyres';

const font = '"Barlow","Helvetica Neue",-apple-system,sans-serif';
const fontCondensed = '"Barlow Condensed","Helvetica Neue",sans-serif';

// ── Icon components (simple inline SVGs to avoid import issues) ───────────────
const IconLive    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0"/><path d="M7.5 12a4.5 4.5 0 1 0 9 0 4.5 4.5 0 0 0-9 0"/></svg>;
const IconReplay  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3"/></svg>;
const IconHistory = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;

// ── Panel icon map ────────────────────────────────────────────────────────────
const PANEL_ICONS: Record<RightPanel, string> = {
  timing:     '⏱',
  highlights: '📺',
  session:    '📅',
  strategy:   '🔧',
  gaps:       '📊',
  tyres:      '🔴',
};

const PANEL_LABELS: Record<RightPanel, string> = {
  timing:     'Timing',
  highlights: 'Clips',
  session:    'Schedule',
  strategy:   'Strategy',
  gaps:       'Predictions',
  tyres:      'Tyres',
};

export default function App() {
  // ── UI state ─────────────────────────────────────────────────────────────
  const [showLanding,    setShowLanding]    = useState(true);
  const [viewMode,       setViewMode]       = useState<ViewMode>('live');
  const [mapStyle,       setMapStyle]       = useState<MapStyle>('vector');
  const [rightPanel,     setRightPanel]     = useState<RightPanel>('timing');
  const [selectedId,     setSelectedId]     = useState<string | null>(null);
  const [advTelemetry,   setAdvTelemetry]   = useState(false);
  const [showH2H,        setShowH2H]        = useState(false);
  const [showHelp,       setShowHelp]       = useState(false);
  const [sessionOpen,    setSessionOpen]    = useState(false);
  const [chosenSession,  setChosenSession]  = useState<number | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const replaySpeedRef = useRef(1);

  // ── Data hooks ────────────────────────────────────────────────────────────
  const live   = useOpenF1Live(2000);
  const replay = useReplayEngine();
  const pwa    = usePWA();

  useEffect(() => {
    if (chosenSession) replay.loadSession(chosenSession);
  }, [chosenSession]);

  const isReplay    = viewMode === 'replay';
  const rawDrivers  = isReplay ? replay.replayDrivers     : live.mapDrivers;
  const leaderboard = isReplay ? replay.replayLeaderboard : live.leaderboard;
  const events      = isReplay ? replay.replayEvents      : live.raceEvents;
  const curLap      = isReplay ? replay.currentLap        : live.currentLap;
  const totalLaps   = isReplay ? replay.totalLaps         : live.totalLaps;

  const drivers = useInterpolatedDrivers(rawDrivers, 2000);
  const tyreDeg  = useTyreDegradation(leaderboard, curLap, totalLaps);
  const gapPreds = useGapPredictor(leaderboard, curLap, totalLaps);

  const selectedDriver    = drivers.find(d => d.id === selectedId) ?? null;
  const selectedTelemetry = selectedId ? live.telemetryMap[selectedId] : null;

  // ── Handlers ─────────────────────────────────────────────────────────────
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

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useKeyboardShortcuts({
    onMapVector:       () => setMapStyle('vector'),
    onMapSatellite:    () => setMapStyle('satellite'),
    onMapTrack:        () => setMapStyle('track'),
    onPanelTiming:     () => setRightPanel('timing'),
    onPanelHighlights: () => setRightPanel('highlights'),
    onPanelSession:    () => setRightPanel('session'),
    onPanelStrategy:   () => setRightPanel('strategy'),
    onPlayPause:   () => replay.isPlaying ? replay.pause() : replay.play(),
    onSeekBack:    () => replay.seekTo(Math.max(0, replay.progress - 0.02)),
    onSeekForward: () => replay.seekTo(Math.min(1, replay.progress + 0.02)),
    onSpeedUp: () => {
      const s = [1,2,5,10];
      const next = s[Math.min(s.length-1, s.indexOf(replaySpeedRef.current)+1)];
      replaySpeedRef.current = next;
      replay.setSpeed(next);
    },
    onSpeedDown: () => {
      const s = [1,2,5,10];
      const next = s[Math.max(0, s.indexOf(replaySpeedRef.current)-1)];
      replaySpeedRef.current = next;
      replay.setSpeed(next);
    },
    onCloseTelemetry: () => { setSelectedId(null); setAdvTelemetry(false); setShowH2H(false); },
    onToggleHelp:     () => setShowHelp(p => !p),
  });

  // ── Style helpers ─────────────────────────────────────────────────────────

  /* Top-bar tab button */
  const tabBtn = (active: boolean, accent = '#E10600'): React.CSSProperties => ({
    padding: '0 18px',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    fontFamily: font,
    border: 'none',
    background: 'transparent',
    color: active ? '#fff' : 'rgba(255,255,255,0.32)',
    borderBottom: active ? `2px solid ${accent}` : '2px solid transparent',
    transition: 'all 0.15s',
    flexShrink: 0,
  });

  /* Map style chip */
  const mapChip = (active: boolean): React.CSSProperties => ({
    padding: '5px 14px', borderRadius: 3,
    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
    cursor: 'pointer', fontFamily: font, border: 'none',
    background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
    color: active ? '#fff' : 'rgba(255,255,255,0.3)',
    transition: 'all 0.15s',
  });

  /* Right panel tab */
  const panelTab = (active: boolean): React.CSSProperties => ({
    padding: '10px 0', width: '100%', textAlign: 'left',
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
    cursor: 'pointer', fontFamily: font, border: 'none', background: 'transparent',
    color: active ? '#fff' : 'rgba(255,255,255,0.28)',
    borderLeft: active ? '2px solid #E10600' : '2px solid transparent',
    paddingLeft: active ? 14 : 16,
    transition: 'all 0.15s',
  });

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Landing page */}
      <AnimatePresence>
        {showLanding && (
          <motion.div key="landing" style={{ position: 'fixed', inset: 0, zIndex: 100 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}>
            <LandingPage onEnter={() => setShowLanding(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard help overlay */}
      <ShortcutsOverlay visible={showHelp} onClose={() => setShowHelp(false)} />

      {/* Offline banner */}
      {pwa.isOffline && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 90,
          background: 'rgba(251,191,36,0.08)', borderBottom: '1px solid rgba(251,191,36,0.22)',
          padding: '6px 24px', textAlign: 'center',
          fontSize: 11, fontWeight: 600, color: '#fbbf24',
          fontFamily: font, letterSpacing: '0.1em',
        }}>
          ⚡ Offline — showing last cached session data
        </div>
      )}

      {/* ── Main app shell ── */}
      <div style={{
        width: '100vw', height: '100vh', background: '#06060A',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        fontFamily: font,
        paddingTop: pwa.isOffline ? 32 : 0,
      }}>

        {/* ═══ TOP BAR ═══ */}
        <div style={{
          height: 52, flexShrink: 0,
          display: 'flex', alignItems: 'stretch',
          background: 'rgba(4,4,8,0.98)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          {/* Logo section */}
          <div style={{
            width: 220, flexShrink: 0, display: 'flex', alignItems: 'center',
            padding: '0 20px', gap: 10,
            borderRight: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{
              width: 30, height: 30, background: '#E10600', flexShrink: 0,
              clipPath: 'polygon(14% 0%,100% 0%,86% 100%,0% 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 11 }}>F1</span>
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1.1, fontFamily: fontCondensed }}>
                Timing
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: font }}>
                2026 Season
              </div>
            </div>
          </div>

          {/* Session info from TopBar */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
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
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '0 20px',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
          }}>
            {/* Live indicator */}
            {viewMode === 'live' && live.isLive && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#E10600', boxShadow: '0 0 8px #E10600' }} className="animate-pulse" />
                <span style={{ fontSize: 10, fontWeight: 800, color: '#E10600', letterSpacing: '0.18em' }}>LIVE</span>
              </div>
            )}

            {/* PWA install */}
            {pwa.isInstallable && !pwa.isInstalled && (
              <button onClick={pwa.install} style={{
                padding: '5px 12px', borderRadius: 3,
                fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: font,
                background: 'transparent', border: '1px solid rgba(255,255,255,0.14)',
                color: 'rgba(255,255,255,0.45)', transition: 'all 0.15s',
              }}>
                Install
              </button>
            )}

            {/* Help */}
            <button onClick={() => setShowHelp(true)} title="Keyboard shortcuts (?)" style={{
              width: 28, height: 28, borderRadius: 6,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 13,
              fontFamily: font, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}>?</button>
          </div>
        </div>

        {/* ═══ VIEW MODE TABS ═══ */}
        <div style={{
          height: 40, flexShrink: 0,
          display: 'flex', alignItems: 'stretch',
          background: 'rgba(5,5,9,0.99)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          {/* View mode group */}
          <div style={{ display: 'flex', alignItems: 'stretch', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
            {([
              ['live',    'Live',    <IconLive />],
              ['replay',  'Replay',  <IconReplay />],
              ['history', 'History', <IconHistory />],
            ] as [ViewMode, string, React.ReactNode][]).map(([m, l, icon]) => (
              <button key={m} onClick={() => setViewMode(m)} style={tabBtn(viewMode === m)}>
                {icon}
                {l}
              </button>
            ))}
          </div>

          {/* Map style group — only when not in history */}
          {viewMode !== 'history' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 2,
              padding: '0 16px', borderRight: '1px solid rgba(255,255,255,0.05)',
            }}>
              <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.15em', textTransform: 'uppercase', marginRight: 8 }}>Map</span>
              {([
                ['vector',    'Dark'],
                ['satellite', '3D'],
                ['track',     'Track'],
              ] as [MapStyle, string][]).map(([s, l]) => (
                <button key={s} onClick={() => setMapStyle(s)} style={mapChip(mapStyle === s)}>{l}</button>
              ))}
            </div>
          )}

          {/* H2H toggle */}
          {viewMode !== 'history' && (
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
              <button onClick={() => setShowH2H(p => !p)} style={{
                ...mapChip(showH2H),
                color: showH2H ? '#B14FFF' : 'rgba(255,255,255,0.3)',
                background: showH2H ? 'rgba(177,79,255,0.12)' : 'transparent',
                border: showH2H ? '1px solid rgba(177,79,255,0.3)' : '1px solid transparent',
              }}>
                H2H
              </button>
            </div>
          )}

          {/* Replay controls — appear inline when in replay mode */}
          {viewMode === 'replay' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', flex: 1 }}>
              {/* Session picker */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setSessionOpen(p => !p)} style={{
                  ...mapChip(false),
                  display: 'flex', alignItems: 'center', gap: 6,
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '5px 12px',
                }}>
                  {chosenSession
                    ? replay.sessions.find(s => s.session_key === chosenSession)?.location ?? 'Race'
                    : 'Select Race'}
                  <span style={{ fontSize: 7, opacity: 0.4 }}>▼</span>
                </button>
                {sessionOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 60,
                    background: 'rgba(6,6,10,0.99)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6, minWidth: 220, maxHeight: 300, overflowY: 'auto',
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
                              transition: 'background 0.1s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <span style={{ fontWeight: 700, color: '#fff' }}>{s.location}</span>
                            <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 6, fontSize: 10 }}>
                              {new Date(s.date_start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {s.year}
                            </span>
                          </button>
                        ))
                    }
                  </div>
                )}
              </div>

              {/* Play/Pause */}
              <button onClick={replay.isPlaying ? replay.pause : replay.play} style={{
                width: 30, height: 30, borderRadius: 4, border: 'none',
                background: replay.isPlaying ? 'rgba(225,6,0,0.15)' : 'rgba(255,255,255,0.07)',
                color: replay.isPlaying ? '#ff6060' : '#fff',
                cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {replay.isPlaying ? '⏸' : '▶'}
              </button>

              {/* Speed */}
              <div style={{ display: 'flex', gap: 2 }}>
                {[1,2,5,10].map(s => (
                  <button key={s} onClick={() => { replay.setSpeed(s); replaySpeedRef.current = s; }}
                    style={{ ...mapChip(replay.speed === s), padding: '4px 8px', fontSize: 10 }}>
                    {s}×
                  </button>
                ))}
              </div>

              {/* Scrubber */}
              <input type="range" min={0} max={1000}
                value={Math.round(replay.progress * 1000)}
                onChange={e => replay.seekTo(+e.target.value / 1000)}
                style={{ width: 120, accentColor: '#E10600', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                L{curLap}/{totalLaps}
              </span>
            </div>
          )}
        </div>

        {/* Replay progress bar */}
        {viewMode === 'replay' && (
          <div style={{ height: 2, flexShrink: 0, background: 'rgba(255,255,255,0.04)' }}>
            <div style={{ width: `${replay.progress * 100}%`, height: '100%', background: 'linear-gradient(90deg,#E10600,#ff4500)', transition: 'width 0.15s' }} />
          </div>
        )}

        {/* ═══ HISTORY VIEW ═══ */}
        {viewMode === 'history' && (
          <ErrorBoundary label="History">
            <div style={{ flex: 1, overflowY: 'auto', padding: '48px 56px' }}>
              <div style={{ maxWidth: 980, margin: '0 auto' }}>
                <div style={{ marginBottom: 40 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#E10600', letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: 12 }}>
                    Results Archive
                  </div>
                  <div style={{ fontSize: 42, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', fontFamily: fontCondensed }}>
                    2026 Season
                  </div>
                </div>
                {replay.loadingSessions ? (
                  <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>Loading sessions…</div>
                ) : replay.sessions.length === 0 ? (
                  <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>No 2026 sessions available yet from OpenF1.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
                    {replay.sessions.map(s => (
                      <button key={s.session_key}
                        onClick={() => { setChosenSession(s.session_key); setViewMode('replay'); }}
                        style={{
                          textAlign: 'left', padding: '24px 28px', borderRadius: 6, cursor: 'pointer',
                          background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
                          fontFamily: font, transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
                      >
                        <div style={{ fontSize: 9, color: '#E10600', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10 }}>
                          Race Session
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 4, letterSpacing: '-0.01em', fontFamily: fontCondensed }}>{s.location}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>{s.circuit_short_name}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                            {new Date(s.date_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                          <div style={{ fontSize: 10, color: '#E10600', fontWeight: 700, letterSpacing: '0.1em' }}>
                            Watch →
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ErrorBoundary>
        )}

        {/* ═══ MAIN DASHBOARD: 3-column layout ═══ */}
        {viewMode !== 'history' && (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

            {/* ── LEFT: Leaderboard panel ── */}
            <div style={{
              width: 262, flexShrink: 0, overflow: 'hidden',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', flexDirection: 'column',
              background: 'rgba(4,4,8,0.6)',
            }}>
              {/* Panel header */}
              <div style={{
                height: 42, flexShrink: 0,
                display: 'flex', alignItems: 'center',
                padding: '0 16px', gap: 10,
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{ width: 2, height: 16, background: '#E10600', borderRadius: 1 }} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
                  Standings
                </span>
                {curLap > 0 && (
                  <span style={{
                    marginLeft: 'auto', fontSize: 10, fontWeight: 700,
                    color: 'rgba(255,255,255,0.25)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    L{curLap}/{totalLaps}
                  </span>
                )}
              </div>

              {/* Leaderboard content */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <ErrorBoundary label="Leaderboard">
                  <Leaderboard
                    positions={leaderboard}
                    onDriverClick={handleDriverClick}
                    selectedDriverId={selectedId}
                    battles={live.battles}
                    currentLap={curLap}
                    totalLaps={totalLaps}
                  />
                </ErrorBoundary>
              </div>
            </div>

            {/* ── CENTRE: Map + overlays ── */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

              {/* Map header — map style switcher minimal */}
              <div style={{
                height: 38, flexShrink: 0,
                display: 'flex', alignItems: 'center',
                padding: '0 16px', gap: 8,
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                background: 'rgba(4,4,8,0.4)',
              }}>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                  Track View
                </span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
                  {([
                    ['vector',    'Dark'],
                    ['satellite', '3D'],
                    ['track',     'Circuit'],
                  ] as [MapStyle, string][]).map(([s, l]) => (
                    <button key={s} onClick={() => setMapStyle(s)} style={mapChip(mapStyle === s)}>{l}</button>
                  ))}
                </div>
              </div>

              {/* Map canvas */}
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <ErrorBoundary label="Track Map">
                  {mapStyle === 'vector'    && <VectorTrackMap  drivers={drivers} onDriverClick={handleDriverSelect} selectedDriverId={selectedId} battles={live.battles} />}
                  {mapStyle === 'satellite' && <RaceMap         drivers={drivers} onDriverSelect={handleDriverSelect} selectedDriver={selectedDriver} />}
                  {mapStyle === 'track'     && <AccurateRaceMap drivers={drivers} onDriverSelect={handleDriverSelect} selectedDriver={selectedDriver} />}
                </ErrorBoundary>

                {/* H2H overlay */}
                <AnimatePresence>
                  {showH2H && (
                    <motion.div key="h2h" style={{ position: 'absolute', inset: 0, zIndex: 40 }}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}>
                      <ErrorBoundary label="Head to Head">
                        <HeadToHead
                          drivers={leaderboard}
                          telemetryMap={live.telemetryMap}
                          onClose={() => setShowH2H(false)}
                        />
                      </ErrorBoundary>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Telemetry overlay */}
                <AnimatePresence>
                  {selectedDriver && selectedTelemetry && !showH2H && (
                    advTelemetry ? (
                      <AdvancedTelemetry key="adv"
                        driver={{ abbreviation: selectedDriver.abbreviation, fullName: selectedDriver.fullName, team: selectedDriver.team, teamColor: selectedDriver.teamColor, number: selectedDriver.number }}
                        telemetry={selectedTelemetry}
                        onClose={() => { setSelectedId(null); setAdvTelemetry(false); }}
                      />
                    ) : (
                      <DriverTelemetry key="basic"
                        driver={{ abbreviation: selectedDriver.abbreviation, fullName: selectedDriver.fullName, team: selectedDriver.team, teamColor: selectedDriver.teamColor, number: selectedDriver.number }}
                        telemetry={selectedTelemetry}
                        onClose={() => setSelectedId(null)}
                      />
                    )
                  )}
                </AnimatePresence>

                {/* Full telemetry upgrade pill */}
                {selectedDriver && selectedTelemetry && !advTelemetry && !showH2H && (
                  <button onClick={() => setAdvTelemetry(true)}
                    style={{
                      position: 'absolute', bottom: 16, right: 16, zIndex: 20,
                      background: 'rgba(4,4,8,0.92)', border: '1px solid rgba(255,255,255,0.14)',
                      color: 'rgba(255,255,255,0.6)', padding: '9px 16px',
                      borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                      letterSpacing: '0.08em', fontFamily: font, backdropFilter: 'blur(12px)',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; }}
                  >
                    Full Telemetry →
                  </button>
                )}
              </div>

              {/* Strategy bar — below the map, always visible */}
              {rightPanel !== 'strategy' && (
                <div style={{
                  flexShrink: 0,
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  background: 'rgba(4,4,8,0.8)',
                }}>
                  <ErrorBoundary label="Strategy Bar">
                    <StrategyBar
                      drivers={leaderboard}
                      currentLap={curLap}
                      totalLaps={totalLaps}
                      selectedDriverId={selectedId}
                      onDriverClick={handleDriverClick}
                    />
                  </ErrorBoundary>
                </div>
              )}
            </div>

            {/* ── RIGHT: Panel with side tab navigation ── */}
            <div style={{
              width: 320, flexShrink: 0,
              borderLeft: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', overflow: 'hidden',
              background: 'rgba(4,4,8,0.6)',
            }}>

              {/* Vertical tab rail */}
              <div style={{
                width: 52, flexShrink: 0,
                borderRight: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                paddingTop: 12, gap: 2,
                background: 'rgba(3,3,7,0.5)',
              }}>
                {(Object.keys(PANEL_LABELS) as RightPanel[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setRightPanel(p)}
                    title={PANEL_LABELS[p]}
                    style={{
                      width: 40, height: 40, borderRadius: 6,
                      border: 'none', cursor: 'pointer',
                      background: rightPanel === p ? 'rgba(225,6,0,0.15)' : 'transparent',
                      color: rightPanel === p ? '#E10600' : 'rgba(255,255,255,0.25)',
                      fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                      boxShadow: rightPanel === p ? 'inset 2px 0 0 #E10600' : 'none',
                    }}
                    onMouseEnter={e => { if (rightPanel !== p) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={e => { if (rightPanel !== p) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {PANEL_ICONS[p]}
                  </button>
                ))}
              </div>

              {/* Panel content */}
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Panel header */}
                <div style={{
                  height: 42, flexShrink: 0,
                  display: 'flex', alignItems: 'center',
                  padding: '0 16px', gap: 10,
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <div style={{ width: 2, height: 16, background: '#E10600', borderRadius: 1 }} />
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
                    {PANEL_LABELS[rightPanel]}
                  </span>
                </div>

                {/* Panel content area */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <ErrorBoundary label="Right Panel">
                    {rightPanel === 'timing'     && <Leaderboard positions={leaderboard} onDriverClick={handleDriverClick} selectedDriverId={selectedId} battles={live.battles} currentLap={curLap} totalLaps={totalLaps} />}
                    {rightPanel === 'highlights' && <HighlightsFeed events={events} raceName={live.sessionInfo?.location} raceYear={2026} />}
                    {rightPanel === 'session'    && <SessionInfo weather={live.weatherInfo} />}
                    {rightPanel === 'strategy'   && <StrategyBar drivers={leaderboard} currentLap={curLap} totalLaps={totalLaps} selectedDriverId={selectedId} onDriverClick={handleDriverClick} />}
                    {rightPanel === 'gaps'       && <GapPredictor predictions={gapPreds} drivers={leaderboard} onDriverClick={handleDriverClick} />}
                    {rightPanel === 'tyres'      && <TyreDegradationPanel data={tyreDeg} drivers={leaderboard} onDriverClick={handleDriverClick} />}
                  </ErrorBoundary>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@400;500;600;700&display=swap');
      `}</style>
    </>
  );
}