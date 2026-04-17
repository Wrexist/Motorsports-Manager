import { describe, expect, it } from "vitest";
import { createSeedSaveGame } from "@/data/seedSaveGame";
import { parseSaveGameFromPersistJson } from "@/lib/parseSaveGame";

describe("parseSaveGameFromPersistJson", () => {
  it("parses a bare PersistedSlice", () => {
    const save = createSeedSaveGame();
    const out = parseSaveGameFromPersistJson({ save });
    expect(out.slotId).toBe(save.slotId);
    expect(out.version).toBeGreaterThanOrEqual(2);
  });

  it("parses zustand wrapper with state and version", () => {
    const save = createSeedSaveGame();
    const out = parseSaveGameFromPersistJson({ version: 2, state: { save } });
    expect(out.playerTeamId).toBe(save.playerTeamId);
  });

  it("returns seed save when JSON is invalid", () => {
    const out = parseSaveGameFromPersistJson({ save: { version: "nope" } });
    expect(out.version).toBeGreaterThanOrEqual(2);
    expect(out.drivers).toBeDefined();
  });
});
