/**
 * Browser Context Utility
 * Collects comprehensive browser, device, and environment data for telemetry
 */

export interface BrowserContextData {
  // Browser information (always available)
  browser: string;
  browserVersion: string;
  userAgent: string;

  // Platform information (always available)
  platform: string;
  platformVersion: string;

  // Display information (always available)
  screenResolution: string;
  viewportSize: string;
  devicePixelRatio: number;
  orientation: string;
  isFullscreen: boolean;

  // Device information (always available)
  deviceType: string;
  touchSupported: boolean;
  maxTouchPoints: number;

  // Locale information (always available)
  language: string;
  languages: string[];
  timezone: string;
  timezoneOffset: number;

  // App state (always available)
  theme: string;

  // Connection information (optional - mainly Chrome/Edge)
  connectionType?: string;
  connectionEffectiveType?: string;
  connectionDownlink?: number;
  connectionRtt?: number;
  connectionSaveData?: boolean;

  // Capabilities (always available)
  cookiesEnabled: boolean;
  localStorageAvailable: boolean;
  sessionStorageAvailable: boolean;
  webWorkersSupported: boolean;
  serviceWorkerSupported: boolean;

  // Performance information (optional - mainly Chrome)
  hardwareConcurrency?: number;
  deviceMemory?: number;
}

/**
 * Detects the browser name and version from user agent
 */
function detectBrowser(): { name: string; version: string } {
  const ua = navigator.userAgent;

  // Edge (Chromium-based)
  if (ua.includes('Edg/')) {
    const match = ua.match(/Edg\/(\d+\.\d+\.\d+\.\d+)/);
    return { name: 'Edge', version: match ? match[1] : 'Unknown' };
  }

  // Chrome
  if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
    const match = ua.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
    return { name: 'Chrome', version: match ? match[1] : 'Unknown' };
  }

  // Firefox
  if (ua.includes('Firefox/')) {
    const match = ua.match(/Firefox\/(\d+\.\d+)/);
    return { name: 'Firefox', version: match ? match[1] : 'Unknown' };
  }

  // Safari (must check after Chrome since Chrome UA contains Safari)
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
    const match = ua.match(/Version\/(\d+\.\d+)/);
    return { name: 'Safari', version: match ? match[1] : 'Unknown' };
  }

  // IE 11
  if (ua.includes('Trident/')) {
    return { name: 'Internet Explorer', version: '11' };
  }

  // Fallback
  return { name: 'Unknown', version: 'Unknown' };
}

/**
 * Detects the platform (OS) and version
 */
function detectPlatform(): { name: string; version: string } {
  const ua = navigator.userAgent;
  const platform = navigator.platform;

  // Windows
  if (platform.includes('Win') || ua.includes('Windows')) {
    let version = 'Unknown';
    if (ua.includes('Windows NT 10.0')) version = '10/11';
    else if (ua.includes('Windows NT 6.3')) version = '8.1';
    else if (ua.includes('Windows NT 6.2')) version = '8';
    else if (ua.includes('Windows NT 6.1')) version = '7';
    return { name: 'Windows', version };
  }

  // macOS
  if (platform.includes('Mac') && !ua.includes('iPhone') && !ua.includes('iPad')) {
    const match = ua.match(/Mac OS X (\d+[._]\d+)/);
    const version = match ? match[1].replace('_', '.') : 'Unknown';
    return { name: 'macOS', version };
  }

  // iOS
  if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) {
    const match = ua.match(/OS (\d+_\d+)/);
    const version = match ? match[1].replace('_', '.') : 'Unknown';
    return { name: 'iOS', version };
  }

  // Android
  if (ua.includes('Android')) {
    const match = ua.match(/Android (\d+\.\d+)/);
    const version = match ? match[1] : 'Unknown';
    return { name: 'Android', version };
  }

  // Linux
  if (platform.includes('Linux')) {
    return { name: 'Linux', version: 'Unknown' };
  }

  // Fallback
  return { name: platform || 'Unknown', version: 'Unknown' };
}

/**
 * Determines device type based on screen size and touch capabilities
 */
function getDeviceType(): string {
  const width = window.screen.width;
  const maxTouchPoints = navigator.maxTouchPoints || 0;

  // Mobile: touch-enabled and small screen
  if (maxTouchPoints > 0 && width < 768) {
    return 'mobile';
  }

  // Tablet: touch-enabled and medium screen
  if (maxTouchPoints > 0 && width >= 768 && width < 1024) {
    return 'tablet';
  }

  // Desktop: everything else or no touch
  return 'desktop';
}

/**
 * Gets screen orientation
 */
function getOrientation(): string {
  // Use Screen Orientation API if available
  if (window.screen.orientation) {
    return window.screen.orientation.type.includes('portrait') ? 'portrait' : 'landscape';
  }

  // Fallback to comparing dimensions
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}

/**
 * Checks if a storage type is available and functional
 */
function isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
  try {
    const storage = window[type];
    const test = '__storage_test__';
    storage.setItem(test, test);
    storage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Gets network connection information (optional, mainly Chrome/Edge)
 */
function getConnectionInfo(): {
  type?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
} {
  try {
    // Type assertion for connection API
    const connection = (navigator as any).connection
      || (navigator as any).mozConnection
      || (navigator as any).webkitConnection;

    if (connection) {
      return {
        type: connection.type,
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      };
    }
  } catch (e) {
    console.warn('Connection API not available:', e);
  }

  return {};
}

/**
 * Gets performance/hardware information (optional, mainly Chrome)
 */
function getPerformanceInfo(): {
  hardwareConcurrency?: number;
  deviceMemory?: number;
} {
  const info: { hardwareConcurrency?: number; deviceMemory?: number } = {};

  try {
    // CPU cores
    if (navigator.hardwareConcurrency) {
      info.hardwareConcurrency = navigator.hardwareConcurrency;
    }

    // Device memory (in GB)
    const nav = navigator as any;
    if (nav.deviceMemory) {
      info.deviceMemory = nav.deviceMemory;
    }
  } catch (e) {
    console.warn('Performance API not fully available:', e);
  }

  return info;
}

/**
 * Main function to collect all browser context data
 * @param isDarkMode - Current theme setting from app state
 */
export function getBrowserContext(isDarkMode: boolean): BrowserContextData {
  try {
    const browser = detectBrowser();
    const platform = detectPlatform();
    const connectionInfo = getConnectionInfo();
    const performanceInfo = getPerformanceInfo();

    const context: BrowserContextData = {
      // Browser
      browser: browser.name,
      browserVersion: browser.version,
      userAgent: navigator.userAgent,

      // Platform
      platform: platform.name,
      platformVersion: platform.version,

      // Display
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      devicePixelRatio: window.devicePixelRatio || 1,
      orientation: getOrientation(),
      isFullscreen: document.fullscreenElement !== null,

      // Device
      deviceType: getDeviceType(),
      touchSupported: navigator.maxTouchPoints > 0,
      maxTouchPoints: navigator.maxTouchPoints || 0,

      // Locale
      language: navigator.language,
      languages: Array.from(navigator.languages || [navigator.language]),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),

      // App state
      theme: isDarkMode ? 'dark' : 'light',

      // Connection (optional)
      connectionType: connectionInfo.type,
      connectionEffectiveType: connectionInfo.effectiveType,
      connectionDownlink: connectionInfo.downlink,
      connectionRtt: connectionInfo.rtt,
      connectionSaveData: connectionInfo.saveData,

      // Capabilities
      cookiesEnabled: navigator.cookieEnabled,
      localStorageAvailable: isStorageAvailable('localStorage'),
      sessionStorageAvailable: isStorageAvailable('sessionStorage'),
      webWorkersSupported: typeof Worker !== 'undefined',
      serviceWorkerSupported: 'serviceWorker' in navigator,

      // Performance (optional)
      hardwareConcurrency: performanceInfo.hardwareConcurrency,
      deviceMemory: performanceInfo.deviceMemory,
    };

    return context;
  } catch (error) {
    console.error('Error collecting browser context:', error);

    // Return minimal fallback context
    return {
      browser: 'Unknown',
      browserVersion: 'Unknown',
      userAgent: navigator.userAgent || 'Unknown',
      platform: 'Unknown',
      platformVersion: 'Unknown',
      screenResolution: 'Unknown',
      viewportSize: 'Unknown',
      devicePixelRatio: 1,
      orientation: 'Unknown',
      isFullscreen: false,
      deviceType: 'Unknown',
      touchSupported: false,
      maxTouchPoints: 0,
      language: 'Unknown',
      languages: [],
      timezone: 'Unknown',
      timezoneOffset: 0,
      theme: isDarkMode ? 'dark' : 'light',
      cookiesEnabled: false,
      localStorageAvailable: false,
      sessionStorageAvailable: false,
      webWorkersSupported: false,
      serviceWorkerSupported: false,
    };
  }
}
