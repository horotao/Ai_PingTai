import type { Metadata } from "next";
import { Geist, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "./_components/AppShell";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "atelier · AI 图像生成工作台",
  description: "纯前端 AI 图像生成工作台，本地存储，零账号。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className={`${geist.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
