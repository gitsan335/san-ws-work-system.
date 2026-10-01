import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatDate } from "@/lib/business";

export const dynamic = "force-dynamic";

export default async function WorkerDashboard() {
  const session = await getSession();
  if (!session?.workerId) redirect("/login");

  const tasks = await prisma.task.findMany({
    where: {
      workerId: session.workerId,
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
    include: { vcfType: true },
    orderBy: { date: "desc" },
  });

  const completed = await prisma.operation.count({
    where: { workerId: session.workerId },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Hello, {session.name}</h1>
        <p className="text-sm text-slate-500">Your work overview</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="text-xs text-slate-500">Open tasks</div>
          <div className="text-2xl font-semibold">{tasks.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">Completed</div>
          <div className="text-2xl font-semibold">{completed}</div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">My Tasks</h2>
          <Link href="/worker/tasks" className="text-sm text-brand">
            View all
          </Link>
        </div>
        {tasks.length === 0 ? (
          <p className="text-sm text-slate-500">No open tasks</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/worker/tasks?open=${t.id}`}
                  className="block p-3 rounded border border-slate-200 hover:bg-slate-50"
                >
                  <div className="font-mono font-medium">{t.groupId}</div>
                  <div className="text-xs text-slate-500">
                    {formatDate(t.date)} · {t.vcfType.name} ·{" "}
                    {t.vcfType.expectedContacts} contacts · {t.status}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
