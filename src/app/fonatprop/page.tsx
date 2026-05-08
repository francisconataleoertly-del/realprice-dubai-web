"use client";

import FonatPropExperience from "@/components/fonatprop/FonatPropExperience";
import CursorGlow from "@/components/design/CursorGlow";
import ScrollProgress from "@/components/design/ScrollProgress";

export default function FonatPropPage() {
  return (
    <>
      <CursorGlow />
      <ScrollProgress />
      <FonatPropExperience surface="public" />
    </>
  );
}
