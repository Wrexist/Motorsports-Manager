import { describe, expect, it } from "vitest";
import { loadCanon } from "@/data/loadCanon";

describe("loadCanon", () => {
  it("loads circuits with ids matching record keys", () => {
    const { circuits } = loadCanon();
    expect(Object.keys(circuits).length).toBeGreaterThanOrEqual(10);
    for (const [k, c] of Object.entries(circuits)) {
      expect(c.id).toBe(k);
    }
  });

  it("loads sponsors with money branded at runtime", () => {
    const { sponsors } = loadCanon();
    expect(sponsors.length).toBeGreaterThanOrEqual(1);
    const title = sponsors.find((s) => s.id === "sp_title");
    expect(title).toBeDefined();
    expect(Number(title!.seasonPaymentCents)).toBe(600_000);
  });
});
