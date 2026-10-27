/**
 * Affiliate URLs supplied by the owner.
 * Leave every value null until those URLs are pasted here.
 * Content records must not contain merchant URLs.
 */
export const partners = {
  hotels: null,
  trains: null,
  flights: null,
  transfers: null,
  carRental: null,
  esim: null,
  tours: null,
} as const;

export type PartnerKey = keyof typeof partners;

export function partnerHref(key: PartnerKey): string | null {
  const value: string | null = partners[key];
  if (!value) return null;
  return value;
}
