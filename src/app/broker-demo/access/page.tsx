import type { Metadata } from "next";

import BrokerDemoAccessPageClient from "./BrokerDemoAccessPageClient";

export const metadata: Metadata = {
  title: "FonatProp Broker Demo | Private Access",
  description:
    "Protected access page for the private FonatProp broker demo, mandate pack and live valuation workflow.",
};

type PageProps = {
  searchParams?: Promise<{
    next?: string | string[];
  }>;
};

export default async function BrokerDemoAccessPage({ searchParams }: PageProps) {
  const resolved = searchParams ? await searchParams : undefined;
  const nextParam = resolved?.next;
  const nextPath = Array.isArray(nextParam) ? nextParam[0] : nextParam;

  return <BrokerDemoAccessPageClient nextPath={nextPath || "/broker-demo"} />;
}
