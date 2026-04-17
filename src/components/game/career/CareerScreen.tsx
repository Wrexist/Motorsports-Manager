import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMoney } from "@/lib/format";
import { CalendarScreen } from "@/components/game/calendar/CalendarScreen";
import { CarDevScreen } from "@/components/game/cardev/CarDevScreen";
import { FinanceScreen } from "@/components/game/finance/FinanceScreen";
import { DriverMarketScreen } from "@/components/game/market/DriverMarketScreen";
import { RaceScreen } from "@/components/game/race/RaceScreen";
import { useGameStore } from "@/stores/useGameStore";

export function CareerScreen() {
  const { teamName, balance, completeNextRace } = useGameStore(
    useShallow((s) => {
      const t = s.save.teams[String(s.save.playerTeamId)];
      return {
        teamName: t?.displayName ?? "Team",
        balance: t?.finance.balanceCents,
        completeNextRace: s.completeNextRace,
      };
    }),
  );

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-50">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">Career</div>
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
            <CardDescription>Simulate the next race weekend and update standings, prizes, and sponsors.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" onClick={() => completeNextRace()}>
              Simulate next race
            </Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="race">
          <TabsList className="w-full flex-wrap h-auto gap-1">
            <TabsTrigger value="race">Race</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="car">Car dev</TabsTrigger>
            <TabsTrigger value="market">Market</TabsTrigger>
            <TabsTrigger value="finance">Finance</TabsTrigger>
          </TabsList>
          <TabsContent value="race">
            <RaceScreen />
          </TabsContent>
          <TabsContent value="calendar">
            <CalendarScreen />
          </TabsContent>
          <TabsContent value="car">
            <CarDevScreen />
          </TabsContent>
          <TabsContent value="market">
            <DriverMarketScreen />
          </TabsContent>
          <TabsContent value="finance">
            <FinanceScreen />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
