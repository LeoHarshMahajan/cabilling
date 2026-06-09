import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Only ADMINs may modify firm settings
  if ((session.user as any).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const firmId = (session.user as any).firmId;
  const body = await req.json();
  const firm = await db.firm.update({
    where: { id: firmId },
    data: {
      name: body.name,
      gstin: body.gstin || null,
      pan: body.pan || null,
      address: body.address,
      city: body.city,
      state: body.state,
      stateCode: body.stateCode,
      pincode: body.pincode,
      phone: body.phone || null,
      email: body.email || null,
      invoicePrefix: body.invoicePrefix || "INV",
      gstRate: body.gstRate ?? 18,
      smtpHost: body.smtpHost || null,
      smtpPort: body.smtpPort ? parseInt(body.smtpPort) : null,
      smtpUser: body.smtpUser || null,
      // Only update smtpPass if a new value is provided (non-empty string)
      ...(body.smtpPass ? { smtpPass: body.smtpPass } : {}),
      smtpFrom: body.smtpFrom || null,
      dailySummaryTo: body.dailySummaryTo || null,
      dailySummaryOn: body.dailySummaryOn ?? true,
      summaryTime: body.summaryTime || "08:00",
    },
    // Never return smtpPass in the response
    select: {
      id: true, name: true, gstin: true, pan: true, address: true, city: true,
      state: true, stateCode: true, pincode: true, phone: true, email: true,
      invoicePrefix: true, gstRate: true, invoiceCounter: true,
      smtpHost: true, smtpPort: true, smtpUser: true, smtpFrom: true,
      dailySummaryTo: true, dailySummaryOn: true, summaryTime: true,
      createdAt: true, updatedAt: true,
    },
  });
  return NextResponse.json(firm);
}
