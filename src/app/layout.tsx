import type { Metadata } from "next";
import { Inter, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AETHER - AI Crime Analytics & Tactical Intelligence Platform",
  description: "AETHER is a modern AI-powered command-center intelligence dashboard that transforms siloed police records and socio-economic data into actionable predictive insights for Delhi NCR.",
  keywords: ["crime analytics", "predictive policing", "tactical intelligence", "geospatial maps", "delhi ncr"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} ${jetbrainsMono.variable}`}>
        {/* Background decorators */}
        <div className="cyber-grid"></div>
        <div className="glow-radial glow-radial-1"></div>
        <div className="glow-radial glow-radial-2"></div>
        
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
