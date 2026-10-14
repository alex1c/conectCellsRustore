/**
 * Loads / saves privacy purpose choices and drives optional SDK bootstrap.
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
	writePersistedPrivacyConsent,
	type PersistedPrivacyConsent,
	type PurposeDecision,
} from './consentPersistence'
import { bootstrapOptionalSdks } from './optionalSdkBootstrap'

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
			try {
				const saved = await writePersistedPrivacyConsent(input)
				setAnalytics(saved.analytics)
				setAds(saved.ads)
				setStorageStatus(saved.storageStatus)
				await bootstrapOptionalSdks({
					analytics: saved.analytics,
					ads: saved.ads,
				})
				setEditorVisible(false)
			} catch {
				setPersistError(true)
				throw new Error('privacy_consent_persist_failed')
			}
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
