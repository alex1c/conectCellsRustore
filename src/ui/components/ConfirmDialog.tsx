/**
 * Shared confirmation modal used by New Game / Rewarded Undo prompts.
 * Dark theme is the only 1.0 appearance.
 */

import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'

import {
	COLOR_ACCENT,
	COLOR_BUTTON_PRIMARY_TEXT,
	COLOR_BUTTON_SECONDARY,
	COLOR_DIVIDER,
	COLOR_MODAL_SCRIM,
	COLOR_SURFACE_ELEVATED,
	COLOR_TEXT,
	COLOR_TEXT_SECONDARY,
} from '../theme/colors'

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
		backgroundColor: COLOR_MODAL_SCRIM,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 24,
	},
	card: {
		width: '100%',
		maxWidth: 360,
		backgroundColor: COLOR_SURFACE_ELEVATED,
		borderRadius: 16,
		padding: 22,
		borderWidth: 1,
		borderColor: COLOR_DIVIDER,
	},
	title: {
		fontSize: 20,
		fontWeight: '800',
		color: COLOR_TEXT,
		marginBottom: 8,
	},
	body: {
		fontSize: 15,
		color: COLOR_TEXT_SECONDARY,
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
		backgroundColor: COLOR_BUTTON_SECONDARY,
	},
	cancelText: {
		fontWeight: '600',
		color: COLOR_TEXT,
	},
	confirm: {
		paddingHorizontal: 14,
		paddingVertical: 12,
		borderRadius: 10,
		backgroundColor: COLOR_ACCENT,
	},
	confirmText: {
		fontWeight: '700',
		color: COLOR_BUTTON_PRIMARY_TEXT,
	},
	disabled: {
		opacity: 0.6,
	},
})
