"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/tasks", label: "Tasks" },
  { href: "/admin/operations", label: "Operations" },
  { href: "/admin/workers", label: "Workers" },
  { href: "/admin/sellers", label: "Sellers" },
  { href: "/admin/expenses", label: "Expenses" },
  { href: "/admin/performance", label: "Performance" },
  { href: "/admin/alerts", label: "Alerts" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/export", label: "Export" },
];

const workerLinks = [
  { href: "/worker/dashboard", label: "Dashboard" },
  { href: "/worker/tasks", label: "My Tasks" },
  { href: "/worker/results", label: "My Results" },
];

export function Nav({ role, name }: { role: string; name: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const links = role === "ADMIN" ? adminLinks : workerLinks;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="bg-brand text-white">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="font-semibold tracking-tight">SAN WS WORK SYSTEM</div>
        <div className="text-sm text-white/80">{name}</div>
      </div>
      <nav className="bg-brand-light">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap gap-1 py-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 text-sm rounded ${
                pathname.startsWith(l.href)
                  ? "bg-white text-brand font-medium"
                  : "text-white/90 hover:bg-white/10"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={logout}
            className="ml-auto px-3 py-1.5 text-sm text-white/90 hover:bg-white/10 rounded"
          >
            Logout
          </button>
        </div>
      </nav>
    </header>
  );
}
