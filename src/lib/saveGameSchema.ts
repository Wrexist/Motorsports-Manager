import { z } from "zod";

/**
 * Runtime validation for persisted `SaveGame` JSON. Keeps branded fields as plain
 * strings/numbers at the Zod layer; callers cast to `SaveGame` after success.
 */
const moneySchema = z.number().int();
const statSchema = z.number().int().min(0).max(100);

const driverStatsSchema = z.object({
  pace: statSchema,
  overtaking: statSchema,
  defence: statSchema,
  consistency: statSchema,
  smoothness: statSchema,
  feedback: statSchema,
  wetSkill: statSchema,
  potential: statSchema,
});

const driverSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  nationality: z.string(),
  age: z.number().int().nonnegative(),
  stats: driverStatsSchema,
  marketability: statSchema,
  xp: z.number().int(),
  morale: statSchema,
  teamId: z.string().nullable(),
});

const contractSchema = z.object({
  id: z.string(),
  driverId: z.string(),
  teamId: z.string(),
  salaryPerSeasonCents: moneySchema,
  seasonsRemaining: z.number().int(),
  endDate: z.string(),
  signingBonusCents: moneySchema,
  podiumBonusCents: moneySchema,
});

const carSetupSchema = z.object({
  qualityAtCurrentCircuit: statSchema,
});

const partSlotSchema = z.enum([
  "engine",
  "aero",
  "chassis",
  "brakes",
  "gearbox",
  "suspension",
  "frontWing",
  "rearWing",
]);

const carSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  seasonId: z.string(),
  overallPerformance: z.number(),
  setup: carSetupSchema,
  fittedPartIds: z.record(partSlotSchema, z.string().nullable()),
});

const partSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  slot: partSlotSchema,
  performance: z.number(),
  lapsRemaining: z.number(),
});

const upgradeSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  slot: partSlotSchema,
  tier: z.number().int(),
  weeksRemaining: z.number().int(),
  projectedGain: z.number(),
  riskPct: z.number(),
  costCents: moneySchema,
  cancelled: z.boolean(),
});

const staffRoleSchema = z.enum([
  "raceEngineer",
  "chiefDesigner",
  "sportingDirector",
  "strategist",
  "mechanic",
  "scout",
]);

const staffSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  role: staffRoleSchema,
  skill: statSchema,
  salaryPerSeasonCents: moneySchema,
});

const sponsorSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  tier: z.number().int(),
  seasonPaymentCents: moneySchema,
  bonuses: z.object({
    winCents: moneySchema,
    podiumCents: moneySchema,
    poleCents: moneySchema,
  }),
  minMarketability: z.number(),
  seasonsRemaining: z.number().int(),
  teamId: z.string().nullable(),
});

const teamSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  colorHex: z.string(),
  prestige: statSchema,
  finance: z.object({
    balanceCents: moneySchema,
    boardPatience: statSchema,
  }),
  driverIds: z.array(z.string()),
  carId: z.string(),
  sponsorIds: z.array(z.string()),
});

const circuitSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  country: z.string(),
  baseLapTimeSec: z.number(),
  overtakingDifficulty: z.number(),
  weatherVolatility: z.number(),
  svgTrackKey: z.string(),
});

const tireCompoundSchema = z.enum([
  "ultraSoft",
  "soft",
  "medium",
  "hard",
  "intermediate",
  "wet",
]);

const seasonRegulationsSchema = z.object({
  pointsTable: z.array(z.number()),
  allowedCompounds: z.array(tireCompoundSchema),
  costCapCents: moneySchema,
  engineAllocation: z.number().int(),
});

const seriesTierSchema = z.enum(["tier1", "tier2", "tier3"]);

const seasonSchema = z.object({
  id: z.string(),
  year: z.number().int(),
  tier: seriesTierSchema,
  regulations: seasonRegulationsSchema,
  raceIds: z.array(z.string()),
  championshipId: z.string(),
});

const weatherSchema = z.enum(["dry", "cloudy", "lightRain", "heavyRain", "thunderstorm"]);

const raceSchema = z.object({
  id: z.string(),
  seasonId: z.string(),
  circuitId: z.string(),
  roundIndex: z.number().int(),
  scheduledDate: z.string(),
  /** Keys are session types (e.g. `race`); map may omit unused sessions. */
  weatherBySession: z.record(z.string(), weatherSchema),
  completed: z.boolean(),
  resultId: z.string().nullable(),
});

const dnfReasonSchema = z.enum([
  "engine",
  "gearbox",
  "collision",
  "hydraulics",
  "electrical",
  "suspension",
  "fuel",
  "retired",
]);

const driverRaceResultSchema = z.object({
  driverId: z.string(),
  teamId: z.string(),
  position: z.number().int(),
  totalTimeSec: z.number(),
  dnf: z.boolean(),
  dnfReason: dnfReasonSchema.optional(),
  fastestLap: z.boolean(),
  points: z.number().int(),
});

const raceResultSchema = z.object({
  id: z.string(),
  raceId: z.string(),
  rngSeed: z.number().int(),
  results: z.array(driverRaceResultSchema),
  poleDriverId: z.string(),
  fastestLapDriverId: z.string(),
  headline: z.string(),
});

const championshipStandingSchema = z.object({
  entityId: z.string(),
  points: z.number().int(),
  wins: z.number().int(),
  podiums: z.number().int(),
});

const championshipSchema = z.object({
  id: z.string(),
  seasonId: z.string(),
  driverStandings: z.array(championshipStandingSchema),
  constructorStandings: z.array(championshipStandingSchema),
});

const financialTransactionSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  amountCents: moneySchema,
  signedAmountCents: moneySchema,
  category: z.enum(["salary", "sponsor", "prize", "upgrade", "fine", "other"]),
  memo: z.string(),
  occurredAt: z.string(),
});

const gameEventSchema = z.object({
  id: z.string(),
  date: z.string(),
  kind: z.string(),
  data: z.record(z.unknown()),
});

const difficultySchema = z.enum(["easy", "normal", "hard"]);

export const saveGameSchema = z.object({
  version: z.number().int().min(1),
  slotId: z.string(),
  playerTeamId: z.string(),
  currentDate: z.string(),
  rngSeed: z.number().int(),
  difficulty: difficultySchema,
  onboardingCompleted: z.boolean().optional(),
  drivers: z.record(z.string(), driverSchema),
  teams: z.record(z.string(), teamSchema),
  contracts: z.record(z.string(), contractSchema),
  cars: z.record(z.string(), carSchema),
  parts: z.record(z.string(), partSchema),
  upgrades: z.record(z.string(), upgradeSchema),
  staff: z.record(z.string(), staffSchema),
  sponsors: z.record(z.string(), sponsorSchema),
  circuits: z.record(z.string(), circuitSchema),
  seasons: z.record(z.string(), seasonSchema),
  races: z.record(z.string(), raceSchema),
  raceResults: z.record(z.string(), raceResultSchema),
  championships: z.record(z.string(), championshipSchema),
  financialTransactions: z.record(z.string(), financialTransactionSchema),
  events: z.array(gameEventSchema),
});

export type ParsedSaveGame = z.infer<typeof saveGameSchema>;
