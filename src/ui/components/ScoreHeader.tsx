/**
 * Score / level / best header with thin level progress bar.
 * Geometry is intentionally STABLE — gain flash must never change header
 * height (that previously recentered HexBoard via flex + justifyContent).
 */

import { StyleSheet, Text, View } from 'react-native'

import {
	COLOR_PROGRESS_FILL,
	COLOR_PROGRESS_TRACK,
	COLOR_SCORE_GAIN,
	COLOR_TEXT,
	COLOR_TEXT_MUTED,
} from '../theme/colors'

export interface ScoreHeaderProps {
	score: number
	best: number
	level: number
	levelProgress: number
	gainFlash: number | null
}

/** Fixed slot under the score value so +gain never reflows the board. */
export const SCORE_GAIN_SLOT_HEIGHT = 16

export function ScoreHeader (props: ScoreHeaderProps) {
	const { score, best, level, levelProgress, gainFlash } = props
	const clamped = Math.min(1, Math.max(0, levelProgress))

	return (
		<View style={styles.wrap}>
			<View style={styles.row}>
				<View style={styles.block}>
					<Text style={styles.label}>Счёт</Text>
					{/* Fixed-height value line — digit growth must not reflow. */}
					<View style={styles.valueSlot}>
						<Text
							style={styles.value}
							numberOfLines={1}
							adjustsFontSizeToFit
							minimumFontScale={0.7}
						>
							{score}
						</Text>
					</View>
					{/* Always-reserved gain slot; text overlays inside (no mount height). */}
					<View style={styles.gainSlot} pointerEvents="none">
						{gainFlash !== null ? (
							<Text style={styles.gain}>+{gainFlash}</Text>
						) : null}
					</View>
				</View>
				<View style={[styles.block, styles.alignCenter]}>
					<Text style={styles.label}>Уровень</Text>
					<View style={styles.valueSlot}>
						<Text style={styles.value} numberOfLines={1}>
							{level}
						</Text>
					</View>
					{/* Matching spacer so all three columns share identical height. */}
					<View style={styles.gainSlot} />
				</View>
				<View style={[styles.block, styles.alignEnd]}>
					<Text style={styles.label}>Рекорд</Text>
					<View style={styles.valueSlot}>
						<Text
							style={[styles.value, styles.valueEnd]}
							numberOfLines={1}
							adjustsFontSizeToFit
							minimumFontScale={0.7}
						>
							{best}
						</Text>
					</View>
					<View style={styles.gainSlot} />
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
		alignItems: 'flex-start',
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
		color: COLOR_TEXT_MUTED,
		fontWeight: '600',
		textTransform: 'uppercase',
		letterSpacing: 0.5,
		height: 16,
	},
	valueSlot: {
		height: 30,
		justifyContent: 'center',
	},
	value: {
		fontSize: 24,
		fontWeight: '800',
		color: COLOR_TEXT,
		lineHeight: 30,
		fontVariant: ['tabular-nums'],
	},
	valueEnd: {
		textAlign: 'right',
	},
	gainSlot: {
		height: SCORE_GAIN_SLOT_HEIGHT,
		justifyContent: 'flex-start',
	},
	gain: {
		fontSize: 13,
		fontWeight: '700',
		color: COLOR_SCORE_GAIN,
		lineHeight: SCORE_GAIN_SLOT_HEIGHT,
	},
	track: {
		height: 5,
		borderRadius: 999,
		backgroundColor: COLOR_PROGRESS_TRACK,
		overflow: 'hidden',
	},
	fill: {
		height: '100%',
		backgroundColor: COLOR_PROGRESS_FILL,
		borderRadius: 999,
	},
})
