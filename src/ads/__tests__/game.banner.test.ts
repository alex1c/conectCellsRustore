/**
 * GameScreen gameplay banner contracts — placement, tutorial isolation,
 * Undo/Restart structure. No pixel assertions.
 */

import {
	AD_PLACEMENTS,
	DEMO_AD_UNITS,
	GAME_BANNER_RESERVED_HEIGHT,
	resolveAdUnitId,
	resolveDemoAdUnitId,
} from '../../ads/placements'

/* eslint-disable @typescript-eslint/no-require-imports -- Jest source contracts */
const nodeFs = require('fs') as {
	readFileSync: (path: string, encoding: string) => string
}
const nodePath = require('path') as {
	join: (...parts: string[]) => string
}
/* eslint-enable @typescript-eslint/no-require-imports */

// Jest provides __dirname for this CommonJS test module.
declare const __dirname: string

function readSrc (relativeFromSrc: string): string {
	return nodeFs.readFileSync(
		nodePath.join(__dirname, '..', '..', relativeFromSrc),
		'utf8',
	)
}

describe('gameplay banner contracts', () => {
	it('production GameScreen mounts gameBanner with fixed reserved dock', () => {
		const src = readSrc('ui/GameScreen.tsx')
		expect(src).toContain('placement="gameBanner"')
		expect(src).toContain('reservedHeight={GAME_BANNER_RESERVED_HEIGHT}')
		expect(src).toContain('BannerSlot')
		// Vertical order: actions then banner dock (not above board).
		const actionsIdx = src.indexOf('styles.actions')
		const bannerIdx = src.indexOf('placement="gameBanner"')
		expect(actionsIdx).toBeGreaterThan(0)
		expect(bannerIdx).toBeGreaterThan(actionsIdx)
		// Undo / Restart structure preserved.
		expect(src).toContain('Отменить ход')
		expect(src).toContain('Заново')
		expect(src).toContain('handleUndoPress')
		expect(src).toContain('requestRestart')
	})

	it('interactive tutorial does not mount gameBanner or BannerSlot', () => {
		const src = readSrc('ui/screens/TutorialScreen.tsx')
		expect(src).not.toContain('gameBanner')
		expect(src).not.toContain('BannerSlot')
		expect(src).not.toContain('R-M-20075886-6')
		expect(src.toLowerCase()).toContain('ad-free')
	})

	it('gameBanner IDs: production -6, DEV demo banner', () => {
		expect(AD_PLACEMENTS.gameBanner).toBe('R-M-20075886-6')
		expect(resolveAdUnitId('gameBanner')).toBe('R-M-20075886-6')
		expect(resolveDemoAdUnitId('gameBanner')).toBe('demo-banner-yandex')
		expect(DEMO_AD_UNITS.gameBanner).toBe('demo-banner-yandex')
		expect(AD_PLACEMENTS.gameBanner).not.toBe(DEMO_AD_UNITS.gameBanner)
		expect(GAME_BANNER_RESERVED_HEIGHT).toBe(50)
	})

	it('BannerSlot keeps placement-stable adRequest memo for fixed docks', () => {
		const src = readSrc('ads/BannerSlot.tsx')
		expect(src).toContain("'gameBanner'")
		expect(src).toContain('reservedHeight')
		expect(src).toContain('[placement]')
		expect(src).toContain('GAME_BANNER_RESERVED_HEIGHT')
	})
})
