/**
 * Brief cascade chain indicator (visual feedback only — no score multiplier).
 */

import { useEffect, useMemo } from 'react'
import { Animated, StyleSheet, Text } from 'react-native'

import { TIMING_CHAIN_TOAST_MS } from '../feel/timings'

export interface ChainToastProps {
	visible: boolean
	cascadeLevel: number
	onHidden: () => void
}

export function ChainToast (props: ChainToastProps) {
	const { visible, cascadeLevel, onHidden } = props
	const opacity = useMemo(() => new Animated.Value(0), [])

	useEffect(() => {
		if (!visible || cascadeLevel < 3) {
			return undefined
		}
		opacity.setValue(0)
		const show = Animated.sequence([
			Animated.timing(opacity, {
				toValue: 1,
				duration: 120,
				useNativeDriver: true,
			}),
			Animated.delay(TIMING_CHAIN_TOAST_MS - 240),
			Animated.timing(opacity, {
				toValue: 0,
				duration: 120,
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
	}, [visible, cascadeLevel, opacity, onHidden])

	if (!visible || cascadeLevel < 3) {
		return null
	}

	return (
		<Animated.View style={[styles.toast, { opacity }]} pointerEvents="none">
			<Text style={styles.text}>Цепочка ×{cascadeLevel}</Text>
		</Animated.View>
	)
}

const styles = StyleSheet.create({
	toast: {
		position: 'absolute',
		alignSelf: 'center',
		top: '28%',
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 999,
		backgroundColor: 'rgba(29, 78, 216, 0.92)',
		zIndex: 18,
	},
	text: {
		color: '#f8fafc',
		fontWeight: '800',
		fontSize: 14,
		letterSpacing: 0.3,
	},
})
