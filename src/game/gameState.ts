/**
 * Serializable game state machine and public engine operations.
 * Pure TypeScript — no React Native imports.
 */

import {
	cloneBoard,
	fillInitialBoard,
	findLargestValue,
	getCell,
} from './board'
import { applyMergeAndChain } from './merge'
import { hasLegalMoves, isLegalMove, listLegalMoves } from './moves'
import { cloneRng, createRng } from './random'
import {
	cloneRules,
	DEFAULT_RULE_PRESET,
	getRulesForPreset,
	type RulePresetId,
} from './rules'
import { maybeSpawn } from './spawn'
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
		largestChain: snapshot.largestChain,
		rulesetId: snapshot.rulesetId,
		rules: cloneRules(snapshot.rules),
	}
}

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
		rulesetId: state.rulesetId,
		rules: cloneRules(state.rules),
	}
}

/** Restore a full GameState from a snapshot (undo consumed). */
function fromSnapshot (snapshot: GameStateSnapshot): GameState {
	return {
		...cloneSnapshot(snapshot),
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
		rulesetId: state.rulesetId,
		rules: cloneRules(state.rules),
		undoSnapshot: state.undoSnapshot
			? cloneSnapshot(state.undoSnapshot)
			: null,
	}
}

/**
 * Create a new run from seed + optional ruleset preset.
 * Identical (seed, ruleset) produce identical boards and RNG streams.
 */
export function createInitialGame (
	seed: number,
	rulesetId: RulePresetId = DEFAULT_RULE_PRESET,
): GameState {
	const rules = getRulesForPreset(rulesetId)
	const rng = createRng(seed)
	const board = fillInitialBoard(rng, rules)
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
		rulesetId,
		rules,
		undoSnapshot: null,
	}
}

/** Alias for createInitialGame — starts a fresh run. */
export function restart (
	seed: number,
	rulesetId: RulePresetId = DEFAULT_RULE_PRESET,
): GameState {
	return createInitialGame(seed, rulesetId)
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
 * Restore the pre-move snapshot exactly (board, score, RNG, rules, stats).
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
		state.rules.scoreBase,
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

	const rng = cloneRng(state.rng)
	const spawnResult = maybeSpawn(mergeResult.board, rng, state.rules)
	events.push(...spawnResult.events)
	const board = spawnResult.board

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
		rng: spawnResult.rng,
		seed: state.seed,
		largestValue,
		largestChain,
		rulesetId: state.rulesetId,
		rules: cloneRules(state.rules),
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
		a.rng.s !== b.rng.s ||
		a.rulesetId !== b.rulesetId ||
		JSON.stringify(a.rules) !== JSON.stringify(b.rules)
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
