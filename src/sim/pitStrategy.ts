import type { Weather } from "@/types/game";
import type { RaceState, SimDriverEntry } from "./types";

export type PitReason =
  | "tireWear"
  | "planned"
  | "weatherCall"
  | "safetyCar"
  | "undercut"
  | "none";

export interface PitDecision {
  pit: boolean;
  reason: PitReason;
}

function wrongTireForWeather(compound: SimDriverEntry["tire"]["compound"], weather: Weather): boolean {
  const wet = weather === "heavyRain" || weather === "thunderstorm";
  if (wet) return compound !== "wet";
  if (weather === "lightRain") return compound === "ultraSoft" || compound === "soft";
  return compound === "wet" && weather === "dry";
}

export function shouldPit(
  driver: SimDriverEntry,
  currentLap: number,
  state: RaceState,
  isFinalStint: boolean,
): PitDecision {
  if (driver.dnf) return { pit: false, reason: "none" };
  if (driver.tire.wearPct > 85 && !isFinalStint) {
    return { pit: true, reason: "tireWear" };
  }
  const planned = driver.pitPlan.find((p) => p.lap === currentLap);
  if (planned) return { pit: true, reason: "planned" };
  if (wrongTireForWeather(driver.tire.compound, state.weather)) {
    return { pit: true, reason: "weatherCall" };
  }
  if (state.safetyCarDeployed && !driver.usedScPit) {
    return { pit: true, reason: "safetyCar" };
  }
  // MVP undercut: if within 3 laps of planned stop of car ahead in order
  const idx = state.order.indexOf(driver.driverId);
  if (idx > 0) {
    const aheadId = state.order[idx - 1];
    const ahead = state.drivers.find((d) => d.driverId === aheadId);
    const nextPlan = ahead?.pitPlan.find((p) => p.lap > currentLap);
    if (nextPlan && nextPlan.lap - currentLap <= 3) {
      return { pit: true, reason: "undercut" };
    }
  }
  return { pit: false, reason: "none" };
}
