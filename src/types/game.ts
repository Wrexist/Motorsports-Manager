/**
 * Pit Lane Manager — core domain types (pure data, no functions).
 *
 * **Branded IDs:** Each entity ID is a `string` at runtime but typed with a unique brand
 * to prevent accidentally mixing IDs across tables (e.g. passing a `TeamId` where a `DriverId`
 * is expected). Construct at boundaries with `as DriverId` only after validation.
 *
 * **Normalized store:** Entities live in top-level `Record<Id, Entity>` maps on `SaveGame`.
 * Cross-references are always by ID, never nested objects, so persistence and migrations stay stable.
 */

declare const brand: unique symbol;

export type Brand<T, B extends string> = T & { readonly [brand]: B };

export type DriverId = Brand<string, "DriverId">;
export type TeamId = Brand<string, "TeamId">;
export type ContractId = Brand<string, "ContractId">;
export type CarId = Brand<string, "CarId">;
export type PartId = Brand<string, "PartId">;
export type UpgradeId = Brand<string, "UpgradeId">;
export type StaffId = Brand<string, "StaffId">;
export type SponsorId = Brand<string, "SponsorId">;
export type CircuitId = Brand<string, "CircuitId">;
export type SeasonId = Brand<string, "SeasonId">;
export type RaceId = Brand<string, "RaceId">;
export type ChampionshipId = Brand<string, "ChampionshipId">;
export type FinancialTransactionId = Brand<string, "FinancialTransactionId">;
export type GameEventId = Brand<string, "GameEventId">;

/** Integer cents (e.g. 100_00 = $100.00). Never use floats for currency. */
export type Money = Brand<number, "Money">;

/** Statistic on a 0–100 scale used for pace, skills, and UI meters. */
export type Stat = Brand<number, "Stat">;

export type TireCompound =
  | "ultraSoft"
  | "soft"
  | "medium"
  | "hard"
  | "intermediate"
  | "wet";

export type PartSlot =
  | "engine"
  | "aero"
  | "chassis"
  | "brakes"
  | "gearbox"
  | "suspension"
  | "frontWing"
  | "rearWing";

export type StaffRole =
  | "raceEngineer"
  | "chiefDesigner"
  | "sportingDirector"
  | "strategist"
  | "mechanic"
  | "scout";

export type SeriesTier = "tier1" | "tier2" | "tier3";

export type Weather =
  | "dry"
  | "cloudy"
  | "lightRain"
  | "heavyRain"
  | "thunderstorm";

export type SessionType = "practice" | "qualifying" | "race" | "sprint";

export type DNFReason =
  | "engine"
  | "gearbox"
  | "collision"
  | "hydraulics"
  | "electrical"
  | "suspension"
  | "fuel"
  | "retired";

export type DrivingStyle = "conserve" | "standard" | "push" | "attack";
export type EngineMode = "cool" | "standard" | "push";

/** Per-driver stats; all 0–100. */
export interface DriverStats {
  /** Base one-lap pace contribution. */
  pace: Stat;
  overtaking: Stat;
  /** Defensive skill when under attack. */
  defence: Stat;
  /** Lap time variance (higher = more consistent). */
  consistency: Stat;
  /** Tire wear rate modifier (higher = gentler on tires). */
  smoothness: Stat;
  /** Helps car development feedback events. */
  feedback: Stat;
  wetSkill: Stat;
  /** Hidden ceiling until scouted. */
  potential: Stat;
}

export interface Driver {
  id: DriverId;
  displayName: string;
  /** ISO nationality string for filters (fictional ok). */
  nationality: string;
  /** Age in years; affects retirement and market. */
  age: number;
  stats: DriverStats;
  /** Marketability 0–100 for sponsor attractiveness. */
  marketability: Stat;
  /** Accumulated development XP (integer). */
  xp: number;
  /** Morale 0–100; affects negotiation. */
  morale: Stat;
  teamId: TeamId | null;
}

export interface Contract {
  id: ContractId;
  driverId: DriverId;
  teamId: TeamId;
  /** Annual salary in cents. */
  salaryPerSeasonCents: Money;
  seasonsRemaining: number;
  /** ISO end date of current contract segment. */
  endDate: string;
  signingBonusCents: Money;
  podiumBonusCents: Money;
}

export interface CarSetup {
  /** 0–100 quality at the active circuit for this weekend. */
  qualityAtCurrentCircuit: Stat;
}

export interface Car {
  id: CarId;
  teamId: TeamId;
  seasonId: SeasonId;
  /** 0–100 rolled-up performance for sim (not a Stat brand to allow >100 in future; keep 0–100 MVP). */
  overallPerformance: number;
  setup: CarSetup;
  fittedPartIds: Record<PartSlot, PartId | null>;
}

export interface Part {
  id: PartId;
  teamId: TeamId;
  slot: PartSlot;
  /** 0–100 performance contribution when fitted. */
  performance: number;
  /** Laps remaining before wear-out; 9999 = fresh unlimited for MVP. */
  lapsRemaining: number;
}

export interface Upgrade {
  id: UpgradeId;
  teamId: TeamId;
  slot: PartSlot;
  tier: number;
  weeksRemaining: number;
  /** Projected performance gain at completion (0–100 scale). */
  projectedGain: number;
  riskPct: number;
  costCents: Money;
  cancelled: boolean;
}

export interface Staff {
  id: StaffId;
  teamId: TeamId;
  role: StaffRole;
  /** Skill 0–100 affecting slice bonuses. */
  skill: Stat;
  salaryPerSeasonCents: Money;
}

export interface SponsorBonus {
  winCents: Money;
  podiumCents: Money;
  poleCents: Money;
}

export interface Sponsor {
  id: SponsorId;
  displayName: string;
  tier: number;
  /** Base per-season payment in cents. */
  seasonPaymentCents: Money;
  bonuses: SponsorBonus;
  /** Minimum combined marketability + prestige threshold (0–100 scale). */
  minMarketability: number;
  seasonsRemaining: number;
  teamId: TeamId | null;
}

export interface TeamFinance {
  balanceCents: Money;
  /** 0–100 board patience; at 0 triggers demotion / game over flow. */
  boardPatience: Stat;
}

export interface FinancialTransaction {
  id: FinancialTransactionId;
  teamId: TeamId;
  amountCents: Money;
  /** Positive = credit, negative = debit in amountCents sign convention — store signed Money. */
  signedAmountCents: Money;
  category: "salary" | "sponsor" | "prize" | "upgrade" | "fine" | "other";
  memo: string;
  occurredAt: string;
}

export interface Team {
  id: TeamId;
  displayName: string;
  /** Primary hex color for UI dots (no real team identity). */
  colorHex: string;
  /** 0–100 prestige; gates top drivers. */
  prestige: Stat;
  finance: TeamFinance;
  /** Up to two race drivers in grid slots. */
  driverIds: DriverId[];
  carId: CarId;
  sponsorIds: SponsorId[];
}

export interface Circuit {
  id: CircuitId;
  displayName: string;
  country: string;
  /** Base lap time seconds at dry baseline. */
  baseLapTimeSec: number;
  /** 0–2 difficulty scaling overtakes. */
  overtakingDifficulty: number;
  /** Weather volatility 0–1. */
  weatherVolatility: number;
  /** SVG path id reference in `data/circuits.json`. */
  svgTrackKey: string;
}

export interface SeasonRegulations {
  /** Points per finishing position index 0 = P1. */
  pointsTable: number[];
  allowedCompounds: TireCompound[];
  costCapCents: Money;
  engineAllocation: number;
}

export interface Season {
  id: SeasonId;
  year: number;
  tier: SeriesTier;
  regulations: SeasonRegulations;
  raceIds: RaceId[];
  championshipId: ChampionshipId;
}

export interface Race {
  id: RaceId;
  seasonId: SeasonId;
  circuitId: CircuitId;
  roundIndex: number;
  /** ISO scheduled start. */
  scheduledDate: string;
  weatherBySession: Partial<Record<SessionType, Weather>>;
  completed: boolean;
  resultId: RaceResultId | null;
}

export type RaceResultId = Brand<string, "RaceResultId">;

export interface DriverLapData {
  driverId: DriverId;
  lap: number;
  lapTimeSec: number;
  tireCompound: TireCompound;
  tireWearPct: number;
}

export interface DriverRaceResult {
  driverId: DriverId;
  teamId: TeamId;
  position: number;
  /** Total race time including pit loss. */
  totalTimeSec: number;
  dnf: boolean;
  dnfReason?: DNFReason;
  fastestLap: boolean;
  points: number;
}

export interface RaceResult {
  id: RaceResultId;
  raceId: RaceId;
  rngSeed: number;
  /** Final classification order is implicit in `results` sort by position. */
  results: DriverRaceResult[];
  poleDriverId: DriverId;
  fastestLapDriverId: DriverId;
  headline: string;
}

export interface ChampionshipStanding {
  entityId: string;
  points: number;
  wins: number;
  podiums: number;
}

export interface Championship {
  id: ChampionshipId;
  seasonId: SeasonId;
  driverStandings: ChampionshipStanding[];
  constructorStandings: ChampionshipStanding[];
}

export type InterruptType =
  | "race"
  | "news"
  | "contract"
  | "board"
  | "upgrade"
  | "transferDeadline";

export interface ScheduledInterrupt {
  id: string;
  date: string;
  type: InterruptType;
  payload?: Record<string, unknown>;
}

export interface GameEvent {
  id: GameEventId;
  date: string;
  kind: string;
  data: Record<string, unknown>;
}

export type Difficulty = "easy" | "normal" | "hard";

export interface PitStopPlan {
  lap: number;
  compound: TireCompound;
}

export interface SaveGame {
  version: number;
  slotId: string;
  playerTeamId: TeamId;
  currentDate: string;
  rngSeed: number;
  difficulty: Difficulty;
  /** First-run tutorial / disclaimer gate (added in save v2). */
  onboardingCompleted?: boolean;
  drivers: Record<string, Driver>;
  teams: Record<string, Team>;
  contracts: Record<string, Contract>;
  cars: Record<string, Car>;
  parts: Record<string, Part>;
  upgrades: Record<string, Upgrade>;
  staff: Record<string, Staff>;
  sponsors: Record<string, Sponsor>;
  circuits: Record<string, Circuit>;
  seasons: Record<string, Season>;
  races: Record<string, Race>;
  raceResults: Record<string, RaceResult>;
  championships: Record<string, Championship>;
  financialTransactions: Record<string, FinancialTransaction>;
  events: GameEvent[];
}

/** Clamp and brand a stat to 0–100. */
export function makeStat(n: number): Stat {
  const v = Math.max(0, Math.min(100, Math.round(n)));
  return v as Stat;
}

/** Brand integer cents (round to int). */
export function makeMoney(cents: number): Money {
  return Math.round(cents) as Money;
}
