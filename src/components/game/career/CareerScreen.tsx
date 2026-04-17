import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarScreen } from "@/components/game/calendar/CalendarScreen";
import { CarDevScreen } from "@/components/game/cardev/CarDevScreen";
import { FinanceScreen } from "@/components/game/finance/FinanceScreen";
import { DriverMarketScreen } from "@/components/game/market/DriverMarketScreen";
import { RaceScreen } from "@/components/game/race/RaceScreen";
import { formatMoney } from "@/lib/format";
import type { Race } from "@/types/game";
import { useGameStore } from "@/stores/useGameStore";

export function CareerScreen() {
  const [activeTab, setActiveTab] = useState("hq");

  const {
    teamName,
    balance,
    completeNextRace,
    nextInterrupt,
    nextRace,
    nextCircuitName,
    completedRounds,
    totalRounds,
    seasonComplete,
  } = useGameStore(
    useShallow((s) => {
      const t = s.save.teams[String(s.save.playerTeamId)];
      const season = Object.values(s.save.seasons)[0];
      const raceList: Race[] =
        season?.raceIds
          .map((id) => s.save.races[id])
          .filter((r): r is Race => Boolean(r)) ?? [];
      const incomplete = raceList.filter((r) => !r.completed).sort((a, b) => a.roundIndex - b.roundIndex);
      const next = incomplete[0] ?? null;
      const completed = raceList.filter((r) => r.completed).length;
      const circuitName = next ? s.save.circuits[next.circuitId]?.displayName ?? null : null;
      return {
        teamName: t?.displayName ?? "Team",
        balance: t?.finance.balanceCents,
        completeNextRace: s.completeNextRace,
        nextInterrupt: s.nextInterrupt,
        nextRace: next,
        nextCircuitName: circuitName,
        completedRounds: completed,
        totalRounds: raceList.length,
        seasonComplete: raceList.length > 0 && incomplete.length === 0,
      };
    }),
  );

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-50 pb-24">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">Open-wheel career</div>
            <div className="text-lg font-semibold leading-tight">{teamName}</div>
          </div>
          <div className="text-right text-sm">
            <div className="text-zinc-500">Balance</div>
            <div className="font-mono text-emerald-400">{balance != null ? formatMoney(balance) : "—"}</div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Card className="mb-6 border-emerald-900/40 bg-emerald-950/10">
          <CardHeader>
            <CardTitle className="text-base">HQ</CardTitle>
            <CardDescription>
              {seasonComplete
                ? "Every round in the calendar is complete. Start a new season when the game adds season rollover."
                : nextInterrupt && nextRace
                  ? `Next: Round ${nextRace.roundIndex}${nextCircuitName ? ` — ${nextCircuitName}` : ""} (${nextInterrupt.date}). Simulate to score points and update the championship.`
                  : nextInterrupt
                    ? `Next event: ${nextInterrupt.date}.`
                    : "No race scheduled — check your save data if this looks wrong."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 w-full sm:w-auto"
              disabled={seasonComplete}
              onClick={() => {
                setActiveTab("race");
              }}
            >
              Open race replay
            </Button>
            <Button
              type="button"
              className="min-h-11 w-full sm:w-auto"
              disabled={seasonComplete}
              onClick={() => {
                completeNextRace();
                setActiveTab("calendar");
              }}
            >
              Simulate next race
            </Button>
          </CardContent>
          {!seasonComplete ? (
            <CardContent className="border-t border-zinc-800/80 pt-4 text-xs text-zinc-500">
              Progress: {completedRounds} / {totalRounds} rounds complete
            </CardContent>
          ) : null}
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex h-auto w-full flex-wrap gap-1 p-1">
            <TabsTrigger value="hq" className="min-h-11 flex-1 sm:flex-none">
              HQ
            </TabsTrigger>
            <TabsTrigger value="race" className="min-h-11 flex-1 sm:flex-none">
              Race
            </TabsTrigger>
            <TabsTrigger value="calendar" className="min-h-11 flex-1 sm:flex-none">
              Calendar
            </TabsTrigger>
            <TabsTrigger value="car" className="min-h-11 flex-1 sm:flex-none">
              Car dev
            </TabsTrigger>
            <TabsTrigger value="market" className="min-h-11 flex-1 sm:flex-none">
              Market
            </TabsTrigger>
            <TabsTrigger value="finance" className="min-h-11 flex-1 sm:flex-none">
              Finance
            </TabsTrigger>
          </TabsList>
          <TabsContent value="hq" className="mt-4 space-y-3 text-sm text-zinc-400">
            <p>
              Use <span className="text-zinc-200">Simulate next race</span> to run the next round and update standings
              and finances. The <span className="text-zinc-200">Race</span> tab is a lap-by-lap replay for the upcoming
              round (your strategy choices are preview-only until the sim supports live race control).
            </p>
          </TabsContent>
          <TabsContent value="race" className="mt-4">
            <RaceScreen />
          </TabsContent>
          <TabsContent value="calendar" className="mt-4">
            <CalendarScreen />
          </TabsContent>
          <TabsContent value="car" className="mt-4">
            <CarDevScreen />
          </TabsContent>
          <TabsContent value="market" className="mt-4">
            <DriverMarketScreen />
          </TabsContent>
          <TabsContent value="finance" className="mt-4">
            <FinanceScreen />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
