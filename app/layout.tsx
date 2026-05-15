import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AEO + GEO Analyser",
  description: "Analyse any website for Answer Engine and Generative Engine Optimisation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
