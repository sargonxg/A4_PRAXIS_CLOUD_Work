import type { Metadata, Viewport } from "next";
import { EB_Garamond, Inter, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth/auth-context";
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
const SHARE_TITLE = "PRAXIS by TACITUS · AI Built for Statecraft. Calibrated to You.";
const SHARE_DESCRIPTION =
  "Agentic AI workspace for diplomats, conflict analysts, mediators, and policy officers. Calibrated to your mandate. Grounded in ACLED, UCDP, GDELT, OCHA, ReliefWeb, World Bank, and your private corpus.";
const SEARCH_DESCRIPTION =
  "PRAXIS by TACITUS is the agentic AI workspace for statecraft. 40+ calibrated tools for diplomats, conflict analysts, mediators, and policy officers — grounded in ACLED, UCDP, GDELT, OCHA, and your sources.";
const SHARE_IMAGE_ALT =
  "PRAXIS by TACITUS — AI Built for Statecraft. Agentic AI for diplomats, conflict analysts, mediators, and policy officers.";

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
    "ACLED",
    "UCDP",
    "GDELT",
    "OCHA",
    "ReliefWeb",
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
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
/* PRAXIS v16 */
