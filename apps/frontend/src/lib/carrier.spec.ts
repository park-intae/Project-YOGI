import { describe, it, expect } from 'vitest';
import { getLogoSrc, getNetwork } from './carrier';

describe('carrier.ts', () => {
  describe('getLogoSrc', () => {
    it('should return SKT logo for SKT or undefined', () => {
      expect(getLogoSrc('SKT')).toBe('/brand_logo/SKT.png');
      expect(getLogoSrc('')).toBe('/brand_logo/SKT.png');
      expect(getLogoSrc('Unknown')).toBe('/brand_logo/SKT.png');
    });

    it('should return KT logo for KT', () => {
      expect(getLogoSrc('KT 망')).toBe('/brand_logo/KT.png');
    });

    it('should return LGU+ logo for LGU+ or LG U+', () => {
      expect(getLogoSrc('LGU+')).toBe('/brand_logo/LG_U+.png');
      expect(getLogoSrc('LG U+')).toBe('/brand_logo/LG_U+.png');
    });
  });

  describe('getNetwork', () => {
    it('should return SKT for SKT or undefined', () => {
      expect(getNetwork('SKT 망')).toBe('SKT');
      expect(getNetwork('')).toBe('SKT');
      expect(getNetwork('Unknown')).toBe('SKT');
    });

    it('should return KT for KT', () => {
      expect(getNetwork('KT 알뜰폰')).toBe('KT');
    });

    it('should return LGU+ for LGU+ or LG U+', () => {
      expect(getNetwork('LGU+ 망')).toBe('LGU+');
      expect(getNetwork('LG U+')).toBe('LGU+');
    });
  });
});
