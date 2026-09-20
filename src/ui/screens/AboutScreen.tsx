/**
 * About screen — brand, publisher, version.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
	APP_DISPLAY_NAME,
	APP_PUBLISHER,
	APP_VERSION,
} from '../../branding'
import {
	COLOR_ACCENT,
	COLOR_SURFACE,
	COLOR_SURFACE_CARD,
	COLOR_TEXT,
	COLOR_TEXT_MUTED,
} from '../theme/colors'

export interface AboutScreenProps {
	onBack: () => void
}

export function AboutScreen (props: AboutScreenProps) {
	const { onBack } = props
	const insets = useSafeAreaInsets()

	return (
		<View
			style={[
				styles.root,
				{ paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 8) },
			]}
		>
			<Pressable onPress={onBack} hitSlop={12}>
				<Text style={styles.back}>← Назад</Text>
			</Pressable>
			<View style={styles.card}>
				<Text style={styles.brand}>{APP_DISPLAY_NAME}</Text>
				<Text style={styles.line}>{APP_PUBLISHER}</Text>
				<Text style={styles.line}>Версия {APP_VERSION}</Text>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: COLOR_SURFACE,
		paddingHorizontal: 20,
	},
	back: {
		color: COLOR_ACCENT,
		fontWeight: '700',
		fontSize: 15,
		marginBottom: 24,
	},
	card: {
		backgroundColor: COLOR_SURFACE_CARD,
		borderRadius: 16,
		padding: 28,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#c5d0e0',
	},
	brand: {
		fontSize: 28,
		fontWeight: '900',
		color: COLOR_TEXT,
		marginBottom: 12,
	},
	line: {
		fontSize: 16,
		color: COLOR_TEXT_MUTED,
		marginBottom: 6,
		fontWeight: '600',
	},
})
