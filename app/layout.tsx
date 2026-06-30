import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-ibm-plex-mono",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
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
    <html lang="en" className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-screen bg-[#f5f6f8] font-[var(--font-ibm-plex-sans)] text-[#15181c] antialiased">
        <Navbar session={session} />
        <main>{children}</main>
        <Toaster richColors />
      </body>
    </html>
  );
}
