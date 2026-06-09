import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { TasksClient } from "./tasks-client";

export default async function TasksPage() {
  const session = await getSession();
  const firmId = (session!.user as any).firmId;

  const [tasks, clients, services, users] = await Promise.all([
    db.task.findMany({
      where: { firmId },
      include: { client: true, service: true, assignedTo: true },
      orderBy: [{ createdAt: "desc" }],
    }),
    db.client.findMany({ where: { firmId, isActive: true }, orderBy: { name: "asc" } }),
    db.service.findMany({ where: { firmId, isActive: true }, orderBy: { name: "asc" } }),
    db.user.findMany({ where: { firmId, isActive: true }, orderBy: { name: "asc" } }),
  ]);

  const counts = {
    pending: tasks.filter(t => t.status === "PENDING").length,
    inProgress: tasks.filter(t => t.status === "IN_PROGRESS").length,
    completed: tasks.filter(t => t.status === "COMPLETED").length,
    invoiced: tasks.filter(t => t.status === "INVOICED").length,
  };

  const completedValue = tasks
    .filter(t => t.status === "COMPLETED" && t.amount)
    .reduce((s, t) => s + (t.amount ?? 0), 0);

  return (
    <div className="min-h-full bg-gray-50/50">
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Tasks</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Define work for clients — then raise invoices from completed tasks
            </p>
          </div>
          <TasksClient
            clients={clients as any}
            services={services as any}
            users={users as any}
            tasks={tasks as any}
            mode="add-button"
          />
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-5 p-8 pb-0">
        {[
          { label: "Pending", count: counts.pending, color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb" },
          { label: "In Progress", count: counts.inProgress, color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
          { label: "Completed", count: counts.completed, sub: formatCurrency(completedValue) + " ready to bill", color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
          { label: "Invoiced", count: counts.invoiced, color: "#7c3aed", bg: "#faf5ff", border: "#ddd6fe" },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl border shadow-sm p-5"
               style={{ borderColor: c.border }}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{c.label}</p>
            <p className="text-3xl font-bold mt-1" style={{ color: c.color }}>{c.count}</p>
            {c.sub && <p className="text-xs mt-1 font-medium" style={{ color: c.color }}>{c.sub}</p>}
          </div>
        ))}
      </div>

      <div className="p-8">
        <TasksClient
          clients={clients as any}
          services={services as any}
          users={users as any}
          tasks={tasks as any}
          mode="table"
        />
      </div>
    </div>
  );
}
