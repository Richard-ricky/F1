import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  label?:   string;
}
interface State {
  error: Error | null;
}

const font = '"Helvetica Neue","SF Pro Display",-apple-system,sans-serif';

/**
 * Wraps any panel/component. Catches render errors so one broken panel
 * never takes down the whole dashboard.
 * Place in: src/app/components/ErrorBoundary.tsx
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error) {
    console.error(`[F1 Dashboard] ${this.props.label ?? 'Panel'} error:`, error);
  }

  override render() {
    if (!this.state.error) return this.props.children;

    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 32, fontFamily: font,
        background: 'rgba(8,8,8,0.96)',
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, marginBottom: 14,
        }}>⚠</div>

        <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>
          {this.props.label ?? 'Panel'} unavailable
        </div>
        <div style={{
          fontSize: 10, color: 'rgba(255,255,255,0.22)',
          marginBottom: 20, textAlign: 'center', lineHeight: 1.6,
        }}>
          Data could not be rendered.<br />This panel will recover automatically.
        </div>

        <button
          onClick={() => this.setState({ error: null })}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6, color: 'rgba(255,255,255,0.55)',
            padding: '7px 18px', fontSize: 11, fontWeight: 600,
            cursor: 'pointer', fontFamily: font,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.09)'; e.currentTarget.style.color='#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.color='rgba(255,255,255,0.55)'; }}
        >
          Retry
        </button>
      </div>
    );
  }
}