"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

type Trail = {
  id: number;
  title?: string | null;
  image_url?: string | null;
  difficulty?: string | null;
  duration?: string | null;
  distance?: string | null;
};

export default function CurratedTrailsPage() {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");

  const [page, setPage] = useState(0);

  const pageSize = 6;
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);


  useEffect(() => {
    let mounted = true;

    async function loadTrails() {
      setLoading(true);
      setError(null);

      const start = page * pageSize;
      const end = start + pageSize - 1;

      let queryBuilder = supabase
        .from("trails")
        .select("id, title, image_url, difficulty, duration, distance")
        .order("id", { ascending: false });

      if (query.trim()) {
        queryBuilder = queryBuilder.ilike("title", `%${query.trim()}%`);
      }

      if (difficultyFilter !== "all") {
        queryBuilder = queryBuilder.eq("difficulty", difficultyFilter);
      }


      const { data, error: fetchError } = await queryBuilder.range(start, end);


      if (!mounted) return;

      if (fetchError) {
        setError(fetchError.message);
        setTrails([]);
      } else {
        setTrails((data as Trail[]) || []);
      }

      const { count, error: countError } = await supabase
        .from("trails")
        .select("id", { head: true, count: "exact" });

      if (mounted) {
        if (countError) setTotalCount(null);
        else setTotalCount(count ?? 0);
      }

      setLoading(false);
    }

    loadTrails();
    return () => {
      mounted = false;
    };
  }, [page, query, difficultyFilter]);



  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 0;

  return (
    <div className="min-h-screen  text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              CONTENT MANAGEMENT
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Curated trails data and management
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Display curated trail information from your Supabase dataset.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="w-full sm:w-80">
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                placeholder="Search trails…"
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="w-full sm:w-56">
              <select
                value={difficultyFilter}
                onChange={(e) => {
                  setDifficultyFilter(e.target.value);
                  setPage(0);
                }}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="all">All difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Moderate">Moderate</option>
                <option value="Hard">Hard</option>

              </select>
            </div>


            <Link href="/currated-trails/add-currated-trail">
              <Button>Add Trail</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">Back to dashboard</Button>
            </Link>
          </div>
        </div>


        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full text-center py-8">Loading trails…</div>
          ) : error ? (
            <div className="col-span-full text-center py-8 text-rose-600">{error}</div>
          ) : trails.length === 0 ? (
            <div className="col-span-full text-center py-8 text-slate-600">No trails found.</div>
          ) : (
            trails.map((t) => (
              <Card key={t.id} className="overflow-hidden">
                {typeof t.id !== "number" ? (
                  <div className="p-4 text-rose-600">Error: Invalid trail ID for this entry.</div>
                ) : (
                  <>
                    {t.image_url ? (
                      <img
                        src={(() => {
                          const url = t.image_url ?? "";
                          // If the DB already contains a full URL (e.g. https://...), use it as-is.
                          // Otherwise treat it as an absolute/relative asset path.
                          return /^https?:\/\//i.test(url) ? url : url;
                        })()}
                        alt={t.title || "trail image"}
                        className="h-40 w-full object-cover"
                      />
                    ) : null}


                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="truncate">{t.title}</CardTitle>
                        <span className="text-xs font-mono text-slate-400"></span>
                      </div>
                      <CardDescription>
                        {t.difficulty ? `Difficulty: ${t.difficulty}` : ""}
                        {t.duration ? ` • Duration: ${t.duration}` : ""}
                        {t.distance ? ` • Distance: ${t.distance}` : ""}
                      </CardDescription>
                    </CardHeader>

                    

                    <CardFooter className="flex items-center justify-between gap-2">
                      <div className="flex gap-2">
                        <Link href={`/currated-trails/edit-currated-trails/${t.id}`}>
                          <Button size="sm">Edit</Button>
                        </Link>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            if (!confirm("Delete this trail?")) return;
                            try {
                              setDeletingId(t.id);
                              const res = await fetch("/api/trails/delete-trail", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: t.id }),
                              });
                              const body = await res.json();

                              if (!res.ok || body.error) {
                                alert(body.error || "Failed to delete trail");
                              } else {
                                setTrails((prev) => prev.filter((p) => p.id !== t.id));
                                setTotalCount((c) => (c && c > 0 ? c - 1 : c));
                              }
                            } catch {
                              alert("Unexpected error deleting trail");
                            } finally {
                              setDeletingId(null);
                            }
                          }}
                          disabled={deletingId !== null}
                        >
                          {deletingId === t.id ? "Deleting…" : "Delete"}
                        </Button>
                      </div>
                    </CardFooter>
                  </>
                )}
              </Card>
            ))
          )}
        </div>

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

