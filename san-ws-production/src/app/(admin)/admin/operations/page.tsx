import { prisma } from "@/lib/db";
import { formatDate, formatKes, formatPercent } from "@/lib/business";

export const dynamic = "force-dynamic";

export default async function OperationsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string };
}) {
  const q = searchParams.q?.trim() || "";
  const status = searchParams.status || "";

  const ops = await prisma.operation.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { groupId: { contains: q } },
                { worker: { user: { name: { contains: q } } } },
                { seller: { name: { contains: q } } },
              ],
            }
          : {},
        status ? { status } : {},
      ],
    },
    orderBy: { date: "desc" },
    include: {
      worker: { include: { user: true } },
      seller: true,
      vcfType: true,
    },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Operations</h1>
        <p className="text-sm text-slate-500">
          All operational records · DEMO DATA — DELETE BEFORE PRODUCTION
        </p>
      </div>

      <form className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search Group ID, Worker, Seller"
          className="input max-w-xs"
        />
        <select name="status" defaultValue={status} className="input max-w-[140px]">
          <option value="">All statuses</option>
          <option value="VALID">VALID</option>
          <option value="INVALID">INVALID</option>
        </select>
        <button type="submit" className="btn-secondary">
          Filter
        </button>
      </form>

      <div className="card p-4">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Date</th>
                <th>Worker</th>
                <th>Seller</th>
                <th>Group ID</th>
                <th>Status</th>
                <th>VCF</th>
                <th>Members</th>
                <th>Success</th>
                <th>Work Amount</th>
              </tr>
            </thead>
            <tbody>
              {ops.map((o) => (
                <tr key={o.id}>
                  <td>{formatDate(o.date)}</td>
                  <td>{o.worker.user.name}</td>
                  <td>{o.seller.name}</td>
                  <td className="font-mono">
                    {o.groupId}
                    {o.isDemo && (
                      <span className="ml-1 text-xs text-amber-600">DEMO</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={
                        o.status === "VALID" ? "badge-valid" : "badge-invalid"
                      }
                    >
                      {o.status}
                    </span>
                  </td>
                  <td>{o.vcfType.name}</td>
                  <td>{o.membersAdded}</td>
                  <td>{formatPercent(o.successRate)}</td>
                  <td>{formatKes(o.workAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
