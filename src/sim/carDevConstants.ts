/** Central tuning for car development (MVP). */

export const CAR_DEV_CONSTANTS = {
  tierCostsCents: [500_000_00, 1_000_000_00, 2_000_000_00, 4_000_000_00] as const,
  tierWeeks: [2, 3, 4, 5] as const,
  projectedGainByTier: [4, 7, 11, 16] as const,
  riskPctByTier: [12, 16, 20, 25] as const,
  cancelRefundPct: 0.5,
  nextYearCarSplitDefault: 60,
} as const;
