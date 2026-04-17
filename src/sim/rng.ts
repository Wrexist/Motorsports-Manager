export const SIM_CONSTANTS = {} as const;

/** Mulberry32 PRNG factory — deterministic for a given seed. */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Derive independent seeds from a base seed + salt string. */
export function splitmix32(seed: number): (salt: string) => number {
  return (salt: string) => {
    let h = seed >>> 0;
    for (let i = 0; i < salt.length; i += 1) {
      h = Math.imul(h ^ salt.charCodeAt(i), 0x9e3779b9);
    }
    h >>>= 0;
    return h === 0 ? 1 : h;
  };
}

/** Box–Muller Gaussian with mean 0 (stateless; safe across parallel sims). */
export function gaussianNoise(rng: () => number, sigma: number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  const mag = Math.sqrt(-2.0 * Math.log(u));
  const z0 = mag * Math.cos(2 * Math.PI * v);
  return z0 * sigma;
}
