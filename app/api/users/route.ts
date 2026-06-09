import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const firmId = (session.user as any).firmId;
  const body = await req.json();
  const hash = await bcrypt.hash(body.password, 10);
  const user = await db.user.create({
    data: { name: body.name, email: body.email, password: hash, role: body.role || "CLERK", firmId },
  });
  return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role });
}
