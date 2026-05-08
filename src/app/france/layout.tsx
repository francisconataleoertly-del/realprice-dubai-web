import type { Metadata } from "next";

const TITLE = "FonatProp France — DVF intelligence for the French residential market";
const DESCRIPTION =
  "Address-anchored valuations on 5.9M+ DVF transactions, ADEME DPE auto-lookup across 6M+ records, French tax regimes (LMNP, micro-foncier, SCI), reduced TVA + Éco-PTZ renovation modelling, and live DVF comparables. Built on official open-data feeds, never approximations.";
const OG_IMAGE = "/france/eiffel-tower-night.jpg";
const URL = "https://fonatprop.com/france";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "FonatProp France",
  keywords: [
    "France real estate",
    "DVF",
    "DPE",
    "valuation",
    "property intelligence",
    "rendement locatif",
    "MaPrimeRénov",
    "LMNP",
    "FonatProp",
  ],
  openGraph: {
    type: "website",
    url: URL,
    siteName: "FonatProp",
    title: TITLE,
    description: DESCRIPTION,
    locale: "fr_FR",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "FonatProp France — DVF intelligence platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  alternates: {
    canonical: URL,
  },
};

export default function FranceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "FonatProp France",
            applicationCategory: "RealEstateApplication",
            operatingSystem: "Web",
            url: URL,
            description: DESCRIPTION,
            inLanguage: "fr-FR",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "EUR",
              availability: "https://schema.org/InStock",
            },
            isBasedOn: [
              {
                "@type": "Dataset",
                name: "Demandes de Valeurs Foncières (DVF)",
                provider: { "@type": "Organization", name: "DGFiP / Etalab" },
                url: "https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres",
              },
              {
                "@type": "Dataset",
                name: "DPE Logements existants",
                provider: { "@type": "Organization", name: "ADEME" },
                url: "https://data.ademe.fr/datasets/dpe03existant",
              },
            ],
          }),
        }}
      />
    </>
  );
}
