import { useState, useEffect } from 'react';

export interface PWAState {
  isOffline:     boolean;
  isInstallable: boolean;
  isInstalled:   boolean;
  install:       () => void;
}

let deferredPrompt: any = null;

/**
 * Handles PWA install prompt, online/offline detection, and SW registration.
 * Place in: src/app/hooks/usePWA.ts
 *
 * Also place service-worker.ts at the project root (next to vite.config.ts)
 * and register it as a Vite PWA plugin, or manually copy the compiled JS to /public/service-worker.js
 */
export function usePWA(): PWAState {
  const [isOffline,     setIsOffline]     = useState(!navigator.onLine);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled,   setIsInstalled]   = useState(
    window.matchMedia('(display-mode: standalone)').matches
  );

  useEffect(() => {
    // Register SW
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js', { scope: '/' })
        .catch(e => console.warn('[PWA] SW registration failed:', e));
    }

    const onOnline  = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    const onInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      deferredPrompt = null;
    };
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('online',              onOnline);
      window.removeEventListener('offline',             onOffline);
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled',        onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    deferredPrompt    = null;
    setIsInstallable(false);
  };

  return { isOffline, isInstallable, isInstalled, install };
}