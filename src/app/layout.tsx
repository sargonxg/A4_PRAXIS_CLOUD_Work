import type { Metadata, Viewport } from "next";
import { EB_Garamond, Inter, JetBrains_Mono } from "next/font/google";
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0F172A',
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://praxis.tacitus.me';

const PRIMARY_TITLE = "PRAXIS by TACITUS — AI Built for Statecraft";
const SHARE_TITLE = "PRAXIS by TACITUS · ContextCapsules for Policy Work";
const SHARE_DESCRIPTION =
  "PRAXIS lets you compose reasoning and policy products from expert ContextCapsules: reusable blocks that capture how analysts think, frame issues, and structure decisions.";
const SEARCH_DESCRIPTION =
  "PRAXIS by TACITUS is a ContextCapsule-first AI workspace for statecraft, policy analysis, conflict intelligence, diplomacy, and institutional decision work.";
const SHARE_IMAGE_ALT =
  "PRAXIS by TACITUS — reasoning and policy products from expert ContextCapsules.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: PRIMARY_TITLE,
    template: "%s · PRAXIS by TACITUS",
  },
  description: SEARCH_DESCRIPTION,
  applicationName: "PRAXIS by TACITUS",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  keywords: [
    "PRAXIS",
    "TACITUS",
    "ContextCapsule",
    "ContextCapsules",
    "agentic AI",
    "statecraft",
    "policy AI",
    "diplomatic intelligence",
    "conflict analysis",
    "conflict intelligence",
    "mediation software",
    "humanitarian intelligence",
    "Glasl escalation",
    "Fisher-Ury",
    "INFORM Risk Index",
    "ICD-203",
    "ACO conflict ontology",
    "Google Search",
    "source receipts",
    "Google Cloud",
    "Vertex AI",
  ],
  authors: [{ name: "TACITUS", url: "https://tacitus.me" }],
  creator: "TACITUS",
  publisher: "TACITUS",
  category: "Government & Policy Software",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    url: siteUrl,
    type: "website",
    siteName: "PRAXIS by TACITUS",
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: SHARE_IMAGE_ALT,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    site: "@tacitus_me",
    creator: "@tacitus_me",
    images: [
      {
        url: "/opengraph-image",
        alt: SHARE_IMAGE_ALT,
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  appleWebApp: {
    capable: true,
    title: "PRAXIS",
    statusBarStyle: "black-translucent",
  },
  other: {
    "og:image:secure_url": `${siteUrl}/opengraph-image`,
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
      </body>
    </html>
  );
}
/* PRAXIS v16 */
