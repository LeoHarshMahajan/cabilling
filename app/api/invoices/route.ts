import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCurrentFinancialYear, generateInvoiceNumber } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const firmId = (session.user as any).firmId;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const invoices = await db.invoice.findMany({
    where: { firmId, ...(status ? { status: status as any } : {}) },
    include: { client: true, items: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(invoices);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const firmId = (session.user as any).firmId;
  const body = await req.json();

  // Verify clientId belongs to this firm (prevents cross-firm data corruption)
  const client = await db.client.findFirst({ where: { id: body.clientId, firmId } });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 400 });

  const round2 = (n: number) => Math.round(n * 100) / 100;

  // Atomic: increment counter AND create invoice in one transaction to prevent duplicate invoice numbers
  const invoice = await db.$transaction(async (tx) => {
    const firm = await tx.firm.update({
      where: { id: firmId },
      data: { invoiceCounter: { increment: 1 } },
    });

    const fy = getCurrentFinancialYear();
    const invoiceNumber = generateInvoiceNumber(firm.invoicePrefix, firm.invoiceCounter, fy);

    const items: { description: string; sacCode?: string; quantity: number; unitPrice: number; amount: number; serviceId?: string; sortOrder: number }[] = body.items ?? [];
    const subtotal = round2(items.reduce((s: number, i: typeof items[0]) => s + i.amount, 0));

    const isSameState = body.gstType === "CGST_SGST";
    const gstRate = firm.gstRate;
    const gstAmount = body.gstType === "EXEMPT" ? 0 : round2(subtotal * gstRate / 100);
    const cgstAmount = isSameState ? round2(gstAmount / 2) : 0;
    const sgstAmount = isSameState ? round2(gstAmount / 2) : 0;
    const igstAmount = !isSameState && body.gstType !== "EXEMPT" ? gstAmount : 0;
    const totalAmount = round2(subtotal + gstAmount);

    return tx.invoice.create({
      data: {
        firmId,
        clientId: body.clientId,
        assignedToId: body.assignedToId || null,
        invoiceNumber,
        invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : new Date(),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        status: "DRAFT",
        gstType: body.gstType || "CGST_SGST",
        subtotal,
        cgstAmount,
        sgstAmount,
        igstAmount,
        totalAmount,
        paidAmount: 0,
        balanceAmount: totalAmount,
        notes: body.notes || null,
        terms: body.terms || null,
        financialYear: fy,
        items: {
          create: items.map((item, idx) => ({
            serviceId: item.serviceId || null,
            description: item.description,
            sacCode: item.sacCode || null,
            quantity: item.quantity,
            unitPrice: round2(item.unitPrice),
            amount: round2(item.amount),
            sortOrder: idx,
          })),
        },
      },
      include: { client: true, items: true },
    });
  });

  return NextResponse.json(invoice);
}
