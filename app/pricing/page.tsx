"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PLANS, type PlanKey } from "@/lib/stripe";
import { toast } from "sonner";

const CHECK = (
  <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="8" fill="#e3f4ee" />
    <path d="M4.5 8.2l2.2 2.2 4.8-4.8" stroke="#0f9d77" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function PlanCard({
  planKey,
  billing,
  popular,
}: {
  planKey: PlanKey;
  billing: "monthly" | "annual";
  popular?: boolean;
}) {
  const router = useRouter();
  const plan = PLANS[planKey];
  const price = billing === "annual"
    ? (plan.annualPrice / 12).toFixed(2)
    : plan.monthlyPrice.toFixed(2);

  async function handleChoose() {
    // Store selection in sessionStorage, redirect to register
    sessionStorage.setItem("harbor_plan", planKey);
    sessionStorage.setItem("harbor_billing", billing);
    router.push("/register");
  }

  return (
    <div
      className={`flex flex-col rounded-[18px] p-[30px_28px] ${
        popular
          ? "relative border-2 border-[#0f9d77] bg-white shadow-[0_16px_40px_-16px_rgba(15,157,119,0.35)]"
          : "border border-[#e7e9ec] bg-white"
      }`}
    >
      {popular && (
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-[#0f9d77] px-3.5 py-1.5 text-xs font-semibold text-white">
          Most popular
        </div>
      )}
      <div className="mb-1 font-[var(--font-space-grotesk)] text-[18px] font-semibold">{plan.name}</div>
      <div className="mb-5 text-[13px] text-[#7a818a]">
        {planKey === "starter" && "For your first website"}
        {planKey === "growth" && "For growing businesses"}
        {planKey === "business" && "For high-traffic sites"}
      </div>
      <div className="mb-1 flex items-baseline gap-0.5">
        <span className="text-[22px] font-semibold text-[#41474e]">$</span>
        <span className="font-[var(--font-ibm-plex-mono)] text-[42px] font-semibold tracking-tight">{price}</span>
        <span className="text-[15px] font-medium text-[#7a818a]">/mo</span>
      </div>
      <div className="mb-6 text-[12.5px] text-[#9aa0a8]">
        {billing === "annual" ? "billed annually" : "billed monthly"}
      </div>
      <button
        onClick={handleChoose}
        className={`mb-6 h-[46px] w-full cursor-pointer rounded-[11px] text-[15px] font-semibold transition-colors ${
          popular
            ? "border-none bg-[#0f9d77] text-white shadow-[0_6px_14px_-4px_rgba(15,157,119,0.5)] hover:bg-[#0c8463]"
            : "border border-[#d8dce1] bg-white text-[#15181c] hover:bg-[#f3f4f6]"
        }`}
      >
        Choose {plan.name}
      </button>
      <div className="flex flex-col gap-3.5">
        {plan.features.map((f) => (
          <div key={f} className="flex items-start gap-2.5 text-[14px] text-[#3c424a]">
            {CHECK}
            {f}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  const segBase =
    "px-5 py-2 rounded-lg border-none cursor-pointer text-[14px] font-semibold font-[var(--font-ibm-plex-sans)] transition-all";

  return (
    <div className="mx-auto max-w-6xl px-6 pb-20 pt-16">
      <div className="mx-auto mb-10 max-w-[620px] text-center">
        <div className="mb-4 font-[var(--font-ibm-plex-mono)] text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0f9d77]">
          Pricing
        </div>
        <h1 className="mb-4 font-[var(--font-space-grotesk)] text-[44px] font-bold leading-[1.08] tracking-tight">
          Hosting that grows<br />with your business
        </h1>
        <p className="text-[17px] leading-relaxed text-[#5a616a]">
          Fast, secure managed hosting with free SSL, daily backups and human support.
          No setup fees, cancel anytime.
        </p>
      </div>

      <div className="mb-11 flex items-center justify-center gap-3">
        <div className="inline-flex gap-0.5 rounded-[11px] bg-[#eceef1] p-1">
          <button
            onClick={() => setBilling("monthly")}
            className={`${segBase} ${
              billing === "monthly"
                ? "bg-white text-[#15181c] shadow-[0_1px_2px_rgba(16,24,40,0.12)]"
                : "bg-transparent text-[#5a616a]"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={`${segBase} ${
              billing === "annual"
                ? "bg-white text-[#15181c] shadow-[0_1px_2px_rgba(16,24,40,0.12)]"
                : "bg-transparent text-[#5a616a]"
            }`}
          >
            Annual
          </button>
        </div>
        <span className="rounded-full bg-[#e3f4ee] px-3 py-1.5 text-[13px] font-semibold text-[#0c7d5e]">
          Save 17%
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 items-stretch">
        <PlanCard planKey="starter" billing={billing} />
        <PlanCard planKey="growth" billing={billing} popular />
        <PlanCard planKey="business" billing={billing} />
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-7 text-[13.5px] text-[#7a818a]">
        <span>✓ 30-day money-back guarantee</span>
        <span>✓ Free site migration</span>
        <span>✓ 99.9% uptime SLA</span>
      </div>
    </div>
  );
}
