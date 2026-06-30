"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyContent() {
  const params = useSearchParams();
  const sent = params.get("sent");
  const error = params.get("error");

  if (error) {
    const messages: Record<string, string> = {
      missing: "No verification token was provided.",
      invalid: "This verification link is invalid or has already been used.",
      expired: "This verification link has expired. Please register again.",
    };
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">✗</div>
        <h2 className="mb-2 font-[var(--font-plus-jakarta)] font-bold tracking-tight text-[22px] font-bold">Verification failed</h2>
        <p className="mb-6 text-[14.5px] text-[#6a717a]">{messages[error] ?? "Something went wrong."}</p>
        <Link
          href="/pricing"
          className="inline-block rounded-[10px] bg-[#0f9d77] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#0c8463]"
        >
          Try again
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#e3f4ee] text-2xl">
        ✉️
      </div>
      <h2 className="mb-2 font-[var(--font-plus-jakarta)] font-bold tracking-tight text-[22px] font-bold tracking-tight">Check your inbox</h2>
      <p className="mb-6 text-[14.5px] leading-relaxed text-[#6a717a]">
        We&apos;ve sent a confirmation link to your email address.<br />
        Click it to activate your account, then sign in.
      </p>
      <Link
        href="/login"
        className="inline-block rounded-[10px] border border-[#d8dce1] bg-white px-5 py-2.5 text-[14px] font-semibold text-[#15181c] hover:bg-[#f3f4f6]"
      >
        Go to sign in
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-[480px] flex-col justify-center px-6 py-12">
      <div className="rounded-[18px] border border-[#e7e9ec] bg-white p-10">
        <Suspense>
          <VerifyContent />
        </Suspense>
      </div>
    </div>
  );
}
