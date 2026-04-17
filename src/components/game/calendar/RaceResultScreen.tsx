import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RaceId } from "@/types/game";
import { useGameStore } from "@/stores/useGameStore";

type Props = {
  raceId: RaceId;
  onBack: () => void;
};

export function RaceResultScreen({ raceId, onBack }: Props) {
  const { race, circuit, result, driversById, teamsById } = useGameStore(
    useShallow((s) => {
      const r = s.save.races[String(raceId)];
      const c = r ? s.save.circuits[r.circuitId] : undefined;
      const res = r?.resultId ? s.save.raceResults[r.resultId] : undefined;
      return {
        race: r,
        circuit: c,
        result: res,
        driversById: s.save.drivers,
        teamsById: s.save.teams,
      };
    }),
  );

  if (!race || !circuit) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Race result</CardTitle>
          <CardDescription>This round could not be loaded.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="secondary" onClick={onBack}>
            Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {circuit.displayName} — Round {race.roundIndex}
          </CardTitle>
          <CardDescription>Results are not available yet. Run the race from HQ first.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="secondary" onClick={onBack}>
            Back to calendar
          </Button>
        </CardContent>
      </Card>
    );
  }

  const sorted = [...result.results].sort((a, b) => a.position - b.position);

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>
              {circuit.displayName} — Round {race.roundIndex}
            </CardTitle>
            <CardDescription>{race.scheduledDate}</CardDescription>
          </div>
          <Button type="button" variant="secondary" className="shrink-0 min-h-11" onClick={onBack}>
            Back to calendar
          </Button>
        </div>
        <p className="text-sm text-zinc-300 leading-relaxed">{result.headline}</p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">Pos</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="text-right">Time</TableHead>
              <TableHead className="text-right">Pts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((row) => {
              const d = driversById[row.driverId];
              const t = teamsById[row.teamId];
              return (
                <TableRow key={row.driverId}>
                  <TableCell className="font-mono text-zinc-400">{row.dnf ? "DNF" : row.position}</TableCell>
                  <TableCell className="font-medium">{d?.displayName ?? row.driverId}</TableCell>
                  <TableCell className="text-zinc-400">{t?.displayName ?? row.teamId}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-zinc-300">
                    {row.dnf ? (row.dnfReason ?? "—") : `${row.totalTimeSec.toFixed(2)}s`}
                  </TableCell>
                  <TableCell className="text-right font-mono">{row.points}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
