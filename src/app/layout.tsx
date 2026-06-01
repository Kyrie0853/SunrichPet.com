import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import PageTransition from "@/components/PageTransition";
import SplashScreen from "@/components/SplashScreen";
import AnnouncementBar from "@/components/AnnouncementBar";
import Footer from "@/components/Footer";
import PwaRegister from "@/components/PwaRegister";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1a7f5a",
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
  title: "顺瑞益宠 — 全国宠物玩家的聚集地",
  description: "顺瑞益宠 — 全国宠物玩家的聚集地。加入社区，分享养宠经验，发现你的宠物伙伴。",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "顺瑞益宠",
    statusBarStyle: "black-translucent",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
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
      <head>
        <meta name="theme-color" content="#1a7f5a" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-full flex flex-col bg-[#f8f9fa]">
        <SplashScreen />
        <Navbar />
        <AnnouncementBar />
        <main className="flex-1 pb-16 md:pb-0">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
        <MobileNav />
        <PwaRegister />
      </body>
    </html>
  );
}
