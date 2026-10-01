import { getDashboardData } from "@/lib/dashboard";
import { StatCard } from "@/components/StatCard";
import { formatKes, formatPercent } from "@/lib/business";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const d = await getDashboardData();

  function PeriodBlock({
    title,
    data,
  }: {
    title: string;
    data: {
      groups: number;
      members: number;
      avgSuccess: number | null;
      valid: number;
      invalid: number;
      workAmount: number;
      expenseTotal: number;
    };
  }) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-slate-600 mb-2">{title}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatCard label="Groups" value={data.groups} />
          <StatCard label="Members" value={data.members} />
          <StatCard label="Avg Success" value={formatPercent(data.avgSuccess)} />
          <StatCard label="Valid" value={data.valid} />
          <StatCard label="Invalid" value={data.invalid} />
          <StatCard label="Work Amount" value={formatKes(data.workAmount)} />
          <StatCard label="Expenses" value={formatKes(data.expenseTotal)} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Live results from operations and expenses · DEMO DATA — DELETE BEFORE PRODUCTION
        </p>
      </div>

      <PeriodBlock title="Today" data={d.today} />
      <PeriodBlock title="This Week (Mon–Sun)" data={d.week} />
      <PeriodBlock title="This Month" data={d.month} />

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-4">
          <h3 className="font-semibold mb-3">Group Performance</h3>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-slate-500">Total Groups</dt>
            <dd className="font-medium">{d.groupPerf.totalGroups}</dd>
            <dt className="text-slate-500">Valid</dt>
            <dd className="font-medium">{d.groupPerf.validGroups}</dd>
            <dt className="text-slate-500">Invalid</dt>
            <dd className="font-medium">{d.groupPerf.invalidGroups}</dd>
            <dt className="text-slate-500">Validity Rate</dt>
            <dd className="font-medium">{formatPercent(d.groupPerf.validityRate)}</dd>
            <dt className="text-slate-500">Avg Members</dt>
            <dd className="font-medium">{d.groupPerf.avgMembers.toFixed(1)}</dd>
            <dt className="text-slate-500">Avg Success</dt>
            <dd className="font-medium">{formatPercent(d.groupPerf.avgSuccessAll)}</dd>
            <dt className="text-slate-500">Meeting Target</dt>
            <dd className="font-medium">{d.groupPerf.meetTarget}</dd>
            <dt className="text-slate-500">Below Target</dt>
            <dd className="font-medium">{d.groupPerf.belowTarget}</dd>
          </dl>
        </div>

        <div className="card p-4">
          <h3 className="font-semibold mb-3">Totals</h3>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-slate-500">Total Work Amount</dt>
            <dd className="font-medium">{formatKes(d.totalWork)}</dd>
            <dt className="text-slate-500">Total Expenses</dt>
            <dd className="font-medium">{formatKes(d.totalExpenses)}</dd>
            <dt className="text-slate-500">Total Members</dt>
            <dd className="font-medium">{d.totalMembers}</dd>
          </dl>
          <h4 className="font-semibold mt-4 mb-2 text-sm">Expenses by Type</h4>
          <dl className="grid grid-cols-2 gap-1 text-sm">
            {Object.entries(d.expenseByType).map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-slate-500">{k}</dt>
                <dd>{formatKes(v)}</dd>
              </div>
            ))}
            {Object.keys(d.expenseByType).length === 0 && (
              <dd className="text-slate-400 col-span-2">No expenses</dd>
            )}
          </dl>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold mb-3">Worker Performance</h3>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Worker</th>
                <th>Groups</th>
                <th>Members</th>
                <th>Avg Success</th>
                <th>Valid</th>
                <th>Invalid</th>
              </tr>
            </thead>
            <tbody>
              {d.workerPerf.map((w) => (
                <tr key={w.name}>
                  <td>{w.name}</td>
                  <td>{w.groups}</td>
                  <td>{w.members}</td>
                  <td>{formatPercent(w.avgSuccess)}</td>
                  <td>{w.valid}</td>
                  <td>{w.invalid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold mb-3">Seller Performance</h3>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Seller</th>
                <th>Groups</th>
                <th>Valid</th>
                <th>Invalid</th>
                <th>Validity %</th>
                <th>Avg Members</th>
                <th>Avg Success</th>
              </tr>
            </thead>
            <tbody>
              {d.sellerPerf.map((s) => (
                <tr key={s.name}>
                  <td>{s.name}</td>
                  <td>{s.groups}</td>
                  <td>{s.valid}</td>
                  <td>{s.invalid}</td>
                  <td>{formatPercent(s.validity)}</td>
                  <td>{s.avgMembers != null ? s.avgMembers.toFixed(1) : "—"}</td>
                  <td>{formatPercent(s.avgSuccess)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold mb-3">VCF Performance</h3>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>VCF Type</th>
                <th>Expected</th>
                <th>Groups</th>
                <th>Members</th>
                <th>Avg Success</th>
              </tr>
            </thead>
            <tbody>
              {d.vcfPerf.map((v) => (
                <tr key={v.name}>
                  <td>{v.name}</td>
                  <td>{v.expected}</td>
                  <td>{v.groups}</td>
                  <td>{v.members}</td>
                  <td>{formatPercent(v.avgSuccess)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold mb-3">Alerts</h3>
        <ul className="space-y-1">
          {d.alerts.map((a) => (
            <li
              key={a}
              className={
                a === "NO CURRENT ALERTS"
                  ? "text-green-700 text-sm"
                  : "text-red-700 text-sm font-medium"
              }
            >
              {a}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
