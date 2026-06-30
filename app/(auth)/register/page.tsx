"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
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
  const { data: session, status } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const planKey = (typeof window !== "undefined" ? sessionStorage.getItem("harbor_plan") : null) as PlanKey | null;
  const billing = (typeof window !== "undefined" ? sessionStorage.getItem("harbor_billing") : null) as "monthly" | "annual" | null;

  // Already logged in — skip registration and go straight to checkout
  useEffect(() => {
    if (status !== "authenticated") return;
    async function goToCheckout() {
      setLoading(true);
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: planKey ?? "growth", billing: billing ?? "monthly" }),
        });
        const data = await res.json();
        if (res.ok && data.url) {
          sessionStorage.removeItem("harbor_plan");
          sessionStorage.removeItem("harbor_billing");
          window.location.href = data.url;
        } else {
          router.push("/dashboard");
        }
      } catch {
        router.push("/dashboard");
      }
    }
    goToCheckout();
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

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
      // Step 1: Create account
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, company }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          // Account already exists — try signing in with the provided password
          const loginResult = await signIn("credentials", {
            email,
            password,
            redirect: false,
          });
          if (loginResult?.error) {
            // Wrong password for existing account
            toast.error("You already have an account. Please sign in with your existing password.");
            router.push(`/login`);
            return;
          }
          // Signed in successfully — fall through to checkout
        } else {
          toast.error(data.error ?? "Registration failed");
          return;
        }
      } else {
        // Step 2: Sign in automatically after fresh registration
        const loginResult = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        if (loginResult?.error) {
          toast.error("Account created — please sign in to continue.");
          router.push("/login");
          return;
        }
      }

      // Step 3: Start Stripe checkout
      const checkoutRes = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planKey ?? "growth",
          billing: billing ?? "monthly",
        }),
      });
      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok || !checkoutData.url) {
        toast.error("Account created! Redirecting to dashboard…");
        router.push("/dashboard");
        return;
      }

      sessionStorage.removeItem("harbor_plan");
      sessionStorage.removeItem("harbor_billing");
      window.location.href = checkoutData.url;
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center">
        <div className="text-[15px] text-[#7a818a]">Loading…</div>
      </div>
    );
  }

  if (status === "authenticated") {
    return (
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center">
        <div className="text-[15px] text-[#7a818a]">Taking you to checkout…</div>
      </div>
    );
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
          <h2 className="mb-1.5 font-[var(--font-inter)] font-bold tracking-tight text-[24px] font-bold tracking-tight">
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
          <div className="mb-5 font-[var(--font-inter)] font-bold tracking-tight text-[16px] font-semibold">Order summary</div>
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
            You&apos;ll be taken to a secure Stripe checkout after creating your account.
          </div>
        </div>
      </div>
    </div>
  );
}
