import { createSeedSaveGame } from "@/data/seedSaveGame";
import { migratePersistedSave, SAVE_PERSIST_VERSION, type PersistedSlice } from "@/lib/saveMigration";
import { saveGameSchema } from "@/lib/saveGameSchema";
import type { SaveGame } from "@/types/game";

type WrappedPersist = { state?: PersistedSlice; version?: number };

function unwrapPersistedJson(raw: unknown): { slice: PersistedSlice; persistVersion: number } | null {
  if (raw == null || typeof raw !== "object") return null;
  const root = raw as WrappedPersist & PersistedSlice & { version?: number };

  if ("state" in root && root.state && typeof root.state === "object" && "save" in root.state) {
    const v = typeof root.version === "number" ? root.version : SAVE_PERSIST_VERSION;
    return { slice: root.state as PersistedSlice, persistVersion: v };
  }

  if ("save" in root && root.save && typeof root.save === "object") {
    const v = typeof root.version === "number" ? root.version : SAVE_PERSIST_VERSION;
    return { slice: { save: root.save as SaveGame }, persistVersion: v };
  }

  return null;
}

/**
 * Parse persisted Zustand JSON (full persist blob or `{ save }` slice) into a `SaveGame`.
 * Invalid or corrupt data falls back to a fresh seed save.
 */
export function parseSaveGameFromPersistJson(raw: unknown): SaveGame {
  const unwrapped = unwrapPersistedJson(raw);
  if (!unwrapped) {
    return createSeedSaveGame();
  }

  const parsed = saveGameSchema.safeParse(unwrapped.slice.save);
  if (!parsed.success) {
    return createSeedSaveGame();
  }

  const asSave = parsed.data as unknown as SaveGame;
  const migrated = migratePersistedSave({ save: asSave }, unwrapped.persistVersion);
  return migrated.save;
}
