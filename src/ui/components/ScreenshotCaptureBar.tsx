/**
 * DEV-only top strip for RuStore screenshot fixtures.
 * Kept near the header so adb taps never hit the OPPO gesture/nav zone.
 * Production builds never mount this component (__DEV__ gate at call site).
 */

import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import {
	SCREENSHOT_FIXTURE_IDS,
	type FixtureId,
} from '../../game/fixtures'

export interface ScreenshotCaptureBarProps {
	onLoadFixture: (id: FixtureId) => void
}

export function ScreenshotCaptureBar (props: ScreenshotCaptureBarProps) {
	const { onLoadFixture } = props
	const [visible, setVisible] = useState(true)

	if (!__DEV__) {
		return null
	}

	if (!visible) {
		// Keep a barely-visible but a11y-present reopen control for capture scripts.
		return (
			<Pressable
				style={styles.toggle}
				onPress={() => setVisible(true)}
				accessibilityLabel="showScreenshotBar"
			>
				<Text style={styles.toggleText}>shots</Text>
			</Pressable>
		)
	}

	return (
		<View style={styles.bar} pointerEvents="box-none">
			<View style={styles.row}>
				{SCREENSHOT_FIXTURE_IDS.map((id) => (
					<Pressable
						key={id}
						style={styles.chip}
						onPress={() => {
							onLoadFixture(id)
						}}
						accessibilityLabel={id}
					>
						<Text style={styles.chipText}>
							{id.replace('screenshot', '')}
						</Text>
					</Pressable>
				))}
				<Pressable
					style={styles.hideChip}
					onPress={() => setVisible(false)}
					accessibilityLabel="hideScreenshotBar"
				>
					<Text style={styles.chipText}>hide</Text>
				</Pressable>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	bar: {
		// Sit under the score header — clear of status bar / gear / gesture zone.
		position: 'absolute',
		top: 210,
		left: 8,
		right: 8,
		zIndex: 50,
		elevation: 50,
	},
	row: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 6,
		backgroundColor: 'rgba(10, 16, 28, 0.92)',
		borderRadius: 10,
		padding: 8,
		borderWidth: 1,
		borderColor: '#2a3a50',
	},
	chip: {
		backgroundColor: '#1e2c42',
		paddingHorizontal: 8,
		paddingVertical: 6,
		borderRadius: 8,
	},
	hideChip: {
		backgroundColor: '#3a4a63',
		paddingHorizontal: 8,
		paddingVertical: 6,
		borderRadius: 8,
	},
	chipText: {
		color: '#e8eef7',
		fontSize: 11,
		fontWeight: '700',
	},
	toggle: {
		// Below the 1080x1920 store crop on OPPO 1080x2400 (crop starts at y=80 → ends 2000).
		position: 'absolute',
		bottom: 20,
		left: 12,
		zIndex: 50,
		elevation: 50,
		backgroundColor: '#3a4a63',
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 8,
	},
	toggleText: {
		color: '#f8fafc',
		fontSize: 11,
		fontWeight: '700',
	},
})
