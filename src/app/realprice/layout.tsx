import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "RealPrice | AI-Powered Property Valuation for Dubai",
  description:
    "AI-powered automated valuation model for Dubai real estate. Instant property estimates, market insights, and investment analytics.",
};

export default function RealPriceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <style>{`
        body > nav:first-of-type { display: none !important; }
        body { background: #0a0a0f !important; color: #e5e5e5 !important; }
        main { padding: 0 !important; margin: 0 !important; }
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,200..700;1,9..144,300..600&family=Inter:wght@300;400;500;600&family=IBM+Plex+Mono:wght@300;400;500&display=swap');
      `}</style>
      {children}
    </>
  );
}
