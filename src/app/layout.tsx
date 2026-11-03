import type { Metadata } from "next";
// Next 14.2's next/font/google does not ship Geist, so we use the official
// `geist` package, which wraps next/font/local with the same CSS variables.
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { NavigationLogger } from "@/components/NavigationLogger";

export const metadata: Metadata = {
  title: "ShowUp Engine | WhatsApp Webinar Attendance Engine for Kenya & Africa",
  description:
    "Turn 20% webinar attendance into 60% with automated 5-stage official WhatsApp Cloud API sequences.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-canvas text-slate-100 font-sans antialiased">
        <NavigationLogger />
        {children}
      </body>
    </html>
  );
}
