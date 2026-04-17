"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const DubaiMap = dynamic(() => import("@/components/DubaiMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  ),
});

export default function MapPage() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <DubaiMap />
    </div>
  );
}
