"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";

type Site = {
  id?: number;
  Category?: string | null;
  image_url?: string | null;
  name?: string | null;
  description?: string | null;
  city?: string | null;
};

export default function HistoricalSitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const pageSize = 5;
  const [totalCount, setTotalCount] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadSites() {
      setLoading(true);

      const start = page * pageSize;
      const end = start + pageSize - 1;

      let query = supabase.from("sites").select("id, Category, image_url, name, description, city");

      if (debouncedSearch.trim()) {
        const pattern = `%${debouncedSearch.trim()}%`;
        // search across name, city, Category
        query = query.or(`name.ilike.${pattern},city.ilike.${pattern},Category.ilike.${pattern}`);
      }

      const { data, error } = await query.range(start, end);

      if (!mounted) return;

      if (error) {
        setError(error.message);
        setSites([]);
      } else {
        setSites((data as Site[]) || []);
        setError(null);
      }

      // fetch total count using head query
      let countQuery = supabase.from("sites").select("id", { head: true, count: "exact" });
      if (debouncedSearch.trim()) {
        const pattern = `%${debouncedSearch.trim()}%`;
        countQuery = countQuery.or(`name.ilike.${pattern},city.ilike.${pattern},Category.ilike.${pattern}`);
      }

      const { count, error: countError } = await countQuery;

      if (mounted) {
        if (countError) setTotalCount(null);
        else setTotalCount(count ?? 0);
      }

      setLoading(false);
    }

    loadSites();

    return () => {
      mounted = false;
    };
  }, [page, debouncedSearch]);

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Content Management
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Historical Sites
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            View and maintain the list of sites, monuments, and locations that are important to local heritage.
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">Back to dashboard</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/historical-sites/add-site">
          <Button className="w-full py-2 text-sm" variant="outline">Add Site</Button>
        </Link>
        <Link href="/historical-sites/view-sites">
          <Button className="w-full py-2 text-sm">
            View Sites
          </Button>
        </Link>
        <Link href="/historical-sites/edit-sites">
          <Button className="w-full py-2 text-sm" variant="outline">
            Edit Sites
          </Button>
        </Link>
      </div>

      <div className="mt-4">
        <Input
          placeholder="Search name, city or category"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        />
      </div>

      <div>
        {loading ? (
          <div className="text-center py-8">Loading sites…</div>
        ) : error ? (
          <div className="text-center py-8 text-rose-600">{error}</div>
        ) : sites.length === 0 ? (
          <div className="text-center py-8 text-slate-600">No sites found.</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>City</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sites.map((s) => (
                  <TableRow key={s.id || s.name}>
                    <TableCell>
                      {s.image_url ? (
                        <img
                          src={s.image_url}
                          alt={s.name || "site image"}
                          className="h-16 w-32 rounded object-cover"
                        />
                      ) : (
                        <div className="h-16 w-32 rounded bg-slate-100 dark:bg-slate-800" />
                      )}
                    </TableCell>
                    <TableCell>{s.Category}</TableCell>
                    <TableCell className="max-w-xs truncate">{s.name}</TableCell>
                    <TableCell className="max-w-2xl truncate">{s.description}</TableCell>
                    <TableCell>{s.city}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4 grid grid-cols-3 items-center">
              <div className="text-sm text-slate-600">
                Showing {(page * pageSize) + 1} - {Math.min((page + 1) * pageSize, totalCount ?? 0)} of {totalCount ?? "?"}
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
