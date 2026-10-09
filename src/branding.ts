/**
 * Product branding constants.
 * UI display name comes from i18n (`brand.name`): Гексоника (ru) / Hexonica (other).
 * Package id ru.forestmusic.connectcells stays unchanged.
 */

/** Russian product name — RuStore listing and native ru launcher. */
export const APP_DISPLAY_NAME_RU = 'Гексоника'

/** International product name — EN/ES/DE/TR UI and default launcher. */
export const APP_DISPLAY_NAME_INTL = 'Hexonica'

/**
 * Legacy constant retained for RuStore-era contracts.
 * Prefer `t('brand.name')` in UI so the active locale wins.
 */
export const APP_DISPLAY_NAME = APP_DISPLAY_NAME_RU

export const APP_STORE_TITLE_RU = 'Гексоника — числовая головоломка'
export const APP_STORE_TITLE_EN = 'Hexonica — number puzzle'

/** @deprecated Prefer `t('brand.storeTitle')` in UI. */
export const APP_STORE_TITLE = APP_STORE_TITLE_RU

export const APP_PUBLISHER = 'ForestMusic'
export const APP_VERSION = '1.0.1'
