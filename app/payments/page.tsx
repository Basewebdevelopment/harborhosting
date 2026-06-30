import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db, payments } from "@/db";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";

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

  const allPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.userId, session.user.id))
    .orderBy(desc(payments.createdAt));

  const total = allPayments.reduce((sum, p) => sum + p.amount, 0);
  const currency = allPayments[0]?.currency ?? "usd";

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16 pt-10">
      <div className="mb-2 font-[var(--font-plus-jakarta)] font-bold tracking-tight text-[26px] font-bold tracking-tight">
        Payment history
      </div>
      <p className="mb-8 text-[14.5px] text-[#7a818a]">
        All charges to your Harbor account.
      </p>

      {allPayments.length === 0 ? (
        <div className="rounded-[18px] border border-[#e7e9ec] bg-white p-10 text-center">
          <p className="mb-4 text-[15px] text-[#6a717a]">No payments yet.</p>
          <Link
            href="/pricing"
            className="inline-block rounded-[10px] bg-[#0f9d77] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#0c8463]"
          >
            Choose a plan
          </Link>
        </div>
      ) : (
        <>
          {/* Summary */}
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

          {/* Table */}
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
