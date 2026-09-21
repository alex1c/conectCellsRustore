/**
 * DEV-only RuStore fixture loader.
 * When store-capture UI is hidden, chrome is fully invisible (production-identical
 * pixels). An opacity-0 a11y target remains for the capture script to reopen.
 */

import { useSyncExternalStore } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import {
	SCREENSHOT_FIXTURE_IDS,
	type FixtureId,
} from '../../game/fixtures'
import {
	isStoreCaptureUiHidden,
	setStoreCaptureUiHidden,
	subscribeStoreCaptureUi,
} from '../dev/storeCaptureUi'

export interface ScreenshotCaptureBarProps {
	onLoadFixture: (id: FixtureId) => void
}

export function ScreenshotCaptureBar (props: ScreenshotCaptureBarProps) {
	const { onLoadFixture } = props
	const captureHidden = useSyncExternalStore(
		subscribeStoreCaptureUi,
		isStoreCaptureUiHidden,
		isStoreCaptureUiHidden,
	)

	if (!__DEV__) {
		return null
	}

	if (captureHidden) {
		// 1×1 a11y hit-target so capture scripts can reopen the bar without
		// painting any DEV chrome into store screenshots.
		return (
			<Pressable
				style={styles.invisibleReopen}
				onPress={() => setStoreCaptureUiHidden(false)}
				accessibilityLabel="showScreenshotBar"
				accessible
				collapsable={false}
			/>
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
					onPress={() => setStoreCaptureUiHidden(true)}
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
	invisibleReopen: {
		position: 'absolute',
		// Transparent hit-target for capture scripts — paints no DEV chrome.
		bottom: 8,
		left: 8,
		width: 48,
		height: 48,
		opacity: 0,
		backgroundColor: 'transparent',
		zIndex: 50,
		elevation: 50,
	},
})
