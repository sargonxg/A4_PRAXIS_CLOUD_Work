import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistMono = localFont({
  src: "../../node_modules/next/dist/next-devtools/server/font/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "PRAXIS by TACITUS — Conflict Intelligence Platform",
  description:
    "The AI-native workspace for peace and security professionals. Turn raw conflict data into decisive intelligence in minutes, not weeks.",
  openGraph: {
    title: "PRAXIS by TACITUS — Conflict Intelligence Platform",
    description:
      "AI-native conflict intelligence for peace and security professionals. Live Gemini AI. Glasl escalation model. Conflict Grammar™ knowledge graph.",
    type: "website",
    siteName: "PRAXIS by TACITUS",
  },
  twitter: {
    card: "summary_large_image",
    title: "PRAXIS by TACITUS — Conflict Intelligence Platform",
    description:
      "AI-native conflict intelligence for peace and security professionals.",
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>◳</text></svg>",
    shortcut: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>◳</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${geistMono.variable} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
