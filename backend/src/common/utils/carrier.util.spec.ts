import { isMno, isMvno, getMvnoWhereClause, getCarrierFilter } from './carrier.util';

describe('Carrier Utils', () => {
  describe('isMno', () => {
    it('should return true for MNO carriers', () => {
      expect(isMno('SKT')).toBe(true);
      expect(isMno('KT')).toBe(true);
      expect(isMno('LGU_PLUS')).toBe(true);
      expect(isMno('skt')).toBe(true); // case insensitive test
    });

    it('should return false for MVNO carriers or empty string', () => {
      expect(isMno('알뜰폰')).toBe(false);
      expect(isMno('HelloMobile')).toBe(false);
      expect(isMno('')).toBe(false);
      expect(isMno(null as any)).toBe(false);
    });
  });

  describe('isMvno', () => {
    it('should return true for non-MNO carriers', () => {
      expect(isMvno('알뜰폰')).toBe(true);
      expect(isMvno('KCT')).toBe(true);
    });

    it('should return false for MNO carriers or empty string', () => {
      expect(isMvno('SKT')).toBe(false);
      expect(isMvno('')).toBe(false);
      expect(isMvno(null as any)).toBe(false);
    });
  });

  describe('getCarrierFilter', () => {
    it('should return notIn query for 알뜰폰', () => {
      expect(getCarrierFilter('알뜰폰')).toEqual({ notIn: ['SKT', 'KT', 'LGU_PLUS'] });
    });
    
    it('should return exact string for others', () => {
      expect(getCarrierFilter('SKT')).toBe('SKT');
      expect(getCarrierFilter('KT')).toBe('KT');
    });
  });
});
