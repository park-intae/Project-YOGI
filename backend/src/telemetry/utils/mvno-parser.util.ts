export function parseMvnoPlans(rawPlans: any | any[]) {
  // Ensure we are working with an array even if a single item is returned
  const plansArray = Array.isArray(rawPlans) ? rawPlans : [rawPlans];
  
  return plansArray.map((item: any) => ({
    carrier: item.mvncomNm || item.carrier || '알뜰폰',
    base_network: (item.telecomName || item.base_network || 'UNKNOWN').replace(/망$/, '') + '망',
    plan_name: item.chargeName || item.plan_name || '',
    network_type: item.telecomGenerationType || item.network_type || '',
    base_fee: String(item.chargeAmount || item.base_fee || 0),
    data_allowance_gb: String(item.dataAmount || item.data_allowance_gb || 0),
    voice_allowance_min: String(item.voiceAmount || item.voice_allowance_min || 0),
    raw_description: JSON.stringify(item),
  }));
}
