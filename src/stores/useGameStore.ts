import { addDays, differenceInCalendarDays, parseISO } from "date-fns";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createSeedSaveGame } from "@/data/seedSaveGame";
import { migratePersistedSave, SAVE_PERSIST_VERSION, type PersistedSlice } from "@/lib/saveMigration";
import { saveGameSchema } from "@/lib/saveGameSchema";
import { createCapacitorPersistStorage } from "@/lib/storage";
import { processWeeklyUpgrades } from "@/lib/weeklyUpgrades";
import { CAR_DEV_CONSTANTS } from "@/sim/carDevConstants";
import { buildRaceState, prizeMoneyCents, simulateRace } from "@/sim/race";
import type {
  Championship,
  Contract,
  ContractId,
  DriverId,
  DriverRaceResult,
  FinancialTransaction,
  FinancialTransactionId,
  PartSlot,
  Race,
  RaceResult,
  RaceResultId,
  SaveGame,
  ScheduledInterrupt,
  Season,
  SponsorId,
  TeamId,
  Upgrade,
  UpgradeId,
} from "@/types/game";
import { makeMoney } from "@/types/game";

type GameStore = {
  save: SaveGame;
  nextInterrupt: ScheduledInterrupt | null;

  refreshInterrupt: () => void;
  skipWeek: () => void;
  advanceToNextInterrupt: () => void;
  completeNextRace: () => void;

  setOnboardingCompleted: (done: boolean) => void;
  signDriver: (
    driverId: DriverId,
    terms: { salaryPerSeasonCents: number; seasons: number; signingBonusCents: number },
  ) => { ok: true } | { ok: false; reason: string };
  startUpgrade: (slot: PartSlot, tier: number) => void;
  cancelUpgrade: (upgradeId: UpgradeId) => void;
  advanceDay: (days?: number) => void;
  addSponsorToPlayer: (sponsorId: SponsorId) => void;
};

function assertSeason(save: SaveGame): Season {
  const season = Object.values(save.seasons)[0];
  if (!season) throw new Error("No season in save");
  return season;
}

function assertChampionship(save: SaveGame, season: Season): Championship {
  const ch = save.championships[season.championshipId];
  if (!ch) throw new Error("No championship in save");
  return ch;
}

function nextIncompleteRace(save: SaveGame, season: Season): Race | null {
  const races = season.raceIds
    .map((id) => save.races[id])
    .filter((r): r is Race => Boolean(r))
    .filter((r) => !r.completed)
    .sort((a, b) => a.roundIndex - b.roundIndex);
  return races[0] ?? null;
}

/** Exported for tests and tooling that need interrupt state without loading the store. */
export function recomputeInterruptFromSave(save: SaveGame): ScheduledInterrupt | null {
  const season = assertSeason(save);
  const next = nextIncompleteRace(save, season);
  if (!next) return null;
  return { id: `int_${next.id}`, date: next.scheduledDate, type: "race", payload: { raceId: next.id } };
}

function newTx(params: {
  id: string;
  teamId: FinancialTransaction["teamId"];
  signedAmountCents: number;
  category: FinancialTransaction["category"];
  memo: string;
  occurredAt: string;
}): FinancialTransaction {
  const signed = makeMoney(params.signedAmountCents);
  return {
    id: params.id as FinancialTransactionId,
    teamId: params.teamId,
    amountCents: makeMoney(Math.abs(params.signedAmountCents)),
    signedAmountCents: signed,
    category: params.category,
    memo: params.memo,
    occurredAt: params.occurredAt,
  };
}

function applyStandings(ch: Championship, result: RaceResult): void {
  const driverById = new Map(ch.driverStandings.map((d) => [d.entityId, d]));
  const teamById = new Map(ch.constructorStandings.map((t) => [t.entityId, t]));

  for (const row of result.results) {
    if (row.dnf) continue;

    const d = driverById.get(row.driverId);
    if (d) {
      d.points += row.points;
      if (row.position === 1) d.wins += 1;
      if (row.position <= 3) d.podiums += 1;
    }

    const t = teamById.get(row.teamId);
    if (t) {
      t.points += row.points;
      if (row.position === 1) t.wins += 1;
      if (row.position <= 3) t.podiums += 1;
    }
  }
}

function makeUuid(): string {
  const c = globalThis.crypto;
  if (c && "randomUUID" in c) return c.randomUUID();
  // Last resort (still not Math.random): time + performance counter.
  return `${Date.now().toString(16)}_${performance.now().toString(16)}`;
}

function idContract(): ContractId {
  return `ct_${makeUuid()}` as ContractId;
}

function idUpgrade(): UpgradeId {
  return `up_${makeUuid()}` as UpgradeId;
}

function playerBalance(save: SaveGame): number {
  const t = save.teams[String(save.playerTeamId)];
  return t ? Number(t.finance.balanceCents) : 0;
}

function debitTeam(save: SaveGame, teamId: TeamId, cents: number, memo: string): boolean {
  const team = save.teams[String(teamId)];
  if (!team) return false;
  const bal = Number(team.finance.balanceCents);
  if (bal < cents) return false;
  team.finance.balanceCents = makeMoney(bal - cents);
  const tx = newTx({
    id: `tx_${makeUuid()}`,
    teamId: teamId,
    signedAmountCents: -cents,
    category: "other",
    memo,
    occurredAt: `${save.currentDate}T12:00:00.000Z`,
  });
  save.financialTransactions[tx.id] = tx;
  return true;
}

export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        save: createSeedSaveGame(),
        nextInterrupt: recomputeInterruptFromSave(createSeedSaveGame()),

        refreshInterrupt: () => {
          set((d) => {
            d.nextInterrupt = recomputeInterruptFromSave(d.save);
          });
        },

        skipWeek: () => {
          set((d) => {
            processWeeklyUpgrades(d.save, 1);
            const cur = parseISO(`${d.save.currentDate}T00:00:00.000Z`);
            d.save.currentDate = addDays(cur, 7).toISOString().slice(0, 10);
            d.nextInterrupt = recomputeInterruptFromSave(d.save);
          });
        },

        advanceToNextInterrupt: () => {
          set((d) => {
            const interrupt = recomputeInterruptFromSave(d.save);
            if (!interrupt) return;
            const target = parseISO(`${interrupt.date}T00:00:00.000Z`);
            const cur = parseISO(`${d.save.currentDate}T00:00:00.000Z`);
            if (cur.getTime() >= target.getTime()) return;
            const days = differenceInCalendarDays(target, cur);
            processWeeklyUpgrades(d.save, Math.floor(days / 7));
            d.save.currentDate = interrupt.date;
            d.nextInterrupt = recomputeInterruptFromSave(d.save);
          });
        },

        setOnboardingCompleted: (done) => {
          set((d) => {
            d.save.onboardingCompleted = done;
          });
        },

        signDriver: (driverId, terms) => {
          const s0 = get().save;
          const driver = s0.drivers[driverId];
          if (!driver) return { ok: false as const, reason: "Driver not found" };
          const upfront = terms.signingBonusCents + Math.floor(terms.salaryPerSeasonCents * 0.1);
          if (playerBalance(s0) < upfront) return { ok: false as const, reason: "Insufficient funds" };
          let ok = false;
          set((d) => {
            if (!debitTeam(d.save, d.save.playerTeamId, upfront, `Sign ${String(driverId)}`)) return;
            const dr = d.save.drivers[driverId];
            if (!dr) return;
            dr.teamId = d.save.playerTeamId;
            const team = d.save.teams[String(d.save.playerTeamId)]!;
            if (!team.driverIds.includes(driverId)) team.driverIds.push(driverId);
            const c: Contract = {
              id: idContract(),
              driverId,
              teamId: d.save.playerTeamId,
              salaryPerSeasonCents: makeMoney(terms.salaryPerSeasonCents),
              seasonsRemaining: terms.seasons,
              endDate: d.save.currentDate,
              signingBonusCents: makeMoney(terms.signingBonusCents),
              podiumBonusCents: makeMoney(0),
            };
            d.save.contracts[c.id] = c;
            ok = true;
          });
          return ok ? ({ ok: true as const }) : ({ ok: false as const, reason: "Insufficient funds" });
        },

        startUpgrade: (slot, tier) => {
          set((d) => {
            const cost = CAR_DEV_CONSTANTS.tierCostsCents[tier - 1];
            const weeks = CAR_DEV_CONSTANTS.tierWeeks[tier - 1];
            if (cost == null || weeks == null) return;
            if (!debitTeam(d.save, d.save.playerTeamId, Number(cost), `R&D ${slot} tier ${tier}`)) return;
            const up: Upgrade = {
              id: idUpgrade(),
              teamId: d.save.playerTeamId,
              slot,
              tier,
              weeksRemaining: weeks,
              projectedGain: CAR_DEV_CONSTANTS.projectedGainByTier[tier - 1] ?? 5,
              riskPct: CAR_DEV_CONSTANTS.riskPctByTier[tier - 1] ?? 15,
              costCents: makeMoney(Number(cost)),
              cancelled: false,
            };
            d.save.upgrades[up.id] = up;
          });
        },

        cancelUpgrade: (upgradeId) => {
          set((d) => {
            const u = d.save.upgrades[upgradeId];
            if (!u || u.cancelled) return;
            u.cancelled = true;
            const refund = Math.floor(Number(u.costCents) * CAR_DEV_CONSTANTS.cancelRefundPct);
            const team = d.save.teams[String(d.save.playerTeamId)]!;
            team.finance.balanceCents = makeMoney(Number(team.finance.balanceCents) + refund);
            const tx = newTx({
              id: `tx_refund_${upgradeId}`,
              teamId: d.save.playerTeamId,
              signedAmountCents: refund,
              category: "other",
              memo: "Cancelled upgrade refund",
              occurredAt: `${d.save.currentDate}T12:00:00.000Z`,
            });
            d.save.financialTransactions[tx.id] = tx;
          });
        },

        advanceDay: (days = 1) => {
          set((d) => {
            const n = Math.max(1, Math.floor(days));
            processWeeklyUpgrades(d.save, Math.floor(n / 7));
            const cur = parseISO(`${d.save.currentDate}T00:00:00.000Z`);
            d.save.currentDate = addDays(cur, n).toISOString().slice(0, 10);
            d.nextInterrupt = recomputeInterruptFromSave(d.save);
          });
        },

        addSponsorToPlayer: (sponsorId) => {
          set((d) => {
            const sp = d.save.sponsors[sponsorId];
            const team = d.save.teams[String(d.save.playerTeamId)];
            if (!sp || !team) return;
            sp.teamId = d.save.playerTeamId;
            if (!team.sponsorIds.includes(sponsorId)) team.sponsorIds.push(sponsorId);
            const tx = newTx({
              id: `tx_sponsor_${sponsorId}`,
              teamId: d.save.playerTeamId,
              signedAmountCents: Number(sp.seasonPaymentCents),
              category: "sponsor",
              memo: `Sponsor payment — ${sp.displayName}`,
              occurredAt: `${d.save.currentDate}T12:00:00.000Z`,
            });
            d.save.financialTransactions[tx.id] = tx;
            team.finance.balanceCents = makeMoney(
              Number(team.finance.balanceCents) + Number(sp.seasonPaymentCents),
            );
          });
        },

        completeNextRace: () => {
          set((draft) => {
            const season = assertSeason(draft.save);
            const race = nextIncompleteRace(draft.save, season);
            if (!race) return;

            const circuit = draft.save.circuits[race.circuitId];
            if (!circuit) throw new Error(`Missing circuit ${race.circuitId}`);

            const weather = race.weatherBySession.race ?? "dry";
            const driverIds = Object.values(draft.save.drivers)
              .filter((d) => d.teamId != null)
              .map((d) => d.id);

            const { state, contexts } = buildRaceState({
              raceId: race.id,
              circuit,
              regulations: season.regulations,
              weather,
              ambientTempC: weather === "dry" ? 32 : 18,
              totalLaps: 10,
              rngSeed: draft.save.rngSeed + race.roundIndex * 97,
              driverIds,
              driversById: draft.save.drivers,
              teamsById: draft.save.teams,
              carsById: draft.save.cars,
            });

            const { result } = simulateRace(state, contexts, {});

            const rrId = (`rr_${race.id}`) as RaceResultId;
            const finalized: RaceResult = { ...result, id: rrId };
            draft.save.raceResults[rrId] = finalized;

            race.completed = true;
            race.resultId = rrId;

            const ch = assertChampionship(draft.save, season);
            applyStandings(ch, finalized);

            const occurredAt = `${draft.save.currentDate}T12:00:00.000Z`;
            const bestByTeam = new Map<TeamId, DriverRaceResult>();
            for (const row of finalized.results) {
              if (row.dnf) continue;
              const prev = bestByTeam.get(row.teamId);
              if (!prev || row.position < prev.position) bestByTeam.set(row.teamId, row);
            }

            let txCounter = Object.keys(draft.save.financialTransactions).length;
            const pushTx = (tx: FinancialTransaction) => {
              draft.save.financialTransactions[tx.id] = tx;
            };

            for (const [teamId, row] of bestByTeam.entries()) {
              const prize = prizeMoneyCents(row.position);
              txCounter += 1;
              pushTx(
                newTx({
                  id: `tx_${race.id}_prize_${teamId}_${txCounter}`,
                  teamId,
                  signedAmountCents: Number(prize),
                  category: "prize",
                  memo: `Prize money — ${circuit.displayName} (P${row.position})`,
                  occurredAt,
                }),
              );
              draft.save.teams[String(teamId)]!.finance.balanceCents = makeMoney(
                Number(draft.save.teams[String(teamId)]!.finance.balanceCents) + Number(prize),
              );
            }

            const playerTeamId = draft.save.playerTeamId;
            const team = draft.save.teams[String(playerTeamId)]!;
            for (const sponsorId of team.sponsorIds) {
              const sponsor = draft.save.sponsors[sponsorId];
              if (!sponsor) continue;

              for (const row of finalized.results) {
                if (row.dnf) continue;
                if (row.teamId !== playerTeamId) continue;

                if (row.position === 1) {
                  const bonus = sponsor.bonuses.winCents;
                  txCounter += 1;
                  pushTx(
                    newTx({
                      id: `tx_${race.id}_sponsor_win_${sponsorId}_${txCounter}`,
                      teamId: playerTeamId,
                      signedAmountCents: Number(bonus),
                      category: "sponsor",
                      memo: `Sponsor bonus — win (${sponsor.displayName})`,
                      occurredAt,
                    }),
                  );
                  team.finance.balanceCents = makeMoney(Number(team.finance.balanceCents) + Number(bonus));
                } else if (row.position <= 3) {
                  const bonus = sponsor.bonuses.podiumCents;
                  txCounter += 1;
                  pushTx(
                    newTx({
                      id: `tx_${race.id}_sponsor_podium_${sponsorId}_${row.driverId}_${txCounter}`,
                      teamId: playerTeamId,
                      signedAmountCents: Number(bonus),
                      category: "sponsor",
                      memo: `Sponsor bonus — podium (${sponsor.displayName})`,
                      occurredAt,
                    }),
                  );
                  team.finance.balanceCents = makeMoney(Number(team.finance.balanceCents) + Number(bonus));
                }
              }
            }

            draft.nextInterrupt = recomputeInterruptFromSave(draft.save);
          });
        },
      })),
      {
        name: "pit-lane-save-v1",
        version: SAVE_PERSIST_VERSION,
        storage: createCapacitorPersistStorage<PersistedSlice>(),
        partialize: (state): PersistedSlice => ({ save: state.save }),
        migrate: (persisted, version) => {
          if (!persisted || typeof persisted !== "object") {
            return { save: createSeedSaveGame() };
          }
          const maybe = persisted as PersistedSlice & { state?: PersistedSlice };
          const slice: PersistedSlice = "state" in maybe && maybe.state ? maybe.state : maybe;
          if (!slice.save) {
            return { save: createSeedSaveGame() };
          }
          const parsed = saveGameSchema.safeParse(slice.save);
          if (!parsed.success) {
            return { save: createSeedSaveGame() };
          }
          const save = parsed.data as unknown as SaveGame;
          return migratePersistedSave({ save }, version);
        },
      },
    ),
    { name: "PitLaneManagerStore" },
  ),
);

useGameStore.persist.onFinishHydration(() => {
  useGameStore.setState({
    nextInterrupt: recomputeInterruptFromSave(useGameStore.getState().save),
  });
});
