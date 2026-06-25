import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BURank",
  description:
    "Bennett University's competitive programming leaderboard powered by LeetCode stats.",
  openGraph: {
    title: "BU LeetCode Leaderboard",
    description: "See where you rank among Bennett University coders.",
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
      <body className="min-h-screen bg-bu-dark">{children}</body>
    </html>
  );
}
