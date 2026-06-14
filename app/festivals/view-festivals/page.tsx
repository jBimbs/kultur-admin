"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

type Festival = {
  id: number; // id is typically a primary key and should not be optional
  name?: string | null;
  description?: string | null;
  city?: string | null;
  image_url?: string | null;
};

export default function FestivalsPage() {
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

      const { data, error } = await supabase
        .from("festivals")
        .select("id, name, description, city, image_url")
        .range(start, end)
        .order("id", { ascending: false });

      if (!mounted) return;

      if (error) {
        setError(error.message);
        setFestivals([]);
      } else {
        setFestivals((data as Festival[]) || []);
      }

      // fetch total count
      const { count, error: countError } = await supabase.from("festivals").select("id", { head: true, count: "exact" });
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
  }, [page]);

  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 0;

  return (
    <div className="min-h-screen  text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">CONTENT MANAGEMENT</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Festival data and management</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Display festival information, celebration dates, and event details from your Supabase dataset.
            </p>
          </div>

          <div className="flex gap-2">
            <Link href="/festivals/add-festival">
              <Button>Add Festival</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">Back to dashboard</Button>
            </Link>
          </div>
        </div>

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
                {/* Ensure f.id is a valid number before rendering the card content */}
                {typeof f.id !== 'number' ? (
                  <div className="p-4 text-rose-600">Error: Invalid festival ID for this entry.</div>
                ) : (
                  <>
                    {f.image_url ? (
                      <img src={f.image_url} alt={f.name || "festival image"} className="h-40 w-full object-cover" />
                    ) : null}
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
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            if (!confirm('Delete this festival?')) return;
                            try {
                              setDeletingId(f.id); // f.id is guaranteed to be a number here
                              const res = await fetch('/api/festivals/delete-festival', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: f.id }),
                              });
                              const body = await res.json();
                              if (!res.ok || body.error) {
                                alert(body.error || 'Failed to delete festival');
                              } else {
                                setFestivals((prev) => prev.filter((p) => p.id !== f.id));
                                setTotalCount((c) => (c && c > 0 ? c - 1 : c));
                              }
                            } catch (e) {
                              alert('Unexpected error deleting festival');
                            } finally {
                              setDeletingId(null);
                            }
                          }}
                          disabled={deletingId !== null}
                        >
                          {deletingId === f.id ? 'Deleting…' : 'Delete'}
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
          <Button variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page <= 0}>
            Previous
          </Button>
          <div className="text-sm text-slate-600">Page {page + 1} of {totalPages || 1}</div>
          <Button onClick={() => setPage((p) => Math.min((totalPages || 1) - 1, p + 1))} disabled={totalCount === null || page >= (totalPages - 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
