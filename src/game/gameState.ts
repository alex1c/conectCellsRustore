/**
 * Hex game state machine — pure TypeScript, no React Native.
 */

import {
	cloneBoard,
	fillInitialBoard,
	findLargestValue,
	getCell,
	setCell,
} from './board'
import { resolveMergesAndCascades } from './merge'
import { hasLegalMoves, isLegalMove } from './moves'
import { findPath } from './pathfinding'
import { cloneRng, createRng } from './random'
import { cloneHexRules, getDefaultHexRules } from './rules'
import { spawnCells } from './spawn'
import type {
	ApplyMoveResult,
	GameEvent,
	GameState,
	GameStateSnapshot,
	Move,
} from './types'

function cloneSnapshot (snapshot: GameStateSnapshot): GameStateSnapshot {
	return {
		board: cloneBoard(snapshot.board),
		score: snapshot.score,
		moveCount: snapshot.moveCount,
		status: snapshot.status,
		rng: cloneRng(snapshot.rng),
		seed: snapshot.seed,
		largestValue: snapshot.largestValue,
		largestGroup: snapshot.largestGroup,
		largestCascade: snapshot.largestCascade,
		merges: snapshot.merges,
		cascades: snapshot.cascades,
		cellsSpawned: snapshot.cellsSpawned,
		cellsCleared: snapshot.cellsCleared,
		rules: cloneHexRules(snapshot.rules),
	}
}

function toSnapshot (state: GameState): GameStateSnapshot {
	return {
		board: cloneBoard(state.board),
		score: state.score,
		moveCount: state.moveCount,
		status: state.status,
		rng: cloneRng(state.rng),
		seed: state.seed,
		largestValue: state.largestValue,
		largestGroup: state.largestGroup,
		largestCascade: state.largestCascade,
		merges: state.merges,
		cascades: state.cascades,
		cellsSpawned: state.cellsSpawned,
		cellsCleared: state.cellsCleared,
		rules: cloneHexRules(state.rules),
	}
}

function fromSnapshot (snapshot: GameStateSnapshot): GameState {
	return {
		...cloneSnapshot(snapshot),
		undoSnapshot: null,
	}
}

export function cloneGameState (state: GameState): GameState {
	return {
		board: cloneBoard(state.board),
		score: state.score,
		moveCount: state.moveCount,
		status: state.status,
		rng: cloneRng(state.rng),
		seed: state.seed,
		largestValue: state.largestValue,
		largestGroup: state.largestGroup,
		largestCascade: state.largestCascade,
		merges: state.merges,
		cascades: state.cascades,
		cellsSpawned: state.cellsSpawned,
		cellsCleared: state.cellsCleared,
		rules: cloneHexRules(state.rules),
		undoSnapshot: state.undoSnapshot
			? cloneSnapshot(state.undoSnapshot)
			: null,
	}
}

export function createInitialGame (seed: number): GameState {
	const rules = getDefaultHexRules()
	const rng = createRng(seed)
	const board = fillInitialBoard(rng, rules)
	const status = hasLegalMoves(board, rules.boardCols, rules.boardRows)
		? 'playing'
		: 'game_over'
	return {
		board,
		score: 0,
		moveCount: 0,
		status,
		rng,
		seed,
		largestValue: findLargestValue(board),
		largestGroup: 0,
		largestCascade: 0,
		merges: 0,
		cascades: 0,
		cellsSpawned: 0,
		cellsCleared: 0,
		rules,
		undoSnapshot: null,
	}
}

export function restart (seed: number): GameState {
	return createInitialGame(seed)
}

export function canUndo (state: GameState): boolean {
	return state.undoSnapshot !== null
}

export function isGameOver (state: GameState): boolean {
	return state.status === 'game_over'
}

export function undo (state: GameState): GameState {
	if (!state.undoSnapshot) {
		return cloneGameState(state)
	}
	return fromSnapshot(state.undoSnapshot)
}

/**
 * Apply a path move. Engine is the sole source of truth for merge/cascade/spawn.
 */
export function applyMove (state: GameState, move: Move): ApplyMoveResult {
	const frozen = cloneGameState(state)
	const { boardCols: cols, boardRows: rows } = state.rules

	if (state.status === 'game_over') {
		return { ok: false, state: frozen, events: [], reason: 'game_over' }
	}

	const value = getCell(state.board, move.from)
	if (value === null) {
		return { ok: false, state: frozen, events: [], reason: 'illegal' }
	}

	const pathResult = findPath(state.board, move.from, move.to, cols, rows)
	if (!pathResult.reachable) {
		return { ok: false, state: frozen, events: [], reason: 'blocked' }
	}
	if (!isLegalMove(state.board, move, cols, rows)) {
		return { ok: false, state: frozen, events: [], reason: 'illegal' }
	}

	const undoSnapshot = toSnapshot(state)
	let board = setCell(state.board, move.from, null)
	board = setCell(board, move.to, value)

	const events: GameEvent[] = [
		{
			type: 'MOVE',
			from: { ...move.from },
			to: { ...move.to },
			value,
			path: pathResult.path.map((p) => ({ ...p })),
		},
	]

	const cascade = resolveMergesAndCascades(
		board,
		cols,
		rows,
		state.rules.mergeThreshold,
		state.rules.mergeResultFactor,
		move.to,
		state.largestValue,
	)
	board = cascade.board
	events.push(...cascade.events)

	let score = state.score + cascade.scoreGain
	if (cascade.scoreGain > 0) {
		events.push({
			type: 'SCORE_GAIN',
			amount: cascade.scoreGain,
			total: score,
		})
	}

	const rng = cloneRng(state.rng)
	let cellsSpawned = state.cellsSpawned
	if (!cascade.hadMerge) {
		const spawn = spawnCells(board, rng, state.rules)
		board = spawn.board
		events.push(...spawn.events)
		cellsSpawned += spawn.spawned
	}

	let status: GameState['status'] = 'playing'
	if (!hasLegalMoves(board, cols, rows)) {
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
		largestValue: Math.max(state.largestValue, cascade.finalLargestValue),
		largestGroup: Math.max(state.largestGroup, cascade.largestGroup),
		largestCascade: Math.max(state.largestCascade, cascade.largestCascade),
		merges: state.merges + cascade.merges,
		cascades: state.cascades + cascade.cascades,
		cellsSpawned,
		cellsCleared: state.cellsCleared + cascade.cellsCleared,
		rules: cloneHexRules(state.rules),
		undoSnapshot,
	}

	return { ok: true, state: nextState, events }
}

export function serializeGame (state: GameState): string {
	return JSON.stringify(state)
}

export function deserializeGame (json: string): GameState {
	const parsed: unknown = JSON.parse(json)
	if (!parsed || typeof parsed !== 'object') {
		throw new Error('deserializeGame: expected object')
	}
	return cloneGameState(parsed as GameState)
}

export function gameStatesEqual (a: GameState, b: GameState): boolean {
	return JSON.stringify(stripForCompare(a)) === JSON.stringify(stripForCompare(b))
}

function stripForCompare (state: GameState): unknown {
	return {
		board: state.board,
		score: state.score,
		moveCount: state.moveCount,
		status: state.status,
		rng: state.rng,
		seed: state.seed,
		largestValue: state.largestValue,
		largestGroup: state.largestGroup,
		largestCascade: state.largestCascade,
		merges: state.merges,
		cascades: state.cascades,
		cellsSpawned: state.cellsSpawned,
		cellsCleared: state.cellsCleared,
		rules: state.rules,
		undoSnapshot: state.undoSnapshot,
	}
}
