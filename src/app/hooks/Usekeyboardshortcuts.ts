import { useEffect, useCallback } from 'react';

export interface ShortcutConfig {
  onMapVector:       () => void;
  onMapSatellite:    () => void;
  onMapTrack:        () => void;
  onPanelTiming:     () => void;
  onPanelHighlights: () => void;
  onPanelSession:    () => void;
  onPanelStrategy:   () => void;
  onPlayPause:       () => void;
  onSeekBack:        () => void;
  onSeekForward:     () => void;
  onSpeedUp:         () => void;
  onSpeedDown:       () => void;
  onCloseTelemetry:  () => void;
  onToggleHelp:      () => void;
}

export function useKeyboardShortcuts(config: ShortcutConfig) {
  const handler = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    switch (e.key) {
      case '1': config.onMapVector();    break;
      case '2': config.onMapSatellite(); break;
      case '3': config.onMapTrack();     break;

      case 't': case 'T': config.onPanelTiming();     break;
      case 'h': case 'H': config.onPanelHighlights(); break;
      case 's': case 'S': config.onPanelSession();    break;
      case 'y': case 'Y': config.onPanelStrategy();   break;

      case ' ':
        e.preventDefault();
        config.onPlayPause();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        config.onSeekBack();
        break;
      case 'ArrowRight':
        e.preventDefault();
        config.onSeekForward();
        break;
      case '+': case '=': config.onSpeedUp();   break;
      case '-': case '_': config.onSpeedDown(); break;

      case 'Escape': config.onCloseTelemetry(); break;
      case '?':      config.onToggleHelp();     break;
    }
  }, [config]);

  useEffect(() => {
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handler]);
}