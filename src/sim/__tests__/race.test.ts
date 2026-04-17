import { describe, expect, it } from "vitest";
import { createSeedSaveGame } from "@/data/seedSaveGame";
import type { RaceId } from "@/types/game";
import { buildRaceState, simulateRace } from "@/sim/race";

function simulateOnce(seed: number) {
  const save = createSeedSaveGame();
  const season = Object.values(save.seasons)[0]!;
  const raceId = season.raceIds[0]!;
  const race = save.races[raceId]!;
  const circuit = save.circuits[race.circuitId]!;

  const driverIds = Object.values(save.drivers)
    .filter((d) => d.teamId != null)
    .map((d) => d.id);

  const { state, contexts } = buildRaceState({
    raceId: raceId as RaceId,
    circuit,
    regulations: season.regulations,
    weather: race.weatherBySession.race ?? "dry",
    ambientTempC: 30,
    totalLaps: 10,
    rngSeed: seed,
    driverIds,
    driversById: save.drivers,
    teamsById: save.teams,
    carsById: save.cars,
  });

  return simulateRace(state, contexts, {});
}

describe("simulateRace", () => {
  it("is deterministic for the same seed", () => {
    const a = simulateOnce(4242).result;
    const b = simulateOnce(4242).result;
    expect(a).toEqual(b);
  });

  it("changes with different seeds (high probability)", () => {
    const a = simulateOnce(111).result;
    const b = simulateOnce(999999).result;
    expect(JSON.stringify(a.results)).not.toBe(JSON.stringify(b.results));
  });

  it("emits one lap trace row per lap", () => {
    const { lapTrace } = simulateOnce(555);
    expect(lapTrace.length).toBe(10);
  });

  it("returns a headline string", () => {
    const { result } = simulateOnce(777);
    expect(result.headline.length).toBeGreaterThan(0);
  });

  it("includes sim events", () => {
    const { events } = simulateOnce(888);
    expect(Array.isArray(events)).toBe(true);
  });
});
