import { describe, expect, it } from "vitest";
import { createSeedSaveGame } from "@/data/seedSaveGame";

describe("SaveGame shape", () => {
  it("seed save includes onboarding flag and version >= 2", () => {
    const s = createSeedSaveGame();
    expect(s.version).toBeGreaterThanOrEqual(2);
    expect(s.onboardingCompleted).toBe(false);
  });
});
