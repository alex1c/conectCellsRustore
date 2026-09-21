/**
 * DEV-only gate: when true, GameScreen hides DevPanel + capture bar chrome
 * so store screenshots match production UI. Capture scripts reopen via an
 * invisible a11y hit-target (opacity 0).
 */

type Listener = () => void

let storeCaptureUiHidden = false
const listeners = new Set<Listener>()

export function isStoreCaptureUiHidden (): boolean {
	return storeCaptureUiHidden
}

export function setStoreCaptureUiHidden (hidden: boolean): void {
	if (storeCaptureUiHidden === hidden) {
		return
	}
	storeCaptureUiHidden = hidden
	for (const listener of listeners) {
		listener()
	}
}

export function subscribeStoreCaptureUi (listener: Listener): () => void {
	listeners.add(listener)
	return () => {
		listeners.delete(listener)
	}
}
