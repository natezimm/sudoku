import { environment } from '../../environments/environment';

export function validateSecureUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    if (environment.production) {
      if (parsedUrl.protocol !== 'https:') {
        console.error('Security: API URL must use HTTPS in production');
        return false;
      }
    } else {
      const isLocalhost = parsedUrl.hostname === 'localhost' || 
                          parsedUrl.hostname === '127.0.0.1' ||
                          parsedUrl.hostname === '::1';
      
      if (parsedUrl.protocol === 'http:' && !isLocalhost) {
        console.warn('Security: HTTP should only be used for localhost in development');
        return false;
      }
    }
    
    return true;
  } catch {
    console.error('Security: Invalid URL provided');
    return false;
  }
}

export function assertSecureApiUrl(): void {
  const apiUrl = environment.apiUrl;
  
  if (!validateSecureUrl(apiUrl)) {
    if (environment.production) {
      throw new Error(
        `Security Error: API URL "${apiUrl}" is not secure. ` +
        'Production environments require HTTPS.'
      );
    }
  }
}

export function sanitizeForDisplay(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function isValidCellValue(value: unknown): value is number | null {
  if (value === null) return true;
  if (typeof value !== 'number') return false;
  return Number.isInteger(value) && value >= 0 && value <= 9;
}
