"use client";

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

  return (
    <header className="sticky top-0 z-50 border-b border-[#e7e9ec] bg-white backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        <Link href={session ? "/dashboard" : "/"} className="flex items-center">
          <Image
            src="/harbor-logo-v2.png"
            alt="Harbor Hosting"
            width={220}
            height={76}
            className="h-14 w-auto object-contain"
            priority
          />
        </Link>

        {session ? (
          <div className="flex items-center gap-1.5">
            <Link
              href="/dashboard"
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname === "/dashboard"
                  ? "bg-[#f0faf6] text-[#0f9d77]"
                  : "text-[#41474e] hover:bg-[#f3f4f6]"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/payments"
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname === "/payments"
                  ? "bg-[#f0faf6] text-[#0f9d77]"
                  : "text-[#41474e] hover:bg-[#f3f4f6]"
              }`}
            >
              Payments
            </Link>
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
          <div className="flex items-center gap-2">
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
      </div>
    </header>
  );
}
