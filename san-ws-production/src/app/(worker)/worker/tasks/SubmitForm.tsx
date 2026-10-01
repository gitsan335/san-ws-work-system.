"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitTaskResult } from "@/lib/actions/operations";

export function SubmitForm({
  taskId,
  sellers,
}: {
  taskId: string;
  sellers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function action(fd: FormData) {
    setLoading(true);
    setError("");
    const res = await submitTaskResult(fd);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
      return;
    }
    router.push("/worker/results");
    router.refresh();
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="taskId" value={taskId} />
      <div>
        <label className="label">Members Added</label>
        <input
          name="membersAdded"
          type="number"
          min="0"
          step="1"
          className="input"
          required
          inputMode="numeric"
        />
      </div>
      <div>
        <label className="label">Status</label>
        <select name="status" className="input" required defaultValue="VALID">
          <option value="VALID">VALID</option>
          <option value="INVALID">INVALID</option>
        </select>
      </div>
      <div>
        <label className="label">Seller</label>
        <select name="sellerId" className="input" required>
          <option value="">Select seller</option>
          {sellers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Group Creation Date (optional)</label>
        <input name="groupCreationDate" type="date" className="input" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Submitting…" : "Submit Result"}
      </button>
    </form>
  );
}
