/**
 * Square 5×5 board layout that scales to available width.
 */

import { useMemo } from 'react'
import { LayoutChangeEvent, StyleSheet, View } from 'react-native'

import { BOARD_SIZE, type Board, type Position } from '../../game'
import { CellView } from './CellView'

const GAP = 8

export interface BoardViewProps {
	board: Board
	selected: Position | null
	legalTargets: Position[]
	pulseKey: string | null
	spawnKey: string | null
	shakeKey: string | null
	inputLocked: boolean
	onCellPress: (position: Position) => void
	boardWidth: number
	onBoardLayout?: (event: LayoutChangeEvent) => void
}

function posKey (position: Position): string {
	return `${position.row},${position.col}`
}

export function BoardView (props: BoardViewProps) {
	const {
		board,
		selected,
		legalTargets,
		pulseKey,
		spawnKey,
		shakeKey,
		inputLocked,
		onCellPress,
		boardWidth,
	} = props

	const size = board.length || BOARD_SIZE

	const cellSize = useMemo(() => {
		const totalGap = GAP * Math.max(0, size - 1)
		return Math.floor((boardWidth - totalGap) / size)
	}, [boardWidth, size])

	const legalSet = useMemo(() => {
		return new Set(legalTargets.map(posKey))
	}, [legalTargets])

	return (
		<View
			style={[styles.board, { width: boardWidth, height: boardWidth }]}
			accessibilityLabel="Game board"
		>
			{board.map((row, rowIndex) => (
				<View key={`row-${rowIndex}`} style={[styles.row, { gap: GAP }]}>
					{row.map((value, colIndex) => {
						const position: Position = { row: rowIndex, col: colIndex }
						const key = posKey(position)
						const isSelected =
							selected !== null &&
							selected.row === rowIndex &&
							selected.col === colIndex
						return (
							<CellView
								key={key}
								value={value}
								size={cellSize}
								selected={isSelected}
								legalTarget={legalSet.has(key)}
								pulse={pulseKey === key}
								spawn={spawnKey === key}
								shake={shakeKey === key}
								disabled={inputLocked}
								onPress={() => onCellPress(position)}
							/>
						)
					})}
				</View>
			))}
		</View>
	)
}

const styles = StyleSheet.create({
	board: {
		justifyContent: 'space-between',
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
})
