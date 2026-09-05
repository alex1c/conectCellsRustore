import { SafeAreaProvider } from 'react-native-safe-area-context'

import { GameScreen } from './src/ui/GameScreen'

/**
 * App entry — Phase 2.6 hex path-merge gameplay.
 */
export default function App () {
	return (
		<SafeAreaProvider>
			<GameScreen />
		</SafeAreaProvider>
	)
}
