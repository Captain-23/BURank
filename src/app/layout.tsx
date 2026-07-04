// src/app/layout.tsx — replace your existing layout with this
import type { Metadata } from "next";
import SessionProvider from "@/components/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "BURank — Bennett University LeetCode Leaderboard",
  description:
    "Compete, track progress, and rank among Bennett University coders.",
  openGraph: {
    title: "BURank",
    description: "Bennett University LeetCode Leaderboard",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {/*
          SessionProvider must wrap everything so useSession()
          works in any client component.
        */}
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
