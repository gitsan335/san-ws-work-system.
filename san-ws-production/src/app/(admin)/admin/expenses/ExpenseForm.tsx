"use client";

import { useState } from "react";
import { createExpense } from "@/lib/actions/operations";

export function ExpenseForm({
  types,
  workers,
}: {
  types: { id: string; name: string }[];
  workers: { id: string; name: string }[];
}) {
  const [msg, setMsg] = useState("");

  async function action(fd: FormData) {
    const res = await createExpense(fd);
    setMsg(res?.error || "Saved");
  }

  return (
    <form action={action} className="grid sm:grid-cols-3 gap-3">
      <div>
        <label className="label">Date</label>
        <input name="date" type="date" className="input" required />
      </div>
      <div>
        <label className="label">Type</label>
        <select name="expenseTypeId" className="input" required>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Amount (KES)</label>
        <input name="amount" type="number" step="0.01" min="0" className="input" required />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Description</label>
        <input name="description" className="input" required />
      </div>
      <div>
        <label className="label">Group ID</label>
        <input name="groupId" className="input" />
      </div>
      <div>
        <label className="label">Worker</label>
        <select name="workerId" className="input">
          <option value="">—</option>
          {workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Reference</label>
        <input name="reference" className="input" />
      </div>
      <div className="flex items-end gap-2">
        <button type="submit" className="btn-primary">
          Add Expense
        </button>
        {msg && <span className="text-sm text-slate-600">{msg}</span>}
      </div>
    </form>
  );
}
