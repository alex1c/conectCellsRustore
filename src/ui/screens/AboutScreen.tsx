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
		backgroundColor: '#eef3f8',
		paddingHorizontal: 20,
	},
	back: {
		color: '#1d4ed8',
		fontWeight: '700',
		fontSize: 15,
		marginBottom: 24,
	},
	card: {
		backgroundColor: '#ffffff',
		borderRadius: 16,
		padding: 28,
		alignItems: 'center',
	},
	brand: {
		fontSize: 28,
		fontWeight: '900',
		color: '#0f172a',
		marginBottom: 12,
	},
	line: {
		fontSize: 16,
		color: '#475569',
		marginBottom: 6,
		fontWeight: '600',
	},
})
