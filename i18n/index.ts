import * as Localization from 'expo-localization';
import * as I18nModule from 'i18n-js';

import en from './en.json';
import fr from './fr.json';
import ar from './ar.json';

// i18n-js may expose different shapes depending on bundler:
// - a ready-to-use instance with .t()
// - exports the I18n class (named export)
// - a default export may wrap either shape
const raw: any = (I18nModule as any).default ?? I18nModule;

// Resolve a usable instance for the runtime and tests.
const instance: any = (() => {
  if (raw && typeof raw.t === 'function') {
    return raw; // already an instance
  }
  const I18nClass = raw && (raw.I18n || raw.I18n === undefined ? raw.I18n : undefined) || (typeof raw === 'function' ? raw : undefined);
  if (typeof I18nClass === 'function') {
    try {
      return new I18nClass();
    } catch (e) {
      // If constructing the I18n class fails, log and fall back to shim
      // eslint-disable-next-line no-console
      console.warn('i18n: failed to construct I18n class, falling back to shim', e);
    }
  }
  // fallback shim
  return {
    translations: {},
    locale: 'fr',
    defaultLocale: 'fr',
    fallbacks: true,
    t: (k: string) => k,
  } as any;
})();

const i18n: any = instance;

// Attach translations safely
i18n.translations = i18n.translations ?? {};
i18n.translations = { ...i18n.translations, en, fr, ar };

// Default to French as requested
i18n.defaultLocale = i18n.defaultLocale ?? 'fr';

// 1) Try persisted locale (web: localStorage, native: AsyncStorage if available)
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = window.localStorage.getItem('app_locale');
    if (saved) {
      i18n.locale = saved;
      // set document direction for web immediately
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.dir = String(saved).toLowerCase().startsWith('ar') ? 'rtl' : 'ltr';
      }
    }
  }
} catch (e) {
  // ignore localStorage failures
}

// For native, try to read AsyncStorage asynchronously (if installed) and set locale when available.
// NOTE: we avoid requiring AsyncStorage here to prevent the web bundler from
// attempting to resolve native-only packages. Native persistence (AsyncStorage)
// is handled from the UI layer (for example in `app/(tabs)/profile.tsx`) where
// dynamic requires are used behind platform guards.

// 2) Fallback to device locale or default
// Use any cast to avoid type issues from expo-localization typings
i18n.locale = i18n.locale ?? (Localization as any).locale ?? 'fr';
i18n.fallbacks = true;

export function t(key: string, options?: any) {
  return i18n.t(key, options);
}

export default i18n;
