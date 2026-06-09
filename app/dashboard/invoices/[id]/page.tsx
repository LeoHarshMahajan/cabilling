import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency, formatDate, STATUS_COLORS } from "@/lib/utils";
import { notFound } from "next/navigation";
import { InvoiceActions } from "./invoice-actions";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const firmId = (session!.user as any).firmId;
  const { id } = await params;

  const invoice = await db.invoice.findFirst({
    where: { id, firmId },
    include: { client: true, items: { include: { service: true }, orderBy: { sortOrder: "asc" } }, payments: { orderBy: { paymentDate: "desc" } }, firm: true },
  });

  if (!invoice) notFound();

  const STATUS_LABELS: Record<string, string> = { DRAFT: "Draft", SENT: "Sent", PARTIALLY_PAID: "Partially Paid", PAID: "Paid", OVERDUE: "Overdue", CANCELLED: "Cancelled" };

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[invoice.status]}`}>{STATUS_LABELS[invoice.status]}</span>
          </div>
          <p className="text-gray-500 text-sm">Created {formatDate(invoice.createdAt)}</p>
        </div>
        <InvoiceActions invoice={invoice as any} />
      </div>

      {/* Invoice Body */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        {/* Firm & Client */}
        <div className="grid grid-cols-2 gap-8 p-8 border-b border-gray-100">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">From</p>
            <p className="font-bold text-gray-900 text-lg">{invoice.firm.name}</p>
            {invoice.firm.gstin && <p className="text-sm text-gray-600">GSTIN: <span className="font-mono">{invoice.firm.gstin}</span></p>}
            <p className="text-sm text-gray-500 mt-1">{invoice.firm.address}</p>
            <p className="text-sm text-gray-500">{invoice.firm.city}, {invoice.firm.state} – {invoice.firm.pincode}</p>
            {invoice.firm.phone && <p className="text-sm text-gray-500 mt-1">{invoice.firm.phone}</p>}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">To</p>
            <p className="font-bold text-gray-900 text-lg">{invoice.client.name}</p>
            {invoice.client.gstin && <p className="text-sm text-gray-600">GSTIN: <span className="font-mono">{invoice.client.gstin}</span></p>}
            {invoice.client.pan && <p className="text-sm text-gray-500">PAN: <span className="font-mono">{invoice.client.pan}</span></p>}
            {invoice.client.address && <p className="text-sm text-gray-500 mt-1">{invoice.client.address}</p>}
            {invoice.client.city && <p className="text-sm text-gray-500">{invoice.client.city}, {invoice.client.state}</p>}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 px-8 py-4 border-b border-gray-100 bg-gray-50 text-sm">
          <div><p className="text-gray-400 text-xs">Invoice Date</p><p className="font-medium mt-0.5">{formatDate(invoice.invoiceDate)}</p></div>
          <div><p className="text-gray-400 text-xs">Due Date</p><p className="font-medium mt-0.5">{invoice.dueDate ? formatDate(invoice.dueDate) : "—"}</p></div>
          <div><p className="text-gray-400 text-xs">Financial Year</p><p className="font-medium mt-0.5">{invoice.financialYear ?? "—"}</p></div>
          <div><p className="text-gray-400 text-xs">GST Type</p><p className="font-medium mt-0.5">{invoice.gstType === "CGST_SGST" ? "CGST + SGST" : invoice.gstType === "IGST" ? "IGST" : "Exempt"}</p></div>
        </div>

        {/* Line Items */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-8 py-3 font-medium text-gray-500 w-1/2">Description</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">SAC</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Qty</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Rate</th>
              <th className="text-right px-8 py-3 font-medium text-gray-500">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {invoice.items.map((item) => (
              <tr key={item.id}>
                <td className="px-8 py-3 text-gray-900">{item.description}</td>
                <td className="px-4 py-3 text-center font-mono text-xs text-gray-500">{item.sacCode ?? "—"}</td>
                <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                <td className="px-8 py-3 text-right font-medium text-gray-900">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t border-gray-100 px-8 py-6 bg-gray-50">
          <div className="max-w-xs ml-auto space-y-2 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>
            {invoice.gstType === "CGST_SGST" && (
              <>
                <div className="flex justify-between text-gray-600"><span>CGST</span><span>{formatCurrency(invoice.cgstAmount)}</span></div>
                <div className="flex justify-between text-gray-600"><span>SGST</span><span>{formatCurrency(invoice.sgstAmount)}</span></div>
              </>
            )}
            {invoice.gstType === "IGST" && (
              <div className="flex justify-between text-gray-600"><span>IGST</span><span>{formatCurrency(invoice.igstAmount)}</span></div>
            )}
            <div className="flex justify-between font-bold text-base text-gray-900 border-t border-gray-200 pt-2"><span>Total</span><span>{formatCurrency(invoice.totalAmount)}</span></div>
            {invoice.paidAmount > 0 && <div className="flex justify-between text-green-600"><span>Paid</span><span>- {formatCurrency(invoice.paidAmount)}</span></div>}
            {invoice.balanceAmount > 0 && <div className="flex justify-between font-bold text-red-600 border-t border-gray-200 pt-2"><span>Balance Due</span><span>{formatCurrency(invoice.balanceAmount)}</span></div>}
          </div>
        </div>

        {(invoice.notes || invoice.terms) && (
          <div className="grid grid-cols-2 gap-6 px-8 py-6 border-t border-gray-100 text-sm">
            {invoice.notes && <div><p className="font-medium text-gray-700 mb-1">Notes</p><p className="text-gray-500">{invoice.notes}</p></div>}
            {invoice.terms && <div><p className="font-medium text-gray-700 mb-1">Terms & Conditions</p><p className="text-gray-500">{invoice.terms}</p></div>}
          </div>
        )}
      </div>

      {/* Payments */}
      {invoice.payments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Collection History</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 font-medium text-gray-500">Date</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Mode</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Reference</th>
                <th className="text-right px-6 py-3 font-medium text-gray-500">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoice.payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-6 py-3">{formatDate(p.paymentDate)}</td>
                  <td className="px-6 py-3 text-gray-600">{p.mode.replace("_", " ")}</td>
                  <td className="px-6 py-3 text-gray-500 font-mono text-xs">{p.reference ?? p.chequeNumber ?? "—"}</td>
                  <td className="px-6 py-3 text-right font-semibold text-green-600">{formatCurrency(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
