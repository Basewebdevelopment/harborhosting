import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db, payments, subscriptions } from "@/db";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { syncBillingFromStripe } from "@/lib/sync-billing";

function fmtDate(date: Date) {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase() === "USD" ? "GBP" : currency.toUpperCase(),
  }).format(cents / 100);
}

function StatusBadge({ status }: { status: string }) {
  const colours: Record<string, string> = {
    paid: "bg-[#e3f4ee] text-[#0c7d5e]",
    failed: "bg-[#fee2e2] text-[#991b1b]",
    pending: "bg-[#fef3c7] text-[#92400e]",
    refunded: "bg-[#f3f4f6] text-[#6b7280]",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold capitalize ${colours[status] ?? "bg-[#f3f4f6] text-[#6b7280]"}`}>
      {status}
    </span>
  );
}

export default async function PaymentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Sync from Stripe if payments are missing (e.g. webhook fired before fix)
  try {
    await syncBillingFromStripe(session.user.id);
  } catch (err) {
    console.error("[payments] sync error", err);
  }

  const allPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.userId, session.user.id))
    .orderBy(desc(payments.createdAt));

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1);

  const total = allPayments.reduce((sum, p) => sum + p.amount, 0);
  const currency = allPayments[0]?.currency ?? "gbp";

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16 pt-10">
      <div className="mb-2 text-[26px] font-bold tracking-tight">
        Payment history
      </div>
      <p className="mb-8 text-[14.5px] text-[#7a818a]">
        All charges to your Harbor account.
      </p>

      {allPayments.length === 0 ? (
        <div className="rounded-[18px] border border-[#e7e9ec] bg-white p-10 text-center">
          <p className="text-[15px] font-medium text-[#15181c]">No payments recorded yet</p>
          <p className="mt-2 text-[14px] text-[#7a818a]">
            {sub
              ? "Your payment history will appear here after Stripe processes your subscription charges."
              : "Once you subscribe to a plan, your invoices and receipts will show up here."}
          </p>
          <Link
            href="/dashboard"
            className="mt-5 inline-block text-[14px] font-medium text-[#0f9d77] hover:underline"
          >
            ← Back to dashboard
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-[14px] border border-[#e7e9ec] bg-white p-5">
              <div className="mb-1 text-[12px] font-medium text-[#9aa0a8]">Total spent</div>
              <div className="font-[var(--font-geist-mono)] text-[22px] font-semibold">
                {fmtAmount(total, currency)}
              </div>
            </div>
            <div className="rounded-[14px] border border-[#e7e9ec] bg-white p-5">
              <div className="mb-1 text-[12px] font-medium text-[#9aa0a8]">Total payments</div>
              <div className="font-[var(--font-geist-mono)] text-[22px] font-semibold">
                {allPayments.length}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[18px] border border-[#e7e9ec] bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#f0f1f3] bg-[#f9fafb]">
                  <th className="px-6 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wide text-[#9aa0a8]">Date</th>
                  <th className="px-6 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wide text-[#9aa0a8]">Description</th>
                  <th className="px-6 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wide text-[#9aa0a8]">Method</th>
                  <th className="px-6 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wide text-[#9aa0a8]">Status</th>
                  <th className="px-6 py-3.5 text-right text-[12px] font-semibold uppercase tracking-wide text-[#9aa0a8]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {allPayments.map((p, i) => (
                  <tr
                    key={p.id}
                    className={`${i !== allPayments.length - 1 ? "border-b border-[#f0f1f3]" : ""}`}
                  >
                    <td className="px-6 py-4 text-[13.5px] text-[#5a616a]">{fmtDate(p.createdAt)}</td>
                    <td className="px-6 py-4 text-[13.5px] font-medium">{p.description}</td>
                    <td className="px-6 py-4 text-[13.5px] text-[#5a616a]">
                      {p.brand && p.last4 ? `${p.brand} ···· ${p.last4}` : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-6 py-4 text-right font-[var(--font-geist-mono)] text-[14px] font-semibold">
                      {fmtAmount(p.amount, p.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
