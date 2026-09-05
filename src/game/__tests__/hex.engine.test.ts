/**
 * Hex engine unit tests — pathfinding, merge, cascade, spawn, persistence.
 */

import {
	applyMove,
	BOARD_COLS,
	BOARD_ROWS,
	canUndo,
	createFreshSeed,
	createInitialGame,
	FIXTURE_IDS,
	findPath,
	gameStatesEqual,
	getCell,
	getReachableFrom,
	hasLegalMoves,
	isGameOver,
	isValidGameState,
	loadFixture,
	MERGE_RESULT_FACTOR,
	SAVE_SCHEMA_VERSION,
	undo,
	type Move,
} from '../index'
import {
	buildSavedGamePayload,
	deserializeSavedGamePayload,
} from '../../storage/savedGame'
import { createEmptyHexBoard } from '../createGame'
import { setCell } from '../board'

function move (fromRow: number, fromCol: number, toRow: number, toCol: number): Move {
	return {
		from: { row: fromRow, col: fromCol },
		to: { row: toRow, col: toCol },
	}
}

describe('initial hex game', () => {
	it('creates a 6x8 board with deterministic seed', () => {
		const a = createInitialGame(42)
		const b = createInitialGame(42)
		expect(a.board).toHaveLength(BOARD_ROWS)
		expect(a.board[0]).toHaveLength(BOARD_COLS)
		expect(gameStatesEqual(a, b)).toBe(true)
		expect(a.rules.mergeThreshold).toBe(4)
		expect(a.rules.mergeResultFactor).toBe(MERGE_RESULT_FACTOR)
	})

	it('different seeds usually differ', () => {
		const a = createInitialGame(1)
		const b = createInitialGame(2)
		expect(JSON.stringify(a.board)).not.toBe(JSON.stringify(b.board))
	})
})

describe('pathfinding', () => {
	it('allows move into neighboring empty hex', () => {
		const state = loadFixture('simpleMove')
		const from = { row: 3, col: 2 }
		const reachable = getReachableFrom(
			state.board,
			from,
			BOARD_COLS,
			BOARD_ROWS,
		)
		expect(reachable.length).toBeGreaterThan(0)
		const to = reachable[0]!
		const path = findPath(state.board, from, to, BOARD_COLS, BOARD_ROWS)
		expect(path.reachable).toBe(true)
		const result = applyMove(state, { from, to })
		expect(result.ok).toBe(true)
		expect(getCell(result.state.board, from)).toBeNull()
		expect(getCell(result.state.board, to)).toBe(1)
	})

	it('supports long empty paths', () => {
		const state = loadFixture('longPath')
		const from = { row: 0, col: 0 }
		const to = { row: 7, col: 4 }
		const path = findPath(state.board, from, to, BOARD_COLS, BOARD_ROWS)
		expect(path.reachable).toBe(true)
		expect(path.path.length).toBeGreaterThan(3)
	})

	it('rejects blocked destinations', () => {
		const state = loadFixture('blockedPath')
		const result = applyMove(state, move(2, 1, 2, 4))
		expect(result.ok).toBe(false)
		expect(result.reason).toBe('blocked')
	})
})

describe('merge formulas', () => {
	it('merges four 1s into 4 and scores value*size', () => {
		const state = loadFixture('merge4')
		// Any legal move triggers resolution of the existing group of four 1s.
		const from = { row: 0, col: 0 }
		const reachable = getReachableFrom(
			state.board,
			from,
			BOARD_COLS,
			BOARD_ROWS,
		)
		expect(reachable.length).toBeGreaterThan(0)
		const result = applyMove(state, { from, to: reachable[0]! })
		expect(result.ok).toBe(true)
		const merge = result.events.find((e) => e.type === 'MERGE')
		expect(merge).toBeDefined()
		if (merge && merge.type === 'MERGE') {
			expect(merge.value).toBe(1)
			expect(merge.resultValue).toBe(4)
			expect(merge.groupSize).toBe(4)
			expect(merge.scoreGain).toBe(4)
		}
	})

	it('4x2 becomes 8', () => {
		const state = loadFixture('mergeTo8')
		const from = { row: 0, col: 5 }
		const reachable = getReachableFrom(
			state.board,
			from,
			BOARD_COLS,
			BOARD_ROWS,
		)
		// Move the remote 2 into the trio to form four 2s.
		const to = { row: 4, col: 3 }
		const path = findPath(state.board, from, to, BOARD_COLS, BOARD_ROWS)
		expect(path.reachable).toBe(true)
		const result = applyMove(state, { from, to })
		expect(result.ok).toBe(true)
		const merge = result.events.find((e) => e.type === 'MERGE')
		expect(merge && merge.type === 'MERGE' && merge.resultValue).toBe(8)
		void reachable
	})

	it('4x4 becomes 16', () => {
		const state = loadFixture('mergeTo16')
		const from = { row: 1, col: 0 }
		const to = { row: 4, col: 3 }
		const path = findPath(state.board, from, to, BOARD_COLS, BOARD_ROWS)
		expect(path.reachable).toBe(true)
		const result = applyMove(state, { from, to })
		expect(result.ok).toBe(true)
		const merge = result.events.find((e) => e.type === 'MERGE')
		expect(merge && merge.type === 'MERGE' && merge.resultValue).toBe(16)
	})
})

describe('cascade and spawn rules', () => {
	it('can produce multi-step cascades', () => {
		const state = loadFixture('cascade2')
		const from = { row: 0, col: 0 }
		const to = { row: 4, col: 2 }
		const path = findPath(state.board, from, to, BOARD_COLS, BOARD_ROWS)
		expect(path.reachable).toBe(true)
		const result = applyMove(state, { from, to })
		expect(result.ok).toBe(true)
		const merges = result.events.filter((e) => e.type === 'MERGE')
		expect(merges.length).toBeGreaterThanOrEqual(2)
	})

	it('spawns only when the turn had no merge', () => {
		const spawnState = loadFixture('noMergeSpawn')
		const origin = { row: 3, col: 2 }
		const reachable = getReachableFrom(
			spawnState.board,
			origin,
			BOARD_COLS,
			BOARD_ROWS,
		)
		const to = reachable[0]!
		const result = applyMove(spawnState, { from: origin, to })
		expect(result.ok).toBe(true)
		expect(result.events.some((e) => e.type === 'MERGE')).toBe(false)
		expect(result.events.some((e) => e.type === 'SPAWN')).toBe(true)
		const spawn = result.events.find((e) => e.type === 'SPAWN')
		if (spawn && spawn.type === 'SPAWN') {
			expect(spawn.cells.length).toBeGreaterThanOrEqual(1)
			expect(spawn.cells.length).toBeLessThanOrEqual(3)
			for (const cell of spawn.cells) {
				expect([1, 2]).toContain(cell.value)
			}
		}
	})

	it('does not spawn on a merge turn', () => {
		const state = loadFixture('merge4')
		const origin = { row: 0, col: 0 }
		const to = getReachableFrom(
			state.board,
			origin,
			BOARD_COLS,
			BOARD_ROWS,
		)[0]!
		const result = applyMove(state, { from: origin, to })
		expect(result.events.some((e) => e.type === 'MERGE')).toBe(true)
		expect(result.events.some((e) => e.type === 'SPAWN')).toBe(false)
	})
})

describe('game over', () => {
	it('is false when legal movement exists', () => {
		const state = loadFixture('balancedBoard')
		expect(hasLegalMoves(state.board, BOARD_COLS, BOARD_ROWS)).toBe(true)
		expect(isGameOver(state)).toBe(false)
	})

	it('is true on a completely full blocked board', () => {
		const state = loadFixture('gameOver')
		expect(hasLegalMoves(state.board, BOARD_COLS, BOARD_ROWS)).toBe(false)
		expect(isGameOver(state)).toBe(true)
	})

	it('does not use merge availability as game-over definition', () => {
		// Board with no mergeable group of 4 but with free movement stays playing.
		const state = loadFixture('noMergeSpawn')
		expect(isGameOver(state)).toBe(false)
		expect(hasLegalMoves(state.board, BOARD_COLS, BOARD_ROWS)).toBe(true)
	})
})

describe('undo and persistence', () => {
	it('restores board, score, RNG and rules after undo', () => {
		const initial = createInitialGame(77)
		// Find any legal move from first occupied cell.
		let chosen: Move | null = null
		for (let row = 0; row < BOARD_ROWS && !chosen; row += 1) {
			for (let col = 0; col < BOARD_COLS && !chosen; col += 1) {
				if (getCell(initial.board, { row, col }) === null) {
					continue
				}
				const dests = getReachableFrom(
					initial.board,
					{ row, col },
					BOARD_COLS,
					BOARD_ROWS,
				)
				if (dests[0]) {
					chosen = { from: { row, col }, to: dests[0] }
				}
			}
		}
		expect(chosen).not.toBeNull()
		if (!chosen) {
			return
		}
		const after = applyMove(initial, chosen)
		expect(after.ok).toBe(true)
		expect(canUndo(after.state)).toBe(true)
		const restored = undo(after.state)
		expect(restored.rng.s).toBe(initial.rng.s)
		expect(restored.score).toBe(initial.score)
		expect(JSON.stringify(restored.board)).toBe(JSON.stringify(initial.board))
		expect(JSON.stringify(restored.rules)).toBe(JSON.stringify(initial.rules))
		const replay = applyMove(restored, chosen)
		expect(gameStatesEqual(replay.state, after.state)).toBe(true)
	})

	it('round-trips through versioned persistence', () => {
		const game = createInitialGame(9)
		const json = JSON.stringify(buildSavedGamePayload(game, 123))
		const restored = deserializeSavedGamePayload(json)
		expect(SAVE_SCHEMA_VERSION).toBe(3)
		expect(restored).not.toBeNull()
		expect(isValidGameState(restored?.game)).toBe(true)
		expect(gameStatesEqual(game, restored!.game)).toBe(true)
	})

	it('falls back on schema mismatch / corrupt payload', () => {
		expect(deserializeSavedGamePayload('{')).toBeNull()
		expect(
			deserializeSavedGamePayload(
				JSON.stringify({ version: 2, game: createInitialGame(1) }),
			),
		).toBeNull()
		expect(deserializeSavedGamePayload('"x"')).toBeNull()
	})
})

describe('fixtures', () => {
	it('all fixtures are valid states', () => {
		for (const id of FIXTURE_IDS) {
			const state = loadFixture(id)
			expect(isValidGameState(state)).toBe(true)
			expect(state.board).toHaveLength(BOARD_ROWS)
		}
	})
})

describe('immutability', () => {
	it('applyMove does not mutate input state', () => {
		const state = createInitialGame(11)
		const snapshot = JSON.stringify(state)
		let moveToTry: Move | null = null
		for (let row = 0; row < BOARD_ROWS; row += 1) {
			for (let col = 0; col < BOARD_COLS; col += 1) {
				if (getCell(state.board, { row, col }) === null) {
					continue
				}
				const dests = getReachableFrom(
					state.board,
					{ row, col },
					BOARD_COLS,
					BOARD_ROWS,
				)
				if (dests[0]) {
					moveToTry = { from: { row, col }, to: dests[0] }
					break
				}
			}
			if (moveToTry) {
				break
			}
		}
		if (!moveToTry) {
			return
		}
		applyMove(state, moveToTry)
		expect(JSON.stringify(state)).toBe(snapshot)
	})
})

describe('helpers', () => {
	it('createFreshSeed returns uint32', () => {
		const seed = createFreshSeed()
		expect(seed).toBeGreaterThanOrEqual(0)
		expect(seed).toBeLessThanOrEqual(0xffffffff)
	})

	it('empty custom board helper works', () => {
		const board = createEmptyHexBoard()
		expect(board).toHaveLength(8)
		expect(setCell(board, { row: 0, col: 0 }, 1)[0]![0]).toBe(1)
	})
})
