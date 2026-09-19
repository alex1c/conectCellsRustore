/**
 * Score / level / best header with thin level progress bar.
 */

import { StyleSheet, Text, View } from 'react-native'

export interface ScoreHeaderProps {
	score: number
	best: number
	level: number
	levelProgress: number
	gainFlash: number | null
}

export function ScoreHeader (props: ScoreHeaderProps) {
	const { score, best, level, levelProgress, gainFlash } = props
	const clamped = Math.min(1, Math.max(0, levelProgress))

	return (
		<View style={styles.wrap}>
			<View style={styles.row}>
				<View style={styles.block}>
					<Text style={styles.label}>Счёт</Text>
					<Text style={styles.value}>{score}</Text>
					{gainFlash !== null ? (
						<Text style={styles.gain}>+{gainFlash}</Text>
					) : null}
				</View>
				<View style={[styles.block, styles.alignCenter]}>
					<Text style={styles.label}>Уровень</Text>
					<Text style={styles.value}>{level}</Text>
				</View>
				<View style={[styles.block, styles.alignEnd]}>
					<Text style={styles.label}>Рекорд</Text>
					<Text style={styles.value}>{best}</Text>
				</View>
			</View>
			<View style={styles.track}>
				<View style={[styles.fill, { width: `${clamped * 100}%` }]} />
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	wrap: {
		width: '100%',
		marginBottom: 10,
	},
	row: {
		width: '100%',
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	block: {
		flex: 1,
		minWidth: 80,
	},
	alignCenter: {
		alignItems: 'center',
	},
	alignEnd: {
		alignItems: 'flex-end',
	},
	label: {
		fontSize: 12,
		color: '#64748b',
		fontWeight: '600',
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	value: {
		fontSize: 24,
		fontWeight: '800',
		color: '#0f172a',
	},
	gain: {
		marginTop: 2,
		fontSize: 13,
		fontWeight: '700',
		color: '#16a34a',
	},
	track: {
		height: 4,
		borderRadius: 2,
		backgroundColor: '#dbe3ef',
		overflow: 'hidden',
	},
	fill: {
		height: '100%',
		backgroundColor: '#1d4ed8',
		borderRadius: 2,
	},
})
