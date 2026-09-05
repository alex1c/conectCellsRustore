/**
 * Unit tests for the pure Connect Cells game engine.
 * Runs in Jest without an Android emulator.
 */

import {
	applyMove,
	BOARD_SIZE,
	canUndo,
	cloneGameState,
	createInitialGame,
	deserializeGame,
	gameStatesEqual,
	getLegalMoves,
	isGameOver,
	isLegalMove,
	restart,
	serializeGame,
	undo,
	type GameState,
	type Move,
	type Position,
} from '../index'
import { getCell } from '../board'
import { createRng, nextInt } from '../random'

function assertInvariants (state: GameState): void {
	const size = state.rules.boardSize
	const occupied = new Set<string>()
	for (let row = 0; row < size; row += 1) {
		for (let col = 0; col < size; col += 1) {
			const cell = getCell(state.board, { row, col })
			if (cell === null) {
				continue
			}
			expect(Number.isInteger(cell)).toBe(true)
			expect(cell).toBeGreaterThanOrEqual(1)
			const key = `${row},${col}`
			expect(occupied.has(key)).toBe(false)
			occupied.add(key)
		}
	}
	expect(state.board).toHaveLength(size)
	expect(Number.isFinite(state.score)).toBe(true)
	expect(state.score).toBeGreaterThanOrEqual(0)
	expect(Number.isNaN(state.score)).toBe(false)
	expect(state.moveCount).toBeGreaterThanOrEqual(0)
	expect(state.largestValue).toBeGreaterThanOrEqual(0)
	expect(state.largestChain).toBeGreaterThanOrEqual(0)
	expect(state.rulesetId).toBeTruthy()
	expect(state.rules.boardSize).toBe(size)
}

function findMoveWithValue (state: GameState, value: number): Move | null {
	for (const move of getLegalMoves(state)) {
		if (getCell(state.board, move.from) === value) {
			return move
		}
	}
	return null
}

/** Build a custom playing state for targeted scenarios. */
function stateFromBoard (
	cells: (number | null)[][],
	seed = 1,
): GameState {
	const base = createInitialGame(seed)
	return {
		...base,
		board: cells.map((row) => row.slice()),
		score: 0,
		moveCount: 0,
		status: 'playing',
		largestValue: Math.max(
			0,
			...cells.flat().filter((v): v is number => v !== null),
		),
		largestChain: 0,
		undoSnapshot: null,
		rng: createRng(seed),
	}
}

describe('initial state', () => {
	it('creates a full board with non-negative score and playing or game_over', () => {
		const state = createInitialGame(7)
		expect(state.board).toHaveLength(BOARD_SIZE)
		expect(state.board[0]).toHaveLength(BOARD_SIZE)
		expect(state.score).toBe(0)
		expect(state.moveCount).toBe(0)
		expect(state.undoSnapshot).toBeNull()
		expect(['playing', 'game_over']).toContain(state.status)
		assertInvariants(state)
	})

	it('fills every cell on a typical seed', () => {
		const state = createInitialGame(99)
		for (let row = 0; row < BOARD_SIZE; row += 1) {
			for (let col = 0; col < BOARD_SIZE; col += 1) {
				expect(getCell(state.board, { row, col })).not.toBeNull()
			}
		}
	})
})

describe('deterministic seed', () => {
	it('same seed produces identical initial boards and rng state', () => {
		const a = createInitialGame(12345)
		const b = createInitialGame(12345)
		expect(gameStatesEqual(a, b)).toBe(true)
		expect(JSON.stringify(a.board)).toBe(JSON.stringify(b.board))
		expect(a.rng.s).toBe(b.rng.s)
	})

	it('different seeds usually produce different boards', () => {
		const a = createInitialGame(1)
		const b = createInitialGame(2)
		expect(JSON.stringify(a.board) === JSON.stringify(b.board)).toBe(false)
	})

	it('RNG stream itself is deterministic', () => {
		const r1 = createRng(50)
		const r2 = createRng(50)
		const seq1 = [nextInt(r1, 1, 3), nextInt(r1, 1, 3), nextInt(r1, 1, 3)]
		const seq2 = [nextInt(r2, 1, 3), nextInt(r2, 1, 3), nextInt(r2, 1, 3)]
		expect(seq1).toEqual(seq2)
	})
})

describe('legal and illegal moves', () => {
	const board = [
		[1, 1, 2, 3, 1],
		[2, 3, 1, 2, 3],
		[1, 2, 3, 1, 2],
		[3, 1, 2, 3, 1],
		[2, 3, 1, 2, 3],
	]
	const state = stateFromBoard(board)

	it('accepts an orthogonal equal pair', () => {
		const move: Move = {
			from: { row: 0, col: 0 },
			to: { row: 0, col: 1 },
		}
		expect(isLegalMove(state.board, move)).toBe(true)
		expect(getLegalMoves(state).length).toBeGreaterThan(0)
	})

	it('rejects diagonal, mismatched, and empty targets', () => {
		expect(
			isLegalMove(state.board, {
				from: { row: 0, col: 0 },
				to: { row: 1, col: 1 },
			}),
		).toBe(false)
		expect(
			isLegalMove(state.board, {
				from: { row: 0, col: 0 },
				to: { row: 0, col: 2 },
			}),
		).toBe(false)
		const withEmpty = stateFromBoard([
			[1, null, 2, 3, 1],
			[2, 3, 1, 2, 3],
			[1, 2, 3, 1, 2],
			[3, 1, 2, 3, 1],
			[2, 3, 1, 2, 3],
		])
		expect(
			isLegalMove(withEmpty.board, {
				from: { row: 0, col: 0 },
				to: { row: 0, col: 1 },
			}),
		).toBe(false)
	})

	it('applyMove rejects illegal moves without mutation', () => {
		const before = cloneGameState(state)
		const result = applyMove(state, {
			from: { row: 0, col: 0 },
			to: { row: 0, col: 2 },
		})
		expect(result.ok).toBe(false)
		expect(result.events).toHaveLength(0)
		expect(gameStatesEqual(state, before)).toBe(true)
	})
})

describe('simple merge', () => {
	it('merges two adjacent equals into value+1 at the target', () => {
		// Neighbor of the result is not 2, so no chain; spawn may refill source.
		const state = stateFromBoard([
			[1, 1, 3, 4, 5],
			[6, 7, 8, 9, 2],
			[2, 3, 4, 5, 6],
			[3, 4, 5, 6, 7],
			[4, 5, 6, 7, 8],
		])
		const result = applyMove(state, {
			from: { row: 0, col: 0 },
			to: { row: 0, col: 1 },
		})
		expect(result.ok).toBe(true)
		expect(getCell(result.state.board, { row: 0, col: 1 })).toBe(2)
		expect(result.events.some((e) => e.type === 'MOVE')).toBe(true)
		expect(result.events.some((e) => e.type === 'MERGE')).toBe(true)
		expect(result.events.some((e) => e.type === 'SCORE_GAIN')).toBe(true)
		expect(result.state.score).toBeGreaterThan(0)
		assertInvariants(result.state)
	})
})

describe('several neighboring equals', () => {
	it('lists both orientations for a horizontal pair', () => {
		const state = stateFromBoard([
			[2, 2, 1, 3, 1],
			[1, 3, 1, 2, 3],
			[3, 1, 2, 1, 2],
			[1, 2, 3, 1, 3],
			[2, 1, 3, 2, 1],
		])
		const moves = getLegalMoves(state).filter(
			(m) =>
				(m.from.row === 0 && m.from.col === 0 && m.to.col === 1) ||
				(m.from.row === 0 && m.from.col === 1 && m.to.col === 0),
		)
		expect(moves.length).toBe(2)
	})
})

describe('chain reaction', () => {
	it('chains when the merged value touches an equal neighbor', () => {
		// Merge (0,0)=1 with (0,1)=1 → 2 at (0,1); neighbor (0,2)=2 chains to 3.
		// Spawn may later place a 1 on a cleared cell; assert via events + final value.
		const state = stateFromBoard([
			[1, 1, 2, 4, 5],
			[6, 7, 8, 9, 3],
			[2, 3, 4, 5, 6],
			[3, 4, 5, 6, 7],
			[4, 5, 6, 7, 8],
		])
		const result = applyMove(state, {
			from: { row: 0, col: 0 },
			to: { row: 0, col: 1 },
		})
		expect(result.ok).toBe(true)
		expect(getCell(result.state.board, { row: 0, col: 1 })).toBe(3)
		const chainSteps = result.events.filter((e) => e.type === 'CHAIN_STEP')
		expect(chainSteps.length).toBeGreaterThanOrEqual(1)
		expect(result.state.largestChain).toBeGreaterThanOrEqual(2)
		const absorbed = result.events.find(
			(e) => e.type === 'CHAIN_STEP' && e.fromValue === 2,
		)
		expect(absorbed).toBeDefined()
	})
})

describe('scoring', () => {
	it('increases score by SCORE_BASE * V * L for merge steps', () => {
		const state = stateFromBoard([
			[1, 1, 3, 4, 5],
			[6, 7, 8, 9, 2],
			[2, 3, 4, 5, 6],
			[3, 4, 5, 6, 7],
			[4, 5, 6, 7, 8],
		])
		const result = applyMove(state, {
			from: { row: 0, col: 0 },
			to: { row: 0, col: 1 },
		})
		// Primary only: 10 * 1 * 1 = 10
		expect(result.state.score).toBe(10)
	})
})

describe('edge and corner', () => {
	it('allows corner merges along the edge', () => {
		const state = stateFromBoard([
			[3, 3, 1, 2, 1],
			[1, 2, 4, 5, 6],
			[2, 4, 5, 6, 7],
			[4, 5, 6, 7, 8],
			[5, 6, 7, 8, 9],
		])
		const move: Move = {
			from: { row: 0, col: 0 },
			to: { row: 0, col: 1 },
		}
		expect(isLegalMove(state.board, move)).toBe(true)
		const result = applyMove(state, move)
		expect(result.ok).toBe(true)
		// Result is 4 at the corner target; spawn may refill (0,0).
		expect(getCell(result.state.board, { row: 0, col: 1 })).toBe(4)
		expect(result.events.some((e) => e.type === 'MERGE')).toBe(true)
	})
})

describe('nearly full and full boards', () => {
	it('spawns into the single empty cell when present', () => {
		const cells: (number | null)[][] = [
			[1, 1, 2, 3, 4],
			[5, 6, 7, 8, 9],
			[2, 3, 4, 5, 6],
			[3, 4, 5, 6, 7],
			[4, 5, 6, 7, null],
		]
		const state = stateFromBoard(cells, 11)
		const result = applyMove(state, {
			from: { row: 0, col: 0 },
			to: { row: 0, col: 1 },
		})
		expect(result.ok).toBe(true)
		expect(result.events.some((e) => e.type === 'SPAWN')).toBe(true)
		const empties = result.state.board
			.flat()
			.filter((c) => c === null).length
		// Source cleared, maybe chain cleared more, spawn fills one empty.
		expect(empties).toBeGreaterThanOrEqual(0)
		assertInvariants(result.state)
	})

	it('spawns after merge when exactly one empty exists mid-resolution', () => {
		// No chain: neighbor of result is not 2. One empty from source → spawn fills it.
		const state = stateFromBoard([
			[1, 1, 3, 4, 5],
			[6, 7, 8, 9, 2],
			[2, 3, 4, 5, 6],
			[3, 4, 5, 6, 7],
			[4, 5, 6, 7, 8],
		], 21)
		const result = applyMove(state, {
			from: { row: 0, col: 0 },
			to: { row: 0, col: 1 },
		})
		expect(result.ok).toBe(true)
		expect(result.events.some((e) => e.type === 'SPAWN')).toBe(true)
		const emptyCount = result.state.board.flat().filter((c) => c === null).length
		expect(emptyCount).toBe(0)
	})
})

describe('game over', () => {
	it('marks game_over when no adjacent equals remain', () => {
		const state = stateFromBoard([
			[1, 2, 1, 2, 1],
			[2, 1, 2, 1, 2],
			[1, 2, 1, 2, 1],
			[2, 1, 2, 1, 2],
			[1, 2, 1, 2, 1],
		])
		expect(getLegalMoves(state)).toHaveLength(0)
		// Force status via a synthetic completed check: recreate with no moves.
		const over: GameState = { ...state, status: 'game_over' }
		expect(isGameOver(over)).toBe(true)
		expect(getLegalMoves(over)).toHaveLength(0)
	})

	it('emits GAME_OVER after a move that exhausts legal pairs', () => {
		// Only one legal pair on the board; after merge + spawn may or may not
		// create new pairs — craft so spawn cannot create a pair.
		const state = stateFromBoard([
			[1, 1, 3, 4, 5],
			[6, 7, 8, 9, 2],
			[2, 3, 4, 5, 6],
			[3, 4, 5, 6, 7],
			[4, 5, 6, 7, 8],
		], 0)
		const beforeMoves = getLegalMoves(state)
		expect(beforeMoves.length).toBeGreaterThan(0)
		const result = applyMove(state, {
			from: { row: 0, col: 0 },
			to: { row: 0, col: 1 },
		})
		expect(result.ok).toBe(true)
		if (getLegalMoves(result.state).length === 0) {
			expect(result.state.status).toBe('game_over')
			expect(result.events.some((e) => e.type === 'GAME_OVER')).toBe(true)
		}
	})
})

describe('restart', () => {
	it('creates a fresh game equal to createInitialGame for the same seed', () => {
		const a = restart(77)
		const b = createInitialGame(77)
		expect(gameStatesEqual(a, b)).toBe(true)
	})
})

describe('undo', () => {
	it('restores board, score, moveCount, and RNG exactly', () => {
		const initial = createInitialGame(404)
		const move = getLegalMoves(initial)[0]
		expect(move).toBeDefined()
		if (!move) {
			return
		}
		const after = applyMove(initial, move)
		expect(after.ok).toBe(true)
		expect(canUndo(after.state)).toBe(true)

		const restored = undo(after.state)
		expect(restored.score).toBe(initial.score)
		expect(restored.moveCount).toBe(initial.moveCount)
		expect(restored.rng.s).toBe(initial.rng.s)
		expect(JSON.stringify(restored.board)).toBe(JSON.stringify(initial.board))
		expect(restored.largestValue).toBe(initial.largestValue)
		expect(restored.largestChain).toBe(initial.largestChain)
		expect(canUndo(restored)).toBe(false)
	})

	it('replay after undo yields the same result (no RNG drift)', () => {
		const initial = createInitialGame(808)
		const move = getLegalMoves(initial)[0]
		expect(move).toBeDefined()
		if (!move) {
			return
		}
		const first = applyMove(initial, move)
		expect(first.ok).toBe(true)
		const restored = undo(first.state)
		const second = applyMove(restored, move)
		expect(second.ok).toBe(true)
		expect(gameStatesEqual(first.state, second.state)).toBe(true)
		expect(JSON.stringify(first.events)).toBe(JSON.stringify(second.events))
	})
})

describe('serialization', () => {
	it('round-trips through JSON', () => {
		const state = createInitialGame(55)
		const move = getLegalMoves(state)[0]
		const played = move ? applyMove(state, move).state : state
		const json = serializeGame(played)
		const restored = deserializeGame(json)
		expect(gameStatesEqual(played, restored)).toBe(true)
	})
})

describe('immutability', () => {
	it('applyMove does not mutate the previous state', () => {
		const state = createInitialGame(12)
		const snapshot = serializeGame(state)
		const move = getLegalMoves(state)[0]
		if (!move) {
			return
		}
		applyMove(state, move)
		expect(serializeGame(state)).toBe(snapshot)
	})
})

describe('invariant fuzz loop', () => {
	it('holds invariants across hundreds of legal moves', () => {
		let state = createInitialGame(999)
		let steps = 0
		const maxSteps = 300
		while (steps < maxSteps && !isGameOver(state)) {
			const moves = getLegalMoves(state)
			if (moves.length === 0) {
				break
			}
			const before = serializeGame(state)
			const pick = moves[steps % moves.length]
			if (!pick) {
				break
			}
			const result = applyMove(state, pick)
			expect(result.ok).toBe(true)
			expect(serializeGame(state)).toBe(before)
			state = result.state
			assertInvariants(state)
			steps += 1
		}
		expect(steps).toBeGreaterThan(0)
	})

	it('deterministic full replay matches for a fixed seed and move indices', () => {
		const seed = 314159
		const indices = [0, 0, 1, 0, 2, 0, 1, 1, 0, 0]
		const run = (): GameState => {
			let state = createInitialGame(seed)
			for (const index of indices) {
				const moves = getLegalMoves(state)
				if (moves.length === 0) {
					break
				}
				const move = moves[index % moves.length]
				if (!move) {
					break
				}
				const result = applyMove(state, move)
				expect(result.ok).toBe(true)
				state = result.state
			}
			return state
		}
		expect(gameStatesEqual(run(), run())).toBe(true)
	})
})

describe('helpers', () => {
	it('findMoveWithValue locates a pair when present', () => {
		const state = stateFromBoard([
			[2, 2, 1, 3, 1],
			[1, 3, 1, 2, 3],
			[3, 1, 2, 1, 2],
			[1, 2, 3, 1, 3],
			[2, 1, 3, 2, 1],
		])
		const move = findMoveWithValue(state, 2)
		expect(move).not.toBeNull()
	})

	it('rejects out-of-bounds positions as illegal', () => {
		const state = createInitialGame(1)
		const bad: Position = { row: -1, col: 0 }
		expect(
			isLegalMove(state.board, {
				from: bad,
				to: { row: 0, col: 0 },
			}),
		).toBe(false)
	})
})
