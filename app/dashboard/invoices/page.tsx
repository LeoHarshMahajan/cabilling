import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency, formatDate, STATUS_COLORS } from "@/lib/utils";
import Link from "next/link";

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await getSession();
  const firmId = (session!.user as any).firmId;
  const { status } = await searchParams;

  const invoices = await db.invoice.findMany({
    where: { firmId, ...(status ? { status: status as any } : {}) },
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });

  const STATUSES = ["", "DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"];
  const STATUS_LABELS: Record<string, string> = { "": "All", DRAFT: "Draft", SENT: "Sent", PARTIALLY_PAID: "Partial", PAID: "Paid", OVERDUE: "Overdue", CANCELLED: "Cancelled" };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 text-sm">{invoices.length} invoices</p>
        </div>
        <Link href="/dashboard/invoices/new" className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">
          + New Invoice
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={s ? `/dashboard/invoices?status=${s}` : "/dashboard/invoices"}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              (status ?? "") === s ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-6 py-3 font-medium text-gray-500">Invoice #</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Client</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Date</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Due Date</th>
              <th className="text-right px-6 py-3 font-medium text-gray-500">Amount</th>
              <th className="text-right px-6 py-3 font-medium text-gray-500">Balance</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {invoices.length === 0 && (
              <tr><td colSpan={8} className="text-center text-gray-400 py-16">No invoices found.</td></tr>
            )}
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-gray-700">{inv.invoiceNumber}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{inv.client.name}</td>
                <td className="px-6 py-4 text-gray-500">{formatDate(inv.invoiceDate)}</td>
                <td className="px-6 py-4 text-gray-500">{inv.dueDate ? formatDate(inv.dueDate) : "—"}</td>
                <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatCurrency(inv.totalAmount)}</td>
                <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(inv.balanceAmount)}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[inv.status]}`}>
                    {STATUS_LABELS[inv.status]}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/dashboard/invoices/${inv.id}`} className="text-emerald-600 hover:underline text-xs font-medium">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
