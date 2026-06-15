"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabase";


type Cuisine = {
  id: number;
  name?: string | null;
  description?: string | null;
  city_origin?: string | null;
  image_url?: string | null;
};

export default function LocalCuisinesPage() {
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [filteredCuisines, setFilteredCuisines] = useState<Cuisine[]>([]);

  // Derived filtering (avoid keeping extra state in sync with effects)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 6;
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("All");

  const cityOptions = [
    "Tagaytay",
    "Cavite",
    "Bacoor",
    "Imus",
    "Dasmarinas",
    "Kawit",
    "Carmona",
    "Naic",
    "Mendez-Nuñez",
    "Rosario",
    "Alfonso",
    "Tanza",
    "General Trias",
    "Trece Martires",
    "Ternate",
    "Maragondon",
  ];


  useEffect(() => {
    let mounted = true;

    async function loadCuisines() {
      setLoading(true);
      setError(null);

      const start = page * pageSize;
      const end = start + pageSize - 1;

      const { data, error: fetchError } = await supabase
        .from("cuisines")
        .select("id, name, description, city_origin, image_url")
        .range(start, end)
        .order("id", { ascending: false });

      if (!mounted) return;

      if (fetchError) {
        setError(fetchError.message);
        setCuisines([]);
      } else {
        setCuisines((data as Cuisine[]) || []);
      }

      const { count, error: countError } = await supabase
        .from("local_cuisines")
        .select("id", { head: true, count: "exact" });

      if (mounted) {
        if (countError) setTotalCount(null);
        else setTotalCount(count ?? 0);
      }

      setLoading(false);
    }

    loadCuisines();
    return () => {
      mounted = false;
    };
  }, [page]);

  // Filter cuisines based on dropdown (city) and search query
  useEffect(() => {
    const normalizedCity = cityFilter === "All" ? "" : cityFilter.toLowerCase();

    const query = searchQuery.trim().toLowerCase();

    const filtered = cuisines.filter((c) => {
      const cityOrigin = (c.city_origin ?? "").toLowerCase();

      const matchesCity =
        normalizedCity === "" ? true : cityOrigin === normalizedCity;

      if (!query) return matchesCity;

      const matchesSearch =
        (c.name?.toLowerCase().includes(query) ?? false) ||
        (c.description?.toLowerCase().includes(query) ?? false) ||
        (c.city_origin?.toLowerCase().includes(query) ?? false);

      return matchesCity && matchesSearch;
    });

    setFilteredCuisines(filtered);
  }, [searchQuery, cityFilter, cuisines]);


  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(0); // Reset to first page when searching
  };

  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 0;

  return (
    <div className="min-h-screen text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Local Cuisines
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Local cuisine management
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Maintain food and cuisine records for local dishes, ingredients, and restaurant recommendations.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/local-cuisines/add-local-cuisines">
              <Button>Add Cuisine</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">Back to dashboard</Button>
            </Link>
          </div>
        </div>

        <div className="mb-6 bg-white">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="w-full sm:w-80">
              <input
                value={searchQuery}
                onChange={(e) => {
                  handleSearch(e.target.value);
                }}
                placeholder="Search cuisines…"
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="w-full sm:w-56">
              <select
                value={cityFilter}
                onChange={(e) => {
                  setCityFilter(e.target.value);
                  setPage(0);
                }}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                aria-label="Filter by city"
              >
                <option value="All">All cities</option>
                {cityOptions.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>




        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full py-8 text-center">Loading cuisines…</div>
          ) : error ? (
            <div className="col-span-full py-8 text-center text-rose-600">{error}</div>
          ) : filteredCuisines.length === 0 ? (
            <div className="col-span-full py-8 text-center text-slate-600">
              {searchQuery || cityFilter !== "All"
                ? "No cuisines match your filters."
                : "No cuisines found."}
            </div>
          ) : (

            filteredCuisines.map((c) => (
              <Card key={c.id} className="overflow-hidden">
                {c.image_url ? (
                  <img src={c.image_url} alt={c.name || "cuisine image"} className="h-40 w-full object-cover" />
                ) : (
                  <div className="h-40 w-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-xs">No Image</div>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="truncate">{c.name}</CardTitle>
                    <span className="text-xs font-mono text-slate-400">#{c.id}</span>
                  </div>
                  <CardDescription>{c.city_origin}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-400">{c.description}</p>
                </CardContent>
                <CardFooter className="flex items-center justify-between gap-2">
                  <div className="flex gap-2">
                    <Link href={`/local-cuisines/edit-local-cuisines/${c.id}`}>
                      <Button size="sm">Edit</Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async () => {
                        if (!confirm("Delete this cuisine?")) return;
                        try {
                          setDeletingId(c.id);
                          const res = await fetch("/api/local-cuisines/delete-cuisine", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: c.id }),
                          });
                          const body = await res.json();
                          if (!res.ok || body.error) {
                            alert(body.error || "Failed to delete cuisine");
                          } else {
                            setCuisines((prev) => prev.filter((item) => item.id !== c.id));
                            setTotalCount((c) => (c && c > 0 ? c - 1 : c));
                          }
                        } catch (e) {
                          alert("Unexpected error deleting cuisine");
                        } finally {
                          setDeletingId(null);
                        }
                      }}
                      disabled={deletingId !== null}
                    >
                      {deletingId === c.id ? "Deleting…" : "Delete"}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          {!searchQuery && cityFilter === "All" && (
            <>
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
            </>
          )}
          {(!!searchQuery || cityFilter !== "All") && (
            <div className="text-sm text-slate-600">
              Found {filteredCuisines.length} result{filteredCuisines.length !== 1 ? "s" : ""}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
