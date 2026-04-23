import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FonatProp | Log In",
  description: "Access FonatProp member, Pro and admin surfaces.",
};

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,200..700;1,9..144,300..600&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400;500&display=swap');
        body > nav:first-of-type { display: none !important; }
        body { background: #0a0a0f !important; color: #e5e5e5 !important; }
        main { padding: 0 !important; margin: 0 !important; }
        body { font-family: 'Inter', system-ui, sans-serif; }
      `}</style>
      {children}
    </>
  );
}
