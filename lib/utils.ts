import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy");
}

export function getCurrentFinancialYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month >= 4) return `${year}-${(year + 1).toString().slice(-2)}`;
  return `${year - 1}-${year.toString().slice(-2)}`;
}

export function generateInvoiceNumber(
  prefix: string,
  counter: number,
  fy: string
): string {
  return `${prefix}/${fy}/${String(counter).padStart(4, "0")}`;
}

export const INDIAN_STATES: { name: string; code: string }[] = [
  { name: "Andhra Pradesh", code: "37" },
  { name: "Arunachal Pradesh", code: "12" },
  { name: "Assam", code: "18" },
  { name: "Bihar", code: "10" },
  { name: "Chhattisgarh", code: "22" },
  { name: "Goa", code: "30" },
  { name: "Gujarat", code: "24" },
  { name: "Haryana", code: "06" },
  { name: "Himachal Pradesh", code: "02" },
  { name: "Jharkhand", code: "20" },
  { name: "Karnataka", code: "29" },
  { name: "Kerala", code: "32" },
  { name: "Madhya Pradesh", code: "23" },
  { name: "Maharashtra", code: "27" },
  { name: "Manipur", code: "14" },
  { name: "Meghalaya", code: "17" },
  { name: "Mizoram", code: "15" },
  { name: "Nagaland", code: "13" },
  { name: "Odisha", code: "21" },
  { name: "Punjab", code: "03" },
  { name: "Rajasthan", code: "08" },
  { name: "Sikkim", code: "11" },
  { name: "Tamil Nadu", code: "33" },
  { name: "Telangana", code: "36" },
  { name: "Tripura", code: "16" },
  { name: "Uttar Pradesh", code: "09" },
  { name: "Uttarakhand", code: "05" },
  { name: "West Bengal", code: "19" },
  { name: "Delhi", code: "07" },
  { name: "Jammu & Kashmir", code: "01" },
  { name: "Ladakh", code: "38" },
  { name: "Puducherry", code: "34" },
];

export const CA_SERVICES = [
  { name: "Income Tax Return Filing (ITR-1)", sacCode: "998231", defaultAmount: 2000 },
  { name: "Income Tax Return Filing (ITR-2/3)", sacCode: "998231", defaultAmount: 4000 },
  { name: "Income Tax Return Filing (ITR-4)", sacCode: "998231", defaultAmount: 3000 },
  { name: "GST Registration", sacCode: "998233", defaultAmount: 2500 },
  { name: "GST Return Filing (GSTR-1)", sacCode: "998233", defaultAmount: 1500 },
  { name: "GST Return Filing (GSTR-3B)", sacCode: "998233", defaultAmount: 1500 },
  { name: "GST Annual Return (GSTR-9)", sacCode: "998233", defaultAmount: 5000 },
  { name: "Tax Audit (Form 3CA/3CB)", sacCode: "998232", defaultAmount: 15000 },
  { name: "Statutory Audit", sacCode: "998232", defaultAmount: 25000 },
  { name: "Internal Audit", sacCode: "998232", defaultAmount: 20000 },
  { name: "Company Incorporation", sacCode: "998214", defaultAmount: 10000 },
  { name: "ROC Filing (Annual Return)", sacCode: "998214", defaultAmount: 5000 },
  { name: "LLP Incorporation", sacCode: "998214", defaultAmount: 8000 },
  { name: "Bookkeeping & Accounting", sacCode: "998231", defaultAmount: 3000 },
  { name: "Payroll Processing", sacCode: "998231", defaultAmount: 2000 },
  { name: "TDS Return Filing", sacCode: "998233", defaultAmount: 2000 },
  { name: "MSME Registration", sacCode: "998214", defaultAmount: 1500 },
  { name: "PF/ESI Compliance", sacCode: "998233", defaultAmount: 2500 },
  { name: "Financial Statement Preparation", sacCode: "998231", defaultAmount: 5000 },
  { name: "Management Consultancy", sacCode: "998399", defaultAmount: 10000 },
];

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-100 text-blue-700",
  PARTIALLY_PAID: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};
