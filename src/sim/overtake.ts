import type { Circuit } from "@/types/game";

export const SIM_CONSTANTS = {
  gapThresholdSec: 1.0,
  successAttackerLossSec: 0.3,
  failBothLossSec: 0.1,
} as const;

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/** Lap times in seconds (lower = faster). */
export function attemptOvertake(
  attackerLapTimeSec: number,
  defenderLapTimeSec: number,
  attackerOvertaking: number,
  defenderDefence: number,
  track: Pick<Circuit, "overtakingDifficulty">,
  rng: () => number,
): { success: boolean; timeCost: number } {
  const paceDelta = defenderLapTimeSec - attackerLapTimeSec;
  const skillDelta = attackerOvertaking - defenderDefence;
  const p = sigmoid(
    paceDelta * 2 + skillDelta * 0.1 - track.overtakingDifficulty * 2,
  );
  if (rng() < p) {
    return { success: true, timeCost: SIM_CONSTANTS.successAttackerLossSec };
  }
  return { success: false, timeCost: SIM_CONSTANTS.failBothLossSec };
}
