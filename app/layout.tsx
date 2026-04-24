import type { Metadata } from "next";
import { Lora, Inter } from "next/font/google";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dearly — Offrez un podcast à ceux qui comptent",
  description: "Créez un podcast personnalisé avec les voix de vos proches, livré chaque semaine par email.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`h-full antialiased ${lora.variable} ${inter.variable}`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
