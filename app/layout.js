import { Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import RootLayoutClient from "./layout-client";

const manrope = Manrope({
  variable: "--font-sans-custom",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono-custom",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Founder Brain — Coordination Gap Detector",
  description:
    "AI-powered intelligence layer that detects when founding team decisions drift apart, before commitments break.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
