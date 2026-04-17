import { createSeedSaveGame } from "@/data/seedSaveGame";
import type { SaveGame } from "@/types/game";

/** Zustand persist `version` — bump when adding `migrate` cases. */
export const SAVE_PERSIST_VERSION = 2;

export type PersistedSlice = { save: SaveGame };

/**
 * Idempotent migration from persisted JSON to current `SaveGame` shape.
 * Mirrors `useGameStore` persist `migrate` (keep in sync when bumping version).
 */
export function migratePersistedSave(slice: PersistedSlice, version: number): PersistedSlice {
  if (!slice.save) {
    return { save: createSeedSaveGame() };
  }
  if (version < 2) {
    return {
      save: {
        ...slice.save,
        onboardingCompleted: slice.save.onboardingCompleted ?? false,
        version: Math.max(slice.save.version, 2),
      },
    };
  }
  return slice;
}
