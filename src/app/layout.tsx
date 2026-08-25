import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Arabic, Noto_Kufi_Arabic } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AppProvider } from "@/components/app-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

const notoKufi = Noto_Kufi_Arabic({
  variable: "--font-arabic-kufi",
  subsets: ["arabic"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Haqqi — حقي | Your Rights After a Car Accident in Jordan",
  description:
    "Haqqi is a bilingual AI-assisted platform that helps car-accident victims in Jordan understand their legal entitlements, organize evidence, draft lawyer-reviewed documents, and connect with vetted lawyers.",
  keywords: [
    "Haqqi",
    "حقي",
    "Jordan",
    "car accident",
    "legal rights",
    "insurance claim",
    "compensation",
    "lawyer",
  ],
  authors: [{ name: "Haqqi" }],
  icons: { icon: "/logo.svg" },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Haqqi",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "Haqqi — حقي",
    description: "Your Rights After a Car Accident in Jordan",
    siteName: "Haqqi",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoArabic.variable} ${notoKufi.variable} antialiased bg-background text-foreground`}
      >
        <AppProvider>{children}</AppProvider>
        <Toaster />
      </body>
    </html>
  );
}
