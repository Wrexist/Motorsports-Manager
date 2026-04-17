import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export function RaceEvents({ items }: { items: { id: string; text: string }[] }) {
  const reduce = useReducedMotion();
  const shown = items.slice(-5);
  return (
    <div className="space-y-2 text-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Live feed</div>
      <AnimatePresence initial={false}>
        {shown.map((e) => (
          <motion.div
            key={e.id}
            initial={reduce ? false : { opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-md border border-zinc-800/80 bg-zinc-900/80 px-3 py-2 text-zinc-200"
          >
            {e.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
