import { beforeEach, describe, expect, it } from "vitest";
import { createSeedSaveGame } from "@/data/seedSaveGame";
import { migratePersistedSave, SAVE_PERSIST_VERSION } from "@/lib/saveMigration";
import { recomputeInterruptFromSave, useGameStore } from "@/stores/useGameStore";
import type { DriverId, SaveGame } from "@/types/game";
import { makeMoney } from "@/types/game";

function resetStore(save: SaveGame) {
  useGameStore.setState({
    save,
    nextInterrupt: recomputeInterruptFromSave(save),
  });
}

describe("useGameStore", () => {
  beforeEach(() => {
    resetStore(createSeedSaveGame());
  });

  it("signDriver does not mutate roster when debit would fail after pre-check (concurrent balance)", () => {
    const save = createSeedSaveGame();
    const teamId = save.playerTeamId;
    save.teams[String(teamId)]!.finance.balanceCents = makeMoney(0);
    resetStore(save);

    const freeAgentId = "dr_free_1" as DriverId;
    const res = useGameStore.getState().signDriver(freeAgentId, {
      salaryPerSeasonCents: 5_000_00,
      seasons: 2,
      signingBonusCents: 500_00,
    });
    expect(res.ok).toBe(false);
    expect(useGameStore.getState().save.drivers[freeAgentId]?.teamId).toBeNull();
  });

  it("advanceToNextInterrupt moves currentDate to the next race date", () => {
    const save = createSeedSaveGame();
    const interrupt = recomputeInterruptFromSave(save);
    expect(interrupt).not.toBeNull();
    save.currentDate = "2026-03-01";
    resetStore(save);
    useGameStore.getState().advanceToNextInterrupt();
    expect(useGameStore.getState().save.currentDate).toBe(interrupt!.date);
  });

  it("skipWeek decrements upgrade weeksRemaining", () => {
    const save = createSeedSaveGame();
    save.teams[String(save.playerTeamId)]!.finance.balanceCents = makeMoney(2_000_000_00);
    resetStore(save);
    useGameStore.getState().startUpgrade("engine", 1);
    const up = Object.values(useGameStore.getState().save.upgrades)[0];
    expect(up).toBeDefined();
    const before = up!.weeksRemaining;
    useGameStore.getState().skipWeek();
    const up2 = Object.values(useGameStore.getState().save.upgrades)[0];
    expect(up2?.weeksRemaining).toBe(before - 1);
  });
});

describe("migratePersistedSave", () => {
  it("is idempotent for v2 saves", () => {
    const s = createSeedSaveGame();
    const once = migratePersistedSave({ save: s }, SAVE_PERSIST_VERSION);
    const twice = migratePersistedSave(once, SAVE_PERSIST_VERSION);
    expect(twice.save.version).toBe(once.save.version);
    expect(twice.save.onboardingCompleted).toBe(once.save.onboardingCompleted);
  });

  it("adds onboardingCompleted when migrating from v1", () => {
    const s = createSeedSaveGame();
    const legacy = { ...s, onboardingCompleted: undefined, version: 1 } as SaveGame;
    const out = migratePersistedSave({ save: legacy }, 1);
    expect(out.save.onboardingCompleted).toBe(false);
    expect(out.save.version).toBeGreaterThanOrEqual(2);
  });
});
