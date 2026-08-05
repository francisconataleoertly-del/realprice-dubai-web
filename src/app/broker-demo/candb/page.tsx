import type { Metadata } from "next";

import CandBPreviewClient from "./CandBPreviewClient";

export const metadata: Metadata = {
  title: "C&B Project Private Preview | FonatProp",
  description:
    "Private FonatProp pilot preview for C&B Project: one focused property-review widget with broker handoff and pilot analytics.",
};

export default function CandBPreviewPage() {
  return <CandBPreviewClient />;
}
