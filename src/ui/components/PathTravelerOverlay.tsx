/**
 * Single-tile BFS path overlay driven by native Animated transforms.
 * One traveler only — never one Animated node per board cell.
 * Animates translateX/translateY with useNativeDriver (not left/top).
 */

import { useEffect, useMemo, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'

import type { Position } from '../../game'
import { getHexCellVisual, hexValueFontSize } from '../theme/cellVisuals'

export interface PathTravelerSpec {
	/** Inclusive BFS path (origin → destination). */
	path: Position[]
	value: number
	/** Total wall-clock budget for the whole path. */
	durationMs: number
	/** Bumps to remount / restart when the same path is replayed. */
	playId: number
}

export interface PathTravelerOverlayProps {
	traveler: PathTravelerSpec
	/** Absolute layout origins matching HexBoardView cellOrigin. */
	cellOrigin: (position: Position) => { left: number; top: number }
	cellSize: number
	onComplete: (playId: number) => void
}

/**
 * Build native-driver hop sequence. Equal time per hop from the total budget.
 */
export function buildPathHopDurations (
	pathLength: number,
	totalMs: number,
): number[] {
	const hops = Math.max(1, pathLength - 1)
	const base = Math.max(1, Math.round(totalMs / hops))
	const durations: number[] = []
	let spent = 0
	for (let i = 0; i < hops; i += 1) {
		if (i === hops - 1) {
			durations.push(Math.max(1, totalMs - spent))
		} else {
			durations.push(base)
			spent += base
		}
	}
	return durations
}

export function PathTravelerOverlay (props: PathTravelerOverlayProps) {
	const { traveler, cellOrigin, cellSize, onComplete } = props
	const { path, value, durationMs, playId } = traveler

	const translateX = useMemo(() => new Animated.Value(0), [])
	const translateY = useMemo(() => new Animated.Value(0), [])
	const opacity = useMemo(() => new Animated.Value(1), [])
	const animRef = useRef<Animated.CompositeAnimation | null>(null)
	const completedRef = useRef(false)

	const origin = cellOrigin(path[0]!)
	const visual = getHexCellVisual(value)
	const height = cellSize * 1.1

	useEffect(() => {
		let cancelled = false
		completedRef.current = false
		translateX.setValue(0)
		translateY.setValue(0)
		opacity.setValue(1)

		const hops = Math.max(1, path.length - 1)
		const durations = buildPathHopDurations(path.length, durationMs)
		const start = cellOrigin(path[0]!)

		const hopAnims: Animated.CompositeAnimation[] = []
		for (let i = 1; i < path.length; i += 1) {
			const target = cellOrigin(path[i]!)
			const dx = target.left - start.left
			const dy = target.top - start.top
			const ms = durations[i - 1] ?? Math.max(1, Math.round(durationMs / hops))
			hopAnims.push(
				Animated.parallel([
					Animated.timing(translateX, {
						toValue: dx,
						duration: ms,
						useNativeDriver: true,
					}),
					Animated.timing(translateY, {
						toValue: dy,
						duration: ms,
						useNativeDriver: true,
					}),
				]),
			)
		}

		const animation =
			hopAnims.length === 1
				? hopAnims[0]!
				: Animated.sequence(hopAnims)
		animRef.current = animation

		const finish = () => {
			if (cancelled || completedRef.current) {
				return
			}
			completedRef.current = true
			onComplete(playId)
		}

		animation.start(({ finished }) => {
			animRef.current = null
			// Ignore Strict Mode / stop interruptions — parent or safety finishes.
			if (finished) {
				finish()
			}
		})

		// Safety net if the native animation never reports finished.
		const safety = setTimeout(finish, durationMs + 80)

		return () => {
			cancelled = true
			clearTimeout(safety)
			if (animRef.current) {
				animRef.current.stop()
				animRef.current = null
			}
			// Do NOT onComplete here — React Strict Mode remounts would unlock early.
			// Parent resolveTravelerWaiters / syncDisplay cancels waiters on abort.
		}
		// Intentionally keyed by playId — fresh run per move.
		// eslint-disable-next-line react-hooks/exhaustive-deps -- path/duration captured for this playId
	}, [playId])

	return (
		<Animated.View
			pointerEvents="none"
			style={[
				styles.wrap,
				{
					left: origin.left,
					top: origin.top,
					width: cellSize,
					height,
					opacity,
					transform: [{ translateX }, { translateY }],
					zIndex: 5,
				},
			]}
		>
			<View
				style={[
					styles.face,
					{
						width: cellSize,
						height,
						backgroundColor: visual.fill,
						borderColor: visual.stroke,
					},
				]}
			>
				<Text
					style={{
						color: visual.text,
						fontSize: hexValueFontSize(value, cellSize),
						fontWeight: '800',
					}}
				>
					{String(value)}
				</Text>
			</View>
		</Animated.View>
	)
}

const styles = StyleSheet.create({
	wrap: {
		position: 'absolute',
		elevation: 4,
	},
	face: {
		borderRadius: 14,
		borderWidth: 1.5,
		alignItems: 'center',
		justifyContent: 'center',
	},
})
