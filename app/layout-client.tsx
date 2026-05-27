"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SidebarMenu } from "@/components/sidebar-menu";

export default function LayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideSidebar = pathname === "/" || pathname === "/register";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className={`flex min-h-screen ${hideSidebar ? "flex-col" : "flex-col lg:flex-row"}`}>
        {!hideSidebar && <SidebarMenu />}
        <main className="flex-1 p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
