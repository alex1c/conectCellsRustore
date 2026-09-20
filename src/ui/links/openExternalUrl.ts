/**
 * Safe external URL opener — browser / mailto / RuStore, never WebView.
 * Failures are swallowed so Settings / About cannot crash.
 */

import { Linking } from 'react-native'

/**
 * Opens a URL with the system handler (browser, mail client, store app).
 * Does not throw on failure.
 */
export async function openExternalUrl (url: string): Promise<void> {
	try {
		await Linking.openURL(url)
	} catch {
		// Ignore — missing apps / blocked schemes must not crash UI.
	}
}
