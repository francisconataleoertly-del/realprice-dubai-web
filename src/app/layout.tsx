import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AccessProvider } from "@/components/access/AccessProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fonatprop.com"),
  title: "FonatProp Dubai - Property Valuation",
  description:
    "FonatProp: AI-powered Automated Valuation Model for Dubai residential real estate",
  icons: {
    icon: "/brand/favicon.ico",
    shortcut: "/brand/favicon.ico",
    apple: "/brand/fonatprop-apple-touch.png",
  },
  openGraph: {
    title: "FonatProp Dubai - Property Valuation",
    description:
      "AI-powered real estate intelligence, valuation and seller lead capture for Dubai brokerages.",
    images: ["/brand/fonatprop-og.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AccessProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
        </AccessProvider>
      </body>
    </html>
  );
}
