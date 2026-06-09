import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const firmId = (session.user as any).firmId;
  const services = await db.service.findMany({ where: { firmId, isActive: true }, orderBy: { name: "asc" } });
  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const firmId = (session.user as any).firmId;
  const body = await req.json();
  const service = await db.service.create({
    data: { firmId, name: body.name, description: body.description || null, sacCode: body.sacCode, defaultAmount: body.defaultAmount || null },
  });
  return NextResponse.json(service);
}
