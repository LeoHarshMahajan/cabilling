import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createTransport } from "@/lib/mailer";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  // Always return the same message to prevent email enumeration
  const genericOk = { message: "If that email exists, a reset link has been sent." };

  const user = await db.user.findUnique({ where: { email }, include: { firm: true } });
  if (!user || !user.isActive) return NextResponse.json(genericOk);

  // Generate a secure random token (raw = link token, hashed = stored in DB)
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.user.update({
    where: { id: user.id },
    data: { resetToken: hashedToken, resetTokenExpiry: expiry },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3001";
  const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

  // Try to send via the firm's configured SMTP
  const firm = user.firm;
  if (firm.smtpHost && firm.smtpUser && firm.smtpPass) {
    try {
      const transport = createTransport({
        host: firm.smtpHost,
        port: firm.smtpPort ?? 587,
        user: firm.smtpUser,
        pass: firm.smtpPass,
        from: firm.smtpFrom ?? firm.smtpUser,
      });
      await transport.sendMail({
        from: `"${firm.name}" <${firm.smtpFrom ?? firm.smtpUser}>`,
        to: user.email,
        subject: `Password Reset — ${firm.name} CA Billing`,
        html: buildResetEmail(user.name, firm.name, resetUrl),
      });
    } catch (err) {
      console.error("[forgot-password] Failed to send email:", err);
      // Fall through — still log the link in dev so admin can reset manually
    }
  }

  // In dev / when SMTP not set up, log the link so an admin can copy-paste it
  if (process.env.NODE_ENV !== "production" || !firm.smtpHost) {
    console.log(`\n[Password Reset Link for ${user.email}]\n${resetUrl}\n`);
  }

  return NextResponse.json(genericOk);
}

function buildResetEmail(name: string, firmName: string, resetUrl: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:20px;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#1e40af;padding:24px 32px;">
      <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:700;">${firmName}</h1>
      <p style="color:#bfdbfe;margin:4px 0 0;font-size:14px;">CA Billing — Password Reset</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;color:#374151;">Hi ${name},</p>
      <p style="margin:0 0 24px;color:#374151;">
        We received a request to reset your password. Click the button below to choose a new one.
        This link is valid for <strong>1 hour</strong>.
      </p>
      <a href="${resetUrl}"
         style="display:inline-block;background:#1e40af;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">
        Reset My Password
      </a>
      <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">
        If you didn't request this, you can safely ignore this email — your password won't change.
      </p>
      <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;word-break:break-all;">
        Or copy this link: ${resetUrl}
      </p>
    </div>
  </div>
</body>
</html>`;
}
