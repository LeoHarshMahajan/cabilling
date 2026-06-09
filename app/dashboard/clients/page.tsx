import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { ClientsClient } from "./clients-client";

export default async function ClientsPage() {
  const session = await getSession();
  const firmId = (session!.user as any).firmId;

  const clients = await db.client.findMany({
    where: { firmId, isActive: true },
    include: { _count: { select: { invoices: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 text-sm">{clients.length} active clients</p>
        </div>
        <ClientsClient firmId={firmId} clients={clients as any} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-6 py-3 font-medium text-gray-500">Name</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">GSTIN / PAN</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">State</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Type</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Invoices</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {clients.length === 0 && (
              <tr><td colSpan={6} className="text-center text-gray-400 py-16">No clients yet. Add one or import from CSV.</td></tr>
            )}
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{c.name}</p>
                  {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {c.gstin && <p className="font-mono text-xs">{c.gstin}</p>}
                  {c.pan && <p className="text-xs text-gray-400">PAN: {c.pan}</p>}
                </td>
                <td className="px-6 py-4 text-gray-600">{c.state}</td>
                <td className="px-6 py-4">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.clientType}</span>
                </td>
                <td className="px-6 py-4 text-gray-600">{(c as any)._count.invoices}</td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/dashboard/invoices/new?clientId=${c.id}`} className="text-emerald-600 hover:underline text-xs font-medium mr-4">
                    New Invoice
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
