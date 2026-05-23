import { useMemo } from 'react';
import type { ProcessedDriver, TireCompound } from './useOpenF1';

const DEG_RATE: Record<TireCompound, number> = {
  SOFT: 0.085, MEDIUM: 0.048, HARD: 0.028, INTER: 0.060, WET: 0.055,
};
const MAX_STINT: Record<TireCompound, number> = {
  SOFT: 22, MEDIUM: 34, HARD: 48, INTER: 30, WET: 25,
};
const OPTIMAL_STOP: Record<TireCompound, number> = {
  SOFT: 18, MEDIUM: 28, HARD: 40, INTER: 25, WET: 20,
};

export interface TyreDegradationData {
  driverId:       string;
  currentDeg:     number;
  projectedDeg:   number;
  pitWindowOpen:  boolean;
  pitWindowLap:   number;
  mustStopByLap:  number;
  lapsRemaining:  number;
  performance:    number;  // 0–100
  recommendation: string;
}

/**
 * Models tyre degradation per compound and projects pit windows.
 * Place in: src/app/hooks/useTyreDegradation.ts
 */
export function useTyreDegradation(
  drivers:    ProcessedDriver[],
  currentLap: number,
  totalLaps:  number
): Record<string, TyreDegradationData> {
  return useMemo(() => {
    const result: Record<string, TyreDegradationData> = {};

    drivers.forEach(({ tire, tireAge, id }) => {
      const rate        = DEG_RATE[tire];
      const maxStint    = MAX_STINT[tire];
      const optimalStop = OPTIMAL_STOP[tire];
      const currentDeg  = tireAge * rate;
      const performance = Math.max(0, 100 - (tireAge / maxStint) * 100);
      const lapsRemaining   = Math.max(0, maxStint - tireAge);
      const stintStartLap   = currentLap - tireAge;
      const pitWindowLap    = Math.min(totalLaps - 2, stintStartLap + optimalStop);
      const mustStopByLap   = Math.min(totalLaps - 2, stintStartLap + maxStint);
      const pitWindowOpen   = tireAge >= optimalStop && lapsRemaining > 0;
      const projectedDeg    = currentDeg + ((totalLaps - currentLap) * rate);

      let recommendation: string;
      if (lapsRemaining <= 3)               recommendation = '⚠ Critical — pit immediately';
      else if (pitWindowOpen && lapsRemaining <= 8) recommendation = `Pit window open · ${lapsRemaining}L left`;
      else if (pitWindowOpen)               recommendation = `Optimal stop · ${lapsRemaining}L remaining`;
      else if (tireAge < optimalStop * 0.5) recommendation = `Fresh · ${lapsRemaining}L to pit window`;
      else                                  recommendation = `${lapsRemaining}L to critical wear`;

      result[id] = {
        driverId: id, currentDeg, projectedDeg,
        pitWindowOpen, pitWindowLap, mustStopByLap,
        lapsRemaining, performance, recommendation,
      };
    });

    return result;
  }, [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    drivers.map(d => `${d.id}:${d.tire}:${d.tireAge}`).join('|'),
    currentLap, totalLaps,
  ]);
}