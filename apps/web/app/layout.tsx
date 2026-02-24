import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"]
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "Create a Family Storybook | Memorioso",
  description:
    "Record or write stories, get guided prompts, add photos, and export a beautiful PDF storybook.",
  openGraph: {
    title: "Memorioso | A family storybook you will pass down",
    description:
      "Capture memories in voice or text. Export a premium PDF keepsake.",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
