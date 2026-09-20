/**
 * Pointy-top odd-r hex board layout with merge/path presentation hooks.
 * Path movement uses a single native-driver PathTravelerOverlay — the board
 * does not re-render per BFS hop.
 */

import { useCallback, useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { BOARD_COLS, BOARD_ROWS, type Board, type Position } from '../../game'
import { hexValueFontSize } from '../theme/cellVisuals'
import { COLOR_BOARD_PLANE, COLOR_SCORE_GAIN } from '../theme/colors'
import { HexCellView } from './HexCellView'
import {
	PathTravelerOverlay,
	type PathTravelerSpec,
} from './PathTravelerOverlay'

export type BoardTraveler = PathTravelerSpec

export interface BoardScorePopup {
	amount: number
	position: Position
	key: string
}

export interface HexBoardViewProps {
	board: Board
	selected: Position | null
	pulseKey: string | null
	pulseStrong?: boolean
	spawnKeys: string[]
	shrinkKeys?: string[]
	shakeKey?: string | null
	traveler?: BoardTraveler | null
	scorePopup?: BoardScorePopup | null
	inputLocked: boolean
	boardWidth: number
	onCellPress: (position: Position) => void
	onTravelerComplete?: (playId: number) => void
}

function keyOf (position: Position): string {
	return `${position.row},${position.col}`
}

export function HexCellLayoutMetrics (
	boardWidth: number,
	cols: number,
): { cellSize: number; rowStep: number; colStep: number } {
	const size = Math.floor(boardWidth / (cols + 0.55))
	return {
		cellSize: size,
		rowStep: size * 0.86,
		colStep: size * 1.02,
	}
}

export function HexBoardView (props: HexBoardViewProps) {
	const {
		board,
		selected,
		pulseKey,
		pulseStrong = false,
		spawnKeys,
		shrinkKeys = [],
		shakeKey = null,
		traveler = null,
		scorePopup = null,
		inputLocked: _inputLocked,
		boardWidth,
		onCellPress,
		onTravelerComplete,
	} = props
	void _inputLocked

	const rows = board.length || BOARD_ROWS
	const cols = board[0]?.length || BOARD_COLS
	const spawnSet = useMemo(() => new Set(spawnKeys), [spawnKeys])
	const shrinkSet = useMemo(() => new Set(shrinkKeys), [shrinkKeys])

	const { cellSize, rowStep, colStep } = useMemo(
		() => HexCellLayoutMetrics(boardWidth, cols),
		[boardWidth, cols],
	)

	const boardHeight = rowStep * (rows - 1) + cellSize * 1.1

	const cellOrigin = useCallback(
		(position: Position) => {
			const odd = position.row & 1
			return {
				left: position.col * colStep + (odd ? colStep * 0.5 : 0),
				top: position.row * rowStep,
			}
		},
		[colStep, rowStep],
	)

	/** Stable press bridge — HexCellView memo compares this by identity. */
	const handleCellPress = useCallback(
		(row: number, col: number) => {
			onCellPress({ row, col })
		},
		[onCellPress],
	)

	const handleTravelerComplete = useCallback(
		(playId: number) => {
			onTravelerComplete?.(playId)
		},
		[onTravelerComplete],
	)

	const travelOriginKey =
		traveler && traveler.path.length > 0
			? keyOf(traveler.path[0]!)
			: null

	return (
		<View
			style={[styles.board, { width: boardWidth, height: boardHeight }]}
			accessibilityLabel="Hex game board"
		>
			{/* Soft board plane so empty hexes read as one surface. */}
			<View style={[styles.plane, { width: boardWidth, height: boardHeight }]} />

			{Array.from({ length: rows }, (_, row) =>
				Array.from({ length: cols }, (_, col) => {
					const position: Position = { row, col }
					const value = board[row]?.[col] ?? null
					const { left, top } = cellOrigin(position)
					const selectedHere =
						selected !== null &&
						selected.row === row &&
						selected.col === col
					const key = keyOf(position)
					const hiddenByTravel = travelOriginKey === key
					return (
						<View
							key={key}
							style={[
								styles.cellWrap,
								{
									left,
									top,
									width: cellSize,
									height: cellSize * 1.1,
								},
							]}
						>
							<HexCellView
								value={value}
								size={cellSize}
								row={row}
								col={col}
								selected={selectedHere}
								pulse={pulseKey === key}
								pulseStrong={pulseStrong && pulseKey === key}
								spawn={spawnSet.has(key)}
								shrinking={shrinkSet.has(key)}
								shake={shakeKey === key}
								hiddenByTravel={hiddenByTravel}
								disabled={false}
								onCellPress={handleCellPress}
							/>
						</View>
					)
				}),
			)}

			{traveler ? (
				<PathTravelerOverlay
					key={traveler.playId}
					traveler={traveler}
					cellOrigin={cellOrigin}
					cellSize={cellSize}
					onComplete={handleTravelerComplete}
				/>
			) : null}

			{scorePopup ? (
				<View
					pointerEvents="none"
					style={[
						styles.scorePopup,
						{
							...cellOrigin(scorePopup.position),
							width: cellSize,
						},
					]}
				>
					<Text
						style={[
							styles.scorePopupText,
							{ fontSize: hexValueFontSize(scorePopup.amount, cellSize) * 0.9 },
						]}
					>
						+{scorePopup.amount}
					</Text>
				</View>
			) : null}
		</View>
	)
}

const styles = StyleSheet.create({
	board: {
		position: 'relative',
		alignSelf: 'center',
	},
	plane: {
		position: 'absolute',
		left: 0,
		top: 0,
		borderRadius: 20,
		backgroundColor: COLOR_BOARD_PLANE,
	},
	cellWrap: {
		position: 'absolute',
	},
	scorePopup: {
		position: 'absolute',
		alignItems: 'center',
		marginTop: -10,
		zIndex: 8,
	},
	scorePopupText: {
		fontWeight: '800',
		color: COLOR_SCORE_GAIN,
		textShadowColor: 'rgba(0,0,0,0.65)',
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 3,
	},
})
