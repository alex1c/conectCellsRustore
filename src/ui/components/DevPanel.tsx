/**
 * Compact development tools: preset switch, fixtures, turn telemetry.
 * Collapsed by default so human playtest is not crowded. Production: null.
 */

import { useState } from 'react'
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
	const {
		activePreset,
		onSelectPreset,
		onLoadFixture,
		onNewSeed,
		lastMetrics,
		lastTurn,
	} = props

	const [expanded, setExpanded] = useState(false)

	if (!__DEV__) {
		return null
	}

	if (!Array.isArray(FIXTURE_IDS) || FIXTURE_IDS.length === 0) {
		throw new Error(
			'DevPanel: FIXTURE_IDS missing — hex fixtures module failed to load',
		)
	}

	return (
		<View style={styles.wrap}>
			<Pressable
				style={styles.headerRow}
				onPress={() => setExpanded((v) => !v)}
			>
				<Text style={styles.title}>
					DEV {expanded ? '▾' : '▸'}
				</Text>
				{expanded ? (
					<Pressable
						style={styles.seedBtn}
						onPress={(e) => {
							e.stopPropagation?.()
							onNewSeed()
						}}
					>
						<Text style={styles.seedText}>New seed</Text>
					</Pressable>
				) : (
					<Text style={styles.collapsedHint}>tools</Text>
				)}
			</Pressable>

			{expanded ? (
				<>
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
							Turn {lastTurn.turnNumber}: occ {lastTurn.occupied}/
							{lastTurn.capacity} · spawn {lastTurn.turn.spawnCount} (base{' '}
							{lastTurn.turn.baseSpawnCount}+
							{lastTurn.turn.bonusSpawnCount}) · Level:{' '}
							{lastTurn.turn.levelBefore}→{lastTurn.turn.levelAfter} ·
							groups {formatGroups(lastTurn.turn.groupSizes)}
						</Text>
					) : null}

					{lastMetrics ? (
						<Text style={styles.metrics}>
							moves {lastMetrics.moves} · score {lastMetrics.finalScore} ·
							max {lastMetrics.largestValue} · group{' '}
							{lastMetrics.largestGroup} · cascade{' '}
							{lastMetrics.largestCascade}
							{lastMetrics.durationSec !== null
								? ` · ${lastMetrics.durationSec}s`
								: ''}
						</Text>
					) : null}

					<Text style={styles.section}>Fixtures</Text>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.fixtureRow}
					>
						{FIXTURE_IDS.map((id) => (
							<Pressable
								key={id}
								style={styles.fixture}
								onPress={() => onLoadFixture(id)}
								accessibilityLabel={id}
							>
								<Text style={styles.fixtureText}>{id}</Text>
							</Pressable>
						))}
					</ScrollView>
				</>
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
		borderTopColor: '#2a3a50',
		// Keep fixture chips above OPPO 3-button nav (~132px).
		paddingBottom: 140,
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
		color: '#7d8a9c',
		textTransform: 'uppercase',
	},
	collapsedHint: {
		fontSize: 11,
		color: '#7d8a9c',
	},
	section: {
		fontSize: 10,
		fontWeight: '700',
		color: '#7d8a9c',
		textTransform: 'uppercase',
		marginTop: 6,
		marginBottom: 4,
	},
	seedBtn: {
		backgroundColor: '#3a4a63',
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 8,
	},
	seedText: {
		color: '#f8fafc',
		fontSize: 12,
		fontWeight: '600',
	},
	row: {
		flexDirection: 'row',
		flexWrap: 'wrap',
	},
	chip: {
		backgroundColor: '#1e2c42',
		paddingHorizontal: 8,
		paddingVertical: 6,
		borderRadius: 8,
		marginRight: 6,
		marginBottom: 4,
	},
	chipActive: {
		backgroundColor: '#3b82f6',
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
		color: '#a8b4c8',
		marginBottom: 4,
	},
	telemetry: {
		marginTop: 4,
		marginBottom: 4,
		fontSize: 11,
		lineHeight: 16,
		color: '#e8eef7',
		fontFamily: 'monospace',
		backgroundColor: '#162033',
		padding: 8,
		borderRadius: 8,
	},
	metrics: {
		marginTop: 6,
		fontSize: 11,
		color: '#7d8a9c',
	},
	fixtureRow: {
		paddingVertical: 4,
	},
	fixture: {
		backgroundColor: '#1e2c42',
		paddingHorizontal: 10,
		paddingVertical: 8,
		borderRadius: 8,
		marginRight: 6,
	},
	fixtureText: {
		fontSize: 11,
		fontWeight: '600',
		color: '#e8eef7',
	},
})
