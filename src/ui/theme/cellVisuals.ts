/**
 * Simple visual mapping from cell value → colors.
 * Original palette — not copied from any third-party game.
 */

export interface CellVisual {
	background: string
	text: string
	border: string
}

const LEVELS: Record<number, CellVisual> = {
	1: { background: '#dbeafe', text: '#1e3a8a', border: '#93c5fd' },
	2: { background: '#c7f0db', text: '#14532d', border: '#86efac' },
	3: { background: '#fef3c7', text: '#92400e', border: '#fcd34d' },
	4: { background: '#ffedd5', text: '#9a3412', border: '#fdba74' },
	5: { background: '#fce7f3', text: '#9d174d', border: '#f9a8d4' },
	6: { background: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' },
	7: { background: '#ede9fe', text: '#5b21b6', border: '#c4b5fd' },
	8: { background: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
}

const HIGH: CellVisual = {
	background: '#1f2937',
	text: '#f9fafb',
	border: '#fbbf24',
}

const EMPTY: CellVisual = {
	background: '#eef2f7',
	text: '#94a3b8',
	border: '#d8e0ea',
}

export function getCellVisual (value: number | null): CellVisual {
	if (value === null) {
		return EMPTY
	}
	if (value >= 8) {
		return LEVELS[8] ?? HIGH
	}
	return LEVELS[value] ?? HIGH
}
