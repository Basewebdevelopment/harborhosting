"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Something went wrong.");
        return;
      }
      setSent(true);
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-[420px] flex-col justify-center px-6 py-12">
      <div className="rounded-[18px] border border-[#e7e9ec] bg-white p-10">
        <h2 className="mb-1.5 text-[26px] font-bold tracking-tight">Forgot password?</h2>
        <p className="mb-7 text-[14.5px] text-[#6a717a]">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {sent ? (
          <div className="rounded-[10px] border border-[#bbf0de] bg-[#f0faf6] p-4 text-[14px] text-[#0c7d5e]">
            If an account exists for <strong>{email}</strong>, you&apos;ll receive a reset link shortly. Check your inbox.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-[#3a4046]">Email</Label>
              <Input
                type="email"
                required
                placeholder="jane@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-1 h-[46px] w-full cursor-pointer rounded-[11px] border-none bg-[#0f9d77] text-[15px] font-semibold text-white shadow-[0_6px_14px_-4px_rgba(15,157,119,0.4)] transition-colors hover:bg-[#0c8463] disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-[13px] text-[#7a818a]">
          <Link href="/login" className="font-medium text-[#0f9d77] hover:underline">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
