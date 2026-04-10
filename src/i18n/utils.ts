import { ui, defaultLang, type Lang } from './translations';

export type { Lang };
export { defaultLang };

export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as Lang;
  return defaultLang;
}

export function useTranslations(lang: Lang) {
  return function t(key: keyof (typeof ui)[typeof defaultLang]): string {
    return ui[lang]?.[key] ?? ui[defaultLang][key];
  };
}

/** Build a locale-prefixed path. Turkish (default) gets no prefix. */
export function localePath(lang: Lang, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (lang === defaultLang) return clean;
  return `/${lang}${clean}`;
}

/** Get the contact page path for a given locale. */
export function contactPath(lang: Lang): string {
  return lang === 'tr' ? '/iletisim' : '/contact';
}

/** Given the current URL, return the equivalent URL in the target locale. */
export function switchLangUrl(url: URL, targetLang: Lang): string {
  const currentLang = getLangFromUrl(url);
  let pathname = url.pathname;

  // Strip current lang prefix if not default
  if (currentLang !== defaultLang) {
    pathname = pathname.replace(new RegExp(`^/${currentLang}`), '') || '/';
  }

  // Map contact page slug between locales
  if (pathname === '/iletisim') {
    pathname = contactPath(targetLang);
  } else if (pathname === '/contact') {
    pathname = contactPath(targetLang);
  }

  return localePath(targetLang, pathname);
}

/** Return the BCP 47 locale string for Intl APIs. */
export function getDateLocale(lang: Lang): string {
  const map: Record<Lang, string> = {
    tr: 'tr-TR',
    en: 'en-US',
    fr: 'fr-FR',
  };
  return map[lang];
}

/** Extract the clean slug from a content collection ID (strips locale prefix). */
export function getSlugFromId(id: string): string {
  // IDs look like "tr/my-post" or "en/my-post" — strip the locale prefix
  const parts = id.split('/');
  if (parts.length > 1 && parts[0] in { tr: 1, en: 1, fr: 1 }) {
    return parts.slice(1).join('/');
  }
  return id;
}

/** Return the og:locale value for a given lang. */
export function getOgLocale(lang: Lang): string {
  const map: Record<Lang, string> = {
    tr: 'tr_TR',
    en: 'en_US',
    fr: 'fr_FR',
  };
  return map[lang];
}
