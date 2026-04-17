import { format, parseISO } from "date-fns";
import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RaceResultScreen } from "@/components/game/calendar/RaceResultScreen";
import type { Race, RaceId } from "@/types/game";
import { useGameStore } from "@/stores/useGameStore";

export function CalendarScreen() {
  const [view, setView] = useState<{ kind: "list" } | { kind: "result"; raceId: RaceId }>({ kind: "list" });

  const { races, seasons, raceResults, advanceDay, skipWeek, advanceToNextInterrupt, nextInterrupt, playerTeamId } =
    useGameStore(
      useShallow((s) => {
        const season = Object.values(s.save.seasons)[0];
        const raceList: Race[] =
          season?.raceIds
            .map((id) => s.save.races[id])
            .filter((r): r is Race => r != null) ?? [];
        return {
          races: raceList,
          seasons: s.save.seasons,
          raceResults: s.save.raceResults,
          advanceDay: s.advanceDay,
          skipWeek: s.skipWeek,
          advanceToNextInterrupt: s.advanceToNextInterrupt,
          nextInterrupt: s.nextInterrupt,
          playerTeamId: s.save.playerTeamId,
        };
      }),
    );

  const nextRace = useMemo(
    () => races.filter((r) => !r.completed).sort((a, b) => a.roundIndex - b.roundIndex)[0] ?? null,
    [races],
  );

  const completedCount = useMemo(() => races.filter((r) => r.completed).length, [races]);
  const allDone = races.length > 0 && completedCount === races.length;

  if (view.kind === "result") {
    return <RaceResultScreen raceId={view.raceId} onBack={() => setView({ kind: "list" })} />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Season calendar</CardTitle>
            <CardDescription>
              {allDone
                ? "Season complete — use HQ to confirm or start a new save when available."
                : nextInterrupt
                  ? `Next event: ${formatDateLabel(nextInterrupt.date)} — race weekend`
                  : "No upcoming events on the calendar."}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="default"
              className="min-h-11"
              disabled={!nextInterrupt}
              onClick={() => advanceToNextInterrupt()}
            >
              Jump to next race
            </Button>
            <Button type="button" variant="secondary" className="min-h-11" onClick={() => advanceDay(1)}>
              +1 day
            </Button>
            <Button type="button" variant="secondary" className="min-h-11" onClick={() => skipWeek()}>
              +1 week
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {races.map((r) => {
            const res = r.resultId ? raceResults[r.resultId] : undefined;
            const isPlayerHighlight =
              Boolean(res?.results.some((row) => String(row.teamId) === String(playerTeamId)));
            return (
              <button
                key={r.id}
                type="button"
                disabled={!r.completed}
                onClick={() => {
                  if (r.completed) setView({ kind: "result", raceId: r.id });
                }}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left text-sm transition-colors min-h-12 ${
                  r.completed
                    ? "border-zinc-700 bg-zinc-900/40 hover:bg-zinc-800/60 active:bg-zinc-800"
                    : "border-zinc-800 bg-zinc-950/50 text-zinc-500 cursor-default"
                }`}
              >
                <div>
                  <div className="font-medium text-zinc-100">
                    Round {r.roundIndex}
                    {nextRace && r.id === nextRace.id ? (
                      <span className="ml-2 rounded-full bg-emerald-950 px-2 py-0.5 text-xs text-emerald-300">
                        Next
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-zinc-500">{r.scheduledDate}</div>
                </div>
                <div className="flex flex-col items-end gap-0.5 text-xs">
                  <span className={r.completed ? "text-emerald-400" : "text-zinc-500"}>
                    {r.completed ? "View results" : "Upcoming"}
                  </span>
                  {r.completed && isPlayerHighlight ? (
                    <span className="text-zinc-500">Includes your team</span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Championship</CardTitle>
          <CardDescription>
            {Object.keys(seasons).length} season record(s) in save — {completedCount}/{races.length} rounds complete.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

function formatDateLabel(isoDate: string): string {
  try {
    return format(parseISO(`${isoDate}T12:00:00.000Z`), "MMM d, yyyy");
  } catch {
    return isoDate;
  }
}
