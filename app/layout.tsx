import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mittal Gupta & Associates — CA Billing Solution",
  description: "Robust accounts management and GST-compliant billing for CA firms",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="h-full bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
