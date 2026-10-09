import { SafeAreaProvider } from 'react-native-safe-area-context'

import { initI18n } from './src/localization/i18n'
import { AppRoot } from './src/ui/AppRoot'

// Detect device locale before the first paint so Home/tutorial are translated.
initI18n()

/**
 * App entry — Phase 4 Hexonica production shell.
 * Analytics + ads bootstrap inside AppRoot.
 */
export default function App () {
	return (
		<SafeAreaProvider>
			<AppRoot />
		</SafeAreaProvider>
	)
}
