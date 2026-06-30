import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { SessionProvider } from "next-auth/react";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Harbor Hosting — Fast, secure managed hosting",
  description:
    "Fast, secure managed hosting with free SSL, daily backups and human support. No setup fees, cancel anytime.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" className={`${plusJakarta.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-[#f5f6f8] font-[var(--font-plus-jakarta)] text-[#15181c] antialiased">
        <SessionProvider session={session}>
          <Navbar session={session} />
          <main>{children}</main>
          <Toaster richColors />
        </SessionProvider>
      </body>
    </html>
  );
}
