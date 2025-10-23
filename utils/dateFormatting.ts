import { Language } from '../hooks/useLanguage';

/**
 * Formats a date string according to the specified language locale.
 *
 * @param dateString - Date string in ISO format or any valid date string
 * @param language - Language code (en, es, ja)
 * @returns Formatted date string
 *
 * @example
 * formatDate('2025-10-23', 'ja') // Returns: "2025年10月23日"
 * formatDate('2025-10-23', 'es') // Returns: "23/10/2025"
 * formatDate('2025-10-23', 'en') // Returns: "10/23/2025"
 */
export const formatDate = (dateString: string, language: Language): string => {
  if (!dateString) return '';

  const date = new Date(dateString);

  // Check if date is valid
  if (isNaN(date.getTime())) return dateString;

  if (language === 'ja') {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  }

  if (language === 'es') {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  // Default to English
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * Formats a date and time string according to the specified language locale.
 *
 * @param dateString - Date string in ISO format or any valid date string
 * @param language - Language code (en, es, ja)
 * @returns Formatted date-time string
 *
 * @example
 * formatDateTime('2025-10-23T14:30:00', 'ja') // Returns: "2025年10月23日 14:30"
 * formatDateTime('2025-10-23T14:30:00', 'es') // Returns: "23/10/2025 14:30"
 * formatDateTime('2025-10-23T14:30:00', 'en') // Returns: "10/23/2025 2:30 PM"
 */
export const formatDateTime = (dateString: string, language: Language): string => {
  if (!dateString) return '';

  const date = new Date(dateString);

  // Check if date is valid
  if (isNaN(date.getTime())) return dateString;

  if (language === 'ja') {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
  }

  if (language === 'es') {
    const datePart = date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const timePart = date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return `${datePart} ${timePart}`;
  }

  // Default to English
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Formats a relative date (e.g., "2 days ago", "in 3 weeks").
 *
 * @param dateString - Date string in ISO format or any valid date string
 * @param language - Language code (en, es, ja)
 * @returns Relative date string
 *
 * @example
 * formatRelativeDate('2025-10-21', 'ja') // Returns: "2日前"
 * formatRelativeDate('2025-10-25', 'es') // Returns: "en 2 días"
 * formatRelativeDate('2025-10-21', 'en') // Returns: "2 days ago"
 */
export const formatRelativeDate = (dateString: string, language: Language): string => {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();

  // Check if date is valid
  if (isNaN(date.getTime())) return dateString;

  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (language === 'ja') {
    if (diffDays === 0) return '今日';
    if (diffDays === 1) return '明日';
    if (diffDays === -1) return '昨日';
    if (diffDays > 0) return `${diffDays}日後`;
    return `${Math.abs(diffDays)}日前`;
  }

  if (language === 'es') {
    if (diffDays === 0) return 'hoy';
    if (diffDays === 1) return 'mañana';
    if (diffDays === -1) return 'ayer';
    if (diffDays > 0) return `en ${diffDays} días`;
    return `hace ${Math.abs(diffDays)} días`;
  }

  // Default to English
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays === -1) return 'yesterday';
  if (diffDays > 0) return `in ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
};
