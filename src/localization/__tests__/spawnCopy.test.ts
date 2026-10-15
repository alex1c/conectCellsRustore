/**
 * Tutorial / onboarding spawn copy must describe merge-dependent spawn
 * without fixed cell counts (level bonus can add pressure above Level 1).
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

/** Fixed count diagrams like "2 · 4 → 1 · 5+ → 0" are intentionally retired. */
const FIXED_COUNT_DIAGRAM = /→\s*2|2\s*·|→\s*1\s*·|5\+\s*→\s*0/

describe('spawn copy matches merge + level pressure', () => {
	it.each(Object.keys(locales))(
		'%s tutorial spawn avoids fixed cell counts',
		(key) => {
			const spawn = locales[key as keyof typeof locales].tutorial.spawn
			const blob = `${spawn.title} ${spawn.body}`
			expect(blob).not.toMatch(/\badds 2 cells\b/i)
			expect(blob).not.toMatch(/\b2 клетки\b/i)
			expect(blob).not.toMatch(/\bllegan 2\b/i)
			expect(blob).not.toMatch(/\bkommen 2\b/i)
			expect(blob).not.toMatch(/\b2 hücre\b/i)
			expect(
				blob.toLowerCase().includes('merge') ||
					blob.toLowerCase().includes('слиян') ||
					blob.toLowerCase().includes('fus') ||
					blob.toLowerCase().includes('birleş') ||
					blob.toLowerCase().includes('depend'),
			).toBe(true)
		},
	)

	it.each(Object.keys(locales))(
		'%s onboarding spawn mentions level pressure without fixed counts',
		(key) => {
			const spawn = locales[key as keyof typeof locales].onboarding.spawn
			expect(spawn.diagram).not.toMatch(FIXED_COUNT_DIAGRAM)
			expect(spawn.line1.length).toBeGreaterThan(10)
			expect(spawn.line2.length).toBeGreaterThan(10)
			const pressure = `${spawn.line2} ${spawn.diagram}`.toLowerCase()
			expect(
				pressure.includes('level') ||
					pressure.includes('уровн') ||
					pressure.includes('nivel') ||
					pressure.includes('seviye') ||
					pressure.includes('merge') ||
					pressure.includes('слиян') ||
					pressure.includes('fus') ||
					pressure.includes('birleş'),
			).toBe(true)
		},
	)
})
