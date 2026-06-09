import nodemailer from "nodemailer";
import { db } from "./db";
import { formatCurrency, formatDate } from "./utils";

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

export function createTransport(cfg: SmtpConfig) {
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.pass },
  });
}

export async function sendDailySummary(firmId: string) {
  const firm = await db.firm.findUnique({ where: { id: firmId } });
  if (!firm) throw new Error("Firm not found");
  if (!firm.smtpHost || !firm.smtpUser || !firm.smtpPass || !firm.dailySummaryTo) {
    throw new Error("SMTP not configured or no recipient set");
  }

  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalOutstanding,
    overdueInvoices,
    todayPayments,
    monthPayments,
    todayInvoices,
    pendingInvoices,
  ] = await Promise.all([
    db.invoice.aggregate({
      where: { firmId, status: { notIn: ["PAID", "CANCELLED"] } },
      _sum: { balanceAmount: true },
      _count: true,
    }),
    db.invoice.findMany({
      where: { firmId, status: "OVERDUE" },
      include: { client: true },
      orderBy: { balanceAmount: "desc" },
      take: 10,
    }),
    db.payment.aggregate({
      where: { invoice: { firmId }, paymentDate: { gte: startOfDay } },
      _sum: { amount: true },
      _count: true,
    }),
    db.payment.aggregate({
      where: { invoice: { firmId }, paymentDate: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    db.invoice.findMany({
      where: { firmId, createdAt: { gte: startOfDay } },
      include: { client: true },
      take: 10,
    }),
    db.invoice.count({
      where: { firmId, status: { in: ["SENT", "PARTIALLY_PAID"] } },
    }),
  ]);

  const html = buildSummaryHtml({
    firm,
    date: today,
    totalOutstanding: totalOutstanding._sum.balanceAmount ?? 0,
    outstandingCount: totalOutstanding._count,
    overdueInvoices,
    todayCollection: todayPayments._sum.amount ?? 0,
    todayPaymentCount: todayPayments._count,
    monthCollection: monthPayments._sum.amount ?? 0,
    todayInvoices,
    pendingCount: pendingInvoices,
  });

  const transport = createTransport({
    host: firm.smtpHost,
    port: firm.smtpPort ?? 587,
    user: firm.smtpUser,
    pass: firm.smtpPass,
    from: firm.smtpFrom ?? firm.smtpUser,
  });

  await transport.sendMail({
    from: `"${firm.name}" <${firm.smtpFrom ?? firm.smtpUser}>`,
    to: firm.dailySummaryTo,
    subject: `📊 Daily Summary — ${firm.name} — ${formatDate(today)}`,
    html,
  });

  return { success: true };
}

function buildSummaryHtml(data: {
  firm: { name: string; gstin?: string | null };
  date: Date;
  totalOutstanding: number;
  outstandingCount: number;
  overdueInvoices: Array<{ id: string; invoiceNumber: string; balanceAmount: number; dueDate: Date | null; client: { name: string } }>;
  todayCollection: number;
  todayPaymentCount: number;
  monthCollection: number;
  todayInvoices: Array<{ invoiceNumber: string; totalAmount: number; client: { name: string } }>;
  pendingCount: number;
}) {
  const { firm, date, totalOutstanding, outstandingCount, overdueInvoices, todayCollection, todayPaymentCount, monthCollection, todayInvoices, pendingCount } = data;

  const overdueRows = overdueInvoices.map(inv => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${inv.client.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-family:monospace;font-size:12px;">${inv.invoiceNumber}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#ef4444;font-weight:600;">${formatCurrency(inv.balanceAmount)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#6b7280;font-size:12px;">${inv.dueDate ? formatDate(inv.dueDate) : "—"}</td>
    </tr>
  `).join("");

  const newInvoiceRows = todayInvoices.map(inv => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${inv.client.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-family:monospace;font-size:12px;">${inv.invoiceNumber}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-weight:600;">${formatCurrency(inv.totalAmount)}</td>
    </tr>
  `).join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:20px;">
  <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background:#1e40af;padding:24px 32px;">
      <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:700;">${firm.name}</h1>
      <p style="color:#bfdbfe;margin:4px 0 0;font-size:14px;">📊 Daily Summary — ${formatDate(date)}</p>
    </div>

    <!-- KPI Cards -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#e5e7eb;border-bottom:1px solid #e5e7eb;">
      <div style="background:#fff;padding:20px 24px;">
        <p style="margin:0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Today's Collection</p>
        <p style="margin:8px 0 0;font-size:28px;font-weight:700;color:#16a34a;">${formatCurrency(todayCollection)}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">${todayPaymentCount} payment${todayPaymentCount !== 1 ? "s" : ""} received</p>
      </div>
      <div style="background:#fff;padding:20px 24px;">
        <p style="margin:0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Month Collection</p>
        <p style="margin:8px 0 0;font-size:28px;font-weight:700;color:#2563eb;">${formatCurrency(monthCollection)}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">${new Date(date).toLocaleString("default", { month: "long" })} so far</p>
      </div>
      <div style="background:#fff;padding:20px 24px;">
        <p style="margin:0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Total Outstanding</p>
        <p style="margin:8px 0 0;font-size:28px;font-weight:700;color:#d97706;">${formatCurrency(totalOutstanding)}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">${outstandingCount} unpaid invoice${outstandingCount !== 1 ? "s" : ""}</p>
      </div>
      <div style="background:#fff;padding:20px 24px;">
        <p style="margin:0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Pending Invoices</p>
        <p style="margin:8px 0 0;font-size:28px;font-weight:700;color:#7c3aed;">${pendingCount}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">sent, awaiting payment</p>
      </div>
    </div>

    <!-- Overdue -->
    ${overdueInvoices.length > 0 ? `
    <div style="padding:24px 32px;">
      <h2 style="font-size:15px;font-weight:600;color:#dc2626;margin:0 0 16px;">⚠️ Overdue Invoices (${overdueInvoices.length})</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#fef2f2;">
            <th style="text-align:left;padding:8px 12px;font-weight:600;color:#6b7280;">Client</th>
            <th style="text-align:left;padding:8px 12px;font-weight:600;color:#6b7280;">Invoice #</th>
            <th style="text-align:left;padding:8px 12px;font-weight:600;color:#6b7280;">Amount Due</th>
            <th style="text-align:left;padding:8px 12px;font-weight:600;color:#6b7280;">Due Date</th>
          </tr>
        </thead>
        <tbody>${overdueRows}</tbody>
      </table>
    </div>
    ` : `
    <div style="padding:24px 32px;">
      <p style="color:#16a34a;font-weight:600;">✅ No overdue invoices — all clear!</p>
    </div>
    `}

    <!-- New Invoices Today -->
    ${todayInvoices.length > 0 ? `
    <div style="padding:0 32px 24px;">
      <h2 style="font-size:15px;font-weight:600;color:#1e40af;margin:0 0 16px;">📄 New Invoices Today (${todayInvoices.length})</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#eff6ff;">
            <th style="text-align:left;padding:8px 12px;font-weight:600;color:#6b7280;">Client</th>
            <th style="text-align:left;padding:8px 12px;font-weight:600;color:#6b7280;">Invoice #</th>
            <th style="text-align:left;padding:8px 12px;font-weight:600;color:#6b7280;">Amount</th>
          </tr>
        </thead>
        <tbody>${newInvoiceRows}</tbody>
      </table>
    </div>
    ` : ""}

    <!-- Footer -->
    <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
        This is an automated daily summary from CA Billing System.<br>
        To manage notification settings, log in and go to Settings → Notifications.
      </p>
    </div>
  </div>
</body>
</html>`;
}
