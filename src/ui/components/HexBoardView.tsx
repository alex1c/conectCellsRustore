/**
 * Pointy-top odd-r hex board layout with merge/path presentation hooks.
 */

import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { BOARD_COLS, BOARD_ROWS, type Board, type Position } from '../../game'
import { getHexCellVisual, hexValueFontSize } from '../theme/cellVisuals'
import { HexCellView } from './HexCellView'

export interface BoardTraveler {
	position: Position
	value: number
}

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
		inputLocked,
		boardWidth,
		onCellPress,
	} = props

	const rows = board.length || BOARD_ROWS
	const cols = board[0]?.length || BOARD_COLS
	const spawnSet = useMemo(() => new Set(spawnKeys), [spawnKeys])
	const shrinkSet = useMemo(() => new Set(shrinkKeys), [shrinkKeys])

	const { cellSize, rowStep, colStep } = useMemo(
		() => HexCellLayoutMetrics(boardWidth, cols),
		[boardWidth, cols],
	)

	const boardHeight = rowStep * (rows - 1) + cellSize * 1.1

	const cellOrigin = (position: Position) => {
		const odd = position.row & 1
		return {
			left: position.col * colStep + (odd ? colStep * 0.5 : 0),
			top: position.row * rowStep,
		}
	}

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
					// Hide the static cell while the traveler occupies this hex.
					const hiddenByTravel =
						traveler !== null &&
						traveler.position.row === row &&
						traveler.position.col === col
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
									opacity: hiddenByTravel ? 0 : 1,
								},
							]}
						>
							<HexCellView
								value={value}
								size={cellSize}
								selected={selectedHere}
								pulse={pulseKey === key}
								pulseStrong={pulseStrong && pulseKey === key}
								spawn={spawnSet.has(key)}
								shrinking={shrinkSet.has(key)}
								shake={shakeKey === key}
								disabled={inputLocked}
								onPress={() => onCellPress(position)}
							/>
						</View>
					)
				}),
			)}

			{traveler ? (() => {
				const visual = getHexCellVisual(traveler.value)
				return (
					<View
						pointerEvents="none"
						style={[
							styles.cellWrap,
							styles.traveler,
							{
								...cellOrigin(traveler.position),
								width: cellSize,
								height: cellSize * 1.1,
								zIndex: 5,
							},
						]}
					>
						{/* Transient path overlay — not HexCellView (no sticky Animated.Value). */}
						<View
							style={[
								styles.travelerFace,
								{
									width: cellSize,
									height: cellSize * 1.1,
									backgroundColor: visual.fill,
									borderColor: visual.stroke,
								},
							]}
						>
							<Text
								style={{
									color: visual.text,
									fontSize: hexValueFontSize(traveler.value, cellSize),
									fontWeight: '800',
								}}
							>
								{String(traveler.value)}
							</Text>
						</View>
					</View>
				)
			})() : null}

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
		backgroundColor: 'rgba(255,255,255,0.55)',
	},
	cellWrap: {
		position: 'absolute',
	},
	traveler: {
		elevation: 4,
	},
	travelerFace: {
		borderRadius: 14,
		borderWidth: 1.5,
		alignItems: 'center',
		justifyContent: 'center',
	},
	scorePopup: {
		position: 'absolute',
		alignItems: 'center',
		marginTop: -10,
		zIndex: 8,
	},
	scorePopupText: {
		fontWeight: '800',
		color: '#15803d',
		textShadowColor: 'rgba(255,255,255,0.9)',
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 2,
	},
})
