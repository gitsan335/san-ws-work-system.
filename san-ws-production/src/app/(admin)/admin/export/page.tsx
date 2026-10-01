import { prisma } from "@/lib/db";
import { formatDate, formatKes, formatPercent } from "@/lib/business";

export const dynamic = "force-dynamic";

export default async function ExportPage() {
  const ops = await prisma.operation.findMany({
    include: {
      worker: { include: { user: true } },
      seller: true,
      vcfType: true,
    },
    orderBy: { date: "desc" },
  });

  const csv = [
    "Date,Worker,Seller,GroupID,Status,VCF,Members,SuccessRate,WorkAmount",
    ...ops.map(
      (o) =>
        `${formatDate(o.date)},${o.worker.user.name},${o.seller.name},${o.groupId},${o.status},${o.vcfType.name},${o.membersAdded},${formatPercent(o.successRate)},${o.workAmount}`
    ),
  ].join("\n");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Export</h1>
      <p className="text-sm text-slate-500">
        Copy the CSV below or select all and paste into Excel.
      </p>
      <div className="card p-4">
        <pre className="text-xs overflow-x-auto whitespace-pre-wrap bg-slate-50 p-3 rounded border">
          {csv}
        </pre>
      </div>
    </div>
  );
}
