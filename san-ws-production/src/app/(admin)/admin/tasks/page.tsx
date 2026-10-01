import { prisma } from "@/lib/db";
import { createTask } from "@/lib/actions/operations";
import { formatDate } from "@/lib/business";
import { TaskForm } from "./TaskForm";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const [tasks, workers, vcfs] = await Promise.all([
    prisma.task.findMany({
      orderBy: { createdAt: "desc" },
      include: { worker: { include: { user: true } }, vcfType: true },
      take: 100,
    }),
    prisma.worker.findMany({
      where: { status: "ACTIVE" },
      include: { user: true },
    }),
    prisma.vcfType.findMany({ where: { status: "ACTIVE" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tasks</h1>
        <p className="text-sm text-slate-500">Assign work to workers</p>
      </div>

      <div className="card p-4">
        <h2 className="font-semibold mb-3">Create Task</h2>
        <TaskForm
          workers={workers.map((w) => ({ id: w.id, name: w.user.name }))}
          vcfs={vcfs.map((v) => ({
            id: v.id,
            name: v.name,
            expected: v.expectedContacts,
          }))}
        />
      </div>

      <div className="card p-4">
        <h2 className="font-semibold mb-3">Recent Tasks</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Date</th>
                <th>Group ID</th>
                <th>Worker</th>
                <th>VCF</th>
                <th>Expected</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td>{formatDate(t.date)}</td>
                  <td className="font-mono">{t.groupId}</td>
                  <td>{t.worker.user.name}</td>
                  <td>{t.vcfType.name}</td>
                  <td>{t.vcfType.expectedContacts}</td>
                  <td>
                    <span
                      className={
                        t.status === "COMPLETED"
                          ? "badge-done"
                          : t.status === "PENDING"
                          ? "badge-pending"
                          : "badge"
                      }
                    >
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
