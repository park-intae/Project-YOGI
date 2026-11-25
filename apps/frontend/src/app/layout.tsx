import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "YOGI - AI 맞춤 알뜰폰 요금제 추천",
    template: "%s | YOGI",
  },
  description: "사용자의 통신비와 사용 패턴을 진단하여 최적의 알뜰폰 요금제를 AI가 즉시 찾아드립니다.",
  keywords: [
    "알뜰폰",
    "요금제 추천",
    "통신비 절약",
    "알뜰폰 요금제 비교",
    "AI 요금제 추천",
    "YOGI",
    "Project YOGI",
  ],
  authors: [{ name: "Project YOGI" }],
  openGraph: {
    title: "YOGI - AI 맞춤 알뜰폰 요금제 추천",
    description: "사용자의 통신비와 사용 패턴을 진단하여 최적의 알뜰폰 요금제를 AI가 즉시 찾아드립니다.",
    siteName: "Project YOGI",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "YOGI - AI 맞춤 알뜰폰 요금제 추천",
    description: "사용자의 통신비와 사용 패턴을 진단하여 최적의 알뜰폰 요금제를 AI가 즉시 찾아드립니다.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
