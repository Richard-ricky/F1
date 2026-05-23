import { useState, useEffect, useRef, useCallback } from 'react';
import type { RaceEvent } from '../hooks/useOpenF1';

/**
 * Real YouTube search + embedded player for F1 2026 highlights.
 * Tabs: Videos (YouTube search) | Race Events (from OpenF1 race_control).
 * Clicking "Find on YouTube" on any race event auto-searches it.
 *
 * Place in: src/app/components/HighlightsFeed.tsx
 * Requires: VITE_YOUTUBE_API_KEY in .env
 */

const YT_KEY = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined;

interface YTItem {
  id: { videoId: string };
  snippet: {
    title:        string;
    channelTitle: string;
    publishedAt:  string;
    description:  string;
    thumbnails:   { medium: { url: string } };
  };
}

async function ytSearch(query: string): Promise<YTItem[]> {
  if (!YT_KEY) throw new Error('NO_KEY');
  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part',       'snippet');
  url.searchParams.set('q',          query);
  url.searchParams.set('type',       'video');
  url.searchParams.set('maxResults', '9');
  url.searchParams.set('order',      'relevance');
  url.searchParams.set('key',        YT_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
  }
  const data = await res.json();
  return (data.items ?? []).filter((i: YTItem) => i.id?.videoId);
}

function eventToQuery(event: RaceEvent, year: number): string {
  const base = `Formula 1 ${year}`;
  switch (event.type) {
    case 'fastest_lap': return `${base} fastest lap ${event.drivers[0] ?? ''} onboard`;
    case 'overtake':    return `${base} overtake ${event.drivers.join(' ')} onboard`;
    case 'pitstop':     return `${base} pit stop ${event.drivers[0] ?? ''} team radio`;
    case 'safety_car':  return `${base} safety car highlights`;
    default:            return `${base} ${event.title}`;
  }
}

interface HighlightsFeedProps {
  events?:   RaceEvent[];
  raceName?: string;
  raceYear?: number;
}

type Tab = 'search' | 'events';

const font      = '"Helvetica Neue","SF Pro Display",-apple-system,sans-serif';
const EVENT_ICON: Record<string, string>  = { overtake:'⚡', pitstop:'🔧', incident:'⚠', fastest_lap:'🟣', safety_car:'🟠', flag:'🏁' };
const EVENT_COLOR: Record<string, string> = { overtake:'#FFC906', pitstop:'#3B82F6', incident:'#EF4444', fastest_lap:'#B14FFF', safety_car:'#F97316', flag:'#22C55E' };

export default function HighlightsFeed({
  events   = [],
  raceName = 'Formula 1',
  raceYear = 2026,         // ← 2026 season
}: HighlightsFeedProps) {
  const [tab,       setTab]       = useState<Tab>('search');
  const [query,     setQuery]     = useState('');
  const [videos,    setVideos]    = useState<YTItem[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [activeId,  setActiveId]  = useState<string | null>(null);
  const [pendingQ,  setPendingQ]  = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-search when tab first opens
  useEffect(() => {
    if (tab === 'search' && !videos.length && !loading) {
      runSearch(`F1 ${raceYear} ${raceName} Grand Prix highlights`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Fire pending search (from event click)
  useEffect(() => {
    if (pendingQ) {
      setTab('search');
      runSearch(pendingQ);
      setPendingQ(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingQ]);

  const runSearch = useCallback(async (q: string) => {
    const t = q.trim();
    if (!t) return;
    setLoading(true);
    setError(null);
    setVideos([]);
    setActiveId(null);
    try {
      const results = await ytSearch(t);
      setVideos(results);
      if (!results.length) setError('No videos found. Try a different search.');
    } catch (e: any) {
      setError(e.message === 'NO_KEY'
        ? 'Add VITE_YOUTUBE_API_KEY to your .env file and restart the dev server.'
        : `YouTube error: ${e.message}`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) runSearch(query.trim());
  };

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'rgba(6,6,6,0.98)', fontFamily:font }}>

      {/* ── Header + tab bar ── */}
      <div style={{ flexShrink:0, padding:'12px 16px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.28)', letterSpacing:'0.22em', textTransform:'uppercase', marginBottom:10 }}>
          Highlights
        </div>
        <div style={{ display:'flex', gap:0 }}>
          {(['search','events'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding:'7px 14px', background:'transparent', border:'none',
              borderBottom: tab===t ? '1px solid #fff' : '1px solid transparent',
              color: tab===t ? '#fff' : 'rgba(255,255,255,0.3)',
              fontSize:11, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase',
              cursor:'pointer', fontFamily:font, transition:'all 0.15s', marginBottom:-1,
            }}>
              {t === 'search' ? `▶ Videos` : `🏎 Events (${events.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Embedded player ── */}
      {activeId && (
        <div style={{ flexShrink:0, position:'relative', background:'#000', aspectRatio:'16/9', maxHeight:195 }}>
          <iframe
            src={`https://www.youtube.com/embed/${activeId}?autoplay=1&rel=0&modestbranding=1&color=white`}
            style={{ width:'100%', height:'100%', border:'none', display:'block' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="F1 Highlight"
          />
          <button onClick={() => setActiveId(null)} style={{
            position:'absolute', top:6, right:6, width:22, height:22,
            background:'rgba(0,0,0,0.7)', border:'1px solid rgba(255,255,255,0.2)',
            borderRadius:4, color:'rgba(255,255,255,0.7)', cursor:'pointer',
            fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:font,
          }}>×</button>
        </div>
      )}

      {/* ── SEARCH TAB ── */}
      {tab === 'search' && (
        <>
          {/* Search bar */}
          <form onSubmit={handleSubmit} style={{
            flexShrink:0, display:'flex', gap:8, padding:'10px 16px',
            borderBottom:'1px solid rgba(255,255,255,0.05)',
          }}>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={`Search F1 ${raceYear} videos…`}
              style={{
                flex:1, padding:'7px 12px',
                background:'rgba(255,255,255,0.05)',
                border:'1px solid rgba(255,255,255,0.1)',
                borderRadius:6, color:'#fff', fontSize:12,
                outline:'none', fontFamily:font, transition:'border-color 0.15s',
              }}
              onFocus={e  => e.target.style.borderColor='rgba(255,255,255,0.25)'}
              onBlur={e   => e.target.style.borderColor='rgba(255,255,255,0.1)'}
            />
            <button type="submit" disabled={loading} style={{
              padding:'7px 14px', background: loading ? 'rgba(255,255,255,0.04)' : '#E10600',
              border:'none', borderRadius:6, color:'#fff',
              fontSize:12, fontWeight:600, cursor: loading ? 'not-allowed':'pointer',
              fontFamily:font, letterSpacing:'0.06em', transition:'background 0.15s', flexShrink:0,
            }}
              onMouseEnter={e => { if(!loading) e.currentTarget.style.background='#c40500'; }}
              onMouseLeave={e => { if(!loading) e.currentTarget.style.background='#E10600'; }}
            >
              {loading ? '…' : 'Go'}
            </button>
          </form>

          {/* Quick chips */}
          {!loading && !videos.length && !error && (
            <div style={{ flexShrink:0, display:'flex', gap:6, padding:'8px 16px', flexWrap:'wrap', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              {[
                `F1 ${raceYear} ${raceName} highlights`,
                `F1 ${raceYear} best overtakes`,
                `F1 ${raceYear} onboard laps`,
                `F1 ${raceYear} qualifying`,
              ].map(q => (
                <button key={q} onClick={() => { setQuery(q); runSearch(q); }} style={{
                  padding:'3px 9px', background:'rgba(255,255,255,0.04)',
                  border:'1px solid rgba(255,255,255,0.08)', borderRadius:4,
                  color:'rgba(255,255,255,0.4)', fontSize:10, cursor:'pointer',
                  fontFamily:font, whiteSpace:'nowrap', transition:'all 0.12s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.4)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; }}
                >{q}</button>
              ))}
            </div>
          )}

          {/* Results */}
          <div style={{ flex:1, overflowY:'auto' }}>
            {/* Loading spinner */}
            {loading && (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:180, gap:12 }}>
                <div style={{ width:24, height:24, border:'2px solid rgba(255,255,255,0.07)', borderTopColor:'#E10600', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.22)', letterSpacing:'0.1em' }}>Searching YouTube…</span>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div style={{ padding:20 }}>
                <div style={{ padding:'12px 16px', borderRadius:8, background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.18)' }}>
                  <div style={{ fontSize:11, fontWeight:600, color:'#ef4444', marginBottom:4 }}>Error</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.38)', lineHeight:1.5 }}>{error}</div>
                </div>
              </div>
            )}

            {/* No API key */}
            {!loading && !error && !YT_KEY && (
              <div style={{ padding:28, textAlign:'center' }}>
                <div style={{ fontSize:28, marginBottom:10 }}>🔑</div>
                <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.45)', marginBottom:6 }}>YouTube API key required</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.22)', lineHeight:1.6 }}>
                  Add <code style={{ color:'#E10600', background:'rgba(255,255,255,0.05)', padding:'1px 6px', borderRadius:3 }}>VITE_YOUTUBE_API_KEY</code>
                  {' '}to your <code style={{ color:'rgba(255,255,255,0.4)' }}>.env</code> and restart.
                </div>
              </div>
            )}

            {/* Video list */}
            {!loading && !error && videos.map(v => {
              const active = activeId === v.id.videoId;
              return (
                <div key={v.id.videoId}
                  onClick={() => setActiveId(active ? null : v.id.videoId)}
                  style={{
                    display:'flex', gap:10, padding:'10px 16px',
                    borderBottom:'1px solid rgba(255,255,255,0.04)',
                    cursor:'pointer', background: active ? 'rgba(225,6,0,0.06)' : 'transparent',
                    transition:'background 0.12s',
                  }}
                  onMouseEnter={e => { if(!active) e.currentTarget.style.background='rgba(255,255,255,0.03)'; }}
                  onMouseLeave={e => { if(!active) e.currentTarget.style.background='transparent'; }}
                >
                  {/* Thumbnail */}
                  <div style={{ width:90, height:51, borderRadius:4, overflow:'hidden', background:'rgba(255,255,255,0.05)', flexShrink:0, position:'relative' }}>
                    <img src={v.snippet.thumbnails.medium.url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} loading="lazy" />
                    <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.35)', opacity: active ? 1 : 0, transition:'opacity 0.15s' }}>
                      <div style={{ width:18, height:18, borderRadius:'50%', background:'rgba(255,255,255,0.9)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <div style={{ width:0, height:0, borderTop:'4px solid transparent', borderBottom:'4px solid transparent', borderLeft:'7px solid #000', marginLeft:2 }} />
                      </div>
                    </div>
                  </div>
                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:11, fontWeight:600, color: active ? '#fff':'rgba(255,255,255,0.78)', lineHeight:1.35, marginBottom:4,
                      display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                      {v.snippet.title}
                    </div>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)' }}>{v.snippet.channelTitle}</div>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.16)', marginTop:2 }}>
                      {new Date(v.snippet.publishedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── EVENTS TAB ── */}
      {tab === 'events' && (
        <div style={{ flex:1, overflowY:'auto' }}>
          {events.length === 0 && (
            <div style={{ padding:28, textAlign:'center', fontSize:11, color:'rgba(255,255,255,0.2)', lineHeight:1.6 }}>
              No race events yet.<br />
              <span style={{ fontSize:10 }}>Data arrives once the session begins.</span>
            </div>
          )}
          {events.map(event => (
            <div key={event.id} style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>{EVENT_ICON[event.type] ?? '●'}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:8, marginBottom:2 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:'#fff', lineHeight:1.3 }}>{event.title}</span>
                    <span style={{ fontSize:9, color:'rgba(255,255,255,0.2)', flexShrink:0 }}>L{event.lap}</span>
                  </div>
                  {event.description !== event.title && (
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.38)', lineHeight:1.45, marginBottom:6 }}>
                      {event.description}
                    </div>
                  )}
                  {event.drivers.length > 0 && (
                    <div style={{ display:'flex', gap:4, marginBottom:8 }}>
                      {event.drivers.map(d => (
                        <span key={d} style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:3, background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.45)', letterSpacing:'0.06em' }}>
                          {d}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => setPendingQ(eventToQuery(event, raceYear))}
                    style={{
                      display:'inline-flex', alignItems:'center', gap:5,
                      padding:'4px 10px', background:'rgba(225,6,0,0.08)',
                      border:'1px solid rgba(225,6,0,0.22)', borderRadius:4,
                      cursor:'pointer', fontFamily:font,
                      fontSize:10, fontWeight:600,
                      color:'rgba(255,80,60,0.85)', letterSpacing:'0.06em',
                      transition:'all 0.12s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(225,6,0,0.16)'; e.currentTarget.style.color='#ff5a48'; }}
                    onMouseLeave={e => { e.currentTarget.style.background='rgba(225,6,0,0.08)'; e.currentTarget.style.color='rgba(255,80,60,0.85)'; }}
                  >
                    ▶ Find on YouTube
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}