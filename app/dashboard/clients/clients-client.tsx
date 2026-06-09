"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { INDIAN_STATES } from "@/lib/utils";

type Client = {
  id: string; name: string; gstin?: string | null; pan?: string | null;
  email?: string | null; phone?: string | null; state?: string | null;
  stateCode?: string | null; city?: string | null; clientType: string;
};

export function ClientsClient({ firmId, clients }: { firmId: string; clients: Client[] }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", gstin: "", pan: "", email: "", phone: "", clientType: "INDIVIDUAL", state: "", stateCode: "", city: "", pincode: "" });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const state = INDIAN_STATES.find(s => s.name === form.state);
    await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, firmId, stateCode: state?.code ?? "" }),
    });
    setLoading(false);
    setShowAdd(false);
    setForm({ name: "", gstin: "", pan: "", email: "", phone: "", clientType: "INDIVIDUAL", state: "", stateCode: "", city: "", pincode: "" });
    router.refresh();
  }

  async function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const rows = result.data as any[];
        for (const row of rows) {
          const state = INDIAN_STATES.find(s => s.name === row.state || s.code === row.stateCode);
          await fetch("/api/clients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              firmId,
              name: row.name || row.Name,
              gstin: row.gstin || row.GSTIN || "",
              pan: row.pan || row.PAN || "",
              email: row.email || row.Email || "",
              phone: row.phone || row.Phone || "",
              clientType: row.clientType || row.type || "INDIVIDUAL",
              state: row.state || row.State || "",
              stateCode: state?.code || row.stateCode || "",
              city: row.city || row.City || "",
              pincode: row.pincode || "",
            }),
          });
        }
        setLoading(false);
        setShowImport(false);
        router.refresh();
      },
    });
  }

  return (
    <>
      <div className="flex gap-2">
        <button onClick={() => setShowImport(true)} className="px-4 py-2 text-sm border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 font-medium transition-colors">
          Import CSV
        </button>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors">
          + Add Client
        </button>
      </div>

      {/* Add Client Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add Client</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Client name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.clientType} onChange={e => setForm(f => ({ ...f, clientType: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    {["INDIVIDUAL", "COMPANY", "LLP", "PARTNERSHIP", "HUF"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PAN</label>
                  <input value={form.pan} onChange={e => setForm(f => ({ ...f, pan: e.target.value.toUpperCase() }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono" placeholder="ABCDE1234F" maxLength={10} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                  <input value={form.gstin} onChange={e => setForm(f => ({ ...f, gstin: e.target.value.toUpperCase() }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono" placeholder="27ABCDE1234F1Z5" maxLength={15} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <select value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Select state</option>
                    {INDIAN_STATES.map(s => <option key={s.code} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 bg-emerald-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-emerald-700 disabled:opacity-60">
                  {loading ? "Saving…" : "Add Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Import Clients from CSV</h2>
              <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6">
              <div className="bg-emerald-50 rounded-lg p-4 text-sm text-blue-800 mb-4">
                <p className="font-medium mb-1">Expected CSV columns:</p>
                <p className="font-mono text-xs">name, pan, gstin, email, phone, clientType, state, city, pincode</p>
              </div>
              <a href="/sample-clients.csv" download className="block text-center text-sm text-emerald-600 hover:underline mb-4">
                Download sample CSV template
              </a>
              <label className="block w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 transition-colors">
                <input type="file" accept=".csv" onChange={handleCSV} className="hidden" />
                <p className="text-gray-500 text-sm">{loading ? "Importing…" : "Click to upload CSV file"}</p>
              </label>
              <button onClick={() => setShowImport(false)} className="w-full mt-4 border border-gray-300 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
