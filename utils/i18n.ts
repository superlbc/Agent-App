import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from '../locales/en/common.json';
import enForms from '../locales/en/forms.json';
import enSettings from '../locales/en/settings.json';
import enConstants from '../locales/en/constants.json';
import enHelp from '../locales/en/help.json';
import enTour from '../locales/en/tour.json';
import enValidation from '../locales/en/validation.json';
import enFeedback from '../locales/en/feedback.json';

import esCommon from '../locales/es/common.json';
import esForms from '../locales/es/forms.json';
import esSettings from '../locales/es/settings.json';
import esConstants from '../locales/es/constants.json';
import esHelp from '../locales/es/help.json';
import esTour from '../locales/es/tour.json';
import esValidation from '../locales/es/validation.json';
import esFeedback from '../locales/es/feedback.json';

import jaCommon from '../locales/ja/common.json';
import jaForms from '../locales/ja/forms.json';
import jaSettings from '../locales/ja/settings.json';
import jaConstants from '../locales/ja/constants.json';
import jaHelp from '../locales/ja/help.json';
import jaTour from '../locales/ja/tour.json';
import jaValidation from '../locales/ja/validation.json';
import jaFeedback from '../locales/ja/feedback.json';

// Timezone to language mapping for auto-detection
const TIMEZONE_TO_LANGUAGE: Record<string, string> = {
  'America/New_York': 'en',
  'America/Chicago': 'en',
  'America/Los_Angeles': 'en',
  'America/Toronto': 'en',
  'Europe/London': 'en',
  'Europe/Madrid': 'es',
  'Asia/Tokyo': 'ja',
};

// Detect language from timezone if not set by user
const detectLanguageFromTimezone = (): string | undefined => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIMEZONE_TO_LANGUAGE[timezone];
  } catch {
    return undefined;
  }
};

// Custom language detector that includes timezone-based detection
const timezoneDetector = {
  name: 'timezone',
  lookup() {
    return detectLanguageFromTimezone();
  },
  cacheUserLanguage(lng: string) {
    // Optionally cache detected language
    localStorage.setItem('i18nextLng-timezone', lng);
  },
};

// Add custom timezone detector to LanguageDetector
const languageDetector = new LanguageDetector();
languageDetector.addDetector(timezoneDetector);

// Configure i18next
i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        forms: enForms,
        settings: enSettings,
        constants: enConstants,
        help: enHelp,
        tour: enTour,
        validation: enValidation,
        feedback: enFeedback,
      },
      es: {
        common: esCommon,
        forms: esForms,
        settings: esSettings,
        constants: esConstants,
        help: esHelp,
        tour: esTour,
        validation: esValidation,
        feedback: esFeedback,
      },
      ja: {
        common: jaCommon,
        forms: jaForms,
        settings: jaSettings,
        constants: jaConstants,
        help: jaHelp,
        tour: jaTour,
        validation: jaValidation,
        feedback: jaFeedback,
      },
    },
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'forms', 'settings', 'constants', 'help', 'tour', 'validation', 'feedback'],

    // Language detection order
    detection: {
      order: ['localStorage', 'navigator', 'timezone'],
      caches: ['localStorage'],
      lookupLocalStorage: 'appLanguage',
    },

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Only languages we support
    supportedLngs: ['en', 'es', 'ja'],
    load: 'languageOnly', // Load 'en' not 'en-US'

    react: {
      useSuspense: false, // Disable suspense to avoid loading issues
    },
  });

export default i18n;
