import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sunrich Pet",
  description: "Sunrich Pet — 小众宠物活体及用品交易平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
