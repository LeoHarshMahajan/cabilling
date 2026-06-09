import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const firmId = (session.user as any).firmId;
  const clients = await db.client.findMany({ where: { firmId, isActive: true }, orderBy: { name: "asc" } });
  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const firmId = (session.user as any).firmId;
  const body = await req.json();
  const client = await db.client.create({
    data: {
      firmId,
      name: body.name,
      gstin: body.gstin || null,
      pan: body.pan || null,
      email: body.email || null,
      phone: body.phone || null,
      clientType: body.clientType || "INDIVIDUAL",
      state: body.state || null,
      stateCode: body.stateCode || null,
      city: body.city || null,
      pincode: body.pincode || null,
    },
  });
  return NextResponse.json(client);
}
