import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NewInvoiceForm } from "./new-invoice-form";

export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ clientId?: string }> }) {
  const session = await getSession();
  const firmId = (session!.user as any).firmId;
  const { clientId } = await searchParams;

  const [clients, services, firm] = await Promise.all([
    db.client.findMany({ where: { firmId, isActive: true }, orderBy: { name: "asc" } }),
    db.service.findMany({ where: { firmId, isActive: true }, orderBy: { name: "asc" } }),
    db.firm.findUnique({ where: { id: firmId } }),
  ]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Invoice</h1>
      <NewInvoiceForm clients={clients as any} services={services as any} firm={firm as any} defaultClientId={clientId} />
    </div>
  );
}
