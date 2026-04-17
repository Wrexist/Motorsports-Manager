import { describe, expect, it } from "vitest";
import { createSeedSaveGame } from "@/data/seedSaveGame";
import { parseSaveGameFromPersistJson } from "@/lib/parseSaveGame";
import { saveGameSchema } from "@/lib/saveGameSchema";

describe("SaveGame shape", () => {
  it("seed save includes onboarding flag and version >= 2", () => {
    const s = createSeedSaveGame();
    expect(s.version).toBeGreaterThanOrEqual(2);
    expect(s.onboardingCompleted).toBe(false);
  });

  it("seed save validates against saveGameSchema", () => {
    const parsed = saveGameSchema.safeParse(createSeedSaveGame());
    expect(parsed.success).toBe(true);
  });

  it("parseSaveGameFromPersistJson round-trips seed save", () => {
    const s = createSeedSaveGame();
    const out = parseSaveGameFromPersistJson({ save: s });
    expect(out.rngSeed).toBe(s.rngSeed);
  });
});
