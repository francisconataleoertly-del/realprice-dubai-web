import type { Metadata } from "next";

import MandatePackPageClient from "./MandatePackPageClient";

export const metadata: Metadata = {
  title: "FonatProp Broker Demo | Mandate Pack",
  description:
    "Seller-ready valuation report demo for Dubai brokerages: AI-backed price range, comparables and listing strategy.",
};

type PageProps = {
  searchParams?: Promise<{
    seller?: string | string[];
  }>;
};

export default async function BrokerDemoMandatePackPage({ searchParams }: PageProps) {
  const resolved = searchParams ? await searchParams : undefined;
  const sellerParam = resolved?.seller;
  const sellerDefault = Array.isArray(sellerParam)
    ? sellerParam.includes("1")
    : sellerParam === "1";

  return <MandatePackPageClient sellerDefault={sellerDefault} />;
}
