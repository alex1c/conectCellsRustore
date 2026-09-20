/**
 * Cohesive light-theme cell palette (original — not a clone of the source game).
 * Neighboring values stay distinguishable; high values keep readable contrast.
 */

export interface HexCellVisual {
	fill: string
	text: string
	stroke: string
}

const TABLE: Record<number, HexCellVisual> = {
	1: { fill: '#6ec9b8', text: '#0b322c', stroke: '#2a9d8f' },
	2: { fill: '#6db3e8', text: '#0a2f4d', stroke: '#2f7fbf' },
	4: { fill: '#e8b84a', text: '#4a3200', stroke: '#c9921a' },
	8: { fill: '#e8926a', text: '#4a1c08', stroke: '#c96a3a' },
	16: { fill: '#b894e8', text: '#2e1548', stroke: '#8a5cc8' },
	32: { fill: '#e87aa0', text: '#4a1030', stroke: '#c84a78' },
	64: { fill: '#5fd68a', text: '#0a3a20', stroke: '#2aaa58' },
	128: { fill: '#5ec8d8', text: '#063848', stroke: '#2a9bb0' },
	256: { fill: '#e8a868', text: '#4a2808', stroke: '#c87830' },
	512: { fill: '#7080d8', text: '#f4f6ff', stroke: '#4050b8' },
	1024: { fill: '#d86090', text: '#fff5fa', stroke: '#b03868' },
	4096: { fill: '#48a898', text: '#f2fffc', stroke: '#287868' },
	16384: { fill: '#4868c8', text: '#f2f6ff', stroke: '#284898' },
}

const EMPTY: HexCellVisual = {
	fill: '#d5dde8',
	text: '#64748b',
	stroke: '#9aabbf',
}

const ULTRA: HexCellVisual = {
	fill: '#1a2740',
	text: '#f8fafc',
	stroke: '#e8c56a',
}

/** Nearest known palette entry for arbitrary high powers of two. */
export function getHexCellVisual (value: number | null): HexCellVisual {
	if (value === null) {
		return EMPTY
	}
	if (TABLE[value]) {
		return TABLE[value]!
	}
	// Walk down powers of two until we hit a defined swatch.
	let v = value
	while (v > 1 && !TABLE[v]) {
		v = Math.floor(v / 2)
	}
	return TABLE[v] ?? ULTRA
}

/**
 * Dynamic label size so 1024 / 4096 / 16384 stay inside the hex.
 * Prefer full digits over abbreviations while they still fit.
 */
export function hexValueFontSize (value: number, cellSize: number): number {
	const digits = String(value).length
	if (digits <= 2) {
		return cellSize * 0.36
	}
	if (digits === 3) {
		return cellSize * 0.3
	}
	if (digits === 4) {
		return cellSize * 0.24
	}
	if (digits === 5) {
		return cellSize * 0.2
	}
	return cellSize * 0.17
}
