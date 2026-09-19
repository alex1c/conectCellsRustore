/**
 * Shared confirmation modal used by New Game / Rewarded Undo prompts.
 */

import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'

export interface ConfirmDialogProps {
	visible: boolean
	title: string
	body: string
	confirmLabel: string
	cancelLabel?: string
	busy?: boolean
	onCancel: () => void
	onConfirm: () => void
}

export function ConfirmDialog (props: ConfirmDialogProps) {
	const {
		visible,
		title,
		body,
		confirmLabel,
		cancelLabel = 'Отмена',
		busy = false,
		onCancel,
		onConfirm,
	} = props
	return (
		<Modal visible={visible} transparent animationType="fade">
			<View style={styles.backdrop}>
				<View style={styles.card}>
					<Text style={styles.title}>{title}</Text>
					<Text style={styles.body}>{body}</Text>
					<View style={styles.actions}>
						<Pressable
							style={styles.cancel}
							onPress={onCancel}
							disabled={busy}
						>
							<Text style={styles.cancelText}>{cancelLabel}</Text>
						</Pressable>
						<Pressable
							style={[styles.confirm, busy && styles.disabled]}
							onPress={onConfirm}
							disabled={busy}
						>
							<Text style={styles.confirmText}>
								{busy ? 'Загрузка…' : confirmLabel}
							</Text>
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
		lineHeight: 22,
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
	disabled: {
		opacity: 0.6,
	},
})
