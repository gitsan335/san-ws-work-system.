"use client";

import { useState } from "react";
import { createTask } from "@/lib/actions/operations";

export function TaskForm({
  workers,
  vcfs,
}: {
  workers: { id: string; name: string }[];
  vcfs: { id: string; name: string; expected: number }[];
}) {
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function action(formData: FormData) {
    setError("");
    setOk("");
    const res = await createTask(formData);
    if (res?.error) setError(res.error);
    else setOk("Task created");
  }

  return (
    <form action={action} className="grid sm:grid-cols-2 gap-3">
      <div>
        <label className="label">Worker</label>
        <select name="workerId" className="input" required>
          <option value="">Select worker</option>
          {workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Group ID</label>
        <input name="groupId" className="input" required placeholder="e.g. G010" />
      </div>
      <div>
        <label className="label">VCF Type</label>
        <select name="vcfTypeId" className="input" required>
          <option value="">Select VCF</option>
          {vcfs.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} ({v.expected} contacts)
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Date</label>
        <input name="date" type="date" className="input" required />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Notes</label>
        <input name="notes" className="input" placeholder="Optional" />
      </div>
      {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
      {ok && <p className="sm:col-span-2 text-sm text-green-600">{ok}</p>}
      <div className="sm:col-span-2">
        <button type="submit" className="btn-primary">
          Assign Task
        </button>
      </div>
    </form>
  );
}
