import type { Metadata } from "next";
import localFont from "next/font/local";
import Header from "@/components/menu/header";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Data agent",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 h-screen flex flex-col`}
      >
        <Header />
        <main className="flex-1 pt-14 relative overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
