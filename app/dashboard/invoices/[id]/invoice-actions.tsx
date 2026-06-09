"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

type Invoice = {
  id: string; status: string; invoiceNumber: string; balanceAmount: number; totalAmount: number;
};

export function InvoiceActions({ invoice }: { invoice: Invoice }) {
  const router = useRouter();
  const [showPayment, setShowPayment] = useState(false);
  const [payAmt, setPayAmt] = useState(invoice.balanceAmount);
  const [payMode, setPayMode] = useState("CASH");
  const [payRef, setPayRef] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  async function markSent() {
    await fetch(`/api/invoices/${invoice.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "SENT" }) });
    router.refresh();
  }

  async function recordPayment(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId: invoice.id, amount: payAmt, mode: payMode, reference: payRef, paymentDate: payDate }),
    });
    setLoading(false);
    setShowPayment(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex gap-2">
        {invoice.status === "DRAFT" && (
          <button onClick={markSent} className="px-4 py-2 text-sm border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 font-medium transition-colors">
            Mark as Sent
          </button>
        )}
        {invoice.balanceAmount > 0 && invoice.status !== "CANCELLED" && (
          <button onClick={() => setShowPayment(true)} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors">
            Record Collection
          </button>
        )}
        <button onClick={() => window.print()} className="px-4 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium transition-colors">
          Print / PDF
        </button>
      </div>

      {showPayment && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Record Collection</h2>
                <p className="text-sm text-gray-500">Balance: {formatCurrency(invoice.balanceAmount)}</p>
              </div>
              <button onClick={() => setShowPayment(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={recordPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                <input type="number" min={0.01} max={invoice.balanceAmount} step="any" value={payAmt} onChange={e => setPayAmt(parseFloat(e.target.value))} required className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-semibold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                  <select value={payMode} onChange={e => setPayMode(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    {["CASH", "CHEQUE", "UPI", "BANK_TRANSFER", "NEFT", "RTGS"].map(m => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference / Transaction ID</label>
                <input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="UTR / Cheque no. / UPI ref" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPayment(false)} className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 bg-emerald-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60">
                  {loading ? "Saving…" : "Record Collection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
