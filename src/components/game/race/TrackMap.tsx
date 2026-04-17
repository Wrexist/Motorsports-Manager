import { motion, useReducedMotion } from "framer-motion";
import type { DriverLapData } from "@/types/game";

const PATH =
  "M 60,200 C 60,80 240,80 240,200 S 420,320 420,200 S 240,80 60,200 Z";

export function TrackMap(props: {
  lapFraction: number;
  drivers: { id: string; color: string; label: string }[];
  lastLapRow: DriverLapData[] | undefined;
}) {
  const reduce = useReducedMotion();
  const frac = Math.min(1, Math.max(0, props.lapFraction));

  return (
    <svg viewBox="0 0 480 360" className="w-full max-w-md mx-auto text-zinc-700">
      <path d={PATH} fill="none" stroke="currentColor" strokeWidth="10" strokeLinejoin="round" />
      {props.drivers.map((d, i) => {
        const row = props.lastLapRow?.find((r) => r.driverId === d.id);
        const jitter = (i * 17) % 40;
        const t = Math.min(0.999, frac + jitter / 1000);
        const pt = pointOnPathApprox(t);
        return (
          <motion.g
            key={d.id}
            layoutId={`dot-${d.id}`}
            style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}
            animate={
              reduce
                ? { x: pt.x - 8, y: pt.y - 8 }
                : { x: pt.x - 8, y: pt.y - 8, opacity: [0.85, 1] }
            }
            transition={{ duration: 0.35 }}
          >
            <circle r={8} fill={d.color} cx={8} cy={8}>
              <title>{row ? `${d.label} ${row.lapTimeSec.toFixed(2)}s` : d.label}</title>
            </circle>
          </motion.g>
        );
      })}
    </svg>
  );
}

/** Cheap approximate position along simplified loop for MVP visuals. */
function pointOnPathApprox(t: number): { x: number; y: number } {
  const a = t * Math.PI * 2;
  return { x: 240 + 170 * Math.cos(a), y: 200 + 110 * Math.sin(a * 1.1) };
}
