import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "@/stores/useGameStore";
import type { Driver, Team } from "@/types/game";

export function usePlayerTeam(): Team | undefined {
  return useGameStore(
    useShallow((s) => {
      const id = String(s.save.playerTeamId);
      return s.save.teams[id];
    }),
  );
}

export function usePlayerDrivers(): Driver[] {
  return useGameStore(
    useShallow((s) => {
      const team = s.save.teams[s.save.playerTeamId];
      if (!team) return [];
      return team.driverIds.map((id) => s.save.drivers[id]).filter(Boolean) as Driver[];
    }),
  );
}
