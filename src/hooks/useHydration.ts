import { useEffect, useState } from "react";
import { useGameStore } from "@/stores/useGameStore";

/**
 * Zustand persist rehydrates asynchronously; never render gameplay UI until hydrated.
 * This prevents iOS first-launch blank screens when reading async storage.
 */
export function useHydration(): boolean {
  const [hydrated, setHydrated] = useState(useGameStore.persist.hasHydrated());

  useEffect(() => {
    const unsub = useGameStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    // In case hydration finished before this effect ran.
    setHydrated(useGameStore.persist.hasHydrated());

    return unsub;
  }, []);

  return hydrated;
}
