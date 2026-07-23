import type { Metadata, Viewport } from "next";
import {
  Bricolage_Grotesque,
  IBM_Plex_Mono,
  Manrope,
} from "next/font/google";

import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://ask-the-image-gemini-demo.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Ask the Image — Visual analysis with Gemini",
    template: "%s | Ask the Image",
  },
  description:
    "Upload an image and receive a structured, uncertainty-aware visual analysis powered by Gemini.",
  applicationName: "Ask the Image",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Ask the Image",
    description:
      "A focused visual-analysis demo with structured findings and explicit uncertainty.",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "Ask the Image",
    description:
      "A focused visual-analysis demo with structured findings and explicit uncertainty.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#102927",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} ${mono.variable}`}>
        {children}
      </body>
    </html>
  );
}
