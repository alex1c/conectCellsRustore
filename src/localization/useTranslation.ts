/**
 * Thin re-export so UI imports stay on our localization package.
 * react-i18next already re-renders when the active language changes.
 */

import { useTranslation as useI18nextTranslation } from 'react-i18next'

import { initI18n } from './i18n'

/**
 * Ensure i18n is ready, then return the standard react-i18next t/i18n pair.
 * Designed so a futureSettings language picker can call i18n.changeLanguage.
 */
export function useTranslation () {
	initI18n()
	return useI18nextTranslation()
}

export type { TFunction } from 'i18next'
