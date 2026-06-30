"use client";

import Link from "next/link";
import { toast } from "sonner";
import { PLANS } from "@/lib/stripe";

type Props = {
  user: { name: string | null; email: string };
  subscription: {
    plan: "starter" | "growth" | "business";
    billingPeriod: "monthly" | "annual";
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  planConfig: (typeof PLANS)[keyof typeof PLANS] | null;
  recentPayments: {
    id: string;
    amount: number;
    currency: string;
    description: string;
    last4: string;
    brand: string;
    createdAt: string;
  }[];
};

function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

function StatusBadge({ status }: { status: string }) {
  const colours: Record<string, string> = {
    active: "bg-[#e3f4ee] text-[#0c7d5e]",
    trialing: "bg-[#fef3c7] text-[#92400e]",
    past_due: "bg-[#fee2e2] text-[#991b1b]",
    canceled: "bg-[#f3f4f6] text-[#6b7280]",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold capitalize ${colours[status] ?? colours.active}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export function DashboardClient({ user, subscription, planConfig, recentPayments }: Props) {
  const firstName = user.name?.split(" ")[0] ?? "there";

  async function handleManageBilling() {
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const { url, error } = await res.json();
      if (error) { toast.error(error); return; }
      window.location.href = url;
    } catch {
      toast.error("Could not open billing portal.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16 pt-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e3f4ee] text-[16px] font-semibold text-[#0c7d5e]">
            {initials(user.name)}
          </div>
          <div>
            <h1 className="font-[var(--font-space-grotesk)] text-[22px] font-bold tracking-tight">
              Good to see you, {firstName}
            </h1>
            <p className="text-[13.5px] text-[#7a818a]">{user.email}</p>
          </div>
        </div>
      </div>

      {!subscription ? (
        <div className="rounded-[18px] border border-[#e7e9ec] bg-white p-10 text-center">
          <p className="mb-4 text-[15px] text-[#6a717a]">You don&apos;t have an active subscription yet.</p>
          <Link
            href="/pricing"
            className="inline-block rounded-[10px] bg-[#0f9d77] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#0c8463]"
          >
            Choose a plan
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Subscription card */}
          <div className="col-span-2 rounded-[18px] border border-[#e7e9ec] bg-white p-7">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <div className="mb-1 font-[var(--font-space-grotesk)] text-[18px] font-bold">
                  {planConfig?.name} plan
                </div>
                <div className="flex items-center gap-2 text-[13.5px] text-[#7a818a]">
                  <StatusBadge status={subscription.status} />
                  <span>·</span>
                  <span className="capitalize">{subscription.billingPeriod} billing</span>
                </div>
              </div>
              <button
                onClick={handleManageBilling}
                className="cursor-pointer rounded-[9px] border border-[#d8dce1] bg-white px-4 py-2 text-[13px] font-semibold text-[#15181c] hover:bg-[#f3f4f6]"
              >
                Manage plan
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-[12px] bg-[#f9fafb] p-4">
                <div className="mb-1 text-[12px] font-medium text-[#9aa0a8]">Storage</div>
                <div className="mb-2 text-[15px] font-semibold">{planConfig?.storage}</div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#e7e9ec]">
                  <div className="h-full w-[27%] rounded-full bg-[#0f9d77]" />
                </div>
                <div className="mt-1 text-[12px] text-[#9aa0a8]">27% used</div>
              </div>

              <div className="rounded-[12px] bg-[#f9fafb] p-4">
                <div className="mb-1 text-[12px] font-medium text-[#9aa0a8]">Bandwidth</div>
                <div className="mb-2 text-[15px] font-semibold">Unlimited</div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#e7e9ec]">
                  <div className="h-full w-[34%] rounded-full bg-[#0f9d77]" />
                </div>
                <div className="mt-1 text-[12px] text-[#9aa0a8]">34% used</div>
              </div>
            </div>

            {subscription.currentPeriodEnd && (
              <div className="mt-4 rounded-[10px] bg-[#f5f6f8] p-3.5 text-[13px] text-[#5a616a]">
                {subscription.cancelAtPeriodEnd ? (
                  <span className="text-[#d6453d]">
                    Cancels on {fmtDate(subscription.currentPeriodEnd)}
                  </span>
                ) : (
                  <span>Renews on {fmtDate(subscription.currentPeriodEnd)}</span>
                )}
              </div>
            )}
          </div>

          {/* Recent payments */}
          <div className="rounded-[18px] border border-[#e7e9ec] bg-white p-7">
            <div className="mb-4 flex items-center justify-between">
              <div className="font-[var(--font-space-grotesk)] text-[16px] font-semibold">Recent payments</div>
              <Link href="/payments" className="text-[13px] font-medium text-[#0f9d77] hover:underline">
                View all
              </Link>
            </div>
            {recentPayments.length === 0 ? (
              <p className="text-[13.5px] text-[#9aa0a8]">No payments yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {recentPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <div>
                      <div className="text-[13.5px] font-medium">{p.description}</div>
                      <div className="text-[12px] text-[#9aa0a8]">
                        {p.brand} ···· {p.last4} · {fmtDate(p.createdAt)}
                      </div>
                    </div>
                    <div className="font-[var(--font-ibm-plex-mono)] text-[14px] font-semibold">
                      {fmtAmount(p.amount, p.currency)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
