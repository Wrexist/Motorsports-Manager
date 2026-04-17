import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/format";
import { useGameStore } from "@/stores/useGameStore";

export function FinanceScreen() {
  const { balance, txs, sponsors, team, addSponsorToPlayer } = useGameStore(
    useShallow((s) => {
      const tid = String(s.save.playerTeamId);
      const team = s.save.teams[tid];
      const txs = Object.values(s.save.financialTransactions).sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));
      return {
        balance: team?.finance.balanceCents,
        txs,
        sponsors: Object.values(s.save.sponsors),
        team,
        addSponsorToPlayer: s.addSponsorToPlayer,
      };
    }),
  );

  const income = useMemo(() => txs.filter((t) => Number(t.signedAmountCents) > 0), [txs]);
  const expense = useMemo(() => txs.filter((t) => Number(t.signedAmountCents) < 0), [txs]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Finance dashboard</CardTitle>
          <CardDescription>Balance: {balance != null ? formatMoney(balance) : "—"}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 text-sm">
          <div>
            <div className="font-semibold text-emerald-400 mb-2">Recent credits</div>
            <ul className="space-y-1 text-zinc-400">
              {income.slice(0, 6).map((t) => (
                <li key={t.id} className="flex justify-between gap-2">
                  <span className="truncate">{t.memo}</span>
                  <span className="font-mono text-emerald-300">+{formatMoney(t.signedAmountCents)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-semibold text-rose-400 mb-2">Recent debits</div>
            <ul className="space-y-1 text-zinc-400">
              {expense.slice(0, 6).map((t) => (
                <li key={t.id} className="flex justify-between gap-2">
                  <span className="truncate">{t.memo}</span>
                  <span className="font-mono text-rose-300">{formatMoney(t.signedAmountCents)}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sponsors</CardTitle>
          <CardDescription>Title slots (MVP)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-xs text-zinc-500">Attached: {team?.sponsorIds.length ?? 0}</div>
          {sponsors
            .filter((s) => s.teamId == null)
            .map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 p-3">
                <div>
                  <div className="text-sm font-medium">{s.displayName}</div>
                  <div className="text-xs text-zinc-500">{formatMoney(s.seasonPaymentCents)} / season</div>
                </div>
                <Button type="button" size="sm" onClick={() => addSponsorToPlayer(s.id)}>
                  Sign
                </Button>
              </div>
            ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Memo</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {txs.slice(0, 30).map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="max-w-[200px] truncate">{t.memo}</TableCell>
                  <TableCell className="text-zinc-400">{t.category}</TableCell>
                  <TableCell className="text-right font-mono">{formatMoney(t.signedAmountCents)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
