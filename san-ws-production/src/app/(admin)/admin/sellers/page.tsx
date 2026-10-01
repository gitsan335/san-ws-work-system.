import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function addSeller(formData: FormData) {
  "use server";
  await requireAuth("ADMIN");
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  await prisma.seller.create({ data: { name, status: "ACTIVE" } });
  revalidatePath("/admin/sellers");
}

async function toggleSeller(formData: FormData) {
  "use server";
  await requireAuth("ADMIN");
  const id = String(formData.get("id") || "");
  const s = await prisma.seller.findUnique({ where: { id } });
  if (!s) return;
  await prisma.seller.update({
    where: { id },
    data: { status: s.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" },
  });
  revalidatePath("/admin/sellers");
}

export default async function SellersPage() {
  const sellers = await prisma.seller.findMany({
    include: { operations: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sellers</h1>
      <div className="card p-4">
        <form action={addSeller} className="flex gap-2 max-w-md">
          <input name="name" className="input" placeholder="Seller name" required />
          <button type="submit" className="btn-primary">
            Add
          </button>
        </form>
      </div>
      <div className="card p-4">
        <table className="data">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Groups</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sellers.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>
                  <span
                    className={
                      s.status === "ACTIVE" ? "badge-valid" : "badge-invalid"
                    }
                  >
                    {s.status}
                  </span>
                </td>
                <td>{s.operations.length}</td>
                <td>
                  <form action={toggleSeller}>
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit" className="btn-secondary text-xs">
                      Toggle
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
