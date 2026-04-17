import { Progress } from "@/components/ui/progress";
import { StrategyPanel } from "@/components/game/race/StrategyPanel";
import type { DrivingStyle, EngineMode, TireCompound } from "@/types/game";

export function PlayerHUD(props: {
  cards: {
    id: string;
    label: string;
    position: number;
    tireWear: number;
    fuelPct: number;
    drivingStyle: DrivingStyle;
    engineMode: EngineMode;
    pitPlan: { lap: number; compound: TireCompound }[];
    onStyle: (id: string, s: DrivingStyle) => void;
    onEngine: (id: string, m: EngineMode) => void;
    onPitNow: (id: string) => void;
    onPlan: (id: string, plan: { lap: number; compound: TireCompound }[]) => void;
  }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {props.cards.map((c) => (
        <div
          key={c.id}
          className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold">{c.label}</div>
              <div className="text-xs text-zinc-500">P{c.position}</div>
            </div>
            <StrategyPanel
              driverLabel={c.label}
              drivingStyle={c.drivingStyle}
              engineMode={c.engineMode}
              pitPlan={c.pitPlan}
              onStyle={(s) => {
                c.onStyle(c.id, s);
              }}
              onEngine={(m) => {
                c.onEngine(c.id, m);
              }}
              onPitNow={() => {
                c.onPitNow(c.id);
              }}
              onPlanChange={(p) => {
                c.onPlan(c.id, p);
              }}
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Tire wear</span>
              <span>{Math.round(c.tireWear)}%</span>
            </div>
            <Progress value={c.tireWear} />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Fuel</span>
              <span>{Math.round(c.fuelPct)}%</span>
            </div>
            <Progress value={c.fuelPct} />
          </div>
          <div className="text-xs text-zinc-500">
            {c.drivingStyle} / {c.engineMode}
          </div>
        </div>
      ))}
    </div>
  );
}
