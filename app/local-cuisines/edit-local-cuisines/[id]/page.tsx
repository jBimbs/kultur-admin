"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { useParams } from "next/navigation";

type Cuisine = {
  id: number;
  name?: string | null;
  description?: string | null;
  city_origin?: string | null;
  image_url?: string | null;
};

export default function EditLocalCuisineByIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const idParamFromQuery = useMemo(
    () => searchParams.get("id"),
    [searchParams]
  );

  const [loaded, setLoaded] = useState(false);
  const [cuisineId, setCuisineId] = useState<number>(NaN);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cityOrigin, setCityOrigin] = useState("");

  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      let idNumber = NaN;

      try {
        const resolved = await params;
        idNumber = Number(resolved.id);
      } catch {
        // ignore
      }

      if (Number.isNaN(idNumber) && idParamFromQuery) {
        const n = Number(idParamFromQuery);
        if (!Number.isNaN(n)) idNumber = n;
      }

      if (!mounted) return;
      setCuisineId(idNumber);
      setLoaded(true);
    }

    init();
    return () => {
      mounted = false;
    };
  }, [idParamFromQuery, params]);

  useEffect(() => {
    let mounted = true;

    async function loadCuisine() {
      if (!loaded) return;

      if (!cuisineId || Number.isNaN(cuisineId)) {
        setError("Invalid cuisine id.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/local-cuisines/get/${cuisineId}`);
        const body = await res.json();

        if (!res.ok || body?.error) {
          throw new Error(body?.error || "Failed to load cuisine details");
        }

        if (!mounted) return;
        const c: Cuisine = body.cuisine;
        setName(c.name || "");
        setDescription(c.description || "");
        setCityOrigin(c.city_origin || "");
        setExistingImageUrl(c.image_url || null);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load cuisine");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadCuisine();

    return () => {
      mounted = false;
    };
  }, [cuisineId, loaded]);

  const onPickImage = (file: File | null) => {
    setError(null);
    if (!file) {
      setImageFile(null);
      setImagePreviewUrl(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setError(null);

    if (!name.trim()) return setError("Name is required"), undefined;
    if (!description.trim())
      return setError("Description is required"), undefined;
    if (!cityOrigin.trim())
      return setError("City origin is required"), undefined;

    if (!cuisineId || Number.isNaN(cuisineId)) {
      setError("Invalid cuisine id.");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("id", String(cuisineId));
      formData.append("name", name.trim());
      formData.append("description", description.trim());
      formData.append("city_origin", cityOrigin.trim());
      if (imageFile) formData.append("image", imageFile);

      const res = await fetch("/api/local-cuisines/update-cuisine", {
        method: "POST",
        body: formData,
      });

      const body = await res.json();
      if (!res.ok || body.error) {
        throw new Error(body.error || "Failed to update cuisine");
      }

      router.push("/local-cuisines/view-local-cuisines");
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Edit Local Cuisine
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Update cuisine details
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Edit name, description, city origin and optionally replace the cuisine image.
            </p>
          </div>

          <Link href="/local-cuisines/view-local-cuisines">
            <button className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
              Back to cuisines
            </button>
          </Link>
        </div>

        <Card className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-600 dark:text-slate-400">
              Loading…
            </div>
          ) : null}

          {!loading && error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <div className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                Current image
              </div>
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                {imagePreviewUrl ? (
                  <img
                    src={imagePreviewUrl}
                    alt="New cuisine preview"
                    className="h-72 w-full object-cover"
                  />
                ) : existingImageUrl ? (
                  <img
                    src={existingImageUrl}
                    alt={name || "Cuisine image"}
                    className="h-72 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-72 w-full items-center justify-center text-xs text-slate-400">
                    No image
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cuisine-image">Replace image (optional)</Label>
                <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                  <input
                    id="cuisine-image"
                    type="file"
                    accept="image/*"
                    className="block w-full text-sm text-slate-700 dark:text-slate-300"
                    onChange={(e) => onPickImage(e.target.files?.[0] || null)}
                  />
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Uploads to Supabase bucket <span className="font-semibold">KulturAR-assets</span> inside folder{" "}
                    <span className="font-semibold">CUISINES</span>. Max 5MB.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                htmlFor="cuisine-name"
              >
                Name
              </label>
              <Input
                id="cuisine-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Cuisine name"
              />
            </div>

            <div>
              <label
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                htmlFor="cuisine-city"
              >
                City origin
              </label>
              <Input
                id="cuisine-city"
                value={cityOrigin}
                onChange={(e) => setCityOrigin(e.target.value)}
                placeholder="City origin"
              />
            </div>
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              htmlFor="cuisine-description"
            >
              Description
            </label>
            <textarea
              id="cuisine-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[140px] w-full rounded-3xl border border-input bg-transparent px-3 py-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="Cuisine description"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              onClick={() => router.push("/local-cuisines/view-local-cuisines")}
              disabled={saving || loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving || loading}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

