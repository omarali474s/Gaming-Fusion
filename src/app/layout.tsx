import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Orbitron, Cairo } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--font-orbitron",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gaming Fusion — Veloce Downloader | تحميل فيديوهات يوتيوب بجميع الجودات",
  description:
    "حمّل أي فيديو من يوتيوب بجودة 360p حتى 4K، وحمّل الصوت بصيغة MP3 حتى 320kbps مباشرة من موقع Gaming Fusion.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${orbitron.variable} ${cairo.variable}`}>
      <body className="min-h-screen bg-[#05060f] font-[var(--font-cairo)] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
