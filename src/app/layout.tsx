// src/app/layout.tsx — replace your existing layout with this
import type { Metadata, Viewport } from "next";
import SessionProvider from "@/components/SessionProvider";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

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

import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
