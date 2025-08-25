export type Locale = 'ja' | 'en'
export type Dict = Record<string, string>

export function detectLocaleFromHeader(acceptLang?: string | null): Locale {
  const al = (acceptLang || '').toLowerCase()
  return al.startsWith('ja') ? 'ja' : 'en'
}

export async function getDictionary(locale: Locale): Promise<Dict> {
  return locale === 'ja'
    ? (await import('../i18n/ja')).default
    : (await import('../i18n/en')).default
}
