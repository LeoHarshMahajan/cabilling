import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const firmId = (session.user as any).firmId;
  const invoice = await db.invoice.findFirst({
    where: { id, firmId },
    include: { client: true, items: { include: { service: true } }, payments: true, firm: true },
  });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(invoice);
}

const VALID_STATUSES = ["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"] as const;
type InvoiceStatus = typeof VALID_STATUSES[number];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const firmId = (session.user as any).firmId;
  const body = await req.json();

  if (!VALID_STATUSES.includes(body.status as InvoiceStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Re-fetch to check ownership and apply business rules
  const existing = await db.invoice.findFirst({ where: { id, firmId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Prevent reopening a fully paid invoice
  if (existing.status === "PAID" && body.status !== "PAID") {
    return NextResponse.json({ error: "Cannot change status of a fully paid invoice" }, { status: 400 });
  }

  const invoice = await db.invoice.update({
    where: { id },
    data: { status: body.status as InvoiceStatus },
  });
  return NextResponse.json(invoice);
}
