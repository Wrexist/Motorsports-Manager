import { Preferences } from "@capacitor/preferences";
import type { PersistStorage, StorageValue } from "zustand/middleware/persist";

const prefix = "plm_";

function key(name: string) {
  return `${prefix}${name}`;
}

/**
 * Capacitor-backed persistence. On web, `@capacitor/preferences` maps to localStorage.
 */
export async function preferencesGet(name: string): Promise<string | null> {
  const { value } = await Preferences.get({ key: key(name) });
  return value ?? null;
}

export async function preferencesSet(name: string, value: string): Promise<void> {
  await Preferences.set({ key: key(name), value });
}

export async function preferencesRemove(name: string): Promise<void> {
  await Preferences.remove({ key: key(name) });
}

/** Zustand `persist` storage adapter (async). */
export function createCapacitorPersistStorage<S>(): PersistStorage<S> {
  return {
    getItem: async (name) => {
      const raw = await preferencesGet(name);
      if (raw == null) return null;
      try {
        return JSON.parse(raw) as StorageValue<S>;
      } catch {
        return null;
      }
    },
    setItem: async (name, value) => {
      await preferencesSet(name, JSON.stringify(value));
    },
    removeItem: async (name) => {
      await preferencesRemove(name);
    },
  };
}
