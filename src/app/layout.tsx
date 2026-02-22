import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Calendar: The Ultimate All-in-One Calendar for Developers",
  description: "A beautifully designed, open-source calendar that aggregates information about competitive programming contests, hackathons, and tech livestreams from multiple platforms into a single, easy-to-use interface.",
  keywords: ["developer", "calendar", "dev", "programming", "contest", "hackathon", "livestream", "atcoder", "codechef", "codeforces", "codolio", "devpost", "geeksforgeeks", "leetcode", "unstop"],
  openGraph: {
    title: "Calendar: The Ultimate All-in-One Calendar for Developers",
    description: "A beautifully designed, open-source calendar that aggregates information about competitive programming contests, hackathons, and tech livestreams from multiple platforms into a single, easy-to-use interface.",
    url: "https://calendar.js.org",
    siteName: "Calendar",
    images: [
      {
        url: "https://calendar.js.org/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Calendar: The Ultimate All-in-One Calendar for Developers",
    description: "A beautifully designed, open-source calendar that aggregates information about competitive programming contests, hackathons, and tech livestreams from multiple platforms into a single, easy-to-use interface.",
    images: ["https://calendar.js.org/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
