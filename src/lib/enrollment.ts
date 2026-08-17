/** Normalize enrollment numbers for storage and lookup. */
export function normalizeEnrollmentNo(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

/** Compare two enrollment values after normalization. */
export function enrollmentMatches(a: string, b: string): boolean {
  return normalizeEnrollmentNo(a) === normalizeEnrollmentNo(b);
}
