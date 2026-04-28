import type { Metadata } from "next";
import { Geist, Geist_Mono, Press_Start_2P, VT323 } from "next/font/google";
import PyodideLoader from "@/components/PyodideLoader";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const pressStart = Press_Start_2P({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: "400",
});

const vt323 = VT323({
  variable: "--font-vt",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "KnightCode — Train for BigTech interviews",
  description:
    "A mock interview simulator that uses chess puzzles as a proxy for algorithmic thinking. Pick a company, solve under pressure, get a real debrief.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${pressStart.variable} ${vt323.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        {children}
        <PyodideLoader />
      </body>
    </html>
  );
}
