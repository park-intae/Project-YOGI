import { parseMvnoPlans } from './mvno-parser.util';

describe('Mvno Parser Utils', () => {
  it('should parse an array of mvno plans', () => {
    const raw = [
      {
        mvncomNm: 'A_MVNO',
        telecomName: 'SKT',
        chargeName: 'A_Plan',
        telecomGenerationType: '5G',
        chargeAmount: 10000,
        dataAmount: 10,
        voiceAmount: 100,
      }
    ];

    const result = parseMvnoPlans(raw);
    expect(result).toHaveLength(1);
    expect(result[0].carrier).toBe('A_MVNO');
    expect(result[0].plan_name).toBe('A_Plan');
    expect(result[0].network_type).toBe('5G');
    expect(result[0].base_fee).toBe('10000');
    expect(result[0].data_allowance_gb).toBe('10');
    expect(result[0].voice_allowance_min).toBe('100');
  });

  it('should handle single object instead of array', () => {
    const raw = {
      telecomName: 'B_MVNO',
      chargeName: 'B_Plan',
      chargeAmount: null,
      dataAmount: undefined,
    };
    const result = parseMvnoPlans(raw);
    expect(result).toHaveLength(1);
    expect(result[0].base_fee).toBe('0'); // edge case fallback
    expect(result[0].data_allowance_gb).toBe('0'); // edge case fallback
  });

  it('should handle completely missing fields with default values', () => {
    const raw = [{}];
    const result = parseMvnoPlans(raw);
    expect(result[0].base_fee).toBe('0');
    expect(result[0].data_allowance_gb).toBe('0');
    expect(result[0].voice_allowance_min).toBe('0');
  });
});
