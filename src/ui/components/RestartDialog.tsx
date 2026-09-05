/**
 * Restart confirmation dialog.
 */

import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'

export interface RestartDialogProps {
	visible: boolean
	onCancel: () => void
	onConfirm: () => void
}

export function RestartDialog (props: RestartDialogProps) {
	const { visible, onCancel, onConfirm } = props
	return (
		<Modal visible={visible} transparent animationType="fade">
			<View style={styles.backdrop}>
				<View style={styles.card}>
					<Text style={styles.title}>Начать новую игру?</Text>
					<Text style={styles.body}>
						Текущая партия будет потеряна.
					</Text>
					<View style={styles.actions}>
						<Pressable style={styles.cancel} onPress={onCancel}>
							<Text style={styles.cancelText}>Отмена</Text>
						</Pressable>
						<Pressable style={styles.confirm} onPress={onConfirm}>
							<Text style={styles.confirmText}>Новая игра</Text>
						</Pressable>
					</View>
				</View>
			</View>
		</Modal>
	)
}

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: 'rgba(15, 23, 42, 0.45)',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 24,
	},
	card: {
		width: '100%',
		maxWidth: 360,
		backgroundColor: '#ffffff',
		borderRadius: 16,
		padding: 22,
	},
	title: {
		fontSize: 20,
		fontWeight: '800',
		color: '#0f172a',
		marginBottom: 8,
	},
	body: {
		fontSize: 15,
		color: '#475569',
		marginBottom: 18,
	},
	actions: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		gap: 10,
	},
	cancel: {
		paddingHorizontal: 14,
		paddingVertical: 12,
		borderRadius: 10,
		backgroundColor: '#e2e8f0',
	},
	cancelText: {
		fontWeight: '600',
		color: '#0f172a',
	},
	confirm: {
		paddingHorizontal: 14,
		paddingVertical: 12,
		borderRadius: 10,
		backgroundColor: '#2563eb',
	},
	confirmText: {
		fontWeight: '700',
		color: '#ffffff',
	},
})
