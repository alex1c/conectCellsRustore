/**
 * Brief non-blocking level-up toast (~1.2s).
 */

import { useEffect, useMemo } from 'react'
import { Animated, StyleSheet, Text } from 'react-native'

import { TIMING_LEVEL_UP_MS } from '../feel/timings'

export interface LevelUpToastProps {
	visible: boolean
	level: number
	onHidden: () => void
}

export function LevelUpToast (props: LevelUpToastProps) {
	const { visible, level, onHidden } = props
	// Stable Animated.Value for the lifetime of this toast (same pattern as HexCellView).
	const opacity = useMemo(() => new Animated.Value(0), [])
	const scale = useMemo(() => new Animated.Value(0.94), [])

	useEffect(() => {
		if (!visible) {
			return undefined
		}
		opacity.setValue(0)
		scale.setValue(0.94)
		const show = Animated.sequence([
			Animated.parallel([
				Animated.timing(opacity, {
					toValue: 1,
					duration: 160,
					useNativeDriver: true,
				}),
				Animated.timing(scale, {
					toValue: 1,
					duration: 160,
					useNativeDriver: true,
				}),
			]),
			Animated.delay(TIMING_LEVEL_UP_MS - 320),
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
	}, [visible, level, opacity, scale, onHidden])

	if (!visible) {
		return null
	}

	return (
		<Animated.View
			style={[styles.toast, { opacity, transform: [{ scale }] }]}
			pointerEvents="none"
		>
			<Text style={styles.title}>Уровень {level}</Text>
			<Text style={styles.sub}>Сложность повышена</Text>
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
