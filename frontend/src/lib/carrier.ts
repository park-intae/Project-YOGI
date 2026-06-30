/**
 * 통신망 이름에서 로고 이미지 경로를 반환합니다.
 */
export function getLogoSrc(networkName: string): string {
  if (!networkName) return '/brand_logo/SKT.png';
  if (networkName.includes('SKT')) return '/brand_logo/SKT.png';
  if (networkName.includes('KT')) return '/brand_logo/KT.png';
  if (networkName.includes('LGU+') || networkName.includes('LG U+')) return '/brand_logo/LG_U+.png';
  return '/brand_logo/SKT.png'; // fallback
}

/**
 * 통신망 이름에서 원본 망(Network)을 추출합니다.
 */
export function getNetwork(networkName: string): string {
  if (!networkName) return 'SKT';
  if (networkName.includes('SKT')) return 'SKT';
  if (networkName.includes('KT')) return 'KT';
  if (networkName.includes('LGU+') || networkName.includes('LG U+')) return 'LGU+';
  return 'SKT'; // fallback
}
