import type { Car, Circuit, Driver, Stat, Weather } from "@/types/game";
import { gaussianNoise } from "./rng";
import { tirePhaseTime } from "./tires";
import type { TireState } from "./types";

export const SIM_CONSTANTS = {
  fuelPenaltySecPerKg: 0.035,
  weatherSlickHeavyRainPenaltySec: 8,
  weatherSlickLightRainPenaltySec: 3,
} as const;

function carPerformanceFactor(overall: number): number {
  return -(overall - 50) * 0.05;
}

function driverPaceFactor(pace: Stat): number {
  return -(Number(pace) - 50) * 0.03;
}

function setupQualityFactor(quality: Stat): number {
  return -(Number(quality) / 100) * 0.5;
}

function driverConsistencySigma(consistency: Stat): number {
  const c = Number(consistency);
  return Math.max(0.05, 0.35 - c / 400);
}

function weatherPenalty(weather: Weather, compound: TireState["compound"]): number {
  const isWetCompound = compound === "wet" || compound === "intermediate";
  if (weather === "heavyRain" || weather === "thunderstorm") {
    return isWetCompound ? 0 : SIM_CONSTANTS.weatherSlickHeavyRainPenaltySec;
  }
  if (weather === "lightRain") {
    if (compound === "wet") return 0;
    if (compound === "intermediate") return 0.2;
    return SIM_CONSTANTS.weatherSlickLightRainPenaltySec;
  }
  if (weather === "cloudy") return 0.05;
  return 0;
}

function fuelMassPenalty(fuelKg: number): number {
  return fuelKg * SIM_CONSTANTS.fuelPenaltySecPerKg;
}

export function computeLapTime(
  driver: Driver,
  car: Car,
  tire: TireState,
  fuelKg: number,
  weather: Weather,
  circuit: Circuit,
  rng: () => number,
): number {
  const tireTime = tirePhaseTime(tire.compound, tire.lapsUsed);
  const noise = gaussianNoise(rng, driverConsistencySigma(driver.stats.consistency));
  return (
    circuit.baseLapTimeSec +
    carPerformanceFactor(car.overallPerformance) +
    driverPaceFactor(driver.stats.pace) +
    tireTime +
    fuelMassPenalty(fuelKg) +
    weatherPenalty(weather, tire.compound) +
    setupQualityFactor(car.setup.qualityAtCurrentCircuit) +
    noise
  );
}
