/**
 * Given the usernames currently in the DB and the usernames in the fresh
 * roster, returns the DB usernames that are no longer in the roster and
 * should be deleted. Case-insensitive.
 */
export function computeStaleUsernames(
  existing: string[],
  incoming: string[],
): string[] {
  const keep = new Set(incoming.map((u) => u.toLowerCase()));
  return existing.filter((u) => !keep.has(u.toLowerCase()));
}
