import type { Metadata } from "next";

import FranceMarketClient from "./FranceMarketClient";

export const metadata: Metadata = {
  title: "FonatProp France | AI-Powered Real Estate Intelligence",
  description:
    "France market intelligence powered by official DVF real estate transaction data.",
};

export default function FrancePage() {
  return <FranceMarketClient />;
}
