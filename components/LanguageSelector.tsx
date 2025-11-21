import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, type Language, type LanguageOption } from '../hooks/useLanguage';

interface LanguageSelectorProps {
  variant?: 'menu' | 'settings';
  showLabels?: boolean;
}

// Modern flag icons as SVG circles
const FlagIcon: React.FC<{ language: Language; size?: 'sm' | 'md' | 'lg' }> = ({ language, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const flags: Record<Language, JSX.Element> = {
    en: (
      // US/UK Combined flag (US flag with UK corner accent)
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-white dark:border-gray-700 shadow-sm`}>
        <svg viewBox="0 0 32 32" className="w-full h-full">
          {/* US Flag base */}
          <rect width="32" height="32" fill="#B22234"/>
          <rect y="2.5" width="32" height="2.5" fill="white"/>
          <rect y="7.5" width="32" height="2.5" fill="white"/>
          <rect y="12.5" width="32" height="2.5" fill="white"/>
          <rect y="17.5" width="32" height="2.5" fill="white"/>
          <rect y="22.5" width="32" height="2.5" fill="white"/>
          <rect y="27.5" width="32" height="2.5" fill="white"/>
          <rect width="13" height="17" fill="#3C3B6E"/>
          {/* White stars */}
          <g fill="white">
            <circle cx="2.5" cy="3" r="0.8"/>
            <circle cx="5.5" cy="3" r="0.8"/>
            <circle cx="8.5" cy="3" r="0.8"/>
            <circle cx="11.5" cy="3" r="0.8"/>
            <circle cx="4" cy="5.5" r="0.8"/>
            <circle cx="7" cy="5.5" r="0.8"/>
            <circle cx="10" cy="5.5" r="0.8"/>
            <circle cx="2.5" cy="8" r="0.8"/>
            <circle cx="5.5" cy="8" r="0.8"/>
            <circle cx="8.5" cy="8" r="0.8"/>
            <circle cx="11.5" cy="8" r="0.8"/>
            <circle cx="4" cy="10.5" r="0.8"/>
            <circle cx="7" cy="10.5" r="0.8"/>
            <circle cx="10" cy="10.5" r="0.8"/>
            <circle cx="2.5" cy="13" r="0.8"/>
            <circle cx="5.5" cy="13" r="0.8"/>
            <circle cx="8.5" cy="13" r="0.8"/>
            <circle cx="11.5" cy="13" r="0.8"/>
          </g>
        </svg>
      </div>
    ),
    es: (
      // Spanish flag
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-white dark:border-gray-700 shadow-sm`}>
        <svg viewBox="0 0 32 32" className="w-full h-full">
          <rect width="32" height="32" fill="#AA151B"/>
          <rect y="8" width="32" height="16" fill="#F1BF00"/>
          <rect y="8" width="5" height="16" fill="#AA151B"/>
          <rect x="3.5" y="13" width="3" height="6" fill="#AA151B"/>
        </svg>
      </div>
    ),
    ja: (
      // Japanese flag
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-white dark:border-gray-700 shadow-sm`}>
        <svg viewBox="0 0 32 32" className="w-full h-full">
          <rect width="32" height="32" fill="white"/>
          <circle cx="16" cy="16" r="6" fill="#BC002D"/>
        </svg>
      </div>
    ),
  };

  // Return the flag for the language, defaulting to 'en' if invalid
  return flags[language] || flags.en;
};

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'menu',
}) => {
  const { currentLanguage, changeLanguage, languageOptions } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelectLanguage = (language: Language) => {
    changeLanguage(language);
    setIsOpen(false);
  };

  if (variant === 'menu') {
    // Compact version for Header menu - inline with other items
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-left"
          aria-label="Select language"
        >
          <FlagIcon language={currentLanguage} size="sm" />
          <span className="text-sm font-medium">
            {languageOptions.find(opt => opt.code === currentLanguage)?.label}
          </span>
        </button>

        {isOpen && (
          <div className="absolute left-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 py-1 z-50">
            {languageOptions.map((option) => (
              <button
                key={option.code}
                onClick={() => handleSelectLanguage(option.code)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  currentLanguage === option.code
                    ? 'bg-primary bg-opacity-5 dark:bg-primary dark:bg-opacity-10'
                    : ''
                }`}
              >
                <FlagIcon language={option.code} size="sm" />
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{option.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{option.region}</div>
                </div>
                {currentLanguage === option.code && (
                  <svg
                    className="w-5 h-5 text-primary"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Full version for Settings drawer
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Language
      </label>
      <div className="grid grid-cols-1 gap-2">
        {languageOptions.map((option) => (
          <button
            key={option.code}
            onClick={() => handleSelectLanguage(option.code)}
            className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
              currentLanguage === option.code
                ? 'border-primary bg-primary bg-opacity-5 dark:bg-primary dark:bg-opacity-10'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <FlagIcon language={option.code} size="md" />
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{option.label}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{option.region}</div>
            </div>
            {currentLanguage === option.code && (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Language is detected automatically. You can override it here.
      </p>
    </div>
  );
};
