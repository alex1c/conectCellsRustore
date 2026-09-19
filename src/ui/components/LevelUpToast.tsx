/**
 * Brief non-blocking level-up toast (~1.2s).
 */

import { useEffect, useMemo } from 'react'
import { Animated, StyleSheet, Text } from 'react-native'

export interface LevelUpToastProps {
	visible: boolean
	level: number
	onHidden: () => void
}

const SHOW_MS = 1300

export function LevelUpToast (props: LevelUpToastProps) {
	const { visible, level, onHidden } = props
	// Stable Animated.Value for the lifetime of this toast (same pattern as HexCellView).
	const opacity = useMemo(() => new Animated.Value(0), [])

	useEffect(() => {
		if (!visible) {
			return undefined
		}
		opacity.setValue(0)
		const show = Animated.sequence([
			Animated.timing(opacity, {
				toValue: 1,
				duration: 160,
				useNativeDriver: true,
			}),
			Animated.delay(SHOW_MS - 320),
			Animated.timing(opacity, {
				toValue: 0,
				duration: 160,
				useNativeDriver: true,
			}),
		])
		show.start(({ finished }) => {
			if (finished) {
				onHidden()
			}
		})
		return () => {
			show.stop()
		}
	}, [visible, level, opacity, onHidden])

	if (!visible) {
		return null
	}

	return (
		<Animated.View style={[styles.toast, { opacity }]} pointerEvents="none">
			<Text style={styles.title}>Уровень {level}</Text>
			<Text style={styles.sub}>Сложность растёт</Text>
		</Animated.View>
	)
}

const styles = StyleSheet.create({
	toast: {
		position: 'absolute',
		alignSelf: 'center',
		top: '38%',
		minWidth: 200,
		paddingHorizontal: 28,
		paddingVertical: 18,
		borderRadius: 16,
		backgroundColor: 'rgba(15, 23, 42, 0.92)',
		alignItems: 'center',
		zIndex: 20,
	},
	title: {
		color: '#f8fafc',
		fontSize: 22,
		fontWeight: '800',
	},
	sub: {
		marginTop: 4,
		color: '#cbd5e1',
		fontSize: 13,
		fontWeight: '600',
	},
})
