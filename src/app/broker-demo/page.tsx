import type { Metadata } from "next";

import BrokerDemoClient from "./BrokerDemoClient";

export const metadata: Metadata = {
  title: "FonatProp Broker Demo | Valuation + Widget",
  description:
    "Focused FonatProp demo for Dubai brokerages: AI valuation engine and embeddable lead-capture widget.",
};

export default function BrokerDemoPage() {
  return <BrokerDemoClient />;
}
