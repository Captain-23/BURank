/** Normalize enrollment numbers for storage and lookup. */
export function normalizeEnrollmentNo(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

/** Compare two enrollment values after normalization. */
export function enrollmentMatches(a: string, b: string): boolean {
  return normalizeEnrollmentNo(a) === normalizeEnrollmentNo(b);
}

/** Reject dates, passwords, and other values that aren't enrollment IDs. */
export function isPlausibleEnrollmentNo(value: string): boolean {
  const n = normalizeEnrollmentNo(value);
  if (n.length < 5 || n.length > 24) return false;
  if (/^\d{4}-\d{2}-\d{2}/.test(n)) return false;
  if (!/^[A-Z0-9]+$/.test(n)) return false;
  // Bennett enrollment IDs start with a letter followed by at least two digits.
  return /^[A-Z]\d{2}/.test(n);
}

/** Pick the first plausible enrollment number from a list of sources. */
export function resolveEnrollmentNo(
  sources: Array<string | null | undefined>,
): string {
  for (const raw of sources) {
    if (!raw?.trim()) continue;
    const normalized = normalizeEnrollmentNo(raw);
    if (isPlausibleEnrollmentNo(normalized)) return normalized;
  }
  return "";
}
