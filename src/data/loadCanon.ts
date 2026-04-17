import { z } from "zod";
import circuitsJson from "@/data/canon/circuits.json";
import sponsorsJson from "@/data/canon/sponsors.json";
import type { Circuit, CircuitId, Sponsor, SponsorId, TeamId } from "@/types/game";
import { makeMoney } from "@/types/game";

const circuitCanonSchema = z.object({
  id: z.string(),
  displayName: z.string().min(1),
  country: z.string().min(1),
  baseLapTimeSec: z.number().positive(),
  overtakingDifficulty: z.number().min(0).max(2),
  weatherVolatility: z.number().min(0).max(1),
  svgTrackKey: z.string().min(1),
});

const circuitsFileSchema = z.record(z.string(), circuitCanonSchema).superRefine((rec, ctx) => {
  for (const [key, val] of Object.entries(rec)) {
    if (key !== val.id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Circuit key "${key}" must match id "${val.id}"`,
        path: [key],
      });
    }
  }
});

const sponsorCanonSchema = z.object({
  id: z.string(),
  displayName: z.string().min(1),
  tier: z.number().int().nonnegative(),
  seasonPaymentCents: z.number().int(),
  bonuses: z.object({
    winCents: z.number().int(),
    podiumCents: z.number().int(),
    poleCents: z.number().int(),
  }),
  minMarketability: z.number(),
  seasonsRemaining: z.number().int(),
  teamId: z.string().nullable(),
});

const sponsorsFileSchema = z.array(sponsorCanonSchema);

function toCircuit(row: z.infer<typeof circuitCanonSchema>): Circuit {
  return {
    id: row.id as CircuitId,
    displayName: row.displayName,
    country: row.country,
    baseLapTimeSec: row.baseLapTimeSec,
    overtakingDifficulty: row.overtakingDifficulty,
    weatherVolatility: row.weatherVolatility,
    svgTrackKey: row.svgTrackKey,
  };
}

function toSponsor(row: z.infer<typeof sponsorCanonSchema>): Sponsor {
  return {
    id: row.id as SponsorId,
    displayName: row.displayName,
    tier: row.tier,
    seasonPaymentCents: makeMoney(row.seasonPaymentCents),
    bonuses: {
      winCents: makeMoney(row.bonuses.winCents),
      podiumCents: makeMoney(row.bonuses.podiumCents),
      poleCents: makeMoney(row.bonuses.poleCents),
    },
    minMarketability: row.minMarketability,
    seasonsRemaining: row.seasonsRemaining,
    teamId: row.teamId as TeamId | null,
  };
}

export type CanonBundle = {
  circuits: Record<string, Circuit>;
  sponsors: Sponsor[];
};

/**
 * Loads and validates fictional canon JSON bundled with the app.
 * Throws if data is invalid (build-time / unit-test enforced).
 */
export function loadCanon(): CanonBundle {
  const circuitsParsed = circuitsFileSchema.safeParse(circuitsJson);
  if (!circuitsParsed.success) {
    throw new Error(`Invalid circuits.json: ${circuitsParsed.error.message}`);
  }

  const sponsorsParsed = sponsorsFileSchema.safeParse(sponsorsJson);
  if (!sponsorsParsed.success) {
    throw new Error(`Invalid sponsors.json: ${sponsorsParsed.error.message}`);
  }

  const circuits: Record<string, Circuit> = {};
  for (const row of Object.values(circuitsParsed.data)) {
    circuits[row.id] = toCircuit(row);
  }

  const sponsors = sponsorsParsed.data.map(toSponsor);
  return { circuits, sponsors };
}
