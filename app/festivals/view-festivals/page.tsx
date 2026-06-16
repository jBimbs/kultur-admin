"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

type Festival = {
  id: number;
  name?: string | null;
  description?: string | null;
  city?: string | null;
  image_url?: string | null;
};

const CITY_OPTIONS = [
  "Alfonso",
  "Amadeo",
  "Bacoor",
  "Carmona",
  "Cavite City",
  "Dasmariñas",
  "General Mariano Alvarez",
  "General Trias",
  "Indang",
  "Kawit",
  "Magallanes",
  "Maragondon",
  "Naic",
  "Rosario",
  "Silang",
  "Tanza",
  "Ternate",
  "Trece Martires",
];

export default function FestivalsPage() {
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("all");

  const [page, setPage] = useState(0);
  const pageSize = 6;
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadFestivals() {
      setLoading(true);
      setError(null);

      const start = page * pageSize;
      const end = start + pageSize - 1;

      let queryBuilder = supabase
        .from("festivals")
        .select("id, name, description, city, image_url")
        .order("id", { ascending: false });

      const q = query.trim();
      if (q) {
        queryBuilder = queryBuilder.ilike("name", `%${q}%`);
      }

      if (cityFilter !== "all") {
        queryBuilder = queryBuilder.eq("city", cityFilter);
      }

      const { data, error } = await queryBuilder.range(start, end);

      if (!mounted) return;

      if (error) {
        setError(error.message);
        setFestivals([]);
      } else {
        setFestivals((data as Festival[]) || []);
      }

      // total count (respect filters)
      let countQuery = supabase
        .from("festivals")
        .select("id", { head: true, count: "exact" });

      if (q) {
        countQuery = countQuery.ilike("name", `%${q}%`);
      }

      if (cityFilter !== "all") {
        countQuery = countQuery.eq("city", cityFilter);
      }

      const { count, error: countError } = await countQuery;
      if (mounted) {
        if (countError) setTotalCount(null);
        else setTotalCount(count ?? 0);
      }

      setLoading(false);
    }

    loadFestivals();
    return () => {
      mounted = false;
    };
  }, [page, query, cityFilter]);

  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 0;

  return (
    <div className="min-h-screen text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        
        {/* Header Block Section */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              CONTENT MANAGEMENT
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Festival data and management
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Display festival information, celebration dates, and event details from your Supabase dataset.
            </p>
          </div>

          <div className="flex gap-2 shrink-0">
            <Link href="/festivals/add-festival">
              <Button>Add Festival</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">Back to dashboard</Button>
            </Link>
          </div>
        </div>

        {/* Filter Row Section Aligned cleanly to the right side */}
        <div className="mb-6 flex w-full justify-end">
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="w-full sm:w-80">
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                placeholder="Search festivals…"
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="w-full sm:w-56">
              <select
                value={cityFilter}
                onChange={(e) => {
                  setCityFilter(e.target.value);
                  setPage(0);
                }}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none shadow-sm focus:border-slate-400 focus:ring-1 focus:ring-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="all">All cities</option>
                {CITY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full text-center py-8">Loading festivals…</div>
          ) : error ? (
            <div className="col-span-full text-center py-8 text-rose-600">{error}</div>
          ) : festivals.length === 0 ? (
            <div className="col-span-full text-center py-8 text-slate-600">No festivals found.</div>
          ) : (
            festivals.map((f) => (
              <Card key={f.id} className="overflow-hidden">
                {typeof f.id !== "number" ? (
                  <div className="p-4 text-rose-600">Error: Invalid festival ID for this entry.</div>
                ) : (
                  <>
                    {f.image_url ? (
                      <img
                        src={f.image_url}
                        alt={f.name || "festival image"}
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <div className="h-40 w-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-xs">No Image</div>
                    )}
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="truncate">{f.name}</CardTitle>
                        <span className="text-xs font-mono text-slate-400">#{f.id}</span>
                      </div>
                      <CardDescription>{f.city}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">{f.description}</p>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between gap-2">
                      <div className="flex gap-2">
                        <Link href={`/festivals/edit/${f.id}`}>
                          <Button size="sm">Edit</Button>
                        </Link>
                        {/* <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            if (!confirm("Delete this festival?")) return;
                            try {
                              setDeletingId(f.id);
                              const res = await fetch("/api/festivals/delete-festival", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: f.id }),
                              });
                              const body = await res.json();

                              if (!res.ok || body.error) {
                                alert(body.error || "Failed to delete festival");
                              } else {
                                setFestivals((prev) => prev.filter((p) => p.id !== f.id));
                                setTotalCount((c) => (c && c > 0 ? c - 1 : c));
                              }
                            } catch {
                              alert("Unexpected error deleting festival");
                            } finally {
                              setDeletingId(null);
                            }
                          }}
                          disabled={deletingId !== null}
                        >
                          {deletingId === f.id ? "Deleting…" : "Delete"}
                        </Button> */}
                      </div>
                    </CardFooter>
                  </>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Pagination Block footer controls */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page <= 0}
          >
            Previous
          </Button>
          <div className="text-sm text-slate-600">
            Page {page + 1} of {totalPages || 1}
          </div>
          <Button
            onClick={() => setPage((p) => Math.min((totalPages || 1) - 1, p + 1))}
            disabled={totalCount === null || page >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}