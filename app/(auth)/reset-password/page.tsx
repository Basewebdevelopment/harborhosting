"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      toast.error("Invalid reset link.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not reset password.");
        return;
      }
      toast.success("Password updated — you can sign in now.");
      router.push("/login");
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="rounded-[10px] border border-[#fde8c0] bg-[#fffbf0] p-4 text-[14px] text-[#92600a]">
        This reset link is invalid.{" "}
        <Link href="/forgot-password" className="font-semibold underline">
          Request a new one
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <Label className="text-[13px] font-semibold text-[#3a4046]">New password</Label>
        <Input
          type="password"
          required
          placeholder="Min. 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[13px] font-semibold text-[#3a4046]">Confirm password</Label>
        <Input
          type="password"
          required
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-1 h-[46px] w-full cursor-pointer rounded-[11px] border-none bg-[#0f9d77] text-[15px] font-semibold text-white shadow-[0_6px_14px_-4px_rgba(15,157,119,0.4)] transition-colors hover:bg-[#0c8463] disabled:opacity-60"
      >
        {loading ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-[420px] flex-col justify-center px-6 py-12">
      <div className="rounded-[18px] border border-[#e7e9ec] bg-white p-10">
        <h2 className="mb-1.5 text-[26px] font-bold tracking-tight">Set a new password</h2>
        <p className="mb-7 text-[14.5px] text-[#6a717a]">
          Choose a strong password of at least 8 characters.
        </p>
        <Suspense>
          <ResetForm />
        </Suspense>
        <p className="mt-5 text-center text-[13px] text-[#7a818a]">
          <Link href="/login" className="font-medium text-[#0f9d77] hover:underline">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
