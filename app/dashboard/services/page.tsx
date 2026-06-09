import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { ServicesClient } from "./services-client";

export default async function ServicesPage() {
  const session = await getSession();
  const firmId = (session!.user as any).firmId;

  const services = await db.service.findMany({
    where: { firmId, isActive: true },
    include: { _count: { select: { invoiceItems: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services Catalog</h1>
          <p className="text-gray-500 text-sm">{services.length} services</p>
        </div>
        <ServicesClient firmId={firmId} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-6 py-3 font-medium text-gray-500">Service Name</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">SAC Code</th>
              <th className="text-right px-6 py-3 font-medium text-gray-500">Default Rate</th>
              <th className="text-right px-6 py-3 font-medium text-gray-500">Used In</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {services.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{s.name}</td>
                <td className="px-6 py-4 font-mono text-xs text-gray-600">{s.sacCode}</td>
                <td className="px-6 py-4 text-right text-gray-700">{s.defaultAmount ? formatCurrency(s.defaultAmount) : "—"}</td>
                <td className="px-6 py-4 text-right text-gray-500">{(s as any)._count.invoiceItems} invoices</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
