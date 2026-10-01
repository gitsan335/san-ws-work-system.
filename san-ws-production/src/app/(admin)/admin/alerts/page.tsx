import { getDashboardData } from "@/lib/dashboard";
export const dynamic = "force-dynamic";
export default async function AlertsPage() {
  const d = await getDashboardData();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Alerts</h1>
      <div className="card p-4">
        <ul className="space-y-2">
          {d.alerts.map((a) => (
            <li
              key={a}
              className={
                a === "NO CURRENT ALERTS"
                  ? "text-green-700"
                  : "text-red-700 font-medium"
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
