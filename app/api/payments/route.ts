import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const firmId = (session.user as any).firmId;
  const body = await req.json();

  const amount = Number(body.amount);
  if (!amount || amount <= 0) return NextResponse.json({ error: "Payment amount must be positive" }, { status: 400 });

  // Atomic: read invoice, validate, create payment, update balance all in one transaction
  const payment = await db.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({ where: { id: body.invoiceId, firmId } });
    if (!invoice) throw new Error("NOT_FOUND");

    if (amount > invoice.balanceAmount + 0.001) {
      throw new Error("EXCEEDS_BALANCE");
    }

    const created = await tx.payment.create({
      data: {
        invoiceId: body.invoiceId,
        amount,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
        mode: body.mode || "CASH",
        reference: body.reference || null,
        chequeNumber: body.chequeNumber || null,
        bankName: body.bankName || null,
        notes: body.notes || null,
      },
    });

    const newPaid = Math.round((invoice.paidAmount + amount) * 100) / 100;
    const newBalance = Math.max(0, Math.round((invoice.totalAmount - newPaid) * 100) / 100);
    const newStatus = newBalance <= 0 ? "PAID" : newPaid > 0 ? "PARTIALLY_PAID" : invoice.status;

    await tx.invoice.update({
      where: { id: body.invoiceId },
      data: { paidAmount: newPaid, balanceAmount: newBalance, status: newStatus as any },
    });

    return created;
  }).catch((err: Error) => {
    if (err.message === "NOT_FOUND") return null;
    if (err.message === "EXCEEDS_BALANCE") return "EXCEEDS";
    throw err;
  });

  if (payment === null) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (payment === "EXCEEDS") return NextResponse.json({ error: "Payment amount exceeds outstanding balance" }, { status: 400 });

  return NextResponse.json(payment);
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const firmId = (session.user as any).firmId;
  const payments = await db.payment.findMany({
    where: { invoice: { firmId } },
    include: { invoice: { include: { client: true } } },
    orderBy: { paymentDate: "desc" },
    take: 50,
  });
  return NextResponse.json(payments);
}
