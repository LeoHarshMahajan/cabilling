import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <Providers>
      <div className="flex h-full">
        <Sidebar user={session.user as any} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </Providers>
  );
}
