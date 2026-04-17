import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Driver, DriverId } from "@/types/game";
import { useGameStore } from "@/stores/useGameStore";

export function DriverMarketScreen() {
  const [signMessage, setSignMessage] = useState<string | null>(null);
  const { drivers, teams, playerTeamId, signDriver } = useGameStore(
    useShallow((s) => ({
      drivers: Object.values(s.save.drivers),
      teams: s.save.teams,
      playerTeamId: s.save.playerTeamId,
      signDriver: s.signDriver,
    })),
  );

  const [nat, setNat] = useState("");
  const [minPace, setMinPace] = useState(0);
  const [status, setStatus] = useState<"all" | "free">("all");

  const rows = useMemo(() => {
    return drivers.filter((d) => {
      if (nat && !d.nationality.toLowerCase().includes(nat.toLowerCase())) return false;
      if (Number(d.stats.pace) < minPace) return false;
      if (status === "free" && d.teamId != null) return false;
      return true;
    });
  }, [drivers, nat, minPace, status]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Driver market</CardTitle>
        <CardDescription>Scouting and contracts (MVP)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {signMessage ? (
          <div className="rounded-md border border-amber-900/50 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">
            {signMessage}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <input
            value={nat}
            onChange={(e) => setNat(e.target.value)}
            placeholder="Nationality"
            className="h-9 rounded-md border border-zinc-800 bg-zinc-950 px-2 text-sm"
          />
          <input
            type="number"
            value={minPace}
            onChange={(e) => setMinPace(Number(e.target.value))}
            className="h-9 w-24 rounded-md border border-zinc-800 bg-zinc-950 px-2 text-sm"
            title="Min pace"
          />
          <Button type="button" variant={status === "all" ? "default" : "secondary"} size="sm" onClick={() => setStatus("all")}>
            All
          </Button>
          <Button type="button" variant={status === "free" ? "default" : "secondary"} size="sm" onClick={() => setStatus("free")}>
            Free agents
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Pace</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((d) => (
              <DriverRow
                key={d.id}
                driver={d}
                teams={teams}
                playerTeamId={playerTeamId}
                onSign={(id, terms) => {
                  const res = signDriver(id, terms);
                  if (!res.ok) setSignMessage(res.reason);
                  else setSignMessage("Contract signed.");
                }}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function DriverRow(props: {
  driver: Driver;
  teams: Record<string, { displayName: string }>;
  playerTeamId: string;
  onSign: (
    driverId: DriverId,
    terms: { salaryPerSeasonCents: number; seasons: number; signingBonusCents: number },
  ) => void;
}) {
  const d = props.driver;
  const teamName = d.teamId ? props.teams[String(d.teamId)]?.displayName ?? "—" : "Free agent";
  return (
    <TableRow>
      <TableCell className="font-medium">{d.displayName}</TableCell>
      <TableCell>{d.age}</TableCell>
      <TableCell>{teamName}</TableCell>
      <TableCell>{Number(d.stats.pace)}</TableCell>
      <TableCell>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={d.teamId != null && String(d.teamId) === String(props.playerTeamId)}
            >
              Profile
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{d.displayName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <StatBar label="Pace" v={Number(d.stats.pace)} />
              <StatBar label="Overtaking" v={Number(d.stats.overtaking)} />
              <StatBar label="Defence" v={Number(d.stats.defence)} />
              <StatBar label="Consistency" v={Number(d.stats.consistency)} />
              <StatBar label="Smoothness" v={Number(d.stats.smoothness)} />
            </div>
            {d.teamId == null ? (
              <Button
                type="button"
                className="mt-4 w-full"
                onClick={() => {
                  props.onSign(d.id as DriverId, {
                    salaryPerSeasonCents: 5_000_00,
                    seasons: 2,
                    signingBonusCents: 500_00,
                  });
                }}
              >
                Sign (MVP offer)
              </Button>
            ) : null}
          </DialogContent>
        </Dialog>
      </TableCell>
    </TableRow>
  );
}

function StatBar({ label, v }: { label: string; v: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-zinc-400">
        <span>{label}</span>
        <span>{v}</span>
      </div>
      <Progress value={v} />
    </div>
  );
}
