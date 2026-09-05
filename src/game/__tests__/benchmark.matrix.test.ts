/**
 * Full Phase 2.5 autoplay benchmark (200 seeds × presets × policies).
 * Prints a compact comparison table for the final report.
 */

import {
	AUTOPLAY_POLICY_IDS,
	formatMetricsRow,
	runBenchmarkMatrix,
	type AggregateMetrics,
} from '../benchmark/autoplay'
import { RULE_PRESET_IDS, type RulePresetId } from '../rules'

jest.setTimeout(120_000)

function findCell (
	cells: ReturnType<typeof runBenchmarkMatrix>,
	preset: RulePresetId,
	policy: string,
): AggregateMetrics {
	const cell = cells.find((c) => c.preset === preset && c.policy === policy)
	if (!cell) {
		throw new Error(`missing cell ${preset}/${policy}`)
	}
	return cell.metrics
}

describe('phase 2.5 benchmark matrix', () => {
	it('runs 200 seeds across presets and policies', () => {
		const cells = runBenchmarkMatrix({
			presets: RULE_PRESET_IDS,
			policies: AUTOPLAY_POLICY_IDS,
			seedCount: 200,
			baseSeed: 5000,
			maxMoves: 400,
		})

		expect(cells.length).toBe(RULE_PRESET_IDS.length * AUTOPLAY_POLICY_IDS.length)

		const lines = ['PRESET         POLICY       METRICS']
		for (const cell of cells) {
			lines.push(
				formatMetricsRow(cell.preset, cell.policy, cell.metrics),
			)
		}
		console.log('\n[benchmark]\n' + lines.join('\n'))

		// Skill signal samples for the report.
		const baselineFirst = findCell(cells, 'baseline', 'firstLegal')
		const baselineGreedy = findCell(cells, 'baseline', 'greedyScore')
		const sparseFirst = findCell(cells, 'sparseSpawn', 'firstLegal')
		const sparseGreedy = findCell(cells, 'sparseSpawn', 'greedyScore')
		const sparseMobility = findCell(cells, 'sparseSpawn', 'mobility')
		const largerSparseFirst = findCell(cells, 'largerSparse', 'firstLegal')
		const largerSparseGreedy = findCell(cells, 'largerSparse', 'greedyScore')
		const largerSparseMobility = findCell(cells, 'largerSparse', 'mobility')
		const softFirst = findCell(cells, 'softStart', 'firstLegal')
		const softGreedy = findCell(cells, 'softStart', 'greedyScore')

		console.log('[skill]', JSON.stringify({
			baseline: {
				firstMed: baselineFirst.medianMoves,
				greedyMed: baselineGreedy.medianMoves,
				delta: baselineGreedy.medianMoves - baselineFirst.medianMoves,
			},
			sparseSpawn: {
				firstMed: sparseFirst.medianMoves,
				greedyMed: sparseGreedy.medianMoves,
				mobilityMed: sparseMobility.medianMoves,
				deltaGreedy: sparseGreedy.medianMoves - sparseFirst.medianMoves,
			},
			largerSparse: {
				firstMed: largerSparseFirst.medianMoves,
				greedyMed: largerSparseGreedy.medianMoves,
				mobilityMed: largerSparseMobility.medianMoves,
				pctOver25Greedy: largerSparseGreedy.pctOver25,
				pctOver50Greedy: largerSparseGreedy.pctOver50,
			},
			softStart: {
				firstMed: softFirst.medianMoves,
				greedyMed: softGreedy.medianMoves,
				pctOver25Greedy: softGreedy.pctOver25,
			},
		}, null, 2))

		// Sanity: every policy produced finite metrics.
		for (const cell of cells) {
			expect(Number.isFinite(cell.metrics.avgMoves)).toBe(true)
			expect(cell.metrics.n).toBe(200)
		}
	})
})
