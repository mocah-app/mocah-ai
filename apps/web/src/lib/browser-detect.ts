/**
 * Detects if the current browser is Safari
 * Works in both client and server environments (returns false on server)
 */
export function isSafari(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isSafariBrowser = userAgent.includes('safari') && !userAgent.includes('chrome') && !userAgent.includes('chromium');
  
  return isSafariBrowser;
}

/**
 * Detects browser type
 */
export function getBrowserType(): 'chrome' | 'safari' | 'firefox' | 'edge' | 'other' {
  if (typeof window === 'undefined') return 'other';
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('edg/')) return 'edge';
  if (userAgent.includes('chrome') || userAgent.includes('chromium')) return 'chrome';
  if (userAgent.includes('firefox')) return 'firefox';
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'safari';
  
  return 'other';
}
