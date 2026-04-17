import type { Car, DNFReason, DrivingStyle, EngineMode } from "@/types/game";

export const SIM_CONSTANTS = {
  basePartFailureRate: 0.00035,
} as const;

function stressMultiplier(style: DrivingStyle, mode: EngineMode): number {
  const s = style === "attack" ? 1.35 : style === "push" ? 1.15 : style === "standard" ? 1 : 0.9;
  const m = mode === "push" ? 1.25 : mode === "standard" ? 1 : 0.85;
  return s * m;
}

function tempMultiplier(ambientTempC: number): number {
  if (ambientTempC > 32) return 1.35;
  if (ambientTempC < 12) return 0.9;
  return 1;
}

export function rollFailure(
  car: Car,
  drivingStyle: DrivingStyle,
  engineMode: EngineMode,
  ambientTempC: number,
  rng: () => number,
): { failed: boolean; reason?: DNFReason } {
  const perfStress = 1 + Math.max(0, car.overallPerformance - 85) * 0.02;
  const p =
    SIM_CONSTANTS.basePartFailureRate *
    stressMultiplier(drivingStyle, engineMode) *
    tempMultiplier(ambientTempC) *
    perfStress;
  if (rng() < p) {
    const roll = rng();
    const reason: DNFReason =
      roll < 0.55 ? "engine" : roll < 0.75 ? "gearbox" : roll < 0.85 ? "hydraulics" : "electrical";
    return { failed: true, reason };
  }
  return { failed: false };
}
