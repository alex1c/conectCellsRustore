/**
 * Score / best header for the main play screen.
 */

import { StyleSheet, Text, View } from 'react-native'

export interface ScoreHeaderProps {
	score: number
	best: number
	gainFlash: number | null
}

export function ScoreHeader (props: ScoreHeaderProps) {
	const { score, best, gainFlash } = props
	return (
		<View style={styles.row}>
			<View style={styles.block}>
				<Text style={styles.label}>Score</Text>
				<Text style={styles.value}>{score}</Text>
				{gainFlash !== null ? (
					<Text style={styles.gain}>+{gainFlash}</Text>
				) : null}
			</View>
			<View style={[styles.block, styles.alignEnd]}>
				<Text style={styles.label}>Best</Text>
				<Text style={styles.value}>{best}</Text>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	row: {
		width: '100%',
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 16,
	},
	block: {
		minWidth: 120,
	},
	alignEnd: {
		alignItems: 'flex-end',
	},
	label: {
		fontSize: 13,
		color: '#64748b',
		fontWeight: '600',
		textTransform: 'uppercase',
		letterSpacing: 0.6,
	},
	value: {
		fontSize: 28,
		fontWeight: '800',
		color: '#0f172a',
	},
	gain: {
		marginTop: 2,
		fontSize: 14,
		fontWeight: '700',
		color: '#16a34a',
	},
})
