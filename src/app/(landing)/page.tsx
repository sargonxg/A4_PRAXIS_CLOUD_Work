import { headers } from "next/headers";
import { Phase8WowLanding } from "@/components/landing/phase8-wow-landing";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://praxis.tacitus.me";
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "PRAXIS by TACITUS",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Policy workbench",
  operatingSystem: "Web",
  description:
    "PRAXIS helps policy, diplomacy, and strategy teams build the user context, situation cores, domain ontologies, tool workflows, and reviewable drafts needed to use AI well.",
  url: siteUrl,
  image: `${siteUrl}/opengraph-image`,
  inLanguage: "en",
  audience: {
    "@type": "Audience",
    audienceType: "Policy teams, diplomatic teams, research desks, public affairs teams, and institutional analysts",
  },
  offers: [
    {
      "@type": "Offer",
      name: "Preview",
      price: "0",
      priceCurrency: "USD",
      description: "Ask PRAXIS preview that shows how User Cores, Situation Cores, suggested tools, and memo outputs fit together",
    },
    {
      "@type": "Offer",
      name: "Analyst",
      price: "30.00",
      priceCurrency: "USD",
      description: "Individual workspace for private situations, methods, and drafts",
    },
    {
      "@type": "Offer",
      name: "Team",
      price: "120.00",
      priceCurrency: "USD",
      description: "Shared workspace for teams handling multiple live situations",
    },
  ],
  creator: {
    "@type": "Organization",
    name: "TACITUS",
    url: "https://tacitus.me",
  },
  featureList: [
    "Ask PRAXIS preview for User Core and Situation Core attachment",
    "Persona-aware answers for policy, diplomacy, and strategic analysis work",
    "User Core, Situation Core, source graph, and domain-targeted ontology workflows for policy teams",
    "Suggested actions for research, source intake, graph review, stakeholder mapping, scenarios, memo drafting, brief export, and red team review",
    "Review-first drafting with source posture and visible gaps",
    "Google Cloud, Firebase, Firestore, Cloud SQL Postgres, and Secret Manager production path",
  ],
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TACITUS",
  legalName: "TACITUS",
  url: "https://tacitus.me",
  logo: `${siteUrl}/favicon.svg`,
  description:
    "TACITUS builds software for statecraft, policy analysis, conflict intelligence, and institutional decision work.",
  sameAs: ["https://praxis.tacitus.me", "https://tacitus.me"],
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "sales",
      email: "hello@tacitus.me",
      areaServed: "Worldwide",
      availableLanguage: ["English"],
    },
  ],
};

export default async function LandingPage() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      {gaMeasurementId ? (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`} nonce={nonce} />
          <script
            nonce={nonce}
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}', { anonymize_ip: true });
              `,
            }}
          />
        </>
      ) : null}
      <Phase8WowLanding />
    </>
  );
}
