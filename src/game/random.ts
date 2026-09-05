/**
 * Deterministic Mulberry32 PRNG.
 * Never uses Math.random() so replays and tests stay reproducible.
 */

import type { RngState } from './types'

/** Create RNG state from a numeric seed (any integer; coerced to uint32). */
export function createRng (seed: number): RngState {
	return { s: seed >>> 0 }
}

/** Deep-clone RNG state for immutable updates. */
export function cloneRng (rng: RngState): RngState {
	return { s: rng.s >>> 0 }
}

/**
 * Advance RNG and return the next float in [0, 1).
 * Mutates the provided state object intentionally for internal use;
 * public engine APIs always clone before advancing.
 */
export function nextFloat (rng: RngState): number {
	let t = (rng.s + 0x6d2b79f5) >>> 0
	rng.s = t
	t = Math.imul(t ^ (t >>> 15), t | 1)
	t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** Next integer in [min, max] inclusive. */
export function nextInt (rng: RngState, min: number, max: number): number {
	if (max < min) {
		throw new Error(`nextInt: max (${max}) < min (${min})`)
	}
	const span = max - min + 1
	return min + Math.floor(nextFloat(rng) * span)
}

/** Pick an index in [0, length) uniformly. */
export function nextIndex (rng: RngState, length: number): number {
	if (length <= 0) {
		throw new Error('nextIndex: length must be positive')
	}
	return nextInt(rng, 0, length - 1)
}
