import { LazyMotion, domAnimation } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayerHUD } from "@/components/game/race/PlayerHUD";
import { RaceEvents } from "@/components/game/race/RaceEvents";
import { StandingsTable, type StandingRow } from "@/components/game/race/StandingsTable";
import { TimeControls } from "@/components/game/race/TimeControls";
import { TrackMap } from "@/components/game/race/TrackMap";
import { useRaceLoop } from "@/components/game/race/useRaceLoop";
import { buildRaceState, simulateRace } from "@/sim/race";
import type { DriverLapData, DrivingStyle, EngineMode, PitStopPlan, TireCompound } from "@/types/game";
import { useGameStore } from "@/stores/useGameStore";

function nextRace(save: ReturnType<typeof useGameStore.getState>["save"]) {
  const season = Object.values(save.seasons)[0];
  if (!season) return null;
  const races = season.raceIds
    .map((id) => save.races[id])
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .filter((r) => !r.completed)
    .sort((a, b) => a.roundIndex - b.roundIndex);
  return { season, race: races[0] ?? null };
}

function cumulative(trace: DriverLapData[][], lap: number): Record<string, number> {
  const totals: Record<string, number> = {};
  for (let i = 0; i < Math.min(lap, trace.length); i += 1) {
    const row = trace[i];
    if (!row) continue;
    for (const c of row) {
      totals[c.driverId] = (totals[c.driverId] ?? 0) + c.lapTimeSec;
    }
  }
  return totals;
}

export function RaceScreen() {
  const { save, playerTeamId } = useGameStore(
    useShallow((s) => ({ save: s.save, playerTeamId: s.save.playerTeamId })),
  );

  const sim = useMemo(() => {
    const n = nextRace(save);
    if (!n?.race || !n.season) return null;
    const { race, season } = n;
    const circuit = save.circuits[race.circuitId];
    if (!circuit) return null;
    const driverIds = Object.values(save.drivers)
      .filter((d) => d.teamId != null)
      .map((d) => d.id);
    const { state, contexts } = buildRaceState({
      raceId: race.id,
      circuit,
      regulations: season.regulations,
      weather: race.weatherBySession.race ?? "dry",
      ambientTempC: 28,
      totalLaps: 10,
      rngSeed: save.rngSeed + race.roundIndex * 97,
      driverIds,
      driversById: save.drivers,
      teamsById: save.teams,
      carsById: save.cars,
    });
    const { lapTrace, events } = simulateRace(state, contexts, {});
    return { lapTrace, events, totalLaps: state.totalLaps, raceLabel: circuit.displayName, driverIds };
  }, [save]);

  const [displayedLap, setDisplayedLap] = useState(0);
  const [paused, setPaused] = useState(true);
  const [speed, setSpeed] = useState<0 | 1 | 2 | 5>(1);

  const [styles, setStyles] = useState<Record<string, DrivingStyle>>({});
  const [engines, setEngines] = useState<Record<string, EngineMode>>({});
  const [plans, setPlans] = useState<Record<string, PitStopPlan[]>>({});

  const resetReplay = useCallback(() => {
    setDisplayedLap(0);
    setPaused(true);
    setSpeed(1);
  }, []);

  useEffect(() => {
    resetReplay();
    if (!sim) return;
    const initStyles: Record<string, DrivingStyle> = {};
    const initEngines: Record<string, EngineMode> = {};
    const initPlans: Record<string, { lap: number; compound: TireCompound }[]> = {};
    for (const id of sim.driverIds) {
      initStyles[id] = "standard";
      initEngines[id] = "standard";
      initPlans[id] = [
        { lap: 4, compound: "medium" },
        { lap: 8, compound: "soft" },
      ];
    }
    setStyles(initStyles);
    setEngines(initEngines);
    setPlans(initPlans);
  }, [sim, resetReplay]);

  useRaceLoop({
    enabled: Boolean(sim) && !paused && displayedLap < (sim?.totalLaps ?? 0),
    speed,
    onTick: () => {
      setDisplayedLap((l) => {
        if (!sim) return l;
        return Math.min(sim.totalLaps, l + 1);
      });
    },
  });

  if (!sim) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Race weekend</CardTitle>
          <CardDescription>All races in the current season are complete.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const totals = cumulative(sim.lapTrace, displayedLap);
  const order =
    displayedLap === 0
      ? [...sim.driverIds]
      : Object.keys(totals).sort((a, b) => totals[a]! - totals[b]!);
  const leader = order[0];
  const lastRow = displayedLap > 0 ? sim.lapTrace[displayedLap - 1] : undefined;

  const standings: StandingRow[] = order.map((id, idx) => {
    const d = save.drivers[id];
    const cell = lastRow?.find((c) => c.driverId === id);
    const gap =
      displayedLap === 0
        ? "—"
        : leader && totals[id] != null && totals[leader] != null
          ? `+${(totals[id]! - totals[leader]!).toFixed(2)}s`
          : "—";
    return {
      position: idx + 1,
      name: d?.displayName ?? id,
      gap: idx === 0 ? "—" : gap,
      tire: cell?.tireCompound ?? "—",
      last: cell ? cell.lapTimeSec.toFixed(2) : "—",
      highlight: d?.teamId === playerTeamId,
    };
  });

  const dots = sim.driverIds.map((id) => {
    const d = save.drivers[id];
    const team = d?.teamId ? save.teams[d.teamId] : undefined;
    return { id, color: team?.colorHex ?? "#a1a1aa", label: d?.displayName ?? id };
  });

  const feed = sim.events
    .filter((e) => e.lap <= displayedLap)
    .slice(-5)
    .map((e, i) => ({ id: `${e.lap}-${i}-${e.kind}`, text: e.message }));

  const playerCards = sim.driverIds
    .filter((id) => save.drivers[id]?.teamId != null && String(save.drivers[id]!.teamId) === String(playerTeamId))
    .map((id) => {
      const d = save.drivers[id]!;
      const pos = order.indexOf(id) + 1;
      const cell = lastRow?.find((c) => c.driverId === id);
      return {
        id,
        label: d.displayName,
        position: pos || sim.driverIds.length,
        tireWear: cell?.tireWearPct ?? 0,
        fuelPct: Math.max(0, 100 - displayedLap * 1.6),
        drivingStyle: styles[id] ?? "standard",
        engineMode: engines[id] ?? "standard",
        pitPlan: plans[id] ?? [],
        onStyle: (did: string, s: DrivingStyle) => setStyles((m) => ({ ...m, [did]: s })),
        onEngine: (did: string, mode: EngineMode) => setEngines((prev) => ({ ...prev, [did]: mode })),
        onPitNow: () => {},
        onPlan: (did: string, p: PitStopPlan[]) => setPlans((prev) => ({ ...prev, [did]: p })),
      };
    });

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{sim.raceLabel}</CardTitle>
              <CardDescription>
                Lap {Math.min(displayedLap, sim.totalLaps)} / {sim.totalLaps} — replay (does not advance career until
                you use HQ → Simulate next race)
              </CardDescription>
            </div>
            <TimeControls
              paused={paused}
              speed={speed}
              onPause={() => setPaused(true)}
              onResume={() => setPaused(false)}
              onSpeed={(s) => {
                setSpeed(s);
                setPaused(false);
              }}
            />
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <div className="space-y-4">
              <TrackMap lapFraction={displayedLap / sim.totalLaps} drivers={dots} lastLapRow={lastRow} />
              <StandingsTable rows={standings} />
              <PlayerHUD cards={playerCards} />
            </div>
            <RaceEvents items={feed} />
          </CardContent>
        </Card>
      </div>
    </LazyMotion>
  );
}
