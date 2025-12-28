import { validateSecureUrl, sanitizeForDisplay, isValidCellValue } from './security.utils';

describe('Security Utils', () => {
  describe('validateSecureUrl', () => {
    describe('in production environment', () => {
      beforeEach(() => {
      });

      it('should accept valid HTTPS URLs', () => {
        const url = new URL('https://api.example.com/api/sudoku');
        expect(url.protocol).toBe('https:');
      });

      it('should reject HTTP URLs in production', () => {
        const url = new URL('http://api.example.com/api/sudoku');
        expect(url.protocol).toBe('http:');
      });

      it('should handle invalid URLs gracefully', () => {
        expect(() => new URL('not-a-valid-url')).toThrow();
      });
    });

    describe('URL parsing', () => {
      it('should correctly identify localhost', () => {
        const localhostUrls = [
          'http://localhost:5200',
          'http://127.0.0.1:5200',
        ];

        localhostUrls.forEach(urlStr => {
          const url = new URL(urlStr);
          const isLocalhost = url.hostname === 'localhost' || 
                              url.hostname === '127.0.0.1' ||
                              url.hostname === '::1';
          expect(isLocalhost).toBe(true);
        });
      });

      it('should identify non-localhost URLs', () => {
        const url = new URL('http://api.example.com');
        const isLocalhost = url.hostname === 'localhost' || 
                            url.hostname === '127.0.0.1' ||
                            url.hostname === '::1';
        expect(isLocalhost).toBe(false);
      });
    });
  });

  describe('sanitizeForDisplay', () => {
    it('should escape HTML special characters', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeForDisplay(input);
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('should escape ampersands', () => {
      const input = 'foo & bar';
      const result = sanitizeForDisplay(input);
      expect(result).toBe('foo &amp; bar');
    });

    it('should escape single quotes', () => {
      const input = "it's a test";
      const result = sanitizeForDisplay(input);
      expect(result).toBe('it&#x27;s a test');
    });

    it('should handle empty strings', () => {
      expect(sanitizeForDisplay('')).toBe('');
    });

    it('should handle strings without special characters', () => {
      const input = 'Hello World 123';
      expect(sanitizeForDisplay(input)).toBe(input);
    });

    it('should escape multiple special characters', () => {
      const input = '<div class="test">Hello & goodbye</div>';
      const result = sanitizeForDisplay(input);
      expect(result).toBe('&lt;div class=&quot;test&quot;&gt;Hello &amp; goodbye&lt;/div&gt;');
    });
  });

  describe('isValidCellValue', () => {
    it('should accept null as valid', () => {
      expect(isValidCellValue(null)).toBe(true);
    });

    it('should accept 0 as valid', () => {
      expect(isValidCellValue(0)).toBe(true);
    });

    it('should accept numbers 1-9 as valid', () => {
      for (let i = 1; i <= 9; i++) {
        expect(isValidCellValue(i)).toBe(true);
      }
    });

    it('should reject negative numbers', () => {
      expect(isValidCellValue(-1)).toBe(false);
    });

    it('should reject numbers greater than 9', () => {
      expect(isValidCellValue(10)).toBe(false);
      expect(isValidCellValue(100)).toBe(false);
    });

    it('should reject non-integer numbers', () => {
      expect(isValidCellValue(1.5)).toBe(false);
      expect(isValidCellValue(0.1)).toBe(false);
    });

    it('should reject strings', () => {
      expect(isValidCellValue('5')).toBe(false);
      expect(isValidCellValue('')).toBe(false);
    });

    it('should reject undefined', () => {
      expect(isValidCellValue(undefined)).toBe(false);
    });

    it('should reject objects', () => {
      expect(isValidCellValue({})).toBe(false);
      expect(isValidCellValue([])).toBe(false);
    });

    it('should reject NaN', () => {
      expect(isValidCellValue(NaN)).toBe(false);
    });

    it('should reject Infinity', () => {
      expect(isValidCellValue(Infinity)).toBe(false);
      expect(isValidCellValue(-Infinity)).toBe(false);
    });
  });
});
