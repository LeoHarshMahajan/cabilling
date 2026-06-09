import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const firmId = (session.user as any).firmId;
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const status = searchParams.get("status");

  const tasks = await db.task.findMany({
    where: {
      firmId,
      ...(clientId ? { clientId } : {}),
      ...(status ? { status: status as any } : {}),
    },
    include: { client: true, service: true, assignedTo: true },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const firmId = (session.user as any).firmId;
  const body = await req.json();

  if (!body.title || !body.clientId) {
    return NextResponse.json({ error: "Title and client are required" }, { status: 400 });
  }

  // Verify client belongs to this firm
  const client = await db.client.findFirst({ where: { id: body.clientId, firmId } });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 400 });

  const task = await db.task.create({
    data: {
      firmId,
      clientId: body.clientId,
      serviceId: body.serviceId || null,
      assignedToId: body.assignedToId || null,
      title: body.title,
      description: body.description || null,
      amount: body.amount ? parseFloat(body.amount) : null,
      period: body.period || null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      notes: body.notes || null,
    },
    include: { client: true, service: true },
  });
  return NextResponse.json(task);
}
