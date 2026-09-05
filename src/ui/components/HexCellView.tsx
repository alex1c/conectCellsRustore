/**
 * Pointy-top hex cell with selection wobble / pulse feedback.
 */

import { useEffect, useMemo } from 'react'
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

export function HexCellView (props: HexCellViewProps) {
	const { value, size, selected, pulse, spawn, disabled, onPress } = props
	const visual = getHexCellVisual(value)
	const scale = useMemo(() => new Animated.Value(1), [])
	const wobble = useMemo(() => new Animated.Value(0), [])

	useEffect(() => {
		if (selected) {
			const loop = Animated.loop(
				Animated.sequence([
					Animated.timing(wobble, {
						toValue: 1,
						duration: 120,
						useNativeDriver: true,
					}),
					Animated.timing(wobble, {
						toValue: -1,
						duration: 120,
						useNativeDriver: true,
					}),
					Animated.timing(wobble, {
						toValue: 0,
						duration: 120,
						useNativeDriver: true,
					}),
				]),
			)
			loop.start()
			return () => {
				loop.stop()
				wobble.setValue(0)
			}
		}
		wobble.setValue(0)
		return undefined
	}, [selected, wobble])

	useEffect(() => {
		if (pulse) {
			Animated.sequence([
				Animated.timing(scale, {
					toValue: 1.12,
					duration: 90,
					useNativeDriver: true,
				}),
				Animated.timing(scale, {
					toValue: 1,
					duration: 90,
					useNativeDriver: true,
				}),
			]).start()
		}
	}, [pulse, scale])

	useEffect(() => {
		if (spawn) {
			scale.setValue(0.6)
			Animated.timing(scale, {
				toValue: 1,
				duration: 160,
				useNativeDriver: true,
			}).start()
		}
	}, [spawn, scale])

	const rotate = wobble.interpolate({
		inputRange: [-1, 1],
		outputRange: ['-4deg', '4deg'],
	})

	const width = size
	const height = size * 1.1

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
					<Text
						style={[
							styles.label,
							{
								color: visual.text,
								fontSize: value >= 100 ? size * 0.28 : size * 0.36,
							},
						]}
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
