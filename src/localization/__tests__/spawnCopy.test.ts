/**
 * Tutorial / onboarding spawn copy must match observedPressure mechanics:
 * no merge → 2, merge of 4 → 1, groups of 5+ → 0.
 */

const en = require('../locales/en.json') as {
	tutorial: { spawn: { title: string; body: string } }
	onboarding: { spawn: { line1: string; line2: string; diagram: string } }
}
const ru = require('../locales/ru.json') as typeof en
const es = require('../locales/es.json') as typeof en
const de = require('../locales/de.json') as typeof en
const tr = require('../locales/tr.json') as typeof en

const locales = { en, ru, es, de, tr }

describe('spawn copy matches observedPressure', () => {
	it.each(Object.keys(locales))(
		'%s tutorial spawn mentions merge-dependent counts',
		(key) => {
			const spawn = locales[key as keyof typeof locales].tutorial.spawn
			const blob = `${spawn.title} ${spawn.body}`.toLowerCase()
			// Must not claim every move always adds the same cells.
			expect(blob).not.toMatch(/after a move, new cells appear on the board/)
			expect(blob).not.toMatch(/tras cada movimiento aparecen/)
			expect(blob).not.toMatch(/после ходов появляются новые клетки$/)
			// Must describe large-merge / fewer-spawn idea.
			expect(
				blob.includes('5') ||
					blob.includes('merge') ||
					blob.includes('слиян') ||
					blob.includes('fus') ||
					blob.includes('birleş') ||
					blob.includes('verschmel') ||
					blob.includes('depend'),
			).toBe(true)
		},
	)

	it.each(Object.keys(locales))(
		'%s onboarding spawn diagram encodes 2 / 1 / 0',
		(key) => {
			const spawn = locales[key as keyof typeof locales].onboarding.spawn
			expect(spawn.diagram).toMatch(/2/)
			expect(spawn.diagram).toMatch(/1/)
			expect(spawn.diagram).toMatch(/0/)
			expect(spawn.line1.length).toBeGreaterThan(10)
			expect(spawn.line2.length).toBeGreaterThan(10)
		},
	)
})
