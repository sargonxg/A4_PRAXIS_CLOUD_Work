import type { Metadata } from "next";
import { EB_Garamond, Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-eb-garamond",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PRAXIS by TACITUS — Conflict Intelligence Platform",
  description:
    "The AI-native workspace for peace and security professionals. Turn raw conflict data into decisive intelligence in minutes, not weeks.",
  openGraph: {
    title: "PRAXIS by TACITUS — Conflict Intelligence Platform",
    description:
      "AI-native conflict intelligence for peace and security professionals. Live Gemini AI. Glasl escalation model. Conflict Grammar knowledge graph.",
    type: "website",
    siteName: "PRAXIS by TACITUS",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PRAXIS by TACITUS — Conflict Intelligence Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PRAXIS by TACITUS — Conflict Intelligence Platform",
    description:
      "AI-native conflict intelligence for peace and security professionals.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${ebGaramond.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
