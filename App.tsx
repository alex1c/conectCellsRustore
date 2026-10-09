import { SafeAreaProvider } from 'react-native-safe-area-context'

import { initI18n } from './src/localization/i18n'
import { useDeviceLocaleRefresh } from './src/localization/useDeviceLocaleRefresh'
import { AppRoot } from './src/ui/AppRoot'

// Detect device locale before the first paint so Home/tutorial are translated.
initI18n()

/**
 * App entry — Phase 4 Hexonica production shell.
 * Analytics + ads bootstrap inside AppRoot.
 * Foreground AppState refresh picks up Android Settings language changes.
 */
export default function App () {
	useDeviceLocaleRefresh()
	return (
		<SafeAreaProvider>
			<AppRoot />
		</SafeAreaProvider>
	)
}
