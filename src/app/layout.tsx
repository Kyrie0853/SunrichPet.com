import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import PageTransition from "@/components/PageTransition";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sunrich Pet — 小众宠物活体及用品交易平台",
  description: "Sunrich Pet — 安全、可自主管理的宠物活体及用品多商家购物平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f8f9fa]">
        <Navbar />
        <main className="flex-1 pb-16 md:pb-0">
          <PageTransition>{children}</PageTransition>
        </main>
        <MobileNav />
      </body>
    </html>
  );
}
