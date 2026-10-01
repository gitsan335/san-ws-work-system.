import { prisma } from "@/lib/db";
import { createExpense } from "@/lib/actions/operations";
import { formatDate, formatKes } from "@/lib/business";
import { ExpenseForm } from "./ExpenseForm";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const [expenses, types, workers] = await Promise.all([
    prisma.expense.findMany({
      orderBy: { date: "desc" },
      include: { expenseType: true, worker: { include: { user: true } } },
      take: 100,
    }),
    prisma.expenseType.findMany({ where: { status: "ACTIVE" } }),
    prisma.worker.findMany({
      where: { status: "ACTIVE" },
      include: { user: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Expenses</h1>
      <div className="card p-4">
        <h2 className="font-semibold mb-3">Add Expense</h2>
        <ExpenseForm
          types={types.map((t) => ({ id: t.id, name: t.name }))}
          workers={workers.map((w) => ({ id: w.id, name: w.user.name }))}
        />
      </div>
      <div className="card p-4">
        <table className="data">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Group</th>
              <th>Worker</th>
              <th>Ref</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id}>
                <td>{formatDate(e.date)}</td>
                <td>{e.expenseType.name}</td>
                <td>{e.description}</td>
                <td>{formatKes(e.amount)}</td>
                <td>{e.groupId || "—"}</td>
                <td>{e.worker?.user.name || "—"}</td>
                <td>{e.reference || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
