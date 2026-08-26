const SETTING_KEY = "suppressed_usernames";

export function parseSuppressedUsernames(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return [
      ...new Set(
        parsed
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean),
      ),
    ];
  } catch {
    return [];
  }
}

export function withSuppressedUsername(
  existing: string[],
  username: string,
): string[] {
  const normalized = username.trim().toLowerCase();
  if (!normalized) return existing;
  return [...new Set([...existing, normalized])];
}

export function withoutSuppressedUsername(
  existing: string[],
  username: string,
): string[] {
  const normalized = username.trim().toLowerCase();
  return existing.filter((value) => value !== normalized);
}

export function excludeSuppressedUsers<T extends { username: string }>(
  users: T[],
  suppressed: string[],
): T[] {
  if (suppressed.length === 0) return users;
  const skip = new Set(suppressed.map((value) => value.toLowerCase()));
  return users.filter((user) => !skip.has(user.username.toLowerCase()));
}

export { SETTING_KEY as SUPPRESSED_USERNAMES_KEY };
