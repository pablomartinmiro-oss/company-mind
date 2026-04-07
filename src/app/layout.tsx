import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Company Mind",
  description: "AI CRM for operators who move fast.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen relative bg-[#ebe7e0] font-sans text-[#1a1a1a] before:fixed before:inset-0 before:pointer-events-none before:bg-[url('/noise.svg')] before:opacity-[0.04] before:mix-blend-overlay">
        {children}
      </body>
    </html>
  );
}
