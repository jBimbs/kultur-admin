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

type Artifact = {
  id: number;
  name?: string | null;
  description?: string | null;
  image_url?: string | null;
  current_location?: string | null;
};

export default function ArtifactsPage() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");

  const [page, setPage] = useState(0);
  const pageSize = 6;
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadArtifacts() {
      setLoading(true);
      setError(null);

      const start = page * pageSize;
      const end = start + pageSize - 1;

      let queryBuilder = supabase
        .from("artifacts")
        .select("id, name, description, image_url, current_location")
        .order("id", { ascending: false });

      if (query.trim()) {
        queryBuilder = queryBuilder.ilike("name", `%${query.trim()}%`);
      }

      const { data, error: fetchError } = await queryBuilder.range(start, end);

      if (!mounted) return;

      if (fetchError) {
        setError(fetchError.message);
        setArtifacts([]);
      } else {
        setArtifacts((data as Artifact[]) || []);
      }

      const { count, error: countError } = await supabase
        .from("artifacts")
        .select("id", { head: true, count: "exact" });

      if (mounted) {
        if (countError) setTotalCount(null);
        else setTotalCount(count ?? 0);
      }

      setLoading(false);
    }

    loadArtifacts();
    return () => {
      mounted = false;
    };
  }, [page, query]);

  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 0;

  return (
    <div className="min-h-screen text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        
        {/* Header Block Section */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Artifacts
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Artifact catalog management
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Showcase artifact records and maintain the inventory of cultural objects from your backend.
            </p>
          </div>
          
          <div className="flex gap-2 shrink-0">
            <Link href="/artifacts/add-artifact">
              <Button>Add Artifact</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">Back to dashboard</Button>
            </Link>
          </div>
        </div>

        {/* Search bar wrapper aligned to the right side */}
        <div className="mb-6 flex w-full justify-end">
          <div className="w-full sm:w-80">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder="Search artifacts…"
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Main Grid View */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full py-8 text-center">Loading artifacts…</div>
          ) : error ? (
            <div className="col-span-full py-8 text-center text-rose-600">{error}</div>
          ) : artifacts.length === 0 ? (
            <div className="col-span-full py-8 text-center text-slate-600">No artifacts found.</div>
          ) : (
            artifacts.map((a) => (
              <Card key={a.id} className="overflow-hidden">
                {a.image_url ? (
                  <img src={a.image_url} alt={a.name || "artifact image"} className="h-40 w-full object-cover" />
                ) : (
                  <div className="h-40 w-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-xs">No Image</div>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="truncate">{a.name}</CardTitle>
                    <span className="text-xs font-mono text-slate-400">#{a.id}</span>
                  </div>
                  <CardDescription>{a.current_location}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-400">{a.description}</p>
                </CardContent>
                <CardFooter className="flex items-center justify-between gap-2">
                  <div className="flex gap-2">
                    <Link href={`/artifacts/edit-artifact/${a.id}`}>
                      <Button size="sm">Edit</Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async () => {
                        if (!confirm("Delete this artifact?")) return;
                        try {
                          setDeletingId(a.id);
                          const res = await fetch("/api/artifacts/delete-artifact", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: a.id }),
                          });
                          const body = await res.json();
                          if (!res.ok || body.error) {
                            alert(body.error || "Failed to delete artifact");
                          } else {
                            setArtifacts((prev) => prev.filter((item) => item.id !== a.id));
                            setTotalCount((c) => (c && c > 0 ? c - 1 : c));
                          }
                        } catch (e) {
                          alert("Unexpected error deleting artifact");
                        } finally {
                          setDeletingId(null);
                        }
                      }}
                      disabled={deletingId !== null}
                    >
                      {deletingId === a.id ? "Deleting…" : "Delete"}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </div>

        {/* Pagination Block footer controls */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page <= 0}>
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
      </div>
    </div>
  );
}