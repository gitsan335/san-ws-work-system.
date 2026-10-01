import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Nav } from "@/components/Nav";

export default async function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || (session.role !== "WORKER" && session.role !== "ADMIN")) {
    redirect("/login");
  }
  return (
    <div className="min-h-screen">
      <Nav role="WORKER" name={session.name} />
      <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
