import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendDailySummary } from "@/lib/mailer";

export async function POST() {
  const session = await getSession();
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const firmId = (session.user as any).firmId;
  try {
    await sendDailySummary(firmId);
    return NextResponse.json({ success: true, message: "Summary email sent successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
