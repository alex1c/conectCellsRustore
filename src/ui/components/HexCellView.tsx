/**
 * Pointy-top hex cell with selection / pulse / spawn / shrink feedback.
 * Uses timing/spring only — never Animated.loop (Hermes-fragile).
 */

import { useEffect, useMemo, useRef } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'

import { TIMING_SELECTION_MS, TIMING_SPAWN_MS } from '../feel/timings'
import { getHexCellVisual, hexValueFontSize } from '../theme/cellVisuals'

export interface HexCellViewProps {
	value: number | null
	size: number
	selected: boolean
	pulse: boolean
	/** Extra-strong pop for large merges / cascade. */
	pulseStrong?: boolean
	spawn: boolean
	/** Merge converge: shrink absorbed cells. */
	shrinking?: boolean
	/** Light shake when path is blocked while selected. */
	shake?: boolean
	disabled: boolean
	onPress: () => void
	/** Expand pressable hit area slightly beyond the visual hex. */
	hitSlop?: number
}

export function HexCellView (props: HexCellViewProps) {
	const {
		value,
		size,
		selected,
		pulse,
		pulseStrong = false,
		spawn,
		shrinking = false,
		shake = false,
		disabled,
		onPress,
		hitSlop = 6,
	} = props
	const visual = getHexCellVisual(value)

	const scale = useMemo(() => new Animated.Value(1), [])
	const wobble = useMemo(() => new Animated.Value(0), [])
	const opacity = useMemo(() => new Animated.Value(1), [])
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

		Animated.spring(scale, {
			toValue: 1.07,
			friction: 6,
			useNativeDriver: true,
		}).start()

		const wobbleOnce = Animated.sequence([
			Animated.timing(wobble, {
				toValue: 1,
				duration: TIMING_SELECTION_MS,
				useNativeDriver: true,
			}),
			Animated.timing(wobble, {
				toValue: -1,
				duration: TIMING_SELECTION_MS,
				useNativeDriver: true,
			}),
			Animated.timing(wobble, {
				toValue: 0,
				duration: TIMING_SELECTION_MS,
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
		const peak = pulseStrong ? 1.2 : 1.12
		const animation = Animated.sequence([
			Animated.timing(scale, {
				toValue: peak,
				duration: pulseStrong ? 110 : 90,
				useNativeDriver: true,
			}),
			Animated.timing(scale, {
				toValue: selected ? 1.07 : 1,
				duration: pulseStrong ? 110 : 90,
				useNativeDriver: true,
			}),
		])
		animation.start()
		return () => {
			animation.stop()
		}
	}, [pulse, pulseStrong, scale, selected])

	useEffect(() => {
		if (!spawn) {
			return undefined
		}
		scale.setValue(0.7)
		opacity.setValue(0.35)
		const animation = Animated.parallel([
			Animated.timing(scale, {
				toValue: 1,
				duration: TIMING_SPAWN_MS,
				useNativeDriver: true,
			}),
			Animated.timing(opacity, {
				toValue: 1,
				duration: TIMING_SPAWN_MS,
				useNativeDriver: true,
			}),
		])
		animation.start()
		return () => {
			animation.stop()
		}
	}, [spawn, scale, opacity])

	useEffect(() => {
		if (!shrinking) {
			opacity.setValue(1)
			return undefined
		}
		const animation = Animated.parallel([
			Animated.timing(scale, {
				toValue: 0.35,
				duration: 130,
				useNativeDriver: true,
			}),
			Animated.timing(opacity, {
				toValue: 0.15,
				duration: 130,
				useNativeDriver: true,
			}),
		])
		animation.start()
		return () => {
			animation.stop()
		}
	}, [shrinking, scale, opacity])

	useEffect(() => {
		if (!shake) {
			return undefined
		}
		const animation = Animated.sequence([
			Animated.timing(wobble, {
				toValue: 1.4,
				duration: 50,
				useNativeDriver: true,
			}),
			Animated.timing(wobble, {
				toValue: -1.4,
				duration: 50,
				useNativeDriver: true,
			}),
			Animated.timing(wobble, {
				toValue: 0.8,
				duration: 50,
				useNativeDriver: true,
			}),
			Animated.timing(wobble, {
				toValue: 0,
				duration: 50,
				useNativeDriver: true,
			}),
		])
		animation.start()
		return () => {
			animation.stop()
		}
	}, [shake, wobble])

	const rotate = wobble.interpolate({
		inputRange: [-1.5, 1.5],
		outputRange: ['-5deg', '5deg'],
	})

	const width = size
	const height = size * 1.1
	const fontSize =
		value !== null ? hexValueFontSize(value, size) : size * 0.36

	return (
		<Pressable
			disabled={disabled}
			onPress={onPress}
			hitSlop={hitSlop}
			accessibilityRole="button"
		>
			<Animated.View
				style={[
					styles.hex,
					{
						width,
						height,
						backgroundColor: visual.fill,
						borderColor: selected ? '#1d4ed8' : visual.stroke,
						borderWidth: selected ? 3 : value === null ? 1 : 1.5,
						opacity,
						transform: [{ scale }, { rotate }],
					},
				]}
			>
				{value !== null ? (
					<Text
						style={[styles.label, { color: visual.text, fontSize }]}
						numberOfLines={1}
						adjustsFontSizeToFit
					>
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
