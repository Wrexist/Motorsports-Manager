import type { Part, PartId, SaveGame, UpgradeId } from "@/types/game";

function makeUuid(): string {
  const c = globalThis.crypto;
  if (c && "randomUUID" in c) return c.randomUUID();
  return `${Date.now().toString(16)}_${performance.now().toString(16)}`;
}

function idPart(): PartId {
  return `pt_${makeUuid()}` as PartId;
}

/**
 * Advances in-progress R&D by one "week" per call (matches `advanceDay` when crossing multi-day steps).
 */
export function processWeeklyUpgrades(save: SaveGame, weekSteps: number): void {
  const steps = Math.max(0, Math.floor(weekSteps));
  for (let w = 0; w < steps; w += 1) {
    for (const up of Object.values(save.upgrades)) {
      if (up.cancelled) continue;
      up.weeksRemaining = Math.max(0, up.weeksRemaining - 1);
      if (up.weeksRemaining === 0) {
        const part: Part = {
          id: idPart(),
          teamId: up.teamId,
          slot: up.slot,
          performance: up.projectedGain,
          lapsRemaining: 200,
        };
        save.parts[part.id] = part;
        delete save.upgrades[up.id as UpgradeId];
      }
    }
  }
}
