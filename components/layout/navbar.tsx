"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Session } from "next-auth";

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Navbar({ session }: { session: Session | null }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const authedLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/payments", label: "Payments" },
    { href: "/account", label: "Account" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[#e7e9ec] bg-white backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        <Link href={session ? "/dashboard" : "/"} className="flex items-center">
          <Image
            src="/harbor-logo-v2.png"
            alt="Harbor Hosting"
            width={260}
            height={90}
            className="h-16 w-auto object-contain"
            priority
          />
        </Link>

        {/* Desktop nav */}
        {session ? (
          <div className="hidden items-center gap-1.5 md:flex">
            {authedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-[#f0faf6] text-[#0f9d77]"
                    : "text-[#41474e] hover:bg-[#f3f4f6]"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="mx-1.5 h-5 w-px bg-[#e2e4e8]" />
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e3f4ee] text-[13px] font-semibold text-[#0c7d5e]">
              {initials(session.user?.name)}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="cursor-pointer rounded-lg px-2 py-2 text-[13px] font-medium text-[#8a9098] hover:text-[#41474e]"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/pricing"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-[#41474e] hover:bg-[#f3f4f6]"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="rounded-[9px] border border-[#d8dce1] bg-white px-4 py-2 text-sm font-semibold text-[#15181c] hover:bg-[#f3f4f6]"
            >
              Sign in
            </Link>
          </div>
        )}

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-[#41474e] hover:bg-[#f3f4f6] md:hidden"
        >
          {menuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="border-t border-[#e7e9ec] bg-white px-6 py-3 md:hidden">
          {session ? (
            <div className="flex flex-col gap-1">
              <div className="mb-2 flex items-center gap-2.5 px-1 py-1.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e3f4ee] text-[13px] font-semibold text-[#0c7d5e]">
                  {initials(session.user?.name)}
                </div>
                <span className="text-[13.5px] text-[#41474e]">{session.user?.email}</span>
              </div>
              {authedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors ${
                    pathname === link.href
                      ? "bg-[#f0faf6] text-[#0f9d77]"
                      : "text-[#41474e] hover:bg-[#f3f4f6]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="cursor-pointer rounded-lg px-3 py-2.5 text-left text-[15px] font-medium text-[#8a9098] hover:bg-[#f3f4f6] hover:text-[#41474e]"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <Link
                href="/pricing"
                className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-[#41474e] hover:bg-[#f3f4f6]"
              >
                Pricing
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-[#d8dce1] bg-white px-3 py-2.5 text-[15px] font-semibold text-[#15181c] hover:bg-[#f3f4f6]"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
