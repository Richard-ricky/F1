import { useState, useEffect, useRef } from 'react';
import type { ProcessedDriver } from './useOpenF1';

function cubicEaseInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function interpolatePos(
  from: { lat: number; lng: number },
  to:   { lat: number; lng: number },
  t:    number
): { lat: number; lng: number } {
  const e = cubicEaseInOut(Math.max(0, Math.min(1, t)));
  return { lat: lerp(from.lat, to.lat, e), lng: lerp(from.lng, to.lng, e) };
}

function calcHeading(
  from: { lat: number; lng: number },
  to:   { lat: number; lng: number }
): number {
  const dLng = to.lng - from.lng;
  const dLat = to.lat - from.lat;
  return ((Math.atan2(dLng, dLat) * 180 / Math.PI) + 360) % 360;
}

interface Snapshot {
  from:      { lat: number; lng: number; heading: number };
  to:        { lat: number; lng: number; heading: number };
  startTime: number;
}

/**
 * Interpolates driver positions at 60fps between API updates (every ~2s).
 * Cars move fluidly rather than teleporting each poll cycle.
 *
 * Place this file in: src/app/hooks/useInterpolatedDrivers.ts
 */
export function useInterpolatedDrivers(
  apiDrivers:    ProcessedDriver[],
  pollIntervalMs = 2000
): ProcessedDriver[] {
  const [interpolated, setInterpolated] = useState<ProcessedDriver[]>(apiDrivers);
  const snaps   = useRef<Map<string, Snapshot>>(new Map());
  const prevRef = useRef<ProcessedDriver[]>([]);
  const rafRef  = useRef<number>(0);

  // Update target snapshots when API data changes
  useEffect(() => {
    if (!apiDrivers.length) return;
    const now = Date.now();

    apiDrivers.forEach(driver => {
      const prev     = prevRef.current.find(d => d.id === driver.id);
      const existing = snaps.current.get(driver.id);

      const fromLat = existing?.to.lat ?? prev?.lat ?? driver.lat;
      const fromLng = existing?.to.lng ?? prev?.lng ?? driver.lng;

      const moved =
        Math.abs(driver.lat - fromLat) > 0.000001 ||
        Math.abs(driver.lng - fromLng) > 0.000001;

      if (moved) {
        const heading = calcHeading(
          { lat: fromLat, lng: fromLng },
          { lat: driver.lat, lng: driver.lng }
        );
        snaps.current.set(driver.id, {
          from: { lat: fromLat, lng: fromLng, heading: existing?.to.heading ?? heading },
          to:   { lat: driver.lat, lng: driver.lng, heading },
          startTime: now,
        });
      }
    });

    prevRef.current = apiDrivers;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiDrivers.map(d => `${d.id}:${d.lat.toFixed(6)}:${d.lng.toFixed(6)}`).join('|')]);

  // 60fps RAF loop
  useEffect(() => {
    if (!apiDrivers.length) {
      setInterpolated(apiDrivers);
      return;
    }

    const tick = () => {
      const now = Date.now();
      setInterpolated(
        apiDrivers.map(driver => {
          const snap = snaps.current.get(driver.id);
          if (!snap) return driver;
          const t   = Math.min(1, (now - snap.startTime) / pollIntervalMs);
          const pos = interpolatePos(snap.from, snap.to, t);
          const heading = lerp(snap.from.heading, snap.to.heading, cubicEaseInOut(t));
          return { ...driver, lat: pos.lat, lng: pos.lng, heading };
        })
      );
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiDrivers.length, pollIntervalMs]);

  return interpolated;
}