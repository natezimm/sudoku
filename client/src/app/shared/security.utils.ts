import { environment } from '../../environments/environment';

/**
 * Security utilities for validating URLs and ensuring secure connections.
 * These utilities help prevent SSRF and ensure HTTPS-only connections in production.
 */

/**
 * Validates that a URL uses HTTPS protocol in production environments.
 * In development, HTTP is allowed for localhost.
 * 
 * @param url - The URL to validate
 * @returns true if the URL is secure for the current environment
 * @throws Error if the URL is invalid or insecure in production
 */
export function validateSecureUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // In production, require HTTPS
    if (environment.production) {
      if (parsedUrl.protocol !== 'https:') {
        console.error('Security: API URL must use HTTPS in production');
        return false;
      }
    } else {
      // In development, allow HTTP only for localhost
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

/**
 * Ensures the API URL from environment is secure.
 * Call this during app initialization to fail fast if misconfigured.
 */
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

/**
 * Sanitizes user input to prevent XSS when displaying in error messages.
 * Note: Angular's built-in sanitization handles most cases, but this is
 * useful for logging or non-Angular contexts.
 * 
 * @param input - The input string to sanitize
 * @returns Sanitized string safe for display
 */
export function sanitizeForDisplay(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Validates that a value is within expected bounds for Sudoku cells.
 * 
 * @param value - The cell value to validate
 * @returns true if the value is valid (0-9 or null)
 */
export function isValidCellValue(value: unknown): value is number | null {
  if (value === null) return true;
  if (typeof value !== 'number') return false;
  return Number.isInteger(value) && value >= 0 && value <= 9;
}
