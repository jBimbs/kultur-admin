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
  id: number;
  Category?: string | null;
  image_url?: string | null;
  name?: string | null;
  description?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export default function EditSitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 5;
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedSite = sites.find((site) => site.id === selectedSiteId) ?? null;

  useEffect(() => {
    loadSites();
  }, []);

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    // reload when the debounced search value or page changes
    loadSites();
  }, [debouncedSearch, page]);

  useEffect(() => {
    if (selectedSite) {
      setName(selectedSite.name ?? "");
      setDescription(selectedSite.description ?? "");
      setCity(selectedSite.city ?? "");
      setCategory(selectedSite.Category ?? "");
      setLatitude(selectedSite.latitude != null ? selectedSite.latitude.toString() : "");
      setLongitude(selectedSite.longitude != null ? selectedSite.longitude.toString() : "");
      setImageFile(null);
      setImagePreview(selectedSite.image_url ?? null);
      setError(null);
      setMessage(null);
    } else {
      setName("");
      setDescription("");
      setCity("");
      setCategory("");
      setLatitude("");
      setLongitude("");
      setImageFile(null);
      setImagePreview(null);
    }
  }, [selectedSite]);

  const loadSites = async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from("sites")
      .select("id, Category, image_url, name, description, city, latitude, longitude");

    if (debouncedSearch.trim()) {
      const pattern = `%${debouncedSearch.trim()}%`;
      query = query.or(`name.ilike.${pattern},city.ilike.${pattern},Category.ilike.${pattern}`);
    }

    const start = page * pageSize;
    const end = start + pageSize - 1;

    const { data, error } = await query.range(start, end);

    if (error) {
      setError(error.message);
      setSites([]);
    } else {
      setSites((data as Site[]) || []);
    }

    // fetch total count
    let countQuery = supabase.from("sites").select("id", { head: true, count: "exact" });
    if (debouncedSearch.trim()) {
      const pattern = `%${debouncedSearch.trim()}%`;
      countQuery = countQuery.or(`name.ilike.${pattern},city.ilike.${pattern},Category.ilike.${pattern}`);
    }
    const { count, error: countError } = await countQuery;
    if (countError) setTotalCount(null);
    else setTotalCount(count ?? 0);

    setLoading(false);
  };

  const handleSelect = (site: Site) => {
    setSelectedSiteId(site.id);
    setError(null);
    setMessage(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);
    setError(null);

    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const validateForm = () => {
    if (!selectedSiteId) {
      setError("Please select a site to edit.");
      return false;
    }

    if (!name.trim() || !description.trim() || !city.trim() || !category.trim() || !latitude.trim() || !longitude.trim()) {
      setError("All fields are required.");
      return false;
    }

    if (Number.isNaN(Number(latitude)) || Number.isNaN(Number(longitude))) {
      setError("Latitude and longitude must be valid numbers.");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("id", selectedSiteId!.toString());
      formData.append("name", name.trim());
      formData.append("description", description.trim());
      formData.append("city", city.trim());
      formData.append("category", category.trim());
      formData.append("latitude", latitude);
      formData.append("longitude", longitude);

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const response = await fetch("/api/historical-sites/update-site", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        setError(result.error || "Failed to update the site.");
      } else {
        setMessage("Site updated successfully.");
        await loadSites();
      }
    } catch (err) {
      setError("An unexpected error occurred while updating the site.");
    }

    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedSiteId) {
      setError("Please select a site to delete.");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this site? This cannot be undone.");
    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/historical-sites/delete-site", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: selectedSiteId }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        setError(result.error || "Failed to delete the site.");
      } else {
        setMessage("Site deleted successfully.");
        setSelectedSiteId(null);
        await loadSites();
      }
    } catch (err) {
      setError("An unexpected error occurred while deleting the site.");
    }

    setDeleting(false);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Content Management
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Edit Historical Sites
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Select an existing site to update its information or delete it completely.
          </p>
        </div>
        <Link href="/historical-sites/view-sites">
          <Button variant="outline">Back to site list</Button>
        </Link>
      </div>

      <div className="grid gap-8 xl:grid-cols-[400px_1fr]">
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Choose a site</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Pick a site from the table and edit its details on the right.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={loadSites}>
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-600">Loading sites…</div>
          ) : sites.length === 0 ? (
            <div className="py-8 text-center text-slate-600">No sites available yet.</div>
          ) : (
            <div className="space-y-2">
              {sites.map((site) => (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => handleSelect(site)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedSiteId === site.id
                      ? "border-slate-900 bg-slate-100 dark:border-slate-600 dark:bg-slate-900"
                      : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold">{site.name || "Unnamed site"}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">{site.Category || "No category"}</div>
                    </div>
                    <span className="text-sm text-slate-500 dark:text-slate-400">ID {site.id}</span>
                  </div>
                  <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">{site.city}</div>
                </button>
              ))}

              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-slate-600">Page {page + 1} of {totalCount ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1}</div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page <= 0}>Previous</Button>
                  <Button size="sm" onClick={() => setPage((p) => (totalCount ? Math.min(Math.ceil(totalCount / pageSize) - 1, p + 1) : p + 1))} disabled={totalCount !== null && page >= Math.max(0, Math.ceil((totalCount ?? 0) / pageSize) - 1)}>Next</Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4">
            <Input
              placeholder="Search name, city or category"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="edit-name">
                Site Name
              </label>
              <Input
                id="edit-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Site name"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="edit-category">
                Category
              </label>
              <Input
                id="edit-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="e.g. Monument, Museum"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="edit-description">
              Description
            </label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-[120px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="Describe the site"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="edit-city">
                City
              </label>
              <Input
                id="edit-city"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="City"
              />
            </div>
            <div />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="edit-latitude">
                Latitude
              </label>
              <Input
                id="edit-latitude"
                type="number"
                step="any"
                value={latitude}
                onChange={(event) => setLatitude(event.target.value)}
                placeholder="Latitude"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="edit-longitude">
                Longitude
              </label>
              <Input
                id="edit-longitude"
                type="number"
                step="any"
                value={longitude}
                onChange={(event) => setLongitude(event.target.value)}
                placeholder="Longitude"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="edit-image">
              Site Image
            </label>
            <Input id="edit-image" type="file" accept="image/*" onChange={handleFileChange} />
          </div>

          {imagePreview ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
              <img src={imagePreview} alt="Site preview" className="h-64 w-full rounded-xl object-cover" />
            </div>
          ) : null}

          {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40">{error}</div> : null}
          {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40">{message}</div> : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button onClick={handleSave} disabled={!selectedSiteId || saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!selectedSiteId || deleting}
              className="w-full sm:w-auto"
            >
              {deleting ? "Deleting…" : "Delete site"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
