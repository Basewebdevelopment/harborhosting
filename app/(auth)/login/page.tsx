"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const verified = params.get("verified");
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        const msg =
          result.error === "Please verify your email before signing in."
            ? "Please verify your email. Check your inbox for the confirmation link."
            : "Invalid email or password.";
        toast.error(msg);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-[420px] flex-col justify-center px-6 py-12">
      <div className="rounded-[18px] border border-[#e7e9ec] bg-white p-10">
        <h2 className="mb-1.5 font-[var(--font-space-grotesk)] text-[26px] font-bold tracking-tight">
          Welcome back
        </h2>
        <p className="mb-7 text-[14.5px] text-[#6a717a]">Sign in to your Harbor account.</p>

        {verified && (
          <div className="mb-5 rounded-[10px] border border-[#bbf0de] bg-[#f0faf6] p-3.5 text-[13.5px] text-[#0c7d5e]">
            Email confirmed! You can now sign in.
          </div>
        )}

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
          <div className="space-y-1.5">
            <Label className="text-[13px] font-semibold text-[#3a4046]">Password</Label>
            <Input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-1 h-[46px] w-full cursor-pointer rounded-[11px] border-none bg-[#0f9d77] text-[15px] font-semibold text-white shadow-[0_6px_14px_-4px_rgba(15,157,119,0.4)] transition-colors hover:bg-[#0c8463] disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-[13px] text-[#7a818a]">
          Don&apos;t have an account?{" "}
          <Link href="/pricing" className="font-medium text-[#0f9d77] hover:underline">
            Get started
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
