import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/business";
import { SubmitForm } from "./SubmitForm";

export const dynamic = "force-dynamic";

export default async function WorkerTasksPage({
  searchParams,
}: {
  searchParams: { open?: string };
}) {
  const session = await getSession();
  if (!session?.workerId) redirect("/login");

  const [tasks, sellers] = await Promise.all([
    prisma.task.findMany({
      where: {
        workerId: session.workerId,
        status: { in: ["PENDING", "IN_PROGRESS", "COMPLETED"] },
      },
      include: { vcfType: true, operation: true },
      orderBy: { date: "desc" },
    }),
    prisma.seller.findMany({ where: { status: "ACTIVE" } }),
  ]);

  const openId = searchParams.open;
  const openTask = openId ? tasks.find((t) => t.id === openId) : null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">My Tasks</h1>

      {openTask && openTask.status !== "COMPLETED" && (
        <div className="card p-4 border-brand border-2">
          <h2 className="font-semibold mb-1">Submit result</h2>
          <p className="text-sm text-slate-600 mb-3">
            Group <span className="font-mono font-medium">{openTask.groupId}</span>
            {" · "}
            {openTask.vcfType.name} ({openTask.vcfType.expectedContacts} expected)
            {" · "}
            {formatDate(openTask.date)}
          </p>
          <SubmitForm
            taskId={openTask.id}
            sellers={sellers.map((s) => ({ id: s.id, name: s.name }))}
          />
        </div>
      )}

      <div className="space-y-2">
        {tasks.map((t) => (
          <a
            key={t.id}
            href={
              t.status === "COMPLETED"
                ? "/worker/results"
                : `/worker/tasks?open=${t.id}`
            }
            className="card p-3 block hover:bg-slate-50"
          >
            <div className="flex justify-between">
              <span className="font-mono font-medium">{t.groupId}</span>
              <span
                className={
                  t.status === "COMPLETED" ? "badge-done" : "badge-pending"
                }
              >
                {t.status}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {formatDate(t.date)} · {t.vcfType.name} ·{" "}
              {t.vcfType.expectedContacts} contacts
              {t.operation && ` · ${t.operation.membersAdded} members`}
            </div>
          </a>
        ))}
        {tasks.length === 0 && (
          <p className="text-sm text-slate-500">No tasks assigned yet</p>
        )}
      </div>
    </div>
  );
}
