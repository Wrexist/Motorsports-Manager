import { addDays, formatISO } from "date-fns";
import type {
  Car,
  CarId,
  Championship,
  ChampionshipId,
  Circuit,
  CircuitId,
  Contract,
  ContractId,
  Driver,
  DriverId,
  Race,
  RaceId,
  SaveGame,
  Season,
  SeasonId,
  Sponsor,
  SponsorId,
  Team,
  TeamId,
} from "@/types/game";
import { makeMoney, makeStat } from "@/types/game";

const SLOT = "slot_1" as const;

const TEAM_A = "tm_aeroswift" as TeamId;
const TEAM_B = "tm_northline" as TeamId;

const DRIVER_A1 = "dr_a1" as DriverId;
const DRIVER_A2 = "dr_a2" as DriverId;
const DRIVER_B1 = "dr_b1" as DriverId;
const DRIVER_B2 = "dr_b2" as DriverId;
const DRIVER_FA = "dr_free_1" as DriverId;

const CAR_A = "car_a" as CarId;
const CAR_B = "car_b" as CarId;

const SEASON_1 = "sn_2026" as SeasonId;
const CHAMP_1 = "ch_2026" as ChampionshipId;

function isoDate(d: Date): string {
  return formatISO(d, { representation: "date" });
}

function fictionalCircuits(): Record<string, Circuit> {
  const mk = (id: string, name: string, country: string, base: number, overtake: number, weatherVol: number): Circuit => ({
    id: id as CircuitId,
    displayName: name,
    country,
    baseLapTimeSec: base,
    overtakingDifficulty: overtake,
    weatherVolatility: weatherVol,
    svgTrackKey: `${id}_track`,
  });

  return {
    c1: mk("c1", "Desert Ribbon Circuit", "Bahrain", 92.1, 0.55, 0.35),
    c2: mk("c2", "Marina Street Circuit", "Singapore", 104.3, 0.35, 0.55),
    c3: mk("c3", "Forest Crest Raceway", "Belgium", 108.8, 0.65, 0.65),
    c4: mk("c4", "Harbour Loop Circuit", "Australia", 95.4, 0.45, 0.45),
    c5: mk("c5", "Alpine Rise Circuit", "Austria", 97.9, 0.6, 0.55),
    c6: mk("c6", "National Circuit", "United Kingdom", 96.2, 0.62, 0.55),
    c7: mk("c7", "Riviera Street Circuit", "Monaco", 78.4, 0.25, 0.25),
    c8: mk("c8", "Temple Circuit", "Japan", 99.1, 0.58, 0.55),
    c9: mk("c9", "Lakeside Circuit", "Canada", 93.7, 0.52, 0.45),
    c10: mk("c10", "Highland Circuit", "Brazil", 101.2, 0.6, 0.6),
  };
}

function mkDriver(params: {
  id: DriverId;
  name: string;
  nationality: string;
  age: number;
  teamId: TeamId;
  pace: number;
  smooth: number;
  overtake: number;
  consistency: number;
}): Driver {
  return {
    id: params.id,
    displayName: params.name,
    nationality: params.nationality,
    age: params.age,
    stats: {
      pace: makeStat(params.pace),
      overtaking: makeStat(params.overtake),
      defence: makeStat(params.overtake),
      consistency: makeStat(params.consistency),
      smoothness: makeStat(params.smooth),
      feedback: makeStat(55),
      wetSkill: makeStat(55),
      potential: makeStat(80),
    },
    marketability: makeStat(60),
    xp: 0,
    morale: makeStat(70),
    teamId: params.teamId,
  };
}

function mkTeam(params: { id: TeamId; name: string; color: string; prestige: number; driverIds: DriverId[]; carId: CarId }): Team {
  return {
    id: params.id,
    displayName: params.name,
    colorHex: params.color,
    prestige: makeStat(params.prestige),
    finance: {
      balanceCents: makeMoney(25_000_00),
      boardPatience: makeStat(80),
    },
    driverIds: params.driverIds,
    carId: params.carId,
    sponsorIds: [],
  };
}

function mkCar(params: { id: CarId; teamId: TeamId; seasonId: SeasonId; overall: number }): Car {
  return {
    id: params.id,
    teamId: params.teamId,
    seasonId: params.seasonId,
    overallPerformance: params.overall,
    setup: { qualityAtCurrentCircuit: makeStat(70) },
    fittedPartIds: {
      engine: null,
      aero: null,
      chassis: null,
      brakes: null,
      gearbox: null,
      suspension: null,
      frontWing: null,
      rearWing: null,
    },
  };
}

function mkContract(params: {
  id: ContractId;
  driverId: DriverId;
  teamId: TeamId;
  salary: number;
  endDate: string;
}): Contract {
  return {
    id: params.id,
    driverId: params.driverId,
    teamId: params.teamId,
    salaryPerSeasonCents: makeMoney(params.salary),
    seasonsRemaining: 1,
    endDate: params.endDate,
    signingBonusCents: makeMoney(0),
    podiumBonusCents: makeMoney(250_000_00),
  };
}

function mkSponsor(params: { id: SponsorId; name: string; teamId: TeamId }): Sponsor {
  return {
    id: params.id,
    displayName: params.name,
    tier: 2,
    seasonPaymentCents: makeMoney(6_000_00),
    bonuses: {
      winCents: makeMoney(350_000_00),
      podiumCents: makeMoney(150_000_00),
      poleCents: makeMoney(75_000_00),
    },
    minMarketability: 40,
    seasonsRemaining: 1,
    teamId: params.teamId,
  };
}

export function createSeedSaveGame(): SaveGame {
  const circuits = fictionalCircuits();
  const seasonStart = new Date("2026-03-07T00:00:00.000Z");

  const drivers: Record<string, Driver> = {
    [DRIVER_A1]: mkDriver({
      id: DRIVER_A1,
      name: "Jonah Pemberton",
      nationality: "UK",
      age: 25,
      teamId: TEAM_A,
      pace: 86,
      smooth: 72,
      overtake: 78,
      consistency: 74,
    }),
    [DRIVER_A2]: mkDriver({
      id: DRIVER_A2,
      name: "Oscar Lindqvist",
      nationality: "SE",
      age: 23,
      teamId: TEAM_A,
      pace: 80,
      smooth: 80,
      overtake: 70,
      consistency: 82,
    }),
    [DRIVER_B1]: mkDriver({
      id: DRIVER_B1,
      name: "Miguel Otero",
      nationality: "ES",
      age: 31,
      teamId: TEAM_B,
      pace: 78,
      smooth: 74,
      overtake: 72,
      consistency: 86,
    }),
    [DRIVER_B2]: mkDriver({
      id: DRIVER_B2,
      name: "Nile Harker",
      nationality: "UK",
      age: 34,
      teamId: TEAM_B,
      pace: 84,
      smooth: 68,
      overtake: 80,
      consistency: 78,
    }),
    [DRIVER_FA]: {
      ...mkDriver({
        id: DRIVER_FA,
        name: "Riley Vance",
        nationality: "CA",
        age: 22,
        teamId: TEAM_A,
        pace: 81,
        smooth: 75,
        overtake: 74,
        consistency: 80,
      }),
      teamId: null,
    },
  };

  const teams: Record<string, Team> = {
    [TEAM_A]: mkTeam({
      id: TEAM_A,
      name: "Aeroswift Works",
      color: "#F97316",
      prestige: 78,
      driverIds: [DRIVER_A1, DRIVER_A2],
      carId: CAR_A,
    }),
    [TEAM_B]: mkTeam({
      id: TEAM_B,
      name: "Northline GP",
      color: "#38BDF8",
      prestige: 74,
      driverIds: [DRIVER_B1, DRIVER_B2],
      carId: CAR_B,
    }),
  };

  const cars: Record<string, Car> = {
    [CAR_A]: mkCar({ id: CAR_A, teamId: TEAM_A, seasonId: SEASON_1, overall: 72 }),
    [CAR_B]: mkCar({ id: CAR_B, teamId: TEAM_B, seasonId: SEASON_1, overall: 70 }),
  };

  const contracts: Record<string, Contract> = {
    ct_a1: mkContract({
      id: "ct_a1" as ContractId,
      driverId: DRIVER_A1,
      teamId: TEAM_A,
      salary: 6_500_00,
      endDate: "2026-12-31",
    }),
    ct_a2: mkContract({
      id: "ct_a2" as ContractId,
      driverId: DRIVER_A2,
      teamId: TEAM_A,
      salary: 4_250_00,
      endDate: "2026-12-31",
    }),
    ct_b1: mkContract({
      id: "ct_b1" as ContractId,
      driverId: DRIVER_B1,
      teamId: TEAM_B,
      salary: 5_800_00,
      endDate: "2026-12-31",
    }),
    ct_b2: mkContract({
      id: "ct_b2" as ContractId,
      driverId: DRIVER_B2,
      teamId: TEAM_B,
      salary: 9_250_00,
      endDate: "2026-12-31",
    }),
  };

  const sponsors: Record<string, Sponsor> = {
    sp_title: mkSponsor({ id: "sp_title" as SponsorId, name: "Condor Telecoms", teamId: TEAM_A }),
    sp_loom: {
      id: "sp_loom" as SponsorId,
      displayName: "Loom Analytics",
      tier: 3,
      seasonPaymentCents: makeMoney(3_500_00),
      bonuses: {
        winCents: makeMoney(120_000_00),
        podiumCents: makeMoney(60_000_00),
        poleCents: makeMoney(30_000_00),
      },
      minMarketability: 35,
      seasonsRemaining: 1,
      teamId: null,
    },
  };

  // Attach sponsor to player team for MVP payouts.
  teams[TEAM_A]!.sponsorIds = ["sp_title" as SponsorId];

  const circuitIds = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9", "c10"] as CircuitId[];
  const raceIds: RaceId[] = Array.from({ length: 10 }, (_, i) => `rc_${i + 1}` as RaceId);

  const races: Record<string, Race> = {};
  for (let i = 0; i < 10; i += 1) {
    const id = raceIds[i]!;
    const circuitId = circuitIds[i]!;
    races[id] = {
      id,
      seasonId: SEASON_1,
      circuitId,
      roundIndex: i + 1,
      scheduledDate: isoDate(addDays(seasonStart, i * 7)),
      weatherBySession: { race: "dry" },
      completed: false,
      resultId: null,
    };
  }

  const championship: Championship = {
    id: CHAMP_1,
    seasonId: SEASON_1,
    driverStandings: Object.keys(drivers).map((id) => ({
      entityId: id,
      points: 0,
      wins: 0,
      podiums: 0,
    })),
    constructorStandings: Object.keys(teams).map((id) => ({
      entityId: id,
      points: 0,
      wins: 0,
      podiums: 0,
    })),
  };

  const season: Season = {
    id: SEASON_1,
    year: 2026,
    tier: "tier1",
    regulations: {
      pointsTable: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
      allowedCompounds: ["soft", "medium", "hard", "intermediate", "wet"],
      costCapCents: makeMoney(135_000_000_00),
      engineAllocation: 3,
    },
    raceIds,
    championshipId: CHAMP_1,
  };

  return {
    version: 2,
    slotId: SLOT,
    playerTeamId: TEAM_A,
    currentDate: isoDate(seasonStart),
    rngSeed: 1337,
    difficulty: "normal",
    onboardingCompleted: false,
    drivers,
    teams,
    contracts,
    cars,
    parts: {},
    upgrades: {},
    staff: {},
    sponsors,
    circuits,
    seasons: { [SEASON_1]: season },
    races,
    raceResults: {},
    championships: { [CHAMP_1]: championship },
    financialTransactions: {},
    events: [],
  };
}
