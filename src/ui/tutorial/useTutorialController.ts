/**
 * Isolated interactive tutorial session.
 * Reuses production applyMove / PathTravelerOverlay / feel helpers.
 * NEVER persists game state, best scores, ads, or gameplay analytics.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import {
	applyMove,
	cloneBoard,
	samePosition,
	type Board,
	type GameEvent,
	type GameState,
	type Position,
} from '../../game'
import { trackEvent } from '../../analytics/appMetrica'
import {
	hapticMerge4,
	hapticSelection,
} from '../feel/haptics'
import { playMergeSound, playSound } from '../feel/sound'
import {
	TIMING_MERGE_CONVERGE_MS,
	TIMING_MERGE_POP_MS,
	TIMING_SCORE_POPUP_MS,
	TIMING_SPAWN_MS,
	pathTotalMs,
} from '../feel/timings'
import type { BoardScorePopup, BoardTraveler } from '../components/HexBoardView'
import {
	TUTORIAL_MERGE_DEST,
	TUTORIAL_MERGE_FROM,
	TUTORIAL_MERGE_GROUP,
	TUTORIAL_MOVE_DEST,
	TUTORIAL_SELECT_CELL,
	TUTORIAL_SPAWN_DEST,
	TUTORIAL_SPAWN_FROM,
	buildLargeGroupBoard,
	buildLevelsBoard,
	buildMergeSetupBoard,
	buildSelectMoveBoard,
	buildSpawnBoard,
} from './tutorialBoards'
import {
	TUTORIAL_STEP_COUNT,
	getTutorialStep,
	type TutorialSource,
	type TutorialStepId,
} from './tutorialSteps'

function posKey (position: Position): string {
	return `${position.row},${position.col}`
}

function delay (ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}

function boardForStep (stepId: TutorialStepId): GameState {
	switch (stepId) {
		case 'select':
		case 'move':
		case 'path_tip':
			return buildSelectMoveBoard()
		case 'merge':
		case 'merge_tip':
			return buildMergeSetupBoard()
		case 'large_group':
			return buildLargeGroupBoard()
		case 'spawn':
			return buildSpawnBoard()
		case 'levels':
		case 'done':
			return buildLevelsBoard()
		default:
			return buildSelectMoveBoard()
	}
}

function hintsForStep (
	stepId: TutorialStepId,
	selected: Position | null,
): string[] {
	switch (stepId) {
		case 'select':
			return [posKey(TUTORIAL_SELECT_CELL)]
		case 'move':
			return selected
				? [posKey(TUTORIAL_MOVE_DEST)]
				: [posKey(TUTORIAL_SELECT_CELL), posKey(TUTORIAL_MOVE_DEST)]
		case 'merge':
			if (!selected) {
				return [
					posKey(TUTORIAL_MERGE_FROM),
					...TUTORIAL_MERGE_GROUP.map(posKey),
				]
			}
			return [
				posKey(TUTORIAL_MERGE_DEST),
				...TUTORIAL_MERGE_GROUP.map(posKey),
			]
		case 'spawn':
			if (!selected) {
				return [posKey(TUTORIAL_SPAWN_FROM)]
			}
			return [posKey(TUTORIAL_SPAWN_DEST)]
		case 'large_group':
			return [
				posKey({ row: 3, col: 2 }),
				posKey({ row: 3, col: 3 }),
				posKey({ row: 4, col: 2 }),
				posKey({ row: 4, col: 3 }),
				posKey({ row: 2, col: 2 }),
			]
		default:
			return []
	}
}

export interface UseTutorialControllerOptions {
	source: TutorialSource
	onComplete: () => void
	onSkip: () => void
}

export function useTutorialController (options: UseTutorialControllerOptions) {
	const { source, onComplete, onSkip } = options
	const [stepIndex, setStepIndex] = useState(0)
	const step = getTutorialStep(stepIndex)
	const [game, setGame] = useState<GameState>(() => boardForStep('select'))
	const [displayBoard, setDisplayBoard] = useState<Board>(() =>
		cloneBoard(boardForStep('select').board),
	)
	const [selected, setSelected] = useState<Position | null>(null)
	const [inputLocked, setInputLocked] = useState(false)
	const [traveler, setTraveler] = useState<BoardTraveler | null>(null)
	const [shrinkKeys, setShrinkKeys] = useState<string[]>([])
	const [spawnKeys, setSpawnKeys] = useState<string[]>([])
	const [pulseKey, setPulseKey] = useState<string | null>(null)
	const [scorePopup, setScorePopup] = useState<BoardScorePopup | null>(null)
	const [nudgeKey, setNudgeKey] = useState(0)

	const gameRef = useRef(game)
	const selectedRef = useRef<Position | null>(null)
	const stepIdRef = useRef<TutorialStepId>(step.id)
	const animTokenRef = useRef(0)
	const travelerPlayIdRef = useRef(0)
	const travelerWaitersRef = useRef(new Map<number, () => void>())
	const startedRef = useRef(false)

	useEffect(() => {
		gameRef.current = game
	}, [game])

	useEffect(() => {
		selectedRef.current = selected
	}, [selected])

	useEffect(() => {
		stepIdRef.current = step.id
	}, [step.id])

	useEffect(() => {
		if (startedRef.current) {
			return
		}
		startedRef.current = true
		trackEvent('tutorial_start', { source })
		trackEvent('tutorial_step', { source, step: 'select', index: 1 })
	}, [source])

	const resolveTravelerWaiters = useCallback((playId: number) => {
		const resolve = travelerWaitersRef.current.get(playId)
		if (resolve) {
			travelerWaitersRef.current.delete(playId)
			resolve()
		}
	}, [])

	const onTravelerComplete = useCallback(
		(playId: number) => {
			resolveTravelerWaiters(playId)
			setTraveler(null)
		},
		[resolveTravelerWaiters],
	)

	const runPathTraveler = useCallback((path: Position[], value: number) => {
		const playId = travelerPlayIdRef.current + 1
		travelerPlayIdRef.current = playId
		const durationMs = pathTotalMs(path.length)
		const done = new Promise<void>((resolve) => {
			travelerWaitersRef.current.set(playId, resolve)
		})
		setTraveler({ path, value, durationMs, playId })
		return done
	}, [])

	const loadStepBoard = useCallback(
		(nextIndex: number, keepSelection?: Position | null) => {
			const next = getTutorialStep(nextIndex)
			const fresh = boardForStep(next.id)
			animTokenRef.current += 1
			setGame(fresh)
			setDisplayBoard(cloneBoard(fresh.board))
			const sel = keepSelection ?? null
			setSelected(sel)
			selectedRef.current = sel
			setTraveler(null)
			setShrinkKeys([])
			setSpawnKeys([])
			setPulseKey(null)
			setScorePopup(null)
			setInputLocked(false)
			setStepIndex(nextIndex)
			trackEvent('tutorial_step', {
				source,
				step: next.id,
				index: next.index,
			})
		},
		[source],
	)

	/** Advance coach / post-action steps without wiping the visible board. */
	const advanceKeepingBoard = useCallback(
		(nextIndex: number) => {
			const next = getTutorialStep(nextIndex)
			setSelected(null)
			selectedRef.current = null
			setTraveler(null)
			setShrinkKeys([])
			setSpawnKeys([])
			setInputLocked(false)
			setStepIndex(nextIndex)
			trackEvent('tutorial_step', {
				source,
				step: next.id,
				index: next.index,
			})
		},
		[source],
	)

	const handleSkip = useCallback(() => {
		trackEvent('tutorial_skip', { source, step: stepIdRef.current })
		animTokenRef.current += 1
		onSkip()
	}, [onSkip, source])

	const handleCoachContinue = useCallback(() => {
		if (!step.coachOnly) {
			return
		}
		if (step.id === 'done') {
			trackEvent('tutorial_complete', { source })
			onComplete()
			return
		}
		// Entering a new interactive setup needs a fresh deterministic board.
		if (
			step.id === 'path_tip' ||
			step.id === 'merge_tip' ||
			step.id === 'large_group' ||
			step.id === 'levels'
		) {
			loadStepBoard(stepIndex + 1)
			return
		}
		loadStepBoard(stepIndex + 1)
	}, [
		loadStepBoard,
		onComplete,
		source,
		step.coachOnly,
		step.id,
		stepIndex,
	])

	const playTutorialEvents = useCallback(
		async (
			startBoard: Board,
			events: GameEvent[],
			finalState: GameState,
			token: number,
		) => {
			let board = cloneBoard(startBoard)
			const moveEvent = events.find((e) => e.type === 'MOVE')
			if (moveEvent && moveEvent.type === 'MOVE') {
				playSound('move')
				const path = moveEvent.path
				const travelerDone = runPathTraveler(path, moveEvent.value)
				board = cloneBoard(board)
				const originRow = board[moveEvent.from.row]
				if (originRow) {
					originRow[moveEvent.from.col] = null
				}
				setDisplayBoard(board)
				await travelerDone
				if (animTokenRef.current !== token) {
					return
				}
				board = cloneBoard(board)
				const destRow = board[moveEvent.to.row]
				if (destRow) {
					destRow[moveEvent.to.col] = moveEvent.value
				}
				setDisplayBoard(board)
			}

			for (const event of events) {
				if (animTokenRef.current !== token) {
					return
				}
				if (event.type === 'MOVE' || event.type === 'SCORE_GAIN') {
					continue
				}
				if (event.type === 'MERGE') {
					const clearKeys = event.cleared.map(posKey)
					setShrinkKeys(clearKeys)
					await delay(TIMING_MERGE_CONVERGE_MS)
					if (animTokenRef.current !== token) {
						return
					}
					board = cloneBoard(board)
					for (const cleared of event.cleared) {
						const row = board[cleared.row]
						if (row) {
							row[cleared.col] = null
						}
					}
					const resultRow = board[event.resultAt.row]
					if (resultRow) {
						resultRow[event.resultAt.col] = event.resultValue
					}
					setShrinkKeys([])
					setDisplayBoard(board)
					setPulseKey(posKey(event.resultAt))
					playMergeSound(event.cascadeLevel, event.groupSize)
					void hapticMerge4()
					setScorePopup({
						amount: event.scoreGain,
						position: event.resultAt,
						key: `${posKey(event.resultAt)}-${event.scoreGain}`,
					})
					void delay(TIMING_SCORE_POPUP_MS).then(() => {
						if (animTokenRef.current === token) {
							setScorePopup(null)
						}
					})
					await delay(TIMING_MERGE_POP_MS)
				} else if (event.type === 'SPAWN') {
					playSound('spawn')
					const keys = event.cells.map((c) => posKey(c.position))
					board = cloneBoard(finalState.board)
					setDisplayBoard(board)
					setSpawnKeys(keys)
					await delay(TIMING_SPAWN_MS + 40)
					if (animTokenRef.current === token) {
						setSpawnKeys([])
					}
				}
			}

			if (animTokenRef.current !== token) {
				return
			}
			setGame(finalState)
			setDisplayBoard(cloneBoard(finalState.board))
		},
		[runPathTraveler],
	)

	const runGuidedMove = useCallback(
		async (from: Position, to: Position, nextStepIndex: number) => {
			const current = gameRef.current
			const result = applyMove(current, { from, to })
			if (!result.ok) {
				setNudgeKey((n) => n + 1)
				return
			}
			setInputLocked(true)
			setSelected(null)
			selectedRef.current = null
			const token = animTokenRef.current + 1
			animTokenRef.current = token
			await playTutorialEvents(
				current.board,
				result.events,
				result.state,
				token,
			)
			if (animTokenRef.current !== token) {
				return
			}
			setInputLocked(false)
			// Keep the post-move board visible on coach tips.
			advanceKeepingBoard(nextStepIndex)
		},
		[advanceKeepingBoard, playTutorialEvents],
	)

	const handleCellPress = useCallback(
		(position: Position) => {
			if (inputLocked || step.coachOnly) {
				return
			}
			const stepId = stepIdRef.current

			if (stepId === 'select') {
				if (!samePosition(position, TUTORIAL_SELECT_CELL)) {
					setNudgeKey((n) => n + 1)
					return
				}
				playSound('select')
				void hapticSelection()
				setSelected(position)
				selectedRef.current = position
				loadStepBoard(1, position)
				return
			}

			if (stepId === 'move') {
				const selectedNow = selectedRef.current
				if (!selectedNow) {
					if (samePosition(position, TUTORIAL_SELECT_CELL)) {
						playSound('select')
						void hapticSelection()
						setSelected(position)
						selectedRef.current = position
					} else {
						setNudgeKey((n) => n + 1)
					}
					return
				}
				if (!samePosition(position, TUTORIAL_MOVE_DEST)) {
					setNudgeKey((n) => n + 1)
					return
				}
				void runGuidedMove(selectedNow, position, 2)
				return
			}

			if (stepId === 'merge') {
				const selectedNow = selectedRef.current
				if (!selectedNow) {
					if (!samePosition(position, TUTORIAL_MERGE_FROM)) {
						setNudgeKey((n) => n + 1)
						return
					}
					playSound('select')
					void hapticSelection()
					setSelected(position)
					selectedRef.current = position
					return
				}
				if (!samePosition(position, TUTORIAL_MERGE_DEST)) {
					setNudgeKey((n) => n + 1)
					return
				}
				void runGuidedMove(selectedNow, position, 4)
				return
			}

			if (stepId === 'spawn') {
				const selectedNow = selectedRef.current
				if (!selectedNow) {
					if (!samePosition(position, TUTORIAL_SPAWN_FROM)) {
						setNudgeKey((n) => n + 1)
						return
					}
					playSound('select')
					void hapticSelection()
					setSelected(position)
					selectedRef.current = position
					return
				}
				if (!samePosition(position, TUTORIAL_SPAWN_DEST)) {
					setNudgeKey((n) => n + 1)
					return
				}
				void runGuidedMove(selectedNow, position, 7)
			}
		},
		[
			inputLocked,
			loadStepBoard,
			runGuidedMove,
			step.coachOnly,
		],
	)

	const hintKeys = hintsForStep(step.id, selected)

	return {
		step,
		stepIndex,
		stepCount: TUTORIAL_STEP_COUNT,
		displayBoard,
		selected,
		inputLocked,
		traveler,
		shrinkKeys,
		spawnKeys,
		pulseKey,
		scorePopup,
		hintKeys,
		nudgeKey,
		source,
		handleCellPress,
		onTravelerComplete,
		handleCoachContinue,
		handleSkip,
	}
}
