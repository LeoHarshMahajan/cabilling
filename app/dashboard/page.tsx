import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getSession();
  const firmId = (session!.user as any).firmId;

  const [
    totalClients,
    totalInvoices,
    invoiceSummary,
    recentInvoices,
    overdueInvoices,
    thisMonthCollections,
  ] = await Promise.all([
    db.client.count({ where: { firmId, isActive: true } }),
    db.invoice.count({ where: { firmId } }),
    db.invoice.groupBy({
      by: ["status"],
      where: { firmId },
      _sum: { totalAmount: true, paidAmount: true, balanceAmount: true },
      _count: true,
    }),
    db.invoice.findMany({
      where: { firmId },
      include: { client: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.invoice.findMany({
      where: { firmId, status: "OVERDUE" },
      include: { client: true },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    db.payment.aggregate({
      where: {
        invoice: { firmId },
        paymentDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      _sum: { amount: true },
    }),
  ]);

  const totalBilled      = invoiceSummary.reduce((s, r) => s + (r._sum.totalAmount  ?? 0), 0);
  const totalCollected   = invoiceSummary.reduce((s, r) => s + (r._sum.paidAmount   ?? 0), 0);
  const totalOutstanding = invoiceSummary.reduce((s, r) => s + (r._sum.balanceAmount ?? 0), 0);
  const overdueAmt       = invoiceSummary.find(r => r.status === "OVERDUE")?._sum.balanceAmount ?? 0;
  const monthCollection  = thisMonthCollections._sum.amount ?? 0;

  const STATUS: Record<string, { label: string; cls: string }> = {
    DRAFT:          { label: "Draft",    cls: "text-slate-600 bg-slate-100" },
    SENT:           { label: "Sent",     cls: "text-blue-700 bg-blue-100" },
    PARTIALLY_PAID: { label: "Partial",  cls: "text-amber-700 bg-amber-100" },
    PAID:           { label: "Paid",     cls: "text-emerald-700 bg-emerald-100" },
    OVERDUE:        { label: "Overdue",  cls: "text-red-700 bg-red-100" },
    CANCELLED:      { label: "Cancelled",cls: "text-slate-500 bg-slate-100" },
  };

  const kpis = [
    {
      label: "Total Billed",
      value: formatCurrency(totalBilled),
      sub: `${totalInvoices} invoice${totalInvoices !== 1 ? "s" : ""}`,
      href: "/dashboard/invoices",
      icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
      valueColor: "#1d4ed8",
      iconBg: "#dbeafe",
      iconColor: "#1d4ed8",
      border: "#bfdbfe",
    },
    {
      label: "Total Collected",
      value: formatCurrency(totalCollected),
      sub: "All time",
      href: "/dashboard/payments",
      icon: "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z",
      valueColor: "#15803d",
      iconBg: "#dcfce7",
      iconColor: "#15803d",
      border: "#bbf7d0",
    },
    {
      label: "Outstanding",
      value: formatCurrency(totalOutstanding),
      sub: "Pending collection",
      href: "/dashboard/invoices?status=OVERDUE",
      icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
      valueColor: "#b45309",
      iconBg: "#fef3c7",
      iconColor: "#b45309",
      border: "#fde68a",
    },
    {
      label: "This Month",
      value: formatCurrency(monthCollection),
      sub: new Date().toLocaleString("en-IN", { month: "long" }) + " collections",
      href: "/dashboard/payments",
      icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5m-9-6h.008v.008H12V10.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM12 13.5h.008v.008H12V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM9.75 13.5h.008v.008H9.75V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM9.75 16.5h.008v.008H9.75V16.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM12 16.5h.008v.008H12V16.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM14.25 16.5h.008v.008h-.008V16.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM14.25 13.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
      valueColor: "#7c3aed",
      iconBg: "#ede9fe",
      iconColor: "#7c3aed",
      border: "#ddd6fe",
    },
  ];

  return (
    <div className="min-h-full bg-gray-50/50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Welcome back, <span className="font-medium text-gray-700">{session?.user?.name?.split(" ")[0]}</span>
              {" — "}{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <Link
            href="/dashboard/invoices/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Invoice
          </Link>
        </div>
      </div>

      <div className="p-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-5 mb-8">
          {kpis.map((k) => (
            <Link key={k.label} href={k.href} className="bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md hover:scale-[1.02] transition-all block"
                 style={{ borderColor: k.border }}>
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{k.label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                     style={{ background: k.iconBg }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}
                       style={{ color: k.iconColor }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={k.icon} />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold tracking-tight" style={{ color: k.valueColor }}>{k.value}</p>
              <p className="text-xs text-gray-400 mt-1.5 font-medium">{k.sub}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Recent Invoices */}
          <div className="col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(180deg,#16a34a,#15803d)" }} />
                <h2 className="font-semibold text-gray-900 text-sm">Recent Invoices</h2>
              </div>
              <Link href="/dashboard/invoices" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline">
                View all →
              </Link>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-12 px-6 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <div className="col-span-5">Client</div>
              <div className="col-span-3">Invoice #</div>
              <div className="col-span-2 text-right">Amount</div>
              <div className="col-span-2 text-right">Status</div>
            </div>

            <div className="divide-y divide-gray-50">
              {recentInvoices.length === 0 && (
                <div className="text-center py-16">
                  <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <p className="text-sm text-gray-400">No invoices yet.</p>
                  <Link href="/dashboard/invoices/new" className="text-sm text-emerald-600 hover:underline font-medium mt-1 inline-block">Create your first invoice →</Link>
                </div>
              )}
              {recentInvoices.map((inv) => {
                const s = STATUS[inv.status] ?? STATUS.DRAFT;
                return (
                  <Link key={inv.id} href={`/dashboard/invoices/${inv.id}`}
                        className="grid grid-cols-12 items-center px-6 py-3.5 hover:bg-emerald-50/40 transition-colors group">
                    <div className="col-span-5 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-emerald-700 transition-colors">{inv.client.name}</p>
                    </div>
                    <div className="col-span-3">
                      <p className="text-xs text-gray-400 font-mono">{inv.invoiceNumber}</p>
                    </div>
                    <div className="col-span-2 text-right">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(inv.totalAmount)}</p>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(180deg,#16a34a,#15803d)" }} />
                <h2 className="font-semibold text-gray-900 text-sm">Quick Actions</h2>
              </div>
              <div className="space-y-2.5">
                {[
                  {
                    href: "/dashboard/invoices/new",
                    label: "New Invoice",
                    icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
                    primary: true,
                  },
                  {
                    href: "/dashboard/clients",
                    label: "Add Client",
                    icon: "M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z",
                    primary: false,
                  },
                  {
                    href: "/dashboard/payments",
                    label: "Record Collection",
                    icon: "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z",
                    primary: false,
                  },
                ].map((a) => (
                  <Link key={a.href} href={a.href}
                        className={cn(
                          "flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                          a.primary
                            ? "text-white hover:opacity-90 shadow-sm"
                            : "text-gray-700 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 border border-gray-200 hover:border-emerald-200"
                        )}
                        style={a.primary ? { background: "linear-gradient(135deg, #16a34a, #15803d)" } : {}}>
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={a.icon} />
                    </svg>
                    {a.label}
                  </Link>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span>{totalClients} active clients</span>
                <Link href="/dashboard/clients" className="text-emerald-600 hover:underline font-medium">Manage →</Link>
              </div>
            </div>

            {/* Overdue */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                <div className="w-1 h-5 rounded-full bg-red-500" />
                <h2 className="font-semibold text-gray-900 text-sm">Overdue</h2>
                {overdueInvoices.length > 0 && (
                  <span className="ml-auto text-xs font-bold text-white bg-red-500 rounded-full px-2 py-0.5">
                    {overdueInvoices.length}
                  </span>
                )}
              </div>
              <div className="divide-y divide-gray-50">
                {overdueInvoices.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-2">
                      <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-500">All clear!</p>
                    <p className="text-xs text-gray-400 mt-0.5">No overdue invoices</p>
                  </div>
                ) : (
                  overdueInvoices.map((inv) => (
                    <Link key={inv.id} href={`/dashboard/invoices/${inv.id}`}
                          className="flex items-center px-5 py-3 hover:bg-red-50/50 transition-colors group">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-red-700">{inv.client.name}</p>
                        <p className="text-xs text-red-400 mt-0.5">
                          Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-red-600 ml-3 shrink-0">{formatCurrency(inv.balanceAmount)}</p>
                    </Link>
                  ))
                )}
                {overdueInvoices.length > 0 && (
                  <div className="px-5 py-3 bg-red-50/50">
                    <p className="text-xs font-bold text-red-600">
                      Total overdue: {formatCurrency(overdueAmt)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// inline cn helper (no import needed, just a small util)
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
