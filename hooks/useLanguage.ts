import { useTranslation } from 'react-i18next';
import { useCallback, useEffect } from 'react';
import { telemetryService } from '../utils/telemetryService';

export type Language = 'en' | 'es' | 'ja';

export interface LanguageOption {
  code: Language;
  label: string;
  flag: string;
  region: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'English', flag: '🇺🇸', region: 'Americas / UK' },
  { code: 'es', label: 'Español', flag: '🇪🇸', region: 'Spain' },
  { code: 'ja', label: '日本語', flag: '🇯🇵', region: 'Japan' },
];

export const useLanguage = () => {
  const { i18n, t } = useTranslation();

  // Ensure we always have a valid language (fallback to 'en' if invalid)
  const getCurrentLanguage = (): Language => {
    const lang = i18n.language?.split('-')[0]; // Handle 'en-US' -> 'en'
    if (lang === 'es' || lang === 'ja') {
      return lang;
    }
    return 'en'; // Default fallback
  };

  const currentLanguage = getCurrentLanguage();

  const changeLanguage = useCallback(
    async (newLanguage: Language) => {
      const oldLanguage = i18n.language;

      if (oldLanguage === newLanguage) {
        return;
      }

      try {
        await i18n.changeLanguage(newLanguage);

        // Store in localStorage
        localStorage.setItem('appLanguage', newLanguage);

        // Update HTML lang attribute for accessibility and Japanese typography
        document.documentElement.lang = newLanguage;

        // Track language change event
        telemetryService.trackEvent('languageChanged', {
          from: oldLanguage,
          to: newLanguage,
          method: 'manual',
          timestamp: new Date().toISOString(),
        });

        console.log(`✅ Language changed from ${oldLanguage} to ${newLanguage}`);
      } catch (error) {
        console.error('Failed to change language:', error);
        telemetryService.trackEvent('languageChangeError', {
          from: oldLanguage,
          to: newLanguage,
          error: String(error),
        });
      }
    },
    [i18n]
  );

  const getLanguageSource = (): 'user' | 'browser' | 'timezone' | 'default' => {
    const stored = localStorage.getItem('appLanguage');
    if (stored) return 'user';

    const browserLang = navigator.language.split('-')[0];
    if (['en', 'es', 'ja'].includes(browserLang)) return 'browser';

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const timezoneMap: Record<string, string> = {
        'America/New_York': 'en',
        'America/Chicago': 'en',
        'Europe/Madrid': 'es',
        'Asia/Tokyo': 'ja',
      };
      if (timezoneMap[timezone]) return 'timezone';
    } catch {
      // ignore
    }

    return 'default';
  };

  // Set HTML lang attribute on mount and language change
  useEffect(() => {
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  // Track initial language on mount (once)
  useEffect(() => {
    const hasTrackedLanguage = sessionStorage.getItem('hasTrackedLanguage');
    if (!hasTrackedLanguage) {
      telemetryService.trackEvent('languageDetected', {
        language: currentLanguage,
        source: getLanguageSource(),
        browserLanguage: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      sessionStorage.setItem('hasTrackedLanguage', 'true');
    }
  }, []); // Only run once on mount

  return {
    currentLanguage,
    changeLanguage,
    getLanguageSource,
    languageOptions: LANGUAGE_OPTIONS,
    t,
    i18n,
  };
};
