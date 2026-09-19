import { SafeAreaProvider } from 'react-native-safe-area-context'

import { AppRoot } from './src/ui/AppRoot'

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
