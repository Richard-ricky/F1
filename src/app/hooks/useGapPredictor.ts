import { useMemo } from 'react';
import type { ProcessedDriver } from './useOpenF1';

export interface GapPrediction {
  driverId:       string;
  targetId:       string | null;
  currentGap:     number;
  gapTrend:       number;   // positive = closing
  willCatch:      boolean;
  lapsToOvertake: number | null;
  drsRange:       boolean;  // within 1.0s
  pitThreat:      boolean;  // car ahead likely pitting soon
}

function parseGap(g: string): number | null {
  if (!g || g === 'LEADER') return null;
  const n = parseFloat(g.replace('+', ''));
  return isNaN(n) ? null : n;
}

/**
 * Projects whether a driver will catch the car ahead before the race ends.
 * Place in: src/app/hooks/useGapPredictor.ts
 */
export function useGapPredictor(
  drivers:    ProcessedDriver[],
  currentLap: number,
  totalLaps:  number
): GapPrediction[] {
  return useMemo(() => {
    const lapsLeft = totalLaps - currentLap;
    if (lapsLeft <= 0 || drivers.length < 2) return [];

    return drivers.map((driver, i) => {
      const ahead       = i > 0 ? drivers[i - 1] : null;
      const myGapVal    = parseGap(driver.gap);
      const aheadGapVal = ahead ? parseGap(ahead.gap) : null;

      if (!ahead || myGapVal === null || aheadGapVal === null) {
        return { driverId: driver.id, targetId: null, currentGap: 0, gapTrend: 0, willCatch: false, lapsToOvertake: null, drsRange: false, pitThreat: false };
      }

      const interval = myGapVal - aheadGapVal;

      // Lap delta: positive means I'm faster
      const myLapSecs    = parseLapTime(driver.lastLap);
      const aheadLapSecs = parseLapTime(ahead.lastLap);
      const lapDelta     = (myLapSecs && aheadLapSecs) ? aheadLapSecs - myLapSecs : 0;

      let willCatch      = false;
      let lapsToOvertake = null as number | null;

      if (lapDelta > 0 && interval > 0) {
        const lapsNeeded = interval / lapDelta;
        if (lapsNeeded > 0 && lapsNeeded <= lapsLeft) {
          willCatch      = true;
          lapsToOvertake = Math.round(lapsNeeded);
        }
      }

      return {
        driverId:       driver.id,
        targetId:       ahead.id,
        currentGap:     interval,
        gapTrend:       lapDelta,
        willCatch,
        lapsToOvertake,
        drsRange:       interval <= 1.0 && interval >= 0,
        pitThreat:      ahead.tireAge >= 25,
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    drivers.map(d => `${d.id}:${d.gap}:${d.lastLap}:${d.tireAge}`).join('|'),
    currentLap, totalLaps,
  ]);
}

function parseLapTime(lap: string | undefined): number | null {
  if (!lap || lap.includes('-')) return null;
  const match = lap.match(/(\d+):(\d+\.\d+)/);
  if (!match) return null;
  return parseInt(match[1]) * 60 + parseFloat(match[2]);
}