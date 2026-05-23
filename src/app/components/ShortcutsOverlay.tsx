import { useEffect } from 'react';

interface ShortcutsOverlayProps {
  visible: boolean;
  onClose: () => void;
}

const font = '"Helvetica Neue","SF Pro Display",-apple-system,sans-serif';

const SHORTCUTS = [
  { group: 'Map',    keys: [['1','Dark map'],['2','3D satellite'],['3','Track view']] },
  { group: 'Panels', keys: [['T','Timing'],['H','Highlights'],['S','Schedule'],['Y','Strategy']] },
  { group: 'Replay', keys: [['Space','Play / Pause'],['←','Seek back'],['→','Seek forward'],['+','Speed up'],['-','Speed down']] },
  { group: 'UI',     keys: [['Esc','Close telemetry'],['?','Toggle this help']] },
];

/**
 * Keyboard shortcuts help overlay.
 * Place in: src/app/components/ShortcutsOverlay.tsx
 */
export default function ShortcutsOverlay({ visible, onClose }: ShortcutsOverlayProps) {
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === '?') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: font,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(12,12,12,0.98)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          padding: '28px 32px',
          maxWidth: 480, width: '90%',
          boxShadow: '0 32px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 24 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
            Keyboard Shortcuts
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
              fontSize: 20, lineHeight: 1, padding: 4,
            }}
          >×</button>
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {SHORTCUTS.map(group => (
            <div key={group.group}>
              <div style={{
                fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)',
                letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10,
              }}>
                {group.group}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {group.keys.map(([key, label]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{label}</span>
                    <kbd style={{
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 4, padding: '2px 8px',
                      fontSize: 10, fontWeight: 700,
                      color: 'rgba(255,255,255,0.7)',
                      fontFamily: 'monospace',
                      minWidth: 28, textAlign: 'center',
                      boxShadow: '0 1px 0 rgba(255,255,255,0.08)',
                    }}>
                      {key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 20, paddingTop: 16,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center',
        }}>
          Press{' '}
          <kbd style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:3, padding:'1px 6px', fontSize:9, fontFamily:'monospace' }}>?</kbd>
          {' '}or{' '}
          <kbd style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:3, padding:'1px 6px', fontSize:9, fontFamily:'monospace' }}>Esc</kbd>
          {' '}to close
        </div>
      </div>
    </div>
  );
}