import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const session = await getSession();
  const firmId = (session!.user as any).firmId;

  const [firm, users] = await Promise.all([
    db.firm.findUnique({ where: { id: firmId } }),
    db.user.findMany({ where: { firmId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>
      <SettingsClient firm={firm as any} users={users as any} session={session as any} />
    </div>
  );
}
