import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "../index.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const outfit = Outfit({ subsets: ["latin"], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: "ShieldGram | AI Instagram Comment Moderation & Anti-Spam Tool",
  description: "Instantly stop crypto bots, hate speech, and spam on Instagram. ShieldGram is the AI comment moderation tool that auto-hides toxic comments 24/7. Try for free.",
  keywords: ["AI Instagram Comment Moderation", "Auto-Hide Spam", "Stop Crypto Bots", "Social Media Brand Protection", "Instagram Anti-Spam"],
  openGraph: {
    title: "ShieldGram | AI Instagram Comment Moderation & Anti-Spam Tool",
    description: "Instantly stop crypto bots, hate speech, and spam on Instagram. ShieldGram auto-hides toxic comments 24/7.",
    url: "https://www.shieldgram.com",
    siteName: "ShieldGram",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShieldGram | AI Instagram Comment Moderation",
    description: "Stop crypto bots & spam on Instagram with AI-powered auto-moderation.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
