"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

type Client = { id: string; name: string; stateCode?: string | null; state?: string | null };
type Service = { id: string; name: string; sacCode: string; defaultAmount?: number | null };
type Firm = { id: string; stateCode: string; gstRate: number };
type LineItem = { serviceId: string; description: string; sacCode: string; quantity: number; unitPrice: number; amount: number };
type CompletedTask = { id: string; title: string; amount?: number | null; period?: string | null; service?: { sacCode: string; name: string } | null; client: { id: string; name: string } };

export function NewInvoiceForm({ clients, services, firm, defaultClientId, completedTasks = [] }: {
  clients: Client[]; services: Service[]; firm: Firm; defaultClientId?: string; completedTasks?: CompletedTask[];
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [items, setItems] = useState<LineItem[]>([{ serviceId: "", description: "", sacCode: "", quantity: 1, unitPrice: 0, amount: 0 }]);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("Payment due within 30 days.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [showTaskImport, setShowTaskImport] = useState(false);

  const selectedClient = clients.find(c => c.id === clientId);
  const isSameState = selectedClient?.stateCode === firm.stateCode;
  const gstType = clientId && selectedClient ? (isSameState ? "CGST_SGST" : "IGST") : "CGST_SGST";
  const gstRate = firm.gstRate;

  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const gstAmt = subtotal * gstRate / 100;
  const total = subtotal + gstAmt;

  function updateItem(idx: number, field: keyof LineItem, value: string | number) {
    setItems(prev => {
      const next = [...prev];
      const item = { ...next[idx], [field]: value };
      if (field === "quantity" || field === "unitPrice") {
        item.amount = Number(item.quantity) * Number(item.unitPrice);
      }
      if (field === "serviceId") {
        const svc = services.find(s => s.id === value);
        if (svc) {
          item.description = svc.name;
          item.sacCode = svc.sacCode;
          item.unitPrice = svc.defaultAmount ?? 0;
          item.amount = svc.defaultAmount ?? 0;
        }
      }
      next[idx] = item;
      return next;
    });
  }

  function addItem() {
    setItems(prev => [...prev, { serviceId: "", description: "", sacCode: "", quantity: 1, unitPrice: 0, amount: 0 }]);
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  // Tasks available for the currently selected client
  const clientTasks = completedTasks.filter(t => t.client.id === clientId);

  function importTasks() {
    const tasksToImport = completedTasks.filter(t => selectedTaskIds.includes(t.id));
    const newItems = tasksToImport.map(t => ({
      serviceId: "",
      description: t.period ? `${t.title} — ${t.period}` : t.title,
      sacCode: t.service?.sacCode ?? "",
      quantity: 1,
      unitPrice: t.amount ?? 0,
      amount: t.amount ?? 0,
    }));
    setItems(prev => {
      // Replace blank starter item if it's empty
      const hasBlank = prev.length === 1 && !prev[0].description && prev[0].amount === 0;
      return hasBlank ? newItems : [...prev, ...newItems];
    });
    setShowTaskImport(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) return alert("Please select a client");
    if (items.some(i => !i.description)) return alert("All line items need a description");
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, items, invoiceDate, dueDate: dueDate || null, notes, terms, gstType, taskIds: selectedTaskIds }),
      });
      const inv = await res.json();
      if (!res.ok) {
        setError(inv?.error ?? "Failed to create invoice. Please try again.");
        return;
      }
      router.push(`/dashboard/invoices/${inv.id}`);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
      )}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Invoice Details</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
            <select value={clientId} onChange={e => setClientId(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">Select client…</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
            <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>
        {selectedClient && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              GST: <span className="font-medium text-gray-700">{gstType === "CGST_SGST" ? "CGST + SGST (same state)" : "IGST (inter-state)"}</span>
              {" @ "}{gstRate}%
            </p>
            {clientTasks.length > 0 && (
              <button type="button" onClick={() => setShowTaskImport(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Import from Tasks ({clientTasks.length} completed)
              </button>
            )}
          </div>
        )}

        {/* Task import modal */}
        {showTaskImport && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Import Completed Tasks</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Select tasks to add as invoice line items</p>
                </div>
                <button onClick={() => setShowTaskImport(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>
              <div className="p-6 space-y-2 max-h-80 overflow-y-auto">
                {clientTasks.map(t => (
                  <label key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedTaskIds.includes(t.id) ? "bg-emerald-50 border-emerald-300" : "border-gray-200 hover:bg-gray-50"}`}>
                    <input type="checkbox" checked={selectedTaskIds.includes(t.id)}
                      onChange={e => setSelectedTaskIds(prev => e.target.checked ? [...prev, t.id] : prev.filter(id => id !== t.id))}
                      className="w-4 h-4 text-emerald-600 rounded" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{t.title}{t.period ? ` — ${t.period}` : ""}</p>
                      {t.service && <p className="text-xs text-gray-400">SAC: {t.service.sacCode}</p>}
                    </div>
                    <p className="text-sm font-bold text-gray-900 shrink-0">
                      {t.amount ? formatCurrency(t.amount) : "—"}
                    </p>
                  </label>
                ))}
              </div>
              <div className="p-6 border-t border-gray-100 flex gap-3">
                <button type="button" onClick={() => setShowTaskImport(false)}
                  className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50">
                  Cancel
                </button>
                <button type="button" onClick={importTasks} disabled={selectedTaskIds.length === 0}
                  className="flex-1 bg-emerald-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40">
                  Import {selectedTaskIds.length > 0 ? `${selectedTaskIds.length} task${selectedTaskIds.length > 1 ? "s" : ""}` : ""}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Services / Tasks</h2>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-4">
                  {idx === 0 && <label className="block text-xs font-medium text-gray-500 mb-1">Service</label>}
                  <select
                    value={item.serviceId}
                    onChange={e => updateItem(idx, "serviceId", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Custom / select…</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="col-span-3">
                  {idx === 0 && <label className="block text-xs font-medium text-gray-500 mb-1">Description *</label>}
                  <input
                    value={item.description}
                    onChange={e => updateItem(idx, "description", e.target.value)}
                    placeholder="Description"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="col-span-1">
                  {idx === 0 && <label className="block text-xs font-medium text-gray-500 mb-1">SAC</label>}
                  <input value={item.sacCode} onChange={e => updateItem(idx, "sacCode", e.target.value)} placeholder="SAC" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono" />
                </div>
                <div className="col-span-1">
                  {idx === 0 && <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>}
                  <input type="number" min={0.01} step="any" value={item.quantity} onChange={e => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="col-span-2">
                  {idx === 0 && <label className="block text-xs font-medium text-gray-500 mb-1">Rate (₹)</label>}
                  <input type="number" min={0} step="any" value={item.unitPrice} onChange={e => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="col-span-1 flex items-end gap-2">
                  <div className="flex-1 text-right text-sm font-semibold text-gray-900 pb-2">{formatCurrency(item.amount)}</div>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 pb-2">✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addItem} className="mt-4 text-sm text-emerald-600 hover:underline font-medium">+ Add line item</button>
        </div>

        {/* Totals */}
        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 rounded-b-xl">
          <div className="max-w-xs ml-auto space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            {gstType === "CGST_SGST" ? (
              <>
                <div className="flex justify-between text-gray-600">
                  <span>CGST ({gstRate / 2}%)</span>
                  <span>{formatCurrency(gstAmt / 2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>SGST ({gstRate / 2}%)</span>
                  <span>{formatCurrency(gstAmt / 2)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-gray-600">
                <span>IGST ({gstRate}%)</span>
                <span>{formatCurrency(gstAmt)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes & Terms */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Any notes for the client…" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
            <textarea value={terms} onChange={e => setTerms(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={() => router.back()} className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
        <button type="submit" disabled={loading} className="px-8 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60">
          {loading ? "Creating…" : "Create Invoice"}
        </button>
      </div>
    </form>
  );
}
