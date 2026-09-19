/**
 * Compact development tools: preset switch, fixtures, turn telemetry.
 * Imports fixtures directly — avoids barrel circular init issues.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import {
	FIXTURE_IDS,
	type FixtureId,
} from '../../game/fixtures'
import {
	RULE_PRESET_IDS,
	presetDisplayName,
	type RulePresetId,
} from '../../game/rules'
import type { TurnResolution } from '../../game/types'

export interface RunMetrics {
	moves: number
	finalScore: number
	largestValue: number
	largestGroup: number
	largestCascade: number
	durationSec: number | null
}

export interface DevTurnTelemetry {
	turnNumber: number
	occupied: number
	capacity: number
	turn: TurnResolution
}

export interface DevPanelProps {
	activePreset: RulePresetId
	onSelectPreset: (id: RulePresetId) => void
	onLoadFixture: (id: FixtureId) => void
	onNewSeed: () => void
	lastMetrics: RunMetrics | null
	lastTurn: DevTurnTelemetry | null
}

function formatGroups (sizes: number[]): string {
	if (sizes.length === 0) {
		return '—'
	}
	return sizes.join(' → ')
}

export function DevPanel (props: DevPanelProps) {
	if (!__DEV__) {
		return null
	}

	const {
		activePreset,
		onSelectPreset,
		onLoadFixture,
		onNewSeed,
		lastMetrics,
		lastTurn,
	} = props

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

			<Text style={styles.section}>Preset</Text>
			<View style={styles.row}>
				{RULE_PRESET_IDS.map((id) => {
					const active = id === activePreset
					return (
						<Pressable
							key={id}
							style={[styles.chip, active && styles.chipActive]}
							onPress={() => onSelectPreset(id)}
						>
							<Text
								style={[
									styles.chipText,
									active && styles.chipTextActive,
								]}
							>
								{presetDisplayName(id)}
							</Text>
						</Pressable>
					)
				})}
			</View>
			<Text style={styles.activeHint}>
				Active: {presetDisplayName(activePreset)} ({activePreset})
			</Text>

			{lastTurn ? (
				<Text style={styles.telemetry}>
					Turn: {lastTurn.turnNumber}
					{'\n'}
					Merge: {lastTurn.turn.mergeOccurred ? 'yes' : 'no'}
					{'\n'}
					Groups: {formatGroups(lastTurn.turn.groupSizes)}
					{'\n'}
					Cascade: {Math.max(0, lastTurn.turn.cascadeDepth - 1)}
					{'\n'}
					Spawn: {lastTurn.turn.spawnCount}
					{'\n'}
					Spawn values:{' '}
					{lastTurn.turn.spawnedValues.length > 0
						? lastTurn.turn.spawnedValues.join(', ')
						: '—'}
					{'\n'}
					Occupied: {lastTurn.occupied}/{lastTurn.capacity}
				</Text>
			) : null}

			<Text style={styles.section}>Fixtures</Text>
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
	section: {
		fontSize: 10,
		fontWeight: '700',
		color: '#94a3b8',
		textTransform: 'uppercase',
		marginTop: 6,
		marginBottom: 4,
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
		flexWrap: 'wrap',
	},
	chip: {
		backgroundColor: '#1e293b',
		paddingHorizontal: 8,
		paddingVertical: 6,
		borderRadius: 8,
		marginRight: 6,
		marginBottom: 4,
	},
	chipActive: {
		backgroundColor: '#1d4ed8',
	},
	chipText: {
		color: '#f8fafc',
		fontSize: 11,
		fontWeight: '600',
	},
	chipTextActive: {
		color: '#fff',
	},
	activeHint: {
		fontSize: 11,
		color: '#475569',
		marginBottom: 4,
	},
	telemetry: {
		marginTop: 4,
		marginBottom: 4,
		fontSize: 11,
		lineHeight: 16,
		color: '#0f172a',
		fontFamily: 'monospace',
		backgroundColor: '#e2e8f0',
		padding: 8,
		borderRadius: 8,
	},
	metrics: {
		marginTop: 6,
		fontSize: 11,
		color: '#64748b',
	},
})
