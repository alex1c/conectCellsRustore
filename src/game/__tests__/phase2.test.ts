/**
 * Phase 2 persistence, fixtures, and restore-related unit tests.
 */

import {
	applyMove,
	canUndo,
	createFreshSeed,
	createInitialGame,
	FIXTURE_IDS,
	getLegalMoves,
	isGameOver,
	isValidGameState,
	loadFixture,
	undo,
} from '../index'
import { parseBestScore, resolveBestScore } from '../../storage/bestScore'
import {
	buildSavedGamePayload,
	deserializeSavedGamePayload,
	parseSavedGamePayload,
	serializeSavedGamePayload,
} from '../../storage/savedGame'
import { SAVE_SCHEMA_VERSION } from '../constants'

describe('saved game persistence helpers', () => {
	it('round-trips a playing game through versioned payload', () => {
		const game = createInitialGame(42)
		const payload = buildSavedGamePayload(game, 1_700_000_000_000)
		const json = serializeSavedGamePayload(payload)
		const restored = deserializeSavedGamePayload(json)
		expect(restored).not.toBeNull()
		expect(restored?.version).toBe(SAVE_SCHEMA_VERSION)
		expect(restored?.startedAt).toBe(1_700_000_000_000)
		expect(isValidGameState(restored?.game)).toBe(true)
		expect(restored?.game.seed).toBe(42)
		expect(JSON.stringify(restored?.game.board)).toBe(JSON.stringify(game.board))
	})

	it('preserves undo snapshot across serialize/restore', () => {
		const initial = createInitialGame(77)
		const move = getLegalMoves(initial)[0]
		expect(move).toBeDefined()
		if (!move) {
			return
		}
		const after = applyMove(initial, move)
		expect(after.ok).toBe(true)
		expect(canUndo(after.state)).toBe(true)

		const json = serializeSavedGamePayload(
			buildSavedGamePayload(after.state, Date.now()),
		)
		const restored = deserializeSavedGamePayload(json)
		expect(restored).not.toBeNull()
		if (!restored) {
			return
		}
		expect(canUndo(restored.game)).toBe(true)
		const undone = undo(restored.game)
		expect(undone.score).toBe(initial.score)
		expect(JSON.stringify(undone.board)).toBe(JSON.stringify(initial.board))
		expect(undone.rng.s).toBe(initial.rng.s)
	})

	it('returns null for invalid / unsupported payloads', () => {
		expect(deserializeSavedGamePayload('{')).toBeNull()
		expect(deserializeSavedGamePayload('null')).toBeNull()
		expect(deserializeSavedGamePayload('"x"')).toBeNull()
		expect(
			parseSavedGamePayload({
				version: 999,
				game: createInitialGame(1),
			}),
		).toBeNull()
		expect(
			parseSavedGamePayload({
				version: SAVE_SCHEMA_VERSION,
				game: { broken: true },
			}),
		).toBeNull()
		expect(
			parseSavedGamePayload({
				version: SAVE_SCHEMA_VERSION,
				game: {
					...createInitialGame(1),
					score: -5,
				},
			}),
		).toBeNull()
	})
})

describe('best score helpers', () => {
	it('parses and resolves best scores safely', () => {
		expect(parseBestScore(120)).toBe(120)
		expect(parseBestScore('340')).toBe(340)
		expect(parseBestScore('nope')).toBe(0)
		expect(parseBestScore(-2)).toBe(0)
		expect(parseBestScore(null)).toBe(0)
		expect(resolveBestScore(100, 250)).toBe(250)
		expect(resolveBestScore(400, 120)).toBe(400)
	})
})

describe('fixtures', () => {
	it('every fixture builds a valid GameState', () => {
		for (const id of FIXTURE_IDS) {
			const state = loadFixture(id)
			expect(isValidGameState(state)).toBe(true)
		expect(state.board).toHaveLength(state.rules.boardSize)
		expect(state.board[0]).toHaveLength(state.rules.boardSize)
		}
	})

	it('gameOver fixture has no legal moves and isGameOver', () => {
		const state = loadFixture('gameOver')
		expect(getLegalMoves(state)).toHaveLength(0)
		expect(isGameOver(state)).toBe(true)
	})

	it('simpleMerge / chain fixtures expose at least one legal move', () => {
		expect(getLegalMoves(loadFixture('simpleMerge')).length).toBeGreaterThan(0)
		expect(getLegalMoves(loadFixture('chain2')).length).toBeGreaterThan(0)
		expect(getLegalMoves(loadFixture('chain3')).length).toBeGreaterThan(0)
		expect(getLegalMoves(loadFixture('bigChain')).length).toBeGreaterThan(0)
	})

	it('nearGameOver has exactly one undirected equal pair', () => {
		const moves = getLegalMoves(loadFixture('nearGameOver'))
		// Two ordered orientations of the same pair.
		expect(moves.length).toBe(2)
	})
})

describe('fresh seed helper', () => {
	it('returns an unsigned 32-bit integer', () => {
		const seed = createFreshSeed()
		expect(Number.isInteger(seed)).toBe(true)
		expect(seed).toBeGreaterThanOrEqual(0)
		expect(seed).toBeLessThanOrEqual(0xffffffff)
	})
})

describe('game over modal condition', () => {
	it('is driven by engine status, not UI heuristics', () => {
		const over = loadFixture('gameOver')
		const playing = loadFixture('balancedBoard')
		expect(isGameOver(over)).toBe(true)
		expect(isGameOver(playing)).toBe(false)
	})
})
