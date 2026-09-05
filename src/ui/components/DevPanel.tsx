/**
 * Compact development tools for hex fixtures (no square presets).
 * Imports fixtures directly — avoids barrel circular init leaving FIXTURE_IDS undefined.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import {
	FIXTURE_IDS,
	type FixtureId,
} from '../../game/fixtures'

export interface RunMetrics {
	moves: number
	finalScore: number
	largestValue: number
	largestGroup: number
	largestCascade: number
	durationSec: number | null
}

export interface DevPanelProps {
	onLoadFixture: (id: FixtureId) => void
	onNewSeed: () => void
	lastMetrics: RunMetrics | null
}

export function DevPanel (props: DevPanelProps) {
	if (!__DEV__) {
		return null
	}

	const { onLoadFixture, onNewSeed, lastMetrics } = props

	// Contract: FIXTURE_IDS is a compile-time literal array in fixtures.ts.
	if (!Array.isArray(FIXTURE_IDS) || FIXTURE_IDS.length === 0) {
		throw new Error(
			'DevPanel: FIXTURE_IDS missing — hex fixtures module failed to load',
		)
	}

	return (
		<View style={styles.wrap}>
			<View style={styles.headerRow}>
				<Text style={styles.title}>Dev</Text>
				<Pressable style={styles.seedBtn} onPress={onNewSeed}>
					<Text style={styles.seedText}>New seed</Text>
				</Pressable>
			</View>
			<ScrollView horizontal showsHorizontalScrollIndicator={false}>
				<View style={styles.row}>
					{FIXTURE_IDS.map((id) => (
						<Pressable
							key={id}
							style={styles.chip}
							onPress={() => onLoadFixture(id)}
						>
							<Text style={styles.chipText}>{id}</Text>
						</Pressable>
					))}
				</View>
			</ScrollView>
			{lastMetrics ? (
				<Text style={styles.metrics}>
					moves {lastMetrics.moves} · score {lastMetrics.finalScore} · max{' '}
					{lastMetrics.largestValue} · group {lastMetrics.largestGroup} ·
					cascade {lastMetrics.largestCascade}
					{lastMetrics.durationSec !== null
						? ` · ${lastMetrics.durationSec}s`
						: ''}
				</Text>
			) : null}
		</View>
	)
}

const styles = StyleSheet.create({
	wrap: {
		width: '100%',
		marginTop: 8,
		paddingTop: 8,
		borderTopWidth: 1,
		borderTopColor: '#d5dee8',
	},
	headerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 6,
	},
	title: {
		fontSize: 11,
		fontWeight: '700',
		color: '#64748b',
		textTransform: 'uppercase',
	},
	seedBtn: {
		backgroundColor: '#334155',
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 8,
	},
	seedText: {
		color: '#fff',
		fontSize: 12,
		fontWeight: '600',
	},
	row: {
		flexDirection: 'row',
		columnGap: 6,
	},
	chip: {
		backgroundColor: '#1e293b',
		paddingHorizontal: 8,
		paddingVertical: 6,
		borderRadius: 8,
		marginRight: 6,
	},
	chipText: {
		color: '#f8fafc',
		fontSize: 11,
		fontWeight: '600',
	},
	metrics: {
		marginTop: 6,
		fontSize: 11,
		color: '#64748b',
	},
})
