import { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "View Profile",
};

type AdminRow = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  suffix?: string | null;
  city?: string | null;
  password?: string | null;
};

export default async function ViewProfilePage() {
  // Use the existing API route that already reads the `admin_session` cookie
  // and returns the logged-in admin.
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/session`, {
    // keep server-side
    cache: "no-store",
  });

  if (!res.ok) {
    notFound();
  }

  const admin = (await res.json()) as AdminRow;

  return (
    <div className="flex flex-col gap-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Profile
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          View profile
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
          Details of the currently logged-in admin.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Name
            </div>
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {admin.first_name} {admin.last_name}
              {admin.suffix ? ` ${admin.suffix}` : ""}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              City
            </div>
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {admin.city ?? "-"}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Email
            </div>
            <div className="break-all text-lg font-semibold text-slate-900 dark:text-slate-100">
              {admin.email}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Password
            </div>
            <div className="break-all text-lg font-semibold text-slate-900 dark:text-slate-100">
              {admin.password ?? "-"}
            </div>
          </div>
        </div>

        {/* Requirement: show suffix only if not null */}
      </section>
    </div>
  );
}

