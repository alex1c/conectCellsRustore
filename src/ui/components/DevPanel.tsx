/**
 * Development-only fixture panel and run metrics.
 * Hidden unless __DEV__ is true.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { FIXTURE_IDS, type FixtureId } from '../../game'

export interface RunMetrics {
	moves: number
	finalScore: number
	largestValue: number
	largestChain: number
	durationSec: number | null
}

export interface DevPanelProps {
	onLoadFixture: (id: FixtureId) => void
	lastMetrics: RunMetrics | null
}

export function DevPanel (props: DevPanelProps) {
	if (!__DEV__) {
		return null
	}

	const { onLoadFixture, lastMetrics } = props

	return (
		<View style={styles.wrap}>
			<Text style={styles.title}>Dev fixtures</Text>
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
					Last run · moves {lastMetrics.moves} · score{' '}
					{lastMetrics.finalScore} · max {lastMetrics.largestValue} ·
					chain {lastMetrics.largestChain}
					{lastMetrics.durationSec !== null
						? ` · ${lastMetrics.durationSec}s`
						: ''}
				</Text>
			) : (
				<Text style={styles.metrics}>Play a full run to see metrics.</Text>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	wrap: {
		width: '100%',
		marginTop: 16,
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: '#dbe3ef',
	},
	title: {
		fontSize: 12,
		fontWeight: '700',
		color: '#64748b',
		marginBottom: 8,
		textTransform: 'uppercase',
	},
	row: {
		flexDirection: 'row',
		gap: 8,
		paddingBottom: 4,
	},
	chip: {
		backgroundColor: '#1e293b',
		paddingHorizontal: 10,
		paddingVertical: 8,
		borderRadius: 8,
	},
	chipText: {
		color: '#f8fafc',
		fontSize: 12,
		fontWeight: '600',
	},
	metrics: {
		marginTop: 8,
		fontSize: 12,
		color: '#64748b',
	},
})
