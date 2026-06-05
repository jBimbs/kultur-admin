"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

type AdminRow = {
  id?: string | number;
  city?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  suffix?: string | null;
};

export default function ViewAdminPage() {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [pageSize] = useState(12);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  useEffect(() => {
    let mounted = true;

    async function loadAdmins() {
      setLoading(true);
      setError(null);

      const rangeStart = page * pageSize;
      const rangeEnd = rangeStart + pageSize - 1;

      let query = supabase
        .from("admin")
        .select("id, city, first_name, last_name, suffix")
        .order("id", { ascending: true })
        .range(rangeStart, rangeEnd);

      if (debouncedSearch.trim()) {
        const pattern = `%${debouncedSearch.trim()}%`;
        query = query.or(
          `city.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern},suffix.ilike.${pattern}`
        );
      }

      const { data, error: queryError } = await query;
      if (!mounted) return;

      if (queryError) {
        setAdmins([]);
        setError(queryError.message);
      } else {
        setAdmins((data as AdminRow[]) ?? []);
      }

      // total count
      let countQuery = supabase.from("admin").select("id", { count: "exact", head: true });
      if (debouncedSearch.trim()) {
        const pattern = `%${debouncedSearch.trim()}%`;
        countQuery = countQuery.or(
          `city.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern},suffix.ilike.${pattern}`
        );
      }

      const { count, error: countError } = await countQuery;
      if (!mounted) return;

      if (countError) setTotalCount(null);
      else setTotalCount(count ?? 0);

      setLoading(false);
    }

    loadAdmins();
    return () => {
      mounted = false;
    };
  }, [page, debouncedSearch, pageSize]);

  const totalPages = useMemo(() => {
    if (totalCount === null) return 0;
    return Math.max(1, Math.ceil(totalCount / pageSize));
  }, [totalCount, pageSize]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Admin Management
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Admins</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Display and manage administrators stored in the Supabase <span className="font-medium">admin</span> table.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="outline">Back to dashboard</Button>
          </Link>
          <Link href="/admin/add-admin">
            <Button>Add admin</Button>
          </Link>
        </div>
      </div>

      <div className="mt-2">
        <Input
          placeholder="Search by city, first name, last name, or suffix"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
        />
      </div>

      <div>
        {loading ? (
          <div className="text-center py-8">Loading admins…</div>
        ) : error ? (
          <div className="text-center py-8 text-rose-600">{error}</div>
        ) : admins.length === 0 ? (
          <div className="text-center py-8 text-slate-600">No admins found.</div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {admins.map((a) => {
                const fullName = [a.first_name, a.last_name].filter(Boolean).join(" ");
                return (
                  <Card
                    key={a.id ?? `${a.first_name ?? ""}-${a.last_name ?? ""}-${a.city ?? ""}`}
                    className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {fullName || "Unnamed admin"}
                        {a.suffix ? <span className="ml-2 text-sm text-slate-500">{a.suffix}</span> : null}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm">
                        <span className="text-slate-500">City:</span>{" "}
                        <span className="font-medium">{a.city || "Unknown"}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-500">First name:</span>{" "}
                        <span className="font-medium">{a.first_name || "—"}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-500">Last name:</span>{" "}
                        <span className="font-medium">{a.last_name || "—"}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-500">Suffix:</span>{" "}
                        <span className="font-medium">{a.suffix || "—"}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-8 grid grid-cols-3 items-center gap-4">
              <div className="text-sm text-slate-600">
                Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalCount ?? 0)} of {totalCount ?? "?"}
              </div>
              <div className="flex items-center gap-2 justify-center">
                <Button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page <= 0} variant="outline">
                  Previous
                </Button>
                <div className="text-sm text-slate-600">
                  Page {page + 1} of {totalPages || 1}
                </div>
                <Button
                  onClick={() => setPage((p) => Math.min((totalPages || 1) - 1, p + 1))}
                  disabled={totalCount === null || page >= (totalPages - 1)}
                >
                  Next
                </Button>
              </div>
              <div />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

