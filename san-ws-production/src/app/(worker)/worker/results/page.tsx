import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, formatKes, formatPercent } from "@/lib/business";

export const dynamic = "force-dynamic";

export default async function WorkerResultsPage() {
  const session = await getSession();
  if (!session?.workerId) redirect("/login");

  const ops = await prisma.operation.findMany({
    where: { workerId: session.workerId },
    orderBy: { date: "desc" },
    include: { vcfType: true, seller: true },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">My Results</h1>
      {ops.length === 0 ? (
        <p className="text-sm text-slate-500">No completed work yet</p>
      ) : (
        <div className="space-y-2">
          {ops.map((o) => (
            <div key={o.id} className="card p-3">
              <div className="flex justify-between">
                <span className="font-mono font-medium">{o.groupId}</span>
                <span
                  className={
                    o.status === "VALID" ? "badge-valid" : "badge-invalid"
                  }
                >
                  {o.status}
                </span>
              </div>
              <div className="text-sm text-slate-600 mt-1">
                {formatDate(o.date)} · {o.vcfType.name} · {o.membersAdded} members ·{" "}
                {formatPercent(o.successRate)} · {formatKes(o.workAmount)}
              </div>
              {o.notes && (
                <div className="text-xs text-amber-700 mt-1">{o.notes}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
