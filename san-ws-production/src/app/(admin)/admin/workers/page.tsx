import { prisma } from "@/lib/db";
import { requireAuth, hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function createWorker(formData: FormData) {
  "use server";
  await requireAuth("ADMIN");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!name || !email || password.length < 8) {
    return;
  }
  const hash = await hashPassword(password);
  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hash,
      role: "WORKER",
      active: true,
      worker: { create: { status: "ACTIVE" } },
    },
  });
  revalidatePath("/admin/workers");
}

async function toggleWorker(formData: FormData) {
  "use server";
  await requireAuth("ADMIN");
  const id = String(formData.get("id") || "");
  const worker = await prisma.worker.findUnique({ where: { id } });
  if (!worker) return;
  const next = worker.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  await prisma.worker.update({ where: { id }, data: { status: next } });
  if (next === "INACTIVE") {
    await prisma.user.update({
      where: { id: worker.userId },
      data: { active: false },
    });
  } else {
    await prisma.user.update({
      where: { id: worker.userId },
      data: { active: true },
    });
  }
  revalidatePath("/admin/workers");
}

export default async function WorkersPage() {
  const workers = await prisma.worker.findMany({
    include: { user: true, operations: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Workers</h1>
        <p className="text-sm text-slate-500">Manage worker accounts</p>
      </div>

      <div className="card p-4">
        <h2 className="font-semibold mb-3">Add Worker</h2>
        <form action={createWorker} className="grid sm:grid-cols-4 gap-3">
          <input name="name" className="input" placeholder="Full name" required />
          <input name="email" type="email" className="input" placeholder="Email" required />
          <input
            name="password"
            type="password"
            className="input"
            placeholder="Password (min 8)"
            required
            minLength={8}
          />
          <button type="submit" className="btn-primary">
            Create
          </button>
        </form>
      </div>

      <div className="card p-4">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Operations</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((w) => (
                <tr key={w.id}>
                  <td>{w.user.name}</td>
                  <td>{w.user.email}</td>
                  <td>
                    <span
                      className={
                        w.status === "ACTIVE" ? "badge-valid" : "badge-invalid"
                      }
                    >
                      {w.status}
                    </span>
                  </td>
                  <td>{w.operations.length}</td>
                  <td>
                    <form action={toggleWorker}>
                      <input type="hidden" name="id" value={w.id} />
                      <button type="submit" className="btn-secondary text-xs">
                        {w.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
