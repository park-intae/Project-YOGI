export const MNO_CARRIERS = ['SKT', 'KT', 'LGU_PLUS'];

/**
 * Checks if a given carrier string corresponds to a traditional MNO (Mobile Network Operator).
 */
export function isMno(carrier: string): boolean {
  if (!carrier) return false;
  return MNO_CARRIERS.includes(carrier.toUpperCase());
}

/**
 * Checks if a given carrier string corresponds to an MVNO (Mobile Virtual Network Operator).
 */
export function isMvno(carrier: string): boolean {
  if (!carrier) return false;
  return !isMno(carrier);
}

/**
 * Returns a Prisma where clause filter for MVNO carriers.
 */
export function getMvnoWhereClause() {
  return { notIn: MNO_CARRIERS };
}

/**
 * Normalizes a carrier filter query parameter to a Prisma where clause value.
 * Maps '알뜰폰' to an MVNO exclusion query, otherwise returns the exact carrier name.
 */
export function getCarrierFilter(carrierType: string): string | { notIn: string[] } {
  if (carrierType === '알뜰폰') {
    return getMvnoWhereClause();
  }
  return carrierType;
}
