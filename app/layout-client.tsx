"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SidebarMenu } from "@/components/sidebar-menu";

export default function LayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideSidebar = pathname === "/" || pathname === "/register";

  return (
    <div
      className="relative min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      {/* background */}
      <div className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat" />

      {/* readability overlay */}
      <div className="pointer-events-none absolute inset-0 bg-white/70 dark:bg-slate-950/70" />

      <div className={`relative z-10 flex min-h-screen ${hideSidebar ? "flex-col" : "flex-col lg:flex-row"}`}>
        {!hideSidebar && <SidebarMenu />}
        <main className="flex-1 p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
