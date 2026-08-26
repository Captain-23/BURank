import { prisma } from "@/lib/prisma";
import {
  parseSuppressedUsernames,
  SUPPRESSED_USERNAMES_KEY,
  withoutSuppressedUsername,
  withSuppressedUsername,
} from "@/lib/suppressed-users";

export async function getSuppressedUsernames(): Promise<string[]> {
  const row = await prisma.setting.findUnique({
    where: { key: SUPPRESSED_USERNAMES_KEY },
  });
  return parseSuppressedUsernames(row?.value);
}

export async function suppressUsername(username: string): Promise<void> {
  const current = await getSuppressedUsernames();
  const next = withSuppressedUsername(current, username);
  if (next.length === current.length) return;
  await prisma.setting.upsert({
    where: { key: SUPPRESSED_USERNAMES_KEY },
    update: { value: JSON.stringify(next) },
    create: { key: SUPPRESSED_USERNAMES_KEY, value: JSON.stringify(next) },
  });
}

export async function unsuppressUsername(username: string): Promise<void> {
  const current = await getSuppressedUsernames();
  const next = withoutSuppressedUsername(current, username);
  if (next.length === current.length) return;
  await prisma.setting.upsert({
    where: { key: SUPPRESSED_USERNAMES_KEY },
    update: { value: JSON.stringify(next) },
    create: { key: SUPPRESSED_USERNAMES_KEY, value: JSON.stringify(next) },
  });
}
