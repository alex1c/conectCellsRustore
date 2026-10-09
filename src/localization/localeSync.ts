/**
 * Sync i18n language with the device locale when the app returns to foreground.
 * Does not re-init i18next; only changeLanguage when the resolved locale differs.
 */

import { AppState, type AppStateStatus, type NativeEventSubscription } from 'react-native'

import { detectDeviceLocale, getCurrentLocale, initI18n, i18n } from './i18n'
import type { AppLocale } from './resolveLocale'

/**
 * Read the current device locale and apply it if different from i18n.language.
 * Safe to call repeatedly; no-ops when already matched.
 */
export function syncLocaleFromDevice (): AppLocale {
	initI18n()
	const next = detectDeviceLocale()
	const current = getCurrentLocale()
	if (next !== current) {
		void i18n.changeLanguage(next)
	}
	return next
}

export type LocaleAppStateLike = {
	addEventListener: (
		type: 'change',
		listener: (state: AppStateStatus) => void,
	) => NativeEventSubscription
}

/**
 * Subscribe once to AppState. On transition to `active`, refresh locale from
 * the device. Returns an unsubscribe function — call from useEffect cleanup.
 */
export function subscribeDeviceLocaleRefresh (
	appState: LocaleAppStateLike = AppState,
): () => void {
	initI18n()
	const subscription = appState.addEventListener('change', (state) => {
		if (state === 'active') {
			syncLocaleFromDevice()
		}
	})
	let active = true
	return () => {
		if (!active) {
			return
		}
		active = false
		subscription.remove()
	}
}
