import type { DrivingStyle, Stat, TireCompound } from "@/types/game";
import type { TireState } from "./types";

export const SIM_CONSTANTS = {
  ultraSoft: { peakDeltaSec: 0.8, warmupLaps: 1, peakEnd: 6, degEnd: 12, cliff: 14 },
  soft: { peakDeltaSec: 0.4, warmupLaps: 0, peakEnd: 10, degEnd: 20, cliff: 24 },
  medium: { peakDeltaSec: 0, warmupLaps: 0, peakEnd: 16, degEnd: 28, cliff: 34 },
  hard: { peakDeltaSec: -0.2, warmupLaps: 0, peakEnd: 22, degEnd: 40, cliff: 48 },
} as const;

function curveFor(
  lapsUsed: number,
  warmupLaps: number,
  peakEnd: number,
  degEnd: number,
  peakDeltaSec: number,
): number {
  if (lapsUsed <= warmupLaps) return peakDeltaSec * 0.35;
  if (lapsUsed <= peakEnd) return peakDeltaSec;
  if (lapsUsed <= degEnd) {
    const t = (lapsUsed - peakEnd) / Math.max(1, degEnd - peakEnd);
    return peakDeltaSec + t * 1.2;
  }
  const over = lapsUsed - degEnd;
  return peakDeltaSec + 1.2 + over * 0.45;
}

/** Extra seconds vs baseline from tire phase. */
export function tirePhaseTime(compound: TireCompound, lapsUsed: number): number {
  if (compound === "intermediate") return 1.5;
  if (compound === "wet") return 2.2;
  if (compound === "ultraSoft") {
    const c = SIM_CONSTANTS.ultraSoft;
    return curveFor(lapsUsed, c.warmupLaps, c.peakEnd, c.degEnd, c.peakDeltaSec);
  }
  if (compound === "soft") {
    const c = SIM_CONSTANTS.soft;
    return curveFor(lapsUsed, c.warmupLaps, c.peakEnd, c.degEnd, c.peakDeltaSec);
  }
  if (compound === "medium") {
    const c = SIM_CONSTANTS.medium;
    return curveFor(lapsUsed, c.warmupLaps, c.peakEnd, c.degEnd, c.peakDeltaSec);
  }
  if (compound === "hard") {
    const c = SIM_CONSTANTS.hard;
    return curveFor(lapsUsed, c.warmupLaps, c.peakEnd, c.degEnd, c.peakDeltaSec);
  }
  return 0;
}

const styleWear: Record<DrivingStyle, number> = {
  conserve: 0.85,
  standard: 1,
  push: 1.15,
  attack: 1.35,
};

/** Advance tire wear; `smoothness` is 0–100 Stat numeric. */
export function advanceTireWear(
  tire: TireState,
  drivingStyle: DrivingStyle,
  smoothness: Stat,
  trackFactor: number,
): TireState {
  const smooth = Number(smoothness);
  const wearMult = (styleWear[drivingStyle] ?? 1) * (1.05 - smooth / 200) * trackFactor;
  const wearBump = tire.compound === "ultraSoft" ? 1.25 : tire.compound === "soft" ? 1.1 : 1;
  const nextWear = Math.min(100, tire.wearPct + 2.4 * wearMult * wearBump);
  return { ...tire, lapsUsed: tire.lapsUsed + 1, wearPct: nextWear };
}
