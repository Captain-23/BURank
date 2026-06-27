"use client";

// src/components/SessionProvider.tsx
// Wraps the app with NextAuth's SessionProvider so any client
// component can call useSession() to read the logged-in user.

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
