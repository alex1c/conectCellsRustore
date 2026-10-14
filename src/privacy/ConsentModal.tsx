/**
 * First-party privacy purpose dialog (Google Play).
 * Independent analytics + ads switches; defaults OFF on first choice.
 * Persist failures keep the dialog open for Retry.
 */

import { useCallback, useState } from 'react'
import {
	ActivityIndicator,
	Linking,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTranslation } from '../localization/useTranslation'
import {
	COLOR_ACCENT,
	COLOR_APP_BACKGROUND,
	COLOR_DIVIDER,
	COLOR_SWITCH_THUMB,
	COLOR_SWITCH_TRACK_OFF,
	COLOR_SWITCH_TRACK_ON,
	COLOR_TEXT,
	COLOR_TEXT_MUTED,
	COLOR_TEXT_SECONDARY,
} from '../ui/theme/colors'
import type { PurposeDecision } from './consentPersistence'
import { PRIVACY_POLICY_URL } from './privacyUrls'
import type { PrivacyConsentState } from './usePrivacyConsent'

export type ConsentModalProps = {
	consent: PrivacyConsentState
}

/**
 * Draft switches remount when the editor opens so Settings reopen
 * prefills from saved decisions without an effect setState.
 */
function ConsentDraftForm (props: {
	initialAnalyticsOn: boolean
	initialAdsOn: boolean
	persistError: boolean
	busy: boolean
	onBusy: (value: boolean) => void
	onSave: (analytics: boolean, ads: boolean) => Promise<void>
}) {
	const {
		initialAnalyticsOn,
		initialAdsOn,
		persistError,
		busy,
		onBusy,
		onSave,
	} = props
	const { t } = useTranslation()
	const [analyticsOn, setAnalyticsOn] = useState(initialAnalyticsOn)
	const [adsOn, setAdsOn] = useState(initialAdsOn)

	const handleSave = useCallback(
		async (analytics: boolean, ads: boolean) => {
			if (busy) {
				return
			}
			onBusy(true)
			try {
				await onSave(analytics, ads)
			} catch {
				// persistError flag set by hook — keep dialog open.
			} finally {
				onBusy(false)
			}
		},
		[busy, onBusy, onSave],
	)

	const handleOpenPolicy = useCallback(() => {
		void Linking.openURL(PRIVACY_POLICY_URL)
	}, [])

	return (
		<>
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.scrollContent}
				keyboardShouldPersistTaps="handled"
			>
				<Text style={styles.title}>{t('privacy.title')}</Text>
				<Text style={styles.body}>{t('privacy.body')}</Text>
				<Pressable onPress={handleOpenPolicy} hitSlop={8}>
					<Text style={styles.link}>{t('privacy.policyLink')}</Text>
				</Pressable>

				<View style={styles.row}>
					<View style={styles.rowText}>
						<Text style={styles.label}>{t('privacy.analytics')}</Text>
						<Text style={styles.hint}>{t('privacy.analyticsHint')}</Text>
					</View>
					<Switch
						value={analyticsOn}
						onValueChange={setAnalyticsOn}
						trackColor={{
							false: COLOR_SWITCH_TRACK_OFF,
							true: COLOR_SWITCH_TRACK_ON,
						}}
						thumbColor={COLOR_SWITCH_THUMB}
					/>
				</View>
				<View style={[styles.row, styles.rowLast]}>
					<View style={styles.rowText}>
						<Text style={styles.label}>{t('privacy.ads')}</Text>
						<Text style={styles.hint}>{t('privacy.adsHint')}</Text>
					</View>
					<Switch
						value={adsOn}
						onValueChange={setAdsOn}
						trackColor={{
							false: COLOR_SWITCH_TRACK_OFF,
							true: COLOR_SWITCH_TRACK_ON,
						}}
						thumbColor={COLOR_SWITCH_THUMB}
					/>
				</View>

				{persistError ? (
					<Text style={styles.error}>{t('privacy.persistError')}</Text>
				) : null}
			</ScrollView>

			<Pressable
				style={[styles.primaryBtn, busy && styles.btnDisabled]}
				disabled={busy}
				onPress={() => {
					void handleSave(analyticsOn, adsOn)
				}}
			>
				{busy ? (
					<ActivityIndicator color="#0b1220" />
				) : (
					<Text style={styles.primaryBtnText}>
						{persistError ? t('privacy.retry') : t('privacy.save')}
					</Text>
				)}
			</Pressable>
			<Pressable
				style={styles.secondaryBtn}
				disabled={busy}
				onPress={() => {
					void handleSave(false, false)
				}}
			>
				<Text style={styles.secondaryBtnText}>
					{t('privacy.declineOptional')}
				</Text>
			</Pressable>
		</>
	)
}

export function ConsentModal (props: ConsentModalProps) {
	const { consent } = props
	const insets = useSafeAreaInsets()
	const [busy, setBusy] = useState(false)

	const visible =
		consent.ready &&
		consent.requirement.requiresExplicitConsent &&
		(consent.pending || consent.editorVisible || consent.persistError)

	const toDecision = (on: boolean): PurposeDecision =>
		on ? 'granted' : 'denied'

	const handleSave = useCallback(
		async (analytics: boolean, ads: boolean) => {
			await consent.savePurposes({
				analytics: toDecision(analytics),
				ads: toDecision(ads),
			})
		},
		[consent],
	)

	// First prompt: both OFF. Settings editor: seed from saved decisions.
	const initialAnalyticsOn =
		consent.editorVisible && !consent.pending
			? consent.analytics === 'granted'
			: false
	const initialAdsOn =
		consent.editorVisible && !consent.pending
			? consent.ads === 'granted'
			: false
	const formKey = `${consent.editorVisible ? 'edit' : 'first'}:${consent.analytics}:${consent.ads}`

	if (!visible) {
		return null
	}

	return (
		<Modal
			visible
			animationType="fade"
			transparent
			onRequestClose={() => {
				// Required prompt cannot be dismissed without a choice.
				if (!consent.pending && consent.editorVisible) {
					consent.closeEditor()
				}
			}}
		>
			<View style={styles.backdrop}>
				<View
					style={[
						styles.card,
						{ paddingBottom: Math.max(insets.bottom, 16) },
					]}
				>
					<ConsentDraftForm
						key={formKey}
						initialAnalyticsOn={initialAnalyticsOn}
						initialAdsOn={initialAdsOn}
						persistError={consent.persistError}
						busy={busy}
						onBusy={setBusy}
						onSave={handleSave}
					/>
				</View>
			</View>
		</Modal>
	)
}

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.72)',
		justifyContent: 'flex-end',
	},
	card: {
		backgroundColor: COLOR_APP_BACKGROUND,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		paddingHorizontal: 20,
		paddingTop: 20,
		maxHeight: '88%',
		borderWidth: 1,
		borderColor: COLOR_DIVIDER,
	},
	scroll: {
		maxHeight: 420,
	},
	scrollContent: {
		paddingBottom: 12,
	},
	title: {
		fontSize: 20,
		fontWeight: '800',
		color: COLOR_TEXT,
		marginBottom: 8,
	},
	body: {
		fontSize: 14,
		lineHeight: 20,
		color: COLOR_TEXT_SECONDARY,
		marginBottom: 10,
	},
	link: {
		color: COLOR_ACCENT,
		fontWeight: '700',
		fontSize: 14,
		marginBottom: 16,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 12,
		paddingVertical: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: COLOR_DIVIDER,
	},
	rowLast: {
		borderBottomWidth: 0,
	},
	rowText: {
		flex: 1,
	},
	label: {
		fontSize: 16,
		fontWeight: '700',
		color: COLOR_TEXT,
	},
	hint: {
		fontSize: 12,
		color: COLOR_TEXT_MUTED,
		marginTop: 2,
	},
	error: {
		color: '#f87171',
		fontSize: 13,
		marginTop: 8,
	},
	primaryBtn: {
		backgroundColor: COLOR_ACCENT,
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: 'center',
		marginTop: 8,
	},
	primaryBtnText: {
		color: '#0b1220',
		fontWeight: '800',
		fontSize: 16,
	},
	secondaryBtn: {
		paddingVertical: 12,
		alignItems: 'center',
	},
	secondaryBtnText: {
		color: COLOR_TEXT_MUTED,
		fontWeight: '600',
		fontSize: 14,
	},
	btnDisabled: {
		opacity: 0.6,
	},
})
