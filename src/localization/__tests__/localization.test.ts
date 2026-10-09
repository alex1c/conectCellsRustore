/**
 * Localization contracts — key parity, locale resolution, plurals, fallback.
 */

import de from '../locales/de.json'
import en from '../locales/en.json'
import es from '../locales/es.json'
import ru from '../locales/ru.json'
import tr from '../locales/tr.json'
import {
	__resetI18nForTests,
	getCurrentLocale,
	initI18n,
	t,
} from '../i18n'
import {
	DEFAULT_LOCALE,
	resolveAppLocale,
	SUPPORTED_LOCALES,
} from '../resolveLocale'

type JsonLeaf = string | number | boolean | null
type JsonNode = JsonLeaf | { [key: string]: JsonNode }

/** Collect dotted leaf paths from a nested translation object. */
function collectKeys (
	node: JsonNode,
	prefix = '',
	out: string[] = [],
): string[] {
	if (node === null || typeof node !== 'object') {
		if (prefix) {
			out.push(prefix)
		}
		return out
	}
	for (const [key, value] of Object.entries(node)) {
		const path = prefix ? `${prefix}.${key}` : key
		if (value !== null && typeof value === 'object') {
			collectKeys(value as JsonNode, path, out)
		} else {
			out.push(path)
		}
	}
	return out
}

/** Read a nested string by dotted path. */
function readPath (node: JsonNode, path: string): unknown {
	const parts = path.split('.')
	let cur: JsonNode = node
	for (const part of parts) {
		if (cur === null || typeof cur !== 'object') {
			return undefined
		}
		cur = (cur as Record<string, JsonNode>)[part] as JsonNode
	}
	return cur
}

const DICTS = {
	en,
	ru,
	es,
	de,
	tr,
} as const

describe('locale resolution', () => {
	it('maps regional variants onto the five supported locales', () => {
		expect(resolveAppLocale('en-US')).toBe('en')
		expect(resolveAppLocale('en-GB')).toBe('en')
		expect(resolveAppLocale('es-ES')).toBe('es')
		expect(resolveAppLocale('es-MX')).toBe('es')
		expect(resolveAppLocale('de-DE')).toBe('de')
		expect(resolveAppLocale('de-AT')).toBe('de')
		expect(resolveAppLocale('tr-TR')).toBe('tr')
		expect(resolveAppLocale('ru-RU')).toBe('ru')
		expect(resolveAppLocale('ru')).toBe('ru')
	})

	it('falls back to English for unsupported languages', () => {
		expect(resolveAppLocale('fr')).toBe(DEFAULT_LOCALE)
		expect(resolveAppLocale('zh-CN')).toBe('en')
		expect(resolveAppLocale('')).toBe('en')
		expect(resolveAppLocale(null)).toBe('en')
		expect(resolveAppLocale(undefined)).toBe('en')
	})

	it('lists exactly five shipping locales', () => {
		expect([...SUPPORTED_LOCALES].sort()).toEqual(
			['de', 'en', 'es', 'ru', 'tr'].sort(),
		)
	})
})

describe('translation dictionaries', () => {
	const enKeys = collectKeys(en).sort()

	it('keeps the same leaf keys across all five locales', () => {
		for (const locale of SUPPORTED_LOCALES) {
			const keys = collectKeys(DICTS[locale]).sort()
			expect(keys).toEqual(enKeys)
		}
	})

	it('has no empty or whitespace-only values', () => {
		for (const locale of SUPPORTED_LOCALES) {
			for (const key of enKeys) {
				const value = readPath(DICTS[locale], key)
				expect(typeof value).toBe('string')
				expect((value as string).trim().length).toBeGreaterThan(0)
			}
		}
	})

	it('keeps Russian brand Гексоника and international Hexonica', () => {
		expect(ru.brand.name).toBe('Гексоника')
		expect(en.brand.name).toBe('Hexonica')
		expect(es.brand.name).toBe('Hexonica')
		expect(de.brand.name).toBe('Hexonica')
		expect(tr.brand.name).toBe('Hexonica')
	})

	it('preserves Turkish Unicode in core CTAs', () => {
		expect(tr.common.cancel).toContain('İ')
		expect(tr.game.undo).toMatch(/Geri al/)
		expect(tr.home.newGame).toMatch(/Yeni oyun/)
		expect(tr.settings.title).toBe('Ayarlar')
	})

	it('documents terminal merge (>=128) in tutorial merge_tip for all locales', () => {
		for (const locale of SUPPORTED_LOCALES) {
			const tip = DICTS[locale].tutorial.merge_tip.body
			expect(tip).toMatch(/128/)
		}
		expect(en.tutorial.merge_tip.body.toLowerCase()).toMatch(/clear/)
		expect(ru.tutorial.merge_tip.body).toMatch(/исчезает/)
		expect(ru.onboarding.merge.title).toBe('Слияние')
		expect(ru.onboarding.spawn.diagram).toMatch(/слияние/)
		expect(es.tutorial.levels.body).toMatch(/combinaciones/)
		expect(es.tutorial.levels.body).not.toMatch(/Las combos/)
	})

	it('exposes TalkBack cell label keys', () => {
		expect(en.a11y.cellEmpty).toContain('{{row}}')
		expect(en.a11y.cellValue).toContain('{{value}}')
		expect(en.a11y.hintEmpty.length).toBeGreaterThan(0)
		expect(en.a11y.hintOccupied.length).toBeGreaterThan(0)
	})
})

describe('i18n runtime', () => {
	beforeEach(() => {
		__resetI18nForTests()
	})

	it('uses Russian for lng=ru', () => {
		initI18n({ locale: 'ru', forceLocale: true })
		expect(getCurrentLocale()).toBe('ru')
		expect(t('brand.name')).toBe('Гексоника')
		expect(t('home.newGame')).toBe('Новая игра')
		expect(t('game.undo')).toContain('Отменить')
	})

	it('uses English for lng=en and as fallback', () => {
		initI18n({ locale: 'en', forceLocale: true })
		expect(t('brand.name')).toBe('Hexonica')
		expect(t('home.continue')).toBe('Continue')
	})

	it('interpolates safely and tolerates missing params', () => {
		initI18n({ locale: 'en', forceLocale: true })
		expect(t('home.bestScore', { score: 1200 })).toBe('Best: 1200')
		expect(t('home.bestScore', {})).toMatch(/^Best:/)
		expect(t('levelUp.title', { level: 4 })).toBe('Level 4')
	})

	it('supports pluralization (en / ru)', () => {
		initI18n({ locale: 'en', forceLocale: true })
		expect(t('plurals.cells', { count: 1 })).toBe('1 cell')
		expect(t('plurals.cells', { count: 5 })).toBe('5 cells')

		__resetI18nForTests()
		initI18n({ locale: 'ru', forceLocale: true })
		expect(t('plurals.cells', { count: 1 })).toMatch(/1 клетка/)
		expect(t('plurals.cells', { count: 2 })).toMatch(/2 клетки/)
		expect(t('plurals.cells', { count: 5 })).toMatch(/5 клеток/)
	})

	it('does not echo raw missing keys to players', () => {
		initI18n({ locale: 'en', forceLocale: true })
		const missing = t('this.key.does.not.exist')
		expect(missing).not.toContain('this.key.does.not.exist')
		expect(missing).toBe('')
	})

	it('resolves German and Spanish game CTAs without empty strings', () => {
		initI18n({ locale: 'de', forceLocale: true })
		expect(t('game.undo').length).toBeGreaterThan(0)
		expect(t('game.restart')).toBe('Neustart')

		__resetI18nForTests()
		initI18n({ locale: 'es', forceLocale: true })
		expect(t('home.newGame')).toBe('Nueva partida')
		expect(t('game.undo')).toMatch(/Deshacer/)
	})
})
