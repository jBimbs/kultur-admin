"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type NavItem = {
  label: string;
  href: string;
  iconSrc: string;
};


type AdminSession = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  city?: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", iconSrc: "/dashboard.png" },
  {
    label: "Historical Sites",
    href: "/historical-sites/view-sites",
    iconSrc: "/sites.png",
  },
  { label: "Festivals", href: "/festivals/view-festivals", iconSrc: "/festivals.png" },
  { label: "Artifacts", href: "/artifacts/view-artifacts", iconSrc: "/artifacts.png" },
  {
    label: "Local Cuisines",
    href: "/local-cuisines/view-local-cuisines",
    iconSrc: "/cuisines.png",
  },
  { label: "Admin", href: "/admin/view-admin", iconSrc: "/admin.png" },
  { label: "Profile", href: "/profile/view-profile", iconSrc: "/profile.png" },
];


export function SidebarMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminSession | null>(null);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const res = await fetch("/api/session");
        if (res.ok) {
          const data = await res.json();
          setAdmin(data);
        }
      } catch (error) {
        console.error("Failed to fetch admin session:", error);
      }
    };
    fetchAdmin();
  }, []);

  // Hide the sidebar on auth pages
  if (pathname === "/" || pathname === "/register") {
    return null;
  }

  return (
    <aside className="border-r border-slate-200 bg-[#7BB662] p-6 dark:border-slate-800 lg:sticky lg:top-0 lg:h-screen lg:w-80 lg:flex-shrink-0">
      <div className="flex h-full flex-col justify-between">
        <div className="space-y-8">
        <div>
          <div className="mb-6">
            <img src="/Logo.png" alt="KulturAR Logo" className="h-20 w-auto" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
            Admin
          </p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {admin ? `${admin.first_name} ${admin.last_name}` : "Loading..."}
          </p>
          <p className="mt-1 text-sm text-white">
            {admin ? `${admin.city}` : "Loading..."} City Administrator
          </p>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex w-full items-center justify-between rounded-3xl px-4 py-3 text-left text-lg font-medium transition ${
                item.href === pathname
                  ? "text-white bg-white/40 text-slate-900 shadow-sm"
                  : "text-white hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={item.iconSrc}
                  alt=""
                  className="h-8 w-8"
                />
                <span>{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>
        </div>

        <div className="mt-auto">
          <button
            onClick={async () => {
              await fetch("/api/logout", { method: "POST" });
              router.push("/");
            }}
            className="flex w-full items-center gap-3 rounded-3xl px-4 py-3 text-left text-lg font-medium text-white transition hover:bg-white/10 focus:outline-none"
          >
            <img src="/log-out.png" alt="" className="h-8 w-8" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
