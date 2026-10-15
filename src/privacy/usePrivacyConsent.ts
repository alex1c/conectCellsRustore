/**
 * Loads / saves privacy purpose choices and drives optional SDK bootstrap.
 *
 * Saves go through savePrivacyPurposes so revoke closes runtime gates
 * before AsyncStorage awaits, and grants open only after a successful write.
 */

import { useCallback, useEffect, useState } from 'react'

import { getAppStore } from '../store/appStore'
import {
	isConsentPending,
	resolveConsentRequirement,
	type ConsentRequirement,
} from './consentPolicy'
import {
	readPersistedPrivacyConsent,
	type PersistedPrivacyConsent,
	type PurposeDecision,
} from './consentPersistence'
import { bootstrapOptionalSdks } from './optionalSdkBootstrap'
import { savePrivacyPurposes } from './savePrivacyPurposes'

export type PrivacyConsentState = {
	ready: boolean
	pending: boolean
	requirement: ConsentRequirement
	analytics: PurposeDecision | null
	ads: PurposeDecision | null
	storageStatus: PersistedPrivacyConsent['storageStatus']
	persistError: boolean
	/** Opens the Settings privacy editor even when not pending. */
	editorVisible: boolean
	openEditor: () => void
	closeEditor: () => void
	savePurposes: (input: {
		analytics: PurposeDecision
		ads: PurposeDecision
	}) => Promise<void>
}

const defaultRequirement = resolveConsentRequirement({
	storeId: getAppStore(),
})

export function usePrivacyConsent (): PrivacyConsentState {
	const [ready, setReady] = useState(false)
	const [analytics, setAnalytics] = useState<PurposeDecision | null>(null)
	const [ads, setAds] = useState<PurposeDecision | null>(null)
	const [storageStatus, setStorageStatus] =
		useState<PersistedPrivacyConsent['storageStatus']>('ok')
	const [persistError, setPersistError] = useState(false)
	const [editorVisible, setEditorVisible] = useState(false)
	const [requirement] = useState(() =>
		resolveConsentRequirement({ storeId: getAppStore() }),
	)

	useEffect(() => {
		let cancelled = false
		;(async () => {
			const persisted = await readPersistedPrivacyConsent()
			if (cancelled) {
				return
			}
			setAnalytics(persisted.analytics)
			setAds(persisted.ads)
			setStorageStatus(persisted.storageStatus)
			setReady(true)
			// RuStore or already-decided Play — start optional SDKs.
			const req = resolveConsentRequirement({ storeId: getAppStore() })
			if (
				!req.requiresExplicitConsent ||
				(persisted.analytics !== null && persisted.ads !== null)
			) {
				await bootstrapOptionalSdks({
					analytics: persisted.analytics,
					ads: persisted.ads,
				})
			}
		})()
		return () => {
			cancelled = true
		}
	}, [])

	const pending = isConsentPending({ analytics, ads }, requirement)

	const savePurposes = useCallback(
		async (input: {
			analytics: PurposeDecision
			ads: PurposeDecision
		}) => {
			setPersistError(false)
			const result = await savePrivacyPurposes(input)
			if (result.status === 'superseded') {
				// A newer save owns UI + gates — do not flip persistError.
				return
			}
			if (result.status === 'failed') {
				// Fail-closed UI: reflect denials so Settings does not keep showing
				// granted while runtime gates are already closed. Grants are never
				// applied on a failed write (retry required).
				if (input.analytics === 'denied') {
					setAnalytics('denied')
				}
				if (input.ads === 'denied') {
					setAds('denied')
				}
				setPersistError(true)
				throw new Error('privacy_consent_persist_failed')
			}
			setAnalytics(result.saved.analytics)
			setAds(result.saved.ads)
			setStorageStatus(result.saved.storageStatus)
			setEditorVisible(false)
		},
		[],
	)

	return {
		ready,
		pending,
		requirement: requirement ?? defaultRequirement,
		analytics,
		ads,
		storageStatus,
		persistError,
		editorVisible,
		openEditor: () => setEditorVisible(true),
		closeEditor: () => setEditorVisible(false),
		savePurposes,
	}
}
