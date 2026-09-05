/**
 * Serializable game state machine and public engine operations.
 * Pure TypeScript — no React Native imports.
 */

import {
	cloneBoard,
	fillInitialBoard,
	findLargestValue,
	getCell,
	listEmptyPositions,
	setCell,
} from './board'
import { SPAWN_VALUE } from './constants'
import { applyMergeAndChain } from './merge'
import { hasLegalMoves, isLegalMove, listLegalMoves } from './moves'
import { cloneRng, createRng, nextIndex } from './random'
import type {
	ApplyMoveResult,
	GameEvent,
	GameState,
	GameStateSnapshot,
	Move,
} from './types'

/** Capture undo-safe snapshot without nested undo history. */
function toSnapshot (state: GameState): GameStateSnapshot {
	return {
		board: cloneBoard(state.board),
		score: state.score,
		moveCount: state.moveCount,
		status: state.status,
		rng: cloneRng(state.rng),
		seed: state.seed,
		largestValue: state.largestValue,
		largestChain: state.largestChain,
	}
}

/** Restore a full GameState from a snapshot (undo consumed). */
function fromSnapshot (snapshot: GameStateSnapshot): GameState {
	return {
		board: cloneBoard(snapshot.board),
		score: snapshot.score,
		moveCount: snapshot.moveCount,
		status: snapshot.status,
		rng: cloneRng(snapshot.rng),
		seed: snapshot.seed,
		largestValue: snapshot.largestValue,
		largestChain: snapshot.largestChain,
		undoSnapshot: null,
	}
}

/** Deep-clone game state including optional undo snapshot. */
export function cloneGameState (state: GameState): GameState {
	return {
		board: cloneBoard(state.board),
		score: state.score,
		moveCount: state.moveCount,
		status: state.status,
		rng: cloneRng(state.rng),
		seed: state.seed,
		largestValue: state.largestValue,
		largestChain: state.largestChain,
		undoSnapshot: state.undoSnapshot
			? {
					board: cloneBoard(state.undoSnapshot.board),
					score: state.undoSnapshot.score,
					moveCount: state.undoSnapshot.moveCount,
					status: state.undoSnapshot.status,
					rng: cloneRng(state.undoSnapshot.rng),
					seed: state.undoSnapshot.seed,
					largestValue: state.undoSnapshot.largestValue,
					largestChain: state.undoSnapshot.largestChain,
				}
			: null,
	}
}

/**
 * Create a new run from seed.
 * Identical seeds produce identical initial boards and RNG streams.
 */
export function createInitialGame (seed: number): GameState {
	const rng = createRng(seed)
	const board = fillInitialBoard(rng)
	const largestValue = findLargestValue(board)
	const status = hasLegalMoves(board) ? 'playing' : 'game_over'
	return {
		board,
		score: 0,
		moveCount: 0,
		status,
		rng,
		seed,
		largestValue,
		largestChain: 0,
		undoSnapshot: null,
	}
}

/** Alias for createInitialGame — starts a fresh run. */
export function restart (seed: number): GameState {
	return createInitialGame(seed)
}

export function getLegalMoves (state: GameState): Move[] {
	if (state.status === 'game_over') {
		return []
	}
	return listLegalMoves(state.board)
}

export function canUndo (state: GameState): boolean {
	return state.undoSnapshot !== null
}

export function isGameOver (state: GameState): boolean {
	return state.status === 'game_over'
}

/**
 * Restore the pre-move snapshot exactly (board, score, RNG, stats).
 * Returns the input state unchanged when undo is unavailable.
 */
export function undo (state: GameState): GameState {
	if (!state.undoSnapshot) {
		return cloneGameState(state)
	}
	return fromSnapshot(state.undoSnapshot)
}

/**
 * Apply a player move. Never mutates the input state.
 * Illegal moves / game-over return ok:false with a cloned state and no events.
 */
export function applyMove (state: GameState, move: Move): ApplyMoveResult {
	const frozen = cloneGameState(state)

	if (state.status === 'game_over') {
		return { ok: false, state: frozen, events: [] }
	}
	if (!isLegalMove(state.board, move)) {
		return { ok: false, state: frozen, events: [] }
	}

	const value = getCell(state.board, move.from)
	if (value === null) {
		return { ok: false, state: frozen, events: [] }
	}

	const undoSnapshot = toSnapshot(state)
	const mergeResult = applyMergeAndChain(
		state.board,
		move.from,
		move.to,
		value,
	)

	const events: GameEvent[] = [...mergeResult.events]
	let score = state.score + mergeResult.scoreGain
	events.push({
		type: 'SCORE_GAIN',
		amount: mergeResult.scoreGain,
		total: score,
	})

	let largestValue = state.largestValue
	if (mergeResult.finalValue > largestValue) {
		largestValue = mergeResult.finalValue
		events.push({
			type: 'NEW_BEST_CANDIDATE',
			largestValue,
		})
	}

	const largestChain = Math.max(state.largestChain, mergeResult.maxChainLevel)

	// Spawn one cell into a random empty slot when possible.
	let board = mergeResult.board
	const rng = cloneRng(state.rng)
	const empties = listEmptyPositions(board)
	if (empties.length > 0) {
		const index = nextIndex(rng, empties.length)
		const spawnAt = empties[index]
		if (spawnAt) {
			board = setCell(board, spawnAt, SPAWN_VALUE)
			events.push({
				type: 'SPAWN',
				position: { ...spawnAt },
				value: SPAWN_VALUE,
			})
		}
	}

	let status: GameState['status'] = 'playing'
	if (!hasLegalMoves(board)) {
		status = 'game_over'
		events.push({ type: 'GAME_OVER' })
	}

	const nextState: GameState = {
		board,
		score,
		moveCount: state.moveCount + 1,
		status,
		rng,
		seed: state.seed,
		largestValue,
		largestChain,
		undoSnapshot,
	}

	return { ok: true, state: nextState, events }
}

/** JSON serialization for persistence tests / future auto-save. */
export function serializeGame (state: GameState): string {
	return JSON.stringify(state)
}

/** Restore state from JSON. Throws if the payload is not a plain object. */
export function deserializeGame (json: string): GameState {
	const parsed: unknown = JSON.parse(json)
	if (!parsed || typeof parsed !== 'object') {
		throw new Error('deserializeGame: expected object')
	}
	// Structural trust for Phase 1 tests; deeper zod validation can wait.
	const state = parsed as GameState
	return cloneGameState(state)
}

/**
 * Structural equality useful for deterministic replay assertions.
 * Compares gameplay fields; treats undo snapshots recursively.
 */
export function gameStatesEqual (a: GameState, b: GameState): boolean {
	if (
		a.score !== b.score ||
		a.moveCount !== b.moveCount ||
		a.status !== b.status ||
		a.seed !== b.seed ||
		a.largestValue !== b.largestValue ||
		a.largestChain !== b.largestChain ||
		a.rng.s !== b.rng.s
	) {
		return false
	}
	if (JSON.stringify(a.board) !== JSON.stringify(b.board)) {
		return false
	}
	if ((a.undoSnapshot === null) !== (b.undoSnapshot === null)) {
		return false
	}
	if (a.undoSnapshot && b.undoSnapshot) {
		const snapA: GameState = { ...a.undoSnapshot, undoSnapshot: null }
		const snapB: GameState = { ...b.undoSnapshot, undoSnapshot: null }
		return gameStatesEqual(snapA, snapB)
	}
	return true
}
