"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

type Client = { id: string; name: string };
type Service = { id: string; name: string; sacCode: string; defaultAmount?: number | null };
type User = { id: string; name: string };
type Task = {
  id: string; title: string; description?: string | null; status: string;
  amount?: number | null; period?: string | null; dueDate?: string | null;
  notes?: string | null;
  client: Client; service?: Service | null; assignedTo?: User | null;
};

const STATUS_CONFIG: Record<string, { label: string; cls: string; next: string; nextLabel: string }> = {
  PENDING:     { label: "Pending",     cls: "text-gray-600 bg-gray-100",    next: "IN_PROGRESS", nextLabel: "Start" },
  IN_PROGRESS: { label: "In Progress", cls: "text-blue-700 bg-blue-100",    next: "COMPLETED",   nextLabel: "Complete" },
  COMPLETED:   { label: "Completed",   cls: "text-emerald-700 bg-emerald-100", next: "",         nextLabel: "" },
  INVOICED:    { label: "Invoiced",    cls: "text-purple-700 bg-purple-100", next: "",           nextLabel: "" },
};

const PERIODS = () => {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const year = new Date().getFullYear();
  const result = [];
  for (let i = -1; i <= 5; i++) {
    const d = new Date(year, new Date().getMonth() + i, 1);
    result.push(`${months[d.getMonth()]} ${d.getFullYear()}`);
  }
  return result;
};

export function TasksClient({
  clients, services, users, tasks, mode,
}: {
  clients: Client[]; services: Service[]; users: User[];
  tasks: Task[]; mode: "add-button" | "table";
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterClient, setFilterClient] = useState("ALL");
  const [form, setForm] = useState({
    clientId: "", serviceId: "", assignedToId: "", title: "",
    description: "", amount: "", period: `${new Date().toLocaleString("default",{month:"short"})} ${new Date().getFullYear()}`,
    dueDate: "", notes: "",
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    setShowAdd(false);
    setForm({ clientId:"", serviceId:"", assignedToId:"", title:"", description:"", amount:"", period:`${new Date().toLocaleString("default",{month:"short"})} ${new Date().getFullYear()}`, dueDate:"", notes:"" });
    router.refresh();
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function deleteTask(id: string) {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function onServiceChange(serviceId: string) {
    const svc = services.find(s => s.id === serviceId);
    setForm(f => ({
      ...f,
      serviceId,
      title: svc ? svc.name : f.title,
      amount: svc?.defaultAmount ? String(svc.defaultAmount) : f.amount,
    }));
  }

  if (mode === "add-button") {
    return (
      <>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Task
        </button>

        {showAdd && <AddTaskModal
          clients={clients} services={services} users={users}
          form={form} setForm={setForm} loading={loading}
          onServiceChange={onServiceChange}
          onSubmit={handleAdd} onClose={() => setShowAdd(false)}
          periods={PERIODS()}
        />}
      </>
    );
  }

  // Table mode
  const filtered = tasks.filter(t => {
    if (filterStatus !== "ALL" && t.status !== filterStatus) return false;
    if (filterClient !== "ALL" && t.client.id !== filterClient) return false;
    return true;
  });

  const completedUnbilled = tasks.filter(t => t.status === "COMPLETED");

  return (
    <>
      {/* Raise invoice from completed tasks CTA */}
      {completedUnbilled.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-800">
                {completedUnbilled.length} completed task{completedUnbilled.length !== 1 ? "s" : ""} ready to invoice
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">
                Worth {formatCurrency(completedUnbilled.reduce((s,t) => s + (t.amount ?? 0), 0))} — go to New Invoice to select and bill them
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/invoices/new"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 shrink-0"
            style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
          >
            Raise Invoice →
          </Link>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {["ALL","PENDING","IN_PROGRESS","COMPLETED","INVOICED"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterStatus === s ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
              {s === "ALL" ? "All" : s === "IN_PROGRESS" ? "In Progress" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <select value={filterClient} onChange={e => setFilterClient(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
          <option value="ALL">All Clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Task table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <div className="col-span-4">Task</div>
          <div className="col-span-2">Client</div>
          <div className="col-span-1">Period</div>
          <div className="col-span-1 text-right">Amount</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        <div className="divide-y divide-gray-50">
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm text-gray-400">No tasks found.</p>
              <p className="text-xs text-gray-400 mt-1">Add tasks to track work for clients.</p>
            </div>
          )}

          {filtered.map(task => {
            const s = STATUS_CONFIG[task.status];
            return (
              <div key={task.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-gray-50/60 transition-colors">
                <div className="col-span-4 min-w-0 pr-4">
                  <p className="text-sm font-semibold text-gray-900 truncate">{task.title}</p>
                  {task.description && <p className="text-xs text-gray-400 truncate mt-0.5">{task.description}</p>}
                  {task.assignedTo && <p className="text-xs text-gray-400 mt-0.5">👤 {task.assignedTo.name}</p>}
                </div>
                <div className="col-span-2 min-w-0 pr-2">
                  <p className="text-sm text-gray-700 truncate">{task.client.name}</p>
                  {task.service && <p className="text-xs text-gray-400 truncate">{task.service.name}</p>}
                </div>
                <div className="col-span-1">
                  <p className="text-xs text-gray-500 font-medium">{task.period ?? "—"}</p>
                </div>
                <div className="col-span-1 text-right">
                  <p className="text-sm font-bold text-gray-900">
                    {task.amount ? formatCurrency(task.amount) : <span className="text-gray-300">—</span>}
                  </p>
                </div>
                <div className="col-span-2 text-center">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  {s.next && (
                    <button
                      onClick={() => updateStatus(task.id, s.next)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                    >
                      {s.nextLabel}
                    </button>
                  )}
                  {task.status !== "INVOICED" && (
                    <button onClick={() => deleteTask(task.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors p-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showAdd && <AddTaskModal
        clients={clients} services={services} users={users}
        form={form} setForm={setForm} loading={loading}
        onServiceChange={onServiceChange}
        onSubmit={handleAdd} onClose={() => setShowAdd(false)}
        periods={PERIODS()}
      />}
    </>
  );
}

function AddTaskModal({ clients, services, users, form, setForm, loading, onServiceChange, onSubmit, onClose, periods }: any) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add Task</h2>
            <p className="text-xs text-gray-400 mt-0.5">Track work to be done for a client</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
              <select required value={form.clientId} onChange={e => setForm((f: any) => ({ ...f, clientId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">Select client…</option>
                {clients.map((c: Client) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Service (auto-fills title & amount)</label>
              <select value={form.serviceId} onChange={e => onServiceChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">Select service or type custom title…</option>
                {services.map((s: Service) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label>
              <input required value={form.title} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. GST Return Filing — Jun 2026"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
              <select value={form.period} onChange={e => setForm((f: any) => ({ ...f, period: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {periods.map((p: string) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
              <input type="number" min={0} step="any" value={form.amount}
                onChange={e => setForm((f: any) => ({ ...f, amount: e.target.value }))}
                placeholder="Leave blank to fill later"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => setForm((f: any) => ({ ...f, dueDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
              <select value={form.assignedToId} onChange={e => setForm((f: any) => ({ ...f, assignedToId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">Unassigned</option>
                {users.map((u: User) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))}
                rows={2} placeholder="Any internal notes…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-emerald-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60">
              {loading ? "Saving…" : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
