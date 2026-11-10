import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Banner } from "@/components/layout/Banner";
import { getSiteContent } from "@/lib/data/catalog";

const display = Big_Shoulders({
  variable: "--font-big-shoulders",
  subsets: ["latin"],
  axes: ["opsz"],
});

const body = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: { type: "website", siteName: "BUN THEORY", images: ["/renders/the-classic.png"] },
  title: {
    default: "BUN THEORY — Burgers, studied obsessively",
    template: "%s · BUN THEORY",
  },
  description:
    "Smashed, seared and stacked in the right order. Order BUN THEORY burgers for delivery or pickup, or build your own layer by layer.",
};

export const viewport: Viewport = {
  themeColor: "#170b06",
};

/** The banner's copy comes from the database: fetched inside its own Suspense boundary so no page waits on it. */
async function BannerSlot() {
  const { banner } = await getSiteContent();
  return <Banner {...banner} />;
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}>
      <body className="grain min-h-dvh">
        {/* Banner reads the URL (hidden on admin pages), so it streams in its own boundary. */}
        <Suspense fallback={null}>
          <BannerSlot />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
