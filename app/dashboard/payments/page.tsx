import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function PaymentsPage() {
  const session = await getSession();
  const firmId = (session!.user as any).firmId;

  const payments = await db.payment.findMany({
    where: { invoice: { firmId } },
    include: { invoice: { include: { client: true } } },
    orderBy: { paymentDate: "desc" },
    take: 100,
  });

  const total = payments.reduce((s, p) => s + p.amount, 0);

  const MODE_COLORS: Record<string, string> = {
    CASH: "bg-green-100 text-green-700",
    CHEQUE: "bg-blue-100 text-blue-700",
    UPI: "bg-purple-100 text-purple-700",
    BANK_TRANSFER: "bg-yellow-100 text-yellow-700",
    NEFT: "bg-orange-100 text-orange-700",
    RTGS: "bg-pink-100 text-pink-700",
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
          <p className="text-gray-500 text-sm">{payments.length} collection{payments.length !== 1 ? "s" : ""} · Total collected: {formatCurrency(total)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-6 py-3 font-medium text-gray-500">Date</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Client</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Invoice</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Mode</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Reference</th>
              <th className="text-right px-6 py-3 font-medium text-gray-500">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {payments.length === 0 && (
              <tr><td colSpan={6} className="text-center text-gray-400 py-16">No collections recorded yet.</td></tr>
            )}
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-gray-600">{formatDate(p.paymentDate)}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{p.invoice.client.name}</td>
                <td className="px-6 py-4">
                  <Link href={`/dashboard/invoices/${p.invoiceId}`} className="text-blue-600 hover:underline font-mono text-xs">
                    {p.invoice.invoiceNumber}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${MODE_COLORS[p.mode] ?? "bg-gray-100 text-gray-600"}`}>
                    {p.mode.replace("_", " ")}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-gray-500">{p.reference ?? p.chequeNumber ?? "—"}</td>
                <td className="px-6 py-4 text-right font-semibold text-green-600">{formatCurrency(p.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
