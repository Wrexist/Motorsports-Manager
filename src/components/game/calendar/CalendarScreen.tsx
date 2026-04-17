import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Race } from "@/types/game";
import { useGameStore } from "@/stores/useGameStore";

export function CalendarScreen() {
  const { races, seasons, advanceDay, skipWeek, nextInterrupt } = useGameStore(
    useShallow((s) => {
      const season = Object.values(s.save.seasons)[0];
      const raceList: Race[] =
        season?.raceIds
          .map((id) => s.save.races[id])
          .filter((r): r is Race => r != null) ?? [];
      return {
        races: raceList,
        seasons: s.save.seasons,
        advanceDay: s.advanceDay,
        skipWeek: s.skipWeek,
        nextInterrupt: s.nextInterrupt,
      };
    }),
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Season calendar</CardTitle>
            <CardDescription>
              Next interrupt: {nextInterrupt ? `${nextInterrupt.date} (${nextInterrupt.type})` : "None"}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => advanceDay(1)}>
              +1 day
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => skipWeek()}>
              +1 week
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {races.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2 text-sm"
            >
              <div>
                <div className="font-medium">Round {r.roundIndex}</div>
                <div className="text-xs text-zinc-500">{r.scheduledDate}</div>
              </div>
              <div className="text-xs text-zinc-400">{r.completed ? "Done" : "Upcoming"}</div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Championship</CardTitle>
          <CardDescription>{Object.keys(seasons).length} season record(s) in save.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
