import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
    <html lang="en" className={`${geist.variable} ${geistMono.variable} h-full`}>
      <head>
        {/* Pyodide — Python in the browser via WebAssembly */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                var s = document.createElement('script');
                s.src = 'https://cdn.jsdelivr.net/pyodide/v0.27.4/full/pyodide.js';
                s.onload = function() {
                  window.__pyodidePromise = loadPyodide();
                };
                document.head.appendChild(s);
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
