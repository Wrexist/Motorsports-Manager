import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { DrivingStyle, EngineMode, TireCompound } from "@/types/game";

function haptic() {
  void import("@capacitor/haptics")
    .then(({ Haptics, ImpactStyle }) => Haptics.impact({ style: ImpactStyle.Light }))
    .catch(() => {});
}

export function StrategyPanel(props: {
  driverLabel: string;
  drivingStyle: DrivingStyle;
  engineMode: EngineMode;
  pitPlan: { lap: number; compound: TireCompound }[];
  onStyle: (s: DrivingStyle) => void;
  onEngine: (m: EngineMode) => void;
  onPitNow: () => void;
  onPlanChange: (plan: { lap: number; compound: TireCompound }[]) => void;
}) {
  const styles: DrivingStyle[] = ["conserve", "standard", "push", "attack"];
  const engines: EngineMode[] = ["cool", "standard", "push"];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Strategy — {props.driverLabel}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <div className="space-y-6 pb-8">
          <div>
            <div className="text-sm font-semibold text-zinc-300">Driving style</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {styles.map((s) => (
                <Button
                  key={s}
                  type="button"
                  size="sm"
                  variant={props.drivingStyle === s ? "default" : "secondary"}
                  onClick={() => {
                    haptic();
                    props.onStyle(s);
                  }}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-300">Engine mode</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {engines.map((m) => (
                <Button
                  key={m}
                  type="button"
                  size="sm"
                  variant={props.engineMode === m ? "default" : "secondary"}
                  onClick={() => {
                    haptic();
                    props.onEngine(m);
                  }}
                >
                  {m}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-300">Pit plan</div>
            <ul className="mt-2 space-y-2 text-sm text-zinc-400">
              {props.pitPlan.map((p, idx) => (
                <li key={`${p.lap}-${idx}`} className="flex items-center justify-between gap-2">
                  <span>
                    Lap {p.lap} — {p.compound}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      haptic();
                      const next = props.pitPlan.filter((_, i) => i !== idx);
                      props.onPlanChange(next);
                    }}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              className="mt-3"
              variant="secondary"
              size="sm"
              onClick={() => {
                haptic();
                props.onPlanChange([...props.pitPlan, { lap: props.pitPlan.length + 5, compound: "medium" }]);
              }}
            >
              Add stop
            </Button>
          </div>
          <Button
            type="button"
            onClick={() => {
              haptic();
              props.onPitNow();
            }}
          >
            Pit next opportunity
          </Button>
          <SheetClose asChild>
            <Button type="button" variant="ghost" className="w-full">
              Close
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
