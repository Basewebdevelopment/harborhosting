"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PLANS, type PlanKey } from "@/lib/plans";

function Step({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
          done ? "bg-[#0f9d77] text-white" : active ? "bg-[#15181c] text-white" : "bg-[#eceef1] text-[#9aa0a8]"
        }`}
      >
        {done ? "✓" : n}
      </div>
      <span className={`text-[13.5px] font-semibold ${active || done ? "text-[#15181c]" : "text-[#9aa0a8]"}`}>
        {label}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="h-px w-7 bg-[#dde0e4]" />;
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const planKey = (typeof window !== "undefined" ? sessionStorage.getItem("harbor_plan") : null) as PlanKey | null;
  const billing = (typeof window !== "undefined" ? sessionStorage.getItem("harbor_billing") : null) as "monthly" | "annual" | null;

  const plan = planKey && PLANS[planKey] ? PLANS[planKey] : PLANS.growth;
  const price = billing === "annual"
    ? (plan.annualPrice / 12).toFixed(2)
    : plan.monthlyPrice.toFixed(2);
  const billingNote = billing === "annual"
    ? `Billed £${plan.annualPrice.toFixed(2)} today — saves £${(plan.monthlyPrice * 12 - plan.annualPrice).toFixed(2)}/yr`
    : "Billed monthly, cancel anytime";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, company }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Registration failed");
        return;
      }
      router.push("/verify-email?sent=1");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[980px] px-6 pb-18 pt-12">
      <Link href="/pricing" className="mb-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-[#7a818a] hover:text-[#41474e]">
        ← Back to plans
      </Link>

      <div className="mb-8 flex items-center gap-2.5">
        <Step n={1} label="Plan" done active={false} />
        <Divider />
        <Step n={2} label="Account" active done={false} />
        <Divider />
        <Step n={3} label="Payment" active={false} done={false} />
      </div>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1fr_360px] items-start">
        <div className="rounded-[18px] border border-[#e7e9ec] bg-white p-[34px_36px]">
          <h2 className="mb-1.5 font-[var(--font-plus-jakarta)] font-bold tracking-tight text-[24px] font-bold tracking-tight">
            Create your account
          </h2>
          <p className="mb-6 text-[14.5px] text-[#6a717a]">
            Set up your Harbor {plan.name} account to continue.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-[#3a4046]">Full name</Label>
              <Input
                required
                placeholder="Jane Cooper"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-[#3a4046]">Work email</Label>
              <Input
                type="email"
                required
                placeholder="jane@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-[#3a4046]">
                Company <span className="font-normal text-[#a8aeb6]">(optional)</span>
              </Label>
              <Input
                placeholder="Cooper & Co."
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-[#3a4046]">Password</Label>
              <Input
                type="password"
                required
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 h-[46px] w-full cursor-pointer rounded-[11px] border-none bg-[#0f9d77] text-[15px] font-semibold text-white shadow-[0_6px_14px_-4px_rgba(15,157,119,0.4)] transition-colors hover:bg-[#0c8463] disabled:opacity-60"
            >
              {loading ? "Creating account…" : "Continue to payment →"}
            </button>

            <p className="text-center text-[13px] text-[#7a818a]">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-[#0f9d77] hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>

        {/* Order summary */}
        <div className="rounded-[18px] border border-[#e7e9ec] bg-white p-[28px_28px_24px]">
          <div className="mb-5 font-[var(--font-plus-jakarta)] font-bold tracking-tight text-[16px] font-semibold">Order summary</div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-[15px] font-semibold">{plan.name} plan</div>
              <div className="text-[13px] text-[#7a818a]">{billingNote}</div>
            </div>
            <div className="font-[var(--font-geist-mono)] text-[18px] font-semibold">£{price}/mo</div>
          </div>
          <div className="mb-4 h-px bg-[#f0f1f3]" />
          <div className="mb-4 flex flex-col gap-2.5">
            {plan.features.slice(0, 4).map((f) => (
              <div key={f} className="flex items-start gap-2 text-[13px] text-[#5a616a]">
                <span className="mt-0.5 text-[#0f9d77]">✓</span>
                {f}
              </div>
            ))}
          </div>
          <div className="rounded-[10px] bg-[#f5f6f8] p-3 text-[12.5px] text-[#7a818a]">
            You&apos;ll confirm payment after verifying your email.
          </div>
        </div>
      </div>
    </div>
  );
}
