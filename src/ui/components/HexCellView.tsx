/**
 * Pointy-top hex cell with selection / pulse / spawn feedback.
 * Logcat may label this as "CellView" via source maps; export is HexCellView.
 */

import { useEffect, useMemo, useRef } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'

import { getHexCellVisual } from '../theme/cellVisuals'

export interface HexCellViewProps {
	value: number | null
	size: number
	selected: boolean
	pulse: boolean
	spawn: boolean
	disabled: boolean
	onPress: () => void
}

/**
 * Render one hex cell. Uses timing/spring only — no Animated.loop.
 * (Loop + string rotate interpolate was a runtime failure path on Hermes.)
 */
export function HexCellView (props: HexCellViewProps) {
	const { value, size, selected, pulse, spawn, disabled, onPress } = props
	const visual = getHexCellVisual(value)

	// Stable Animated.Value instances for the lifetime of this cell.
	const scale = useMemo(() => new Animated.Value(1), [])
	const wobble = useMemo(() => new Animated.Value(0), [])
	const selectionAnimRef = useRef<Animated.CompositeAnimation | null>(null)

	useEffect(() => {
		if (selectionAnimRef.current) {
			selectionAnimRef.current.stop()
			selectionAnimRef.current = null
		}

		if (!selected) {
			wobble.setValue(0)
			Animated.spring(scale, {
				toValue: 1,
				friction: 7,
				useNativeDriver: true,
			}).start()
			return undefined
		}

		// Gentle scale bump + one-shot wobble (no infinite loop API).
		Animated.spring(scale, {
			toValue: 1.06,
			friction: 6,
			useNativeDriver: true,
		}).start()

		const wobbleOnce = Animated.sequence([
			Animated.timing(wobble, {
				toValue: 1,
				duration: 100,
				useNativeDriver: true,
			}),
			Animated.timing(wobble, {
				toValue: -1,
				duration: 100,
				useNativeDriver: true,
			}),
			Animated.timing(wobble, {
				toValue: 0,
				duration: 100,
				useNativeDriver: true,
			}),
		])
		selectionAnimRef.current = wobbleOnce
		wobbleOnce.start()

		return () => {
			wobbleOnce.stop()
			selectionAnimRef.current = null
			wobble.setValue(0)
		}
	}, [selected, scale, wobble])

	useEffect(() => {
		if (!pulse) {
			return undefined
		}
		const animation = Animated.sequence([
			Animated.timing(scale, {
				toValue: 1.12,
				duration: 90,
				useNativeDriver: true,
			}),
			Animated.timing(scale, {
				toValue: selected ? 1.06 : 1,
				duration: 90,
				useNativeDriver: true,
			}),
		])
		animation.start()
		return () => {
			animation.stop()
		}
	}, [pulse, scale, selected])

	useEffect(() => {
		if (!spawn) {
			return undefined
		}
		scale.setValue(0.6)
		const animation = Animated.timing(scale, {
			toValue: 1,
			duration: 160,
			useNativeDriver: true,
		})
		animation.start()
		return () => {
			animation.stop()
		}
	}, [spawn, scale])

	const rotate = wobble.interpolate({
		inputRange: [-1, 1],
		outputRange: ['-4deg', '4deg'],
	})

	const width = size
	const height = size * 1.1
	const fontSize = value !== null && value >= 100 ? size * 0.28 : size * 0.36

	return (
		<Pressable disabled={disabled} onPress={onPress}>
			<Animated.View
				style={[
					styles.hex,
					{
						width,
						height,
						backgroundColor: visual.fill,
						borderColor: selected ? '#1d4ed8' : visual.stroke,
						borderWidth: selected ? 3 : 1.5,
						transform: [{ scale }, { rotate }],
					},
				]}
			>
				{value !== null ? (
					<Text style={[styles.label, { color: visual.text, fontSize }]}>
						{String(value)}
					</Text>
				) : (
					<View />
				)}
			</Animated.View>
		</Pressable>
	)
}

const styles = StyleSheet.create({
	hex: {
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
	},
	label: {
		fontWeight: '800',
	},
})
