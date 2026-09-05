/**
 * Phase 2.5 rules, spawn, persistence, and deterministic preset tests.
 */

import {
	applyMove,
	cloneGameState,
	createInitialGame,
	gameStatesEqual,
	getLegalMoves,
	getRulesForPreset,
	pickSpawnValue,
	RULE_PRESET_IDS,
	serializeGame,
	undo,
	type RulePresetId,
} from '../index'
import { createRng, nextFloat } from '../random'
import {
	buildSavedGamePayload,
	deserializeSavedGamePayload,
} from '../../storage/savedGame'
import { SAVE_SCHEMA_VERSION } from '../constants'
import { playGame } from '../benchmark/autoplay'

describe('rule presets', () => {
	it('exposes the required preset ids', () => {
		expect(RULE_PRESET_IDS).toEqual(
			expect.arrayContaining([
				'baseline',
				'largerBoard',
				'sparseSpawn',
				'largerSparse',
				'weightedSpawn',
				'softStart',
			]),
		)
	})

	it('each preset is deterministic for the same seed', () => {
		for (const id of RULE_PRESET_IDS) {
			const a = createInitialGame(4242, id)
			const b = createInitialGame(4242, id)
			expect(gameStatesEqual(a, b)).toBe(true)
			expect(a.rulesetId).toBe(id)
			expect(a.rules.boardSize).toBe(getRulesForPreset(id).boardSize)
		}
	})

	it('different presets usually diverge for the same seed', () => {
		const baseline = createInitialGame(55, 'baseline')
		const larger = createInitialGame(55, 'largerBoard')
		expect(baseline.board.length).toBe(5)
		expect(larger.board.length).toBe(6)
		expect(JSON.stringify(baseline.board)).not.toBe(JSON.stringify(larger.board))
	})
})

describe('sparse and weighted spawn', () => {
	it('sparse spawn can skip spawn while still advancing RNG', () => {
		const state = createInitialGame(9, 'sparseSpawn')
		const move = getLegalMoves(state)[0]
		expect(move).toBeDefined()
		if (!move) {
			return
		}
		const beforeRng = state.rng.s
		const result = applyMove(state, move)
		expect(result.ok).toBe(true)
		expect(result.state.rng.s).not.toBe(beforeRng)
		// Replay must match exactly (probability roll included).
		const again = applyMove(cloneGameState(state), move)
		expect(gameStatesEqual(result.state, again.state)).toBe(true)
		expect(JSON.stringify(result.events)).toBe(JSON.stringify(again.events))
	})

	it('weighted spawn only yields configured values', () => {
		const rules = getRulesForPreset('weightedSpawn')
		const allowed = new Set(rules.spawnWeights.map((w) => w.value))
		const rng = createRng(123)
		for (let i = 0; i < 200; i += 1) {
			const value = pickSpawnValue(rng, rules)
			expect(allowed.has(value)).toBe(true)
		}
	})

	it('spawn probability uses deterministic floats in [0,1)', () => {
		const rng = createRng(7)
		for (let i = 0; i < 20; i += 1) {
			const value = nextFloat(rng)
			expect(value).toBeGreaterThanOrEqual(0)
			expect(value).toBeLessThan(1)
		}
	})
})

describe('undo + persistence keep ruleset', () => {
	it('undo restores RNG and ruleset id', () => {
		const initial = createInitialGame(404, 'largerSparse')
		const move = getLegalMoves(initial)[0]
		expect(move).toBeDefined()
		if (!move) {
			return
		}
		const after = applyMove(initial, move)
		expect(after.ok).toBe(true)
		const restored = undo(after.state)
		expect(restored.rulesetId).toBe('largerSparse')
		expect(restored.rng.s).toBe(initial.rng.s)
		expect(JSON.stringify(restored.rules)).toBe(JSON.stringify(initial.rules))
		expect(gameStatesEqual(restored, initial)).toBe(true)
	})

	it('persistence payload version 2 stores ruleset', () => {
		const game = createInitialGame(12, 'weightedSpawn')
		const json = JSON.stringify(buildSavedGamePayload(game, 100))
		const restored = deserializeSavedGamePayload(json)
		expect(SAVE_SCHEMA_VERSION).toBe(2)
		expect(restored).not.toBeNull()
		expect(restored?.game.rulesetId).toBe('weightedSpawn')
		expect(restored?.game.rules.spawnWeights.length).toBeGreaterThan(0)
	})

	it('rejects version 1 / missing rules payloads', () => {
		const game = createInitialGame(1, 'baseline')
		const legacy = {
			version: 1,
			game: JSON.parse(serializeGame(game)),
		}
		expect(deserializeSavedGamePayload(JSON.stringify(legacy))).toBeNull()
	})
})

describe('autoplay helper', () => {
	it('does not mutate states and stays deterministic', () => {
		const a = playGame(2001, 'baseline', 'firstLegal', 80)
		const b = playGame(2001, 'baseline', 'firstLegal', 80)
		expect(a).toEqual(b)
		expect(a.moves).toBeGreaterThan(0)
	})
})

describe('preset smoke matrix', () => {
	it('plays a short run on every preset × policy', () => {
		const policies = [
			'firstLegal',
			'randomLegal',
			'greedyScore',
			'mobility',
		] as const
		for (const preset of RULE_PRESET_IDS as RulePresetId[]) {
			for (const policy of policies) {
				const metrics = playGame(3003, preset, policy, 40)
				expect(metrics.moves).toBeGreaterThanOrEqual(0)
				expect(Number.isFinite(metrics.finalScore)).toBe(true)
			}
		}
	})
})
