import { useShallow } from "zustand/react/shallow";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGameStore } from "@/stores/useGameStore";

type RowView = {
  pos: number;
  entityId: string;
  label: string;
  points: number;
  wins: number;
  highlight: boolean;
  dotColor?: string;
};

export function StandingsPanel() {
  const { driverRows, constructorRows } = useGameStore(
    useShallow((s) => {
      const season = Object.values(s.save.seasons)[0];
      const ch = season ? s.save.championships[season.championshipId] : undefined;
      const pid = String(s.save.playerTeamId);

      if (!ch) {
        return { driverRows: [] as RowView[], constructorRows: [] as RowView[] };
      }

      const sortedDrivers = [...ch.driverStandings].sort(
        (a, b) => b.points - a.points || b.wins - a.wins || b.podiums - a.podiums,
      );
      const driverRows: RowView[] = sortedDrivers.map((st, i) => {
        const dr = s.save.drivers[st.entityId];
        const teamId = dr?.teamId != null ? String(dr.teamId) : null;
        const team = teamId ? s.save.teams[teamId] : undefined;
        return {
          pos: i + 1,
          entityId: st.entityId,
          label: dr?.displayName ?? st.entityId,
          points: st.points,
          wins: st.wins,
          highlight: teamId === pid,
          dotColor: team?.colorHex,
        };
      });

      const sortedTeams = [...ch.constructorStandings].sort(
        (a, b) => b.points - a.points || b.wins - a.wins || b.podiums - a.podiums,
      );
      const constructorRows: RowView[] = sortedTeams.map((st, i) => {
        const tm = s.save.teams[st.entityId];
        return {
          pos: i + 1,
          entityId: st.entityId,
          label: tm?.displayName ?? st.entityId,
          points: st.points,
          wins: st.wins,
          highlight: String(st.entityId) === pid,
          dotColor: tm?.colorHex,
        };
      });

      return { driverRows, constructorRows };
    }),
  );

  const hasData = driverRows.length > 0;

  if (!hasData) {
    return <p className="text-sm text-zinc-500">No championship data in this save.</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Drivers</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead className="text-right">Pts</TableHead>
              <TableHead className="text-right">W</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {driverRows.map((r) => (
              <TableRow key={r.entityId} className={r.highlight ? "bg-emerald-950/25" : undefined}>
                <TableCell className="font-mono text-zinc-400">{r.pos}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-2">
                    {r.dotColor ? (
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-zinc-700"
                        style={{ backgroundColor: r.dotColor }}
                        aria-hidden
                      />
                    ) : null}
                    <span className={r.highlight ? "font-medium text-emerald-100" : ""}>{r.label}</span>
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono">{r.points}</TableCell>
                <TableCell className="text-right font-mono text-zinc-400">{r.wins}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Constructors</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="text-right">Pts</TableHead>
              <TableHead className="text-right">W</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {constructorRows.map((r) => (
              <TableRow key={r.entityId} className={r.highlight ? "bg-emerald-950/25" : undefined}>
                <TableCell className="font-mono text-zinc-400">{r.pos}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-2">
                    {r.dotColor ? (
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-zinc-700"
                        style={{ backgroundColor: r.dotColor }}
                        aria-hidden
                      />
                    ) : null}
                    <span className={r.highlight ? "font-medium text-emerald-100" : ""}>{r.label}</span>
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono">{r.points}</TableCell>
                <TableCell className="text-right font-mono text-zinc-400">{r.wins}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
