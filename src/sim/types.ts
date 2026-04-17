import type {
  Car,
  Circuit,
  Driver,
  DNFReason,
  DrivingStyle,
  EngineMode,
  RaceId,
  SeasonRegulations,
  Stat,
  Team,
  TireCompound,
  Weather,
} from "@/types/game";

/** Runtime tire state for one stint. */
export interface TireState {
  compound: TireCompound;
  lapsUsed: number;
  wearPct: number;
}

export interface SimDriverEntry {
  driverId: string;
  teamId: string;
  /** Cumulative race time in seconds including pit loss. */
  totalTimeSec: number;
  /** Gap to car ahead on track ordering (seconds). */
  gapToAheadSec: number;
  tire: TireState;
  fuelKg: number;
  drivingStyle: DrivingStyle;
  engineMode: EngineMode;
  /** Current pace snapshot for overtakes (sec/lap-ish delta). */
  currentPaceSec: number;
  dnf: boolean;
  dnfReason?: DNFReason;
  position: number;
  /** Planned pit laps for MVP AI/player hints. */
  pitPlan: { lap: number; compound: TireCompound }[];
  usedScPit: boolean;
}

export interface RaceSimEvent {
  lap: number;
  kind: "overtake" | "pit" | "dnf" | "fastestLap" | "weather";
  message: string;
  driverIds?: string[];
}

export interface RaceState {
  raceId: RaceId;
  circuit: Circuit;
  regulations: SeasonRegulations;
  /** Weather used for this race session (MVP single session). */
  weather: Weather;
  /** Ambient temperature for reliability rolls. */
  ambientTempC: number;
  safetyCarDeployed: boolean;
  drivers: SimDriverEntry[];
  /** Ordered grid by position index 0 = leader. */
  order: string[];
  currentLap: number;
  totalLaps: number;
  rngSeed: number;
  events: RaceSimEvent[];
  fastestLapDriverId: string | null;
  fastestLapTimeSec: number | null;
}

export interface SimDriverContext {
  driver: Driver;
  team: Team;
  car: Car;
  /** Unbranded numeric pace for overtakes. */
  overtaking: number;
  defence: number;
  consistency: Stat;
  smoothness: Stat;
  pace: Stat;
}
