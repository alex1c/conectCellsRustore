import { GameScreen } from './src/ui/GameScreen'

/**
 * App entry — Phase 2.6 hex path-merge gameplay.
 * Avoid react-native-safe-area-context here: the installed native
 * development client may not include RNCSafeAreaProvider.
 */
export default function App () {
	return <GameScreen />
}
