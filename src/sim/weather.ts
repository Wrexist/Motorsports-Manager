import type { Weather } from "@/types/game";

export const SIM_CONSTANTS = {
  stay: 0.92,
  adjacent: 0.04,
} as const;

const order: Weather[] = ["dry", "cloudy", "lightRain", "heavyRain"];

function idx(w: Weather): number {
  if (w === "thunderstorm") return order.indexOf("heavyRain");
  return order.indexOf(w);
}

/** Markov step on dry→heavyRain axis; thunderstorm treated as heavy for transitions. */
export function advanceWeather(
  current: Weather,
  circuitVolatility: number,
  rng: () => number,
): Weather {
  const i = idx(current);
  const r = rng();
  const stay = SIM_CONSTANTS.stay - circuitVolatility * 0.05;
  if (r < stay) {
    return current === "thunderstorm" ? "heavyRain" : current;
  }
  const rem = 1 - stay;
  const left = ((1 - stay) / 2) * (i > 0 ? 1 : 0);
  const right = ((1 - stay) / 2) * (i < order.length - 1 ? 1 : 0);
  const u = rng() * rem;
  if (i > 0 && u < left) return order[i - 1] ?? current;
  if (i < order.length - 1 && u < left + right) return order[i + 1] ?? current;
  return current === "thunderstorm" ? "heavyRain" : current;
}

export function forecast(
  current: Weather,
  lapsAhead: number,
  circuitVolatility: number,
  rng: () => number,
): Weather[] {
  const out: Weather[] = [];
  let w = current;
  const localRng = rng;
  for (let i = 0; i < lapsAhead; i += 1) {
    w = advanceWeather(w, circuitVolatility, localRng);
    out.push(w);
  }
  return out.slice(0, 3);
}
