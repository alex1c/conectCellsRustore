/**
 * Deterministic weighted picks for spawn / initial fill.
 */

import { nextFloat } from './random'
import type { RngState } from './types'

export interface WeightedNumber {
	value?: number
	count?: number
	weight: number
}

/** Pick a numeric `value` field from weighted entries. */
export function pickWeighted (
	rng: RngState,
	entries: readonly { value: number; weight: number }[],
): number {
	let total = 0
	for (const entry of entries) {
		total += entry.weight
	}
	if (total <= 0 || entries.length === 0) {
		return 1
	}
	let roll = nextFloat(rng) * total
	for (const entry of entries) {
		roll -= entry.weight
		if (roll < 0) {
			return entry.value
		}
	}
	return entries[entries.length - 1]?.value ?? 1
}

/** Pick a numeric `count` field from weighted entries. */
export function pickWeightedCount (
	rng: RngState,
	entries: readonly { count: number; weight: number }[],
): number {
	let total = 0
	for (const entry of entries) {
		total += entry.weight
	}
	if (total <= 0 || entries.length === 0) {
		return 1
	}
	let roll = nextFloat(rng) * total
	for (const entry of entries) {
		roll -= entry.weight
		if (roll < 0) {
			return entry.count
		}
	}
	return entries[entries.length - 1]?.count ?? 1
}
