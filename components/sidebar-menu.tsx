"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type NavItem = {
  label: string;
  href: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Historical Sites", href: "/historical-sites" },
  { label: "Festivals", href: "/festivals" },
  { label: "Artifacts", href: "/artifacts" },
  { label: "Local Cuisines", href: "/local-cuisines" },
];

export function SidebarMenu() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide the sidebar on auth pages
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <aside className="border-r border-slate-200 bg-[linear-gradient(to_bottom,#7BB662,#FFF347)] p-6 dark:border-slate-800 lg:sticky lg:top-0 lg:h-screen lg:w-80 lg:flex-shrink-0">
      <div className="flex h-full flex-col justify-between">
        <div className="space-y-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">
            Admin
          </p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">
            Jayden Brooks
          </p>
          <p className="mt-1 text-sm text-slate-800">
            Site administrator
          </p>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex w-full items-center justify-between rounded-3xl px-4 py-3 text-left text-sm font-medium transition ${
                item.href === pathname
                  ? "bg-white/40 text-slate-900 shadow-sm"
                  : "text-slate-700 hover:bg-white/10"
              }`}
            >
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        </div>

        <div className="mt-auto">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/login");
            }}
            className="flex w-full items-center rounded-3xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-white/10 focus:outline-none"
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
