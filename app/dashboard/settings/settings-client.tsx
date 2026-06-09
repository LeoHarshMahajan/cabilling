"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { INDIAN_STATES } from "@/lib/utils";

type Firm = {
  id: string; name: string; gstin?: string | null; pan?: string | null;
  state: string; stateCode: string; address: string; city: string;
  pincode: string; phone?: string | null; email?: string | null;
  invoicePrefix: string; gstRate: number;
  smtpHost?: string | null; smtpPort?: number | null; smtpUser?: string | null;
  smtpPass?: string | null; smtpFrom?: string | null;
  dailySummaryTo?: string | null; dailySummaryOn: boolean; summaryTime: string;
};
type User = { id: string; name: string; email: string; role: string; isActive: boolean };
type Session = { user: { id: string; role?: string } };

export function SettingsClient({ firm, users, session }: { firm: Firm; users: User[]; session: Session }) {
  const router = useRouter();
  const [firmForm, setFirmForm] = useState(firm);
  const [saving, setSaving] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", role: "CLERK" });
  const [userLoading, setUserLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("firm");
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [testMsg, setTestMsg] = useState("");

  async function saveFirm(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/firm", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(firmForm),
    });
    setSaving(false);
    router.refresh();
  }

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setUserLoading(true);
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userForm),
    });
    setUserLoading(false);
    setShowAddUser(false);
    setUserForm({ name: "", email: "", password: "", role: "CLERK" });
    router.refresh();
  }

  async function sendTestSummary() {
    setTestStatus("sending");
    setTestMsg("");
    // Save SMTP settings first
    await fetch("/api/firm", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(firmForm),
    });
    const res = await fetch("/api/notifications/send-summary", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setTestStatus("ok");
      setTestMsg(`✅ Summary sent to ${firmForm.dailySummaryTo}`);
    } else {
      setTestStatus("error");
      setTestMsg(`❌ ${data.error}`);
    }
  }

  const isAdmin = (session.user as any).role === "ADMIN";
  const tabs = isAdmin ? ["firm", "notifications", "users"] : ["firm"];

  return (
    <div>
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${activeTab === tab ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Firm Profile Tab */}
      {activeTab === "firm" && (
        <form onSubmit={saveFirm} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 mb-2">Firm Profile</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Firm Name *</label>
              <input required value={firmForm.name} onChange={e => setFirmForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
              <input value={firmForm.gstin ?? ""} onChange={e => setFirmForm(f => ({ ...f, gstin: e.target.value.toUpperCase() }))} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono" maxLength={15} placeholder="27XXXXX0000X1Z5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PAN</label>
              <input value={firmForm.pan ?? ""} onChange={e => setFirmForm(f => ({ ...f, pan: e.target.value.toUpperCase() }))} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono" maxLength={10} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input value={firmForm.address} onChange={e => setFirmForm(f => ({ ...f, address: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input value={firmForm.city} onChange={e => setFirmForm(f => ({ ...f, city: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <select value={firmForm.state} onChange={e => { const s = INDIAN_STATES.find(st => st.name === e.target.value); setFirmForm(f => ({ ...f, state: e.target.value, stateCode: s?.code ?? "" })); }} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {INDIAN_STATES.map(s => <option key={s.code} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
              <input value={firmForm.pincode} onChange={e => setFirmForm(f => ({ ...f, pincode: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={firmForm.phone ?? ""} onChange={e => setFirmForm(f => ({ ...f, phone: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Prefix</label>
              <input value={firmForm.invoicePrefix} onChange={e => setFirmForm(f => ({ ...f, invoicePrefix: e.target.value.toUpperCase() }))} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono" placeholder="MGA" maxLength={5} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
              <input type="number" value={firmForm.gstRate} onChange={e => setFirmForm(f => ({ ...f, gstRate: parseFloat(e.target.value) }))} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <button type="submit" disabled={saving} className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="space-y-6">
          {/* Daily Summary Toggle */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-semibold text-gray-900">Daily Summary Email</h2>
                <p className="text-sm text-gray-500 mt-1">Get a daily summary with collections, outstanding, overdue invoices sent to your inbox.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={firmForm.dailySummaryOn} onChange={e => setFirmForm(f => ({ ...f, dailySummaryOn: e.target.checked }))} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Send Summary To (email)</label>
                <input type="email" value={firmForm.dailySummaryTo ?? ""} onChange={e => setFirmForm(f => ({ ...f, dailySummaryTo: e.target.value }))} placeholder="partner@yourfirm.com" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <p className="text-xs text-gray-400 mt-1">Multiple recipients: use comma-separated emails</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Send Time (daily)</label>
                <input type="time" value={firmForm.summaryTime} onChange={e => setFirmForm(f => ({ ...f, summaryTime: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
          </div>

          {/* SMTP Config */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-1">SMTP / Email Server</h2>
            <p className="text-sm text-gray-500 mb-4">Configure your outgoing email server. For Gmail, use <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">smtp.gmail.com</span> with an App Password.</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                <input value={firmForm.smtpHost ?? ""} onChange={e => setFirmForm(f => ({ ...f, smtpHost: e.target.value }))} placeholder="smtp.gmail.com" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
                <input type="number" value={firmForm.smtpPort ?? 587} onChange={e => setFirmForm(f => ({ ...f, smtpPort: parseInt(e.target.value) }))} placeholder="587" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <p className="text-xs text-gray-400 mt-1">587 (TLS) or 465 (SSL)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username / Email</label>
                <input type="email" value={firmForm.smtpUser ?? ""} onChange={e => setFirmForm(f => ({ ...f, smtpUser: e.target.value }))} placeholder="yourname@gmail.com" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password / App Password</label>
                <input type="password" value={firmForm.smtpPass ?? ""} onChange={e => setFirmForm(f => ({ ...f, smtpPass: e.target.value }))} placeholder="••••••••••••••••" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">From Name / Email</label>
                <input value={firmForm.smtpFrom ?? ""} onChange={e => setFirmForm(f => ({ ...f, smtpFrom: e.target.value }))} placeholder="billing@yourfirm.com" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button type="button" onClick={saveFirm as any} disabled={saving} className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60">
                {saving ? "Saving…" : "Save Settings"}
              </button>
              <button type="button" onClick={sendTestSummary} disabled={testStatus === "sending" || !firmForm.smtpHost || !firmForm.dailySummaryTo} className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                {testStatus === "sending" ? "Sending…" : "Send Test Summary Now"}
              </button>
            </div>
            {testMsg && (
              <p className={`mt-3 text-sm font-medium ${testStatus === "ok" ? "text-green-600" : "text-red-600"}`}>{testMsg}</p>
            )}

            {/* Gmail Help */}
            <div className="mt-6 p-4 bg-emerald-50 rounded-xl text-sm">
              <p className="font-semibold text-emerald-900 mb-2">📌 Gmail Setup (recommended)</p>
              <ol className="list-decimal list-inside space-y-1 text-emerald-800 text-xs">
                <li>Go to Google Account → Security → 2-Step Verification (enable it)</li>
                <li>Then go to Security → App passwords</li>
                <li>Create an app password for "Mail" — use it as the password above</li>
                <li>Host: <span className="font-mono">smtp.gmail.com</span> · Port: <span className="font-mono">587</span></li>
              </ol>
            </div>
          </div>

          {/* What's in the summary */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-3">What's in the daily summary?</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: "💰", text: "Today's collections & payment count" },
                { icon: "📅", text: "Month-to-date collections" },
                { icon: "⏳", text: "Total outstanding balance" },
                { icon: "⚠️", text: "All overdue invoices with amounts & due dates" },
                { icon: "📄", text: "New invoices raised today" },
                { icon: "🔔", text: "Pending invoices count (sent, awaiting payment)" },
              ].map(item => (
                <div key={item.text} className="flex items-start gap-2 text-sm text-gray-600">
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Team Members</h2>
              {isAdmin && <button onClick={() => setShowAddUser(true)} className="px-4 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">+ Add User</button>}
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Name</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Email</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Role</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="px-6 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-6 py-3 text-gray-500">{u.email}</td>
                    <td className="px-6 py-3"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{u.role.toLowerCase()}</span></td>
                    <td className="px-6 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{u.isActive ? "Active" : "Inactive"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showAddUser && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Add Team Member</h2>
                  <button onClick={() => setShowAddUser(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                <form onSubmit={addUser} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input required value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input required type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                    <input required type="password" value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      <option value="ADMIN">Admin / Partner</option>
                      <option value="CA">CA / Manager</option>
                      <option value="CLERK">Clerk / Staff</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowAddUser(false)} className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50">Cancel</button>
                    <button type="submit" disabled={userLoading} className="flex-1 bg-emerald-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60">
                      {userLoading ? "Adding…" : "Add User"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
