import type { Money } from "@/types/game";

/**
 * Format integer cents as a USD-like string for UI (MVP).
 * Replace with locale-aware i18n when adding translations.
 */
export function formatMoney(cents: Money): string {
  const n = Number(cents);
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return `${sign}$${(abs / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
