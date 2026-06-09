import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const VALID_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "INVOICED"] as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const firmId = (session.user as any).firmId;
  const { id } = await params;
  const body = await req.json();

  const existing = await db.task.findFirst({ where: { id, firmId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Prevent un-invoicing a task
  if (existing.status === "INVOICED" && body.status && body.status !== "INVOICED") {
    return NextResponse.json({ error: "Cannot change status of an invoiced task" }, { status: 400 });
  }

  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const task = await db.task.update({
    where: { id },
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(body.title ? { title: body.title } : {}),
      ...(body.amount !== undefined ? { amount: body.amount ? parseFloat(body.amount) : null } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
      ...(body.period !== undefined ? { period: body.period } : {}),
      ...(body.dueDate !== undefined ? { dueDate: body.dueDate ? new Date(body.dueDate) : null } : {}),
      ...(body.assignedToId !== undefined ? { assignedToId: body.assignedToId || null } : {}),
    },
    include: { client: true, service: true },
  });
  return NextResponse.json(task);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const firmId = (session.user as any).firmId;
  const { id } = await params;

  const existing = await db.task.findFirst({ where: { id, firmId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status === "INVOICED") {
    return NextResponse.json({ error: "Cannot delete an invoiced task" }, { status: 400 });
  }

  await db.task.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
