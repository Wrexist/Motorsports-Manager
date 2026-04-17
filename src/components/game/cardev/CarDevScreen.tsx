import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMoney } from "@/lib/format";
import { CAR_DEV_CONSTANTS } from "@/sim/carDevConstants";
import type { PartSlot } from "@/types/game";
import { makeMoney } from "@/types/game";
import { useGameStore } from "@/stores/useGameStore";

const SLOTS: PartSlot[] = ["engine", "aero", "chassis", "brakes", "gearbox", "suspension", "frontWing", "rearWing"];

export function CarDevScreen() {
  const { upgrades, parts, balance } = useGameStore(
    useShallow((s) => ({
      upgrades: Object.values(s.save.upgrades).filter((u) => !u.cancelled),
      parts: Object.values(s.save.parts),
      balance: s.save.teams[String(s.save.playerTeamId)]?.finance.balanceCents,
    })),
  );

  const [localNext, setLocalNext] = useState(60);

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="w-full flex-wrap h-auto gap-1">
        <TabsTrigger value="overview">Current car</TabsTrigger>
        <TabsTrigger value="randd">R&amp;D</TabsTrigger>
        <TabsTrigger value="factory">Parts factory</TabsTrigger>
        <TabsTrigger value="next">Next year</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Chassis overview</CardTitle>
            <CardDescription>Tap a slot to focus R&amp;D (MVP: use R&amp;D tab).</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {SLOTS.map((slot) => (
              <Button key={slot} type="button" variant="outline" className="justify-start">
                {slot}
              </Button>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="randd">
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Linear R&amp;D</CardTitle>
            <CardDescription>Balance: {balance != null ? formatMoney(balance) : "—"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(["engine", "aero"] as const).map((slot) => (
              <div key={slot} className="rounded-lg border border-zinc-800 p-3 space-y-2">
                <div className="text-sm font-semibold capitalize">{slot}</div>
                <div className="grid gap-2 sm:grid-cols-4">
                  {[1, 2, 3, 4].map((tier) => (
                    <div key={tier} className="rounded-md border border-zinc-800/80 p-2 text-xs space-y-2">
                      <div>Tier {tier}</div>
                      <div className="text-zinc-400">
                        {formatMoney(makeMoney(Number(CAR_DEV_CONSTANTS.tierCostsCents[tier - 1] ?? 0)))} /{" "}
                        {CAR_DEV_CONSTANTS.tierWeeks[tier - 1] ?? "?"} wks
                      </div>
                      <Button type="button" size="sm" className="w-full" onClick={() => useGameStore.getState().startUpgrade(slot, tier)}>
                        Start
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="factory">
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Factory queue</CardTitle>
            <CardDescription>Active upgrades</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upgrades.length === 0 ? (
              <p className="text-sm text-zinc-400">No upgrades in progress.</p>
            ) : (
              upgrades.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 p-3">
                  <div>
                    <div className="text-sm font-medium capitalize">
                      {u.slot} tier {u.tier}
                    </div>
                    <div className="text-xs text-zinc-500">{u.weeksRemaining} weeks left</div>
                    <Progress value={100 - u.weeksRemaining * 15} />
                  </div>
                  <Button type="button" variant="secondary" size="sm" onClick={() => useGameStore.getState().cancelUpgrade(u.id)}>
                    Cancel (50%)
                  </Button>
                </div>
              ))
            )}
            <div className="text-xs text-zinc-500">Parts inventory: {parts.length} items</div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="next">
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Next year&apos;s car</CardTitle>
            <CardDescription>Allocate factory attention between this season and next.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              type="range"
              min={0}
              max={100}
              value={localNext}
              onChange={(e) => setLocalNext(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="text-sm text-zinc-400">This season: {100 - localNext}% / Next year: {localNext}%</div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
