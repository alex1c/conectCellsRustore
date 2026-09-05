/**
 * Pointy-top odd-r hex board layout (staggered rows).
 */

import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'

import { BOARD_COLS, BOARD_ROWS, type Board, type Position } from '../../game'
import { HexCellView } from './HexCellView'

export interface HexBoardViewProps {
	board: Board
	selected: Position | null
	pulseKey: string | null
	spawnKeys: string[]
	inputLocked: boolean
	boardWidth: number
	onCellPress: (position: Position) => void
}

function keyOf (position: Position): string {
	return `${position.row},${position.col}`
}

export function HexBoardView (props: HexBoardViewProps) {
	const {
		board,
		selected,
		pulseKey,
		spawnKeys,
		inputLocked,
		boardWidth,
		onCellPress,
	} = props

	const rows = board.length || BOARD_ROWS
	const cols = board[0]?.length || BOARD_COLS
	const spawnSet = useMemo(() => new Set(spawnKeys), [spawnKeys])

	const { cellSize, rowStep, colStep } = useMemo(() => {
		// Leave room for odd-row horizontal stagger.
		const size = Math.floor(boardWidth / (cols + 0.55))
		return {
			cellSize: size,
			rowStep: size * 0.86,
			colStep: size * 1.02,
		}
	}, [boardWidth, cols])

	const boardHeight = rowStep * (rows - 1) + cellSize * 1.1

	return (
		<View
			style={[styles.board, { width: boardWidth, height: boardHeight }]}
			accessibilityLabel="Hex game board"
		>
			{Array.from({ length: rows }, (_, row) =>
				Array.from({ length: cols }, (_, col) => {
					const position: Position = { row, col }
					const value = board[row]?.[col] ?? null
					const odd = row & 1
					const left = col * colStep + (odd ? colStep * 0.5 : 0)
					const top = row * rowStep
					const selectedHere =
						selected !== null &&
						selected.row === row &&
						selected.col === col
					const key = keyOf(position)
					return (
						<View
							key={key}
							style={[
								styles.cellWrap,
								{ left, top, width: cellSize, height: cellSize * 1.1 },
							]}
						>
							<HexCellView
								value={value}
								size={cellSize}
								selected={selectedHere}
								pulse={pulseKey === key}
								spawn={spawnSet.has(key)}
								disabled={inputLocked}
								onPress={() => onCellPress(position)}
							/>
						</View>
					)
				}),
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	board: {
		position: 'relative',
		alignSelf: 'center',
	},
	cellWrap: {
		position: 'absolute',
	},
})
