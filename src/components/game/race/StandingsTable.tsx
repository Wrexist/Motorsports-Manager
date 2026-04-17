import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type StandingRow = {
  position: number;
  name: string;
  gap: string;
  tire: string;
  last: string;
  highlight: boolean;
};

export function StandingsTable({ rows }: { rows: StandingRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pos</TableHead>
          <TableHead>Driver</TableHead>
          <TableHead>Gap</TableHead>
          <TableHead>Tire</TableHead>
          <TableHead>Last lap</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.position} className={r.highlight ? "bg-emerald-950/30" : undefined}>
            <TableCell className="font-mono">{r.position}</TableCell>
            <TableCell className="font-medium">{r.name}</TableCell>
            <TableCell className="text-zinc-400">{r.gap}</TableCell>
            <TableCell>{r.tire}</TableCell>
            <TableCell className="font-mono text-zinc-300">{r.last}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
