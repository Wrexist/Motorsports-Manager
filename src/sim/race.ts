import type {
  Car,
  Driver,
  DriverId,
  DriverLapData,
  DriverRaceResult,
  RaceId,
  RaceResult,
  RaceResultId,
  Team,
  TeamId,
} from "@/types/game";
import { makeMoney } from "@/types/game";
import { computeLapTime } from "./lapTime";
import { mulberry32, splitmix32 } from "./rng";
import { attemptOvertake } from "./overtake";
import { shouldPit } from "./pitStrategy";
import { rollFailure } from "./reliability";
import { advanceWeather } from "./weather";
import { advanceTireWear } from "./tires";
import type { RaceState, SimDriverContext } from "./types";

export const SIM_CONSTANTS = {
  pitLossMinSec: 18,
  pitLossSpreadSec: 8,
  trackWearFactor: 1,
  weatherRollPerLap: 0.15,
} as const;

export interface SimulateRaceOptions {
  /** If set, safety car triggers on this lap (inclusive). */
  safetyCarLap?: number;
}

function pitLossSec(rng: () => number): number {
  return SIM_CONSTANTS.pitLossMinSec + rng() * SIM_CONSTANTS.pitLossSpreadSec;
}

function sortOrder(state: RaceState): string[] {
  const alive = state.drivers.filter((d) => !d.dnf);
  const sorted = [...alive].sort((a, b) => a.totalTimeSec - b.totalTimeSec);
  return sorted.map((d) => d.driverId);
}

export function simulateRace(
  initial: RaceState,
  contexts: Record<string, SimDriverContext>,
  options: SimulateRaceOptions = {},
): { result: RaceResult; lapTrace: DriverLapData[][]; events: import("./types").RaceSimEvent[] } {
  const seedFor = splitmix32(initial.rngSeed);
  const lapTrace: DriverLapData[][] = [];
  const state: RaceState = structuredClone(initial);

  for (let lap = 1; lap <= state.totalLaps; lap += 1) {
    const lapRng = mulberry32(seedFor(`lap:${lap}`));
    if (options.safetyCarLap != null && lap === options.safetyCarLap) {
      state.safetyCarDeployed = true;
    }
    if (lapRng() < SIM_CONSTANTS.weatherRollPerLap) {
      state.weather = advanceWeather(state.weather, state.circuit.weatherVolatility, lapRng);
    }

    const thisLapTimes: Record<string, number> = {};
    const row: DriverLapData[] = [];

    for (const id of state.order) {
      const d = state.drivers.find((x) => x.driverId === id);
      if (!d || d.dnf) continue;
      const ctx = contexts[d.driverId];
      if (!ctx) continue;
      const tireBefore = { ...d.tire };
      const lapTime = computeLapTime(
        ctx.driver,
        ctx.car,
        d.tire,
        d.fuelKg,
        state.weather,
        state.circuit,
        lapRng,
      );
      thisLapTimes[d.driverId] = lapTime;
      d.fuelKg = Math.max(0, d.fuelKg - 1.6);
      d.tire = advanceTireWear(
        d.tire,
        d.drivingStyle,
        ctx.driver.stats.smoothness,
        SIM_CONSTANTS.trackWearFactor,
      );
      const finalStint = lap > state.totalLaps - 3;
      const pit = shouldPit(d, lap, state, finalStint);
      if (pit.pit) {
        d.totalTimeSec += pitLossSec(lapRng);
        const nextCompound = d.pitPlan.find((p) => p.lap >= lap)?.compound ?? "medium";
        d.tire = { compound: nextCompound, lapsUsed: 0, wearPct: 5 };
        if (state.safetyCarDeployed) d.usedScPit = true;
        state.events.push({ lap, kind: "pit", message: `Pit stop (${pit.reason})`, driverIds: [d.driverId] });
      }
      const fail = rollFailure(ctx.car, d.drivingStyle, d.engineMode, state.ambientTempC, lapRng);
      if (fail.failed) {
        d.dnf = true;
        d.dnfReason = fail.reason;
        state.events.push({ lap, kind: "dnf", message: `DNF — ${fail.reason ?? "retired"}`, driverIds: [d.driverId] });
      } else {
        d.totalTimeSec += lapTime;
        d.currentPaceSec = lapTime;
        row.push({
          driverId: d.driverId as DriverId,
          lap,
          lapTimeSec: lapTime,
          tireCompound: tireBefore.compound,
          tireWearPct: tireBefore.wearPct,
        });
        if (state.fastestLapTimeSec == null || lapTime < state.fastestLapTimeSec) {
          state.fastestLapTimeSec = lapTime;
          state.fastestLapDriverId = d.driverId;
        }
      }
    }

    state.order = sortOrder(state);
    for (let i = 0; i < state.order.length - 1; i += 1) {
      const leaderId = state.order[i];
      const behindId = state.order[i + 1];
      if (!leaderId || !behindId) continue;
      const leader = state.drivers.find((x) => x.driverId === leaderId);
      const behind = state.drivers.find((x) => x.driverId === behindId);
      if (!leader || !behind || leader.dnf || behind.dnf) continue;
      const gap = behind.totalTimeSec - leader.totalTimeSec;
      if (gap < 1.0) {
        const ltA = thisLapTimes[behind.driverId] ?? behind.currentPaceSec;
        const ltD = thisLapTimes[leader.driverId] ?? leader.currentPaceSec;
        const ctxA = contexts[behind.driverId];
        const ctxD = contexts[leader.driverId];
        if (!ctxA || !ctxD) continue;
        const res = attemptOvertake(
          ltA,
          ltD,
          Number(ctxA.driver.stats.overtaking),
          Number(ctxD.driver.stats.defence),
          state.circuit,
          lapRng,
        );
        if (res.success) {
          behind.totalTimeSec -= 0.25;
          state.order = sortOrder(state);
          state.events.push({
            lap,
            kind: "overtake",
            message: "Position change",
            driverIds: [behind.driverId, leader.driverId],
          });
        } else {
          behind.totalTimeSec += res.timeCost * 0.5;
          leader.totalTimeSec += res.timeCost * 0.5;
        }
      }
    }

    lapTrace.push(row);
  }

  const finished = state.drivers.filter((d) => !d.dnf).sort((a, b) => a.totalTimeSec - b.totalTimeSec);
  const dnfs = state.drivers.filter((d) => d.dnf).sort((a, b) => a.totalTimeSec - b.totalTimeSec);
  const ranking = [...finished, ...dnfs];
  const pointsTable = state.regulations.pointsTable;
  const results: DriverRaceResult[] = ranking.map((d, index) => {
    const ctx = contexts[d.driverId];
    const position = index + 1;
    const pts = d.dnf ? 0 : (pointsTable[index] ?? 0);
    return {
      driverId: d.driverId as DriverId,
      teamId: (ctx?.team.id ?? ("" as TeamId)) as TeamId,
      position,
      totalTimeSec: d.totalTimeSec,
      dnf: d.dnf,
      dnfReason: d.dnfReason,
      fastestLap: state.fastestLapDriverId === d.driverId,
      points: pts,
    };
  });

  const poleDriverId = (finished[0]?.driverId ?? ranking[0]?.driverId ?? "") as DriverId;
  const headlineTop = finished
    .slice(0, 3)
    .map((d) => contexts[d.driverId]?.driver.displayName ?? d.driverId)
    .join(" / ");
  const headline = `${headlineTop} — ${state.events.filter((e) => e.kind === "dnf").length} retirements`;

  const result: RaceResult = {
    id: (`rr_${state.raceId}`) as RaceResultId,
    raceId: state.raceId,
    rngSeed: initial.rngSeed,
    results,
    poleDriverId,
    fastestLapDriverId: (state.fastestLapDriverId ?? poleDriverId) as DriverId,
    headline,
  };

  return { result, lapTrace, events: [...state.events] };
}

/** Build a race grid from normalized entities (MVP: uses first N drivers in insertion order). */
export function buildRaceState(params: {
  raceId: RaceId;
  circuit: RaceState["circuit"];
  regulations: RaceState["regulations"];
  weather: RaceState["weather"];
  ambientTempC: number;
  totalLaps: number;
  rngSeed: number;
  driverIds: string[];
  driversById: Record<string, Driver>;
  teamsById: Record<string, Team>;
  carsById: Record<string, Car>;
}): { state: RaceState; contexts: Record<string, SimDriverContext> } {
  const contexts: Record<string, SimDriverContext> = {};
  const entries = params.driverIds.map((id) => {
    const driver = params.driversById[id];
    const team = params.teamsById[driver?.teamId ?? ""];
    const car = team ? params.carsById[team.carId] : undefined;
    if (!driver || !team || !car) {
      throw new Error(`Missing driver/team/car for ${id}`);
    }
    contexts[id] = {
      driver,
      team,
      car,
      overtaking: Number(driver.stats.overtaking),
      defence: Number(driver.stats.defence),
      consistency: driver.stats.consistency,
      smoothness: driver.stats.smoothness,
      pace: driver.stats.pace,
    };
    return {
      driverId: id,
      teamId: team.id,
      totalTimeSec: 0,
      gapToAheadSec: 0,
      tire: { compound: "soft" as const, lapsUsed: 0, wearPct: 0 },
      fuelKg: 100,
      drivingStyle: "standard" as const,
      engineMode: "standard" as const,
      currentPaceSec: 0,
      dnf: false,
      position: 0,
      pitPlan: [
        { lap: Math.floor(params.totalLaps * 0.35), compound: "medium" as const },
        { lap: Math.floor(params.totalLaps * 0.7), compound: "soft" as const },
      ],
      usedScPit: false,
    };
  });

  const state: RaceState = {
    raceId: params.raceId,
    circuit: params.circuit,
    regulations: params.regulations,
    weather: params.weather,
    ambientTempC: params.ambientTempC,
    safetyCarDeployed: false,
    drivers: entries,
    order: params.driverIds,
    currentLap: 0,
    totalLaps: params.totalLaps,
    rngSeed: params.rngSeed,
    events: [],
    fastestLapDriverId: null,
    fastestLapTimeSec: null,
  };
  return { state, contexts };
}

export function pointsForPosition(pointsTable: number[], position: number): number {
  return pointsTable[position - 1] ?? 0;
}

export function prizeMoneyCents(position: number): import("@/types/game").Money {
  const base = [12_000_00, 8_000_00, 5_000_00, 3_000_00, 2_000_00];
  return makeMoney(base[position - 1] ?? 500_00);
}
