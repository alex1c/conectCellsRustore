/**
 * Visual styles for hex cell values — original palette, not a clone.
 */

export interface HexCellVisual {
	fill: string
	text: string
	stroke: string
}

const TABLE: Record<number, HexCellVisual> = {
	1: { fill: '#7dd3c0', text: '#0f3d36', stroke: '#2a9d8f' },
	2: { fill: '#8ec5f0', text: '#0c3a5c', stroke: '#3a86c8' },
	4: { fill: '#f2c14e', text: '#5c3d00', stroke: '#d4a017' },
	8: { fill: '#f0a07a', text: '#5c2208', stroke: '#e07a4f' },
	16: { fill: '#d4a5ff', text: '#3b1d5c', stroke: '#9b5de5' },
	32: { fill: '#ff8fab', text: '#5c1030', stroke: '#f15bb5' },
	64: { fill: '#80ed99', text: '#0b3d1f', stroke: '#38b000' },
	128: { fill: '#90e0ef', text: '#023e4d', stroke: '#00b4d8' },
	256: { fill: '#ffd6a5', text: '#5c3a00', stroke: '#fb8500' },
}

const HIGH: HexCellVisual = {
	fill: '#1d3557',
	text: '#f1faee',
	stroke: '#e9c46a',
}

const EMPTY: HexCellVisual = {
	fill: '#e9eef5',
	text: '#94a3b8',
	stroke: '#c9d4e3',
}

export function getHexCellVisual (value: number | null): HexCellVisual {
	if (value === null) {
		return EMPTY
	}
	return TABLE[value] ?? HIGH
}
