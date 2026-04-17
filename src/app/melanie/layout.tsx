import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "MELANIE DAVEID | Experience Design",
  description:
    "Experience Design leader with a rich synthesis of digital ecosystems, physical products and emerging technologies.",
};

export default function MelanieLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <style>{`
        nav { display: none !important; }
        body { background: #0a0a0f !important; color: #e5e5e5 !important; }
        main { padding: 0 !important; margin: 0 !important; }
        @import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@300;400;500&display=swap');
      `}</style>
      {children}
    </>
  );
}
