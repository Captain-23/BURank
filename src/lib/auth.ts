import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export { authOptions };

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();

  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  return session;
}

export function enrollmentFromEmail(email: string) {
  return email.split("@")[0]?.toLowerCase() ?? "";
}