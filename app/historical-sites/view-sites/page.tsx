"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
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
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [cities, setCities] = useState<string[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);

  const pageSize = 6;

  const [totalCount, setTotalCount] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadSites() {
      setLoading(true);

      // fetch cities for filter (only once per session)
      if (!citiesLoading && cities.length === 0) {
        setCitiesLoading(true);
        const { data: cityData, error: cityError } = await supabase
          .from("sites")
          .select("city")
          .not("city", "is", null);

        if (!cityError) {
          const unique = Array.from(
            new Set((cityData ?? []).map((r) => r.city).filter(Boolean))
          ) as string[];
          unique.sort((a, b) => a.localeCompare(b));
          setCities(unique);
        }
        setCitiesLoading(false);
      }




      const start = page * pageSize;
      const end = start + pageSize - 1;

      let query = supabase.from("sites").select("id, Category, image_url, name, description, city");

      if (debouncedSearch.trim()) {
        const pattern = `%${debouncedSearch.trim()}%`;
        // search across name, city, Category
        query = query.or(`name.ilike.${pattern},city.ilike.${pattern},Category.ilike.${pattern}`);
      }

      if (cityFilter !== "all") {
        query = query.eq("city", cityFilter);
      }

      if (categoryFilter !== "all") {
        query = query.eq("Category", categoryFilter);
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

      if (cityFilter !== "all") {
        countQuery = countQuery.eq("city", cityFilter);
      }

      if (categoryFilter !== "all") {
        countQuery = countQuery.eq("Category", categoryFilter);
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
  }, [page, debouncedSearch, cityFilter, categoryFilter]);


  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
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
          <Button className="w-full py-1 text-sm" variant="outline">Add Site</Button>
        </Link>
        <Link href="/historical-sites/edit-sites">
          <Button className="w-full py-1 text-sm" variant="outline">
            Edit Sites
          </Button>
        </Link>
      </div>

      <div className="mt-6 py-8">
        <div className="flex flex-col bg-white gap-2 sm:flex-row sm:items-center">
          <Input
            className="w-full sm:max-w-sm"
            placeholder="Search name"
            value={search}

            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />

          <select
            className="h-8 w-full sm:w-56 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            value={cityFilter}
            onChange={(e) => {
              setCityFilter(e.target.value);
              setPage(0);
            }}
            disabled={citiesLoading}
          >
            <option value="all">{citiesLoading ? "Loading cities…" : "All cities"}</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>


          <select
            className="h-8 w-full sm:w-56 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(0);
            }}
          >
            <option value="all">All categories</option>
            <option value="Monument">Monument</option>
            <option value="Church">Church</option>
            <option value="House">House</option>
            <option value="Site">Site</option>
          </select>
        </div>
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sites.map((site) => (
                <Card key={site.id || site.name} className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden hover:shadow-md transition">
                  <div className="w-full h-40 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    {site.image_url ? (
                      <img
                        src={site.image_url}
                        alt={site.name || "site image"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 dark:bg-slate-800" />
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{site.name || "Unnamed Site"}</CardTitle>
                        <CardDescription>{site.Category || "No category"}</CardDescription>
                      </div>
                      <div className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {site.city || "Unknown"}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                      {site.description || "No description available"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-3 items-center gap-4">
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
