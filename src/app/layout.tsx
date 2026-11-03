import type { Metadata } from "next";
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
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-slate-950">
        <NavigationLogger />
        {children}
      </body>
    </html>
  );
}
