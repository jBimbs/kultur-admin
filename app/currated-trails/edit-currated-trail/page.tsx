"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

type Difficulty = "Easy" | "Moderate" | "Hard";

type Trail = {
  id: number;
  title?: string | null;
  image_url?: string | null;
  difficulty?: string | null;
  duration?: string | null;
  distance?: string | null;
};

function EditCurratedTrailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParamFromQuery = useMemo(() => searchParams.get("id"), [searchParams]);

  const trailId = useMemo(() => {
    if (!idParamFromQuery) return NaN;
    const n = Number(idParamFromQuery);
    return Number.isNaN(n) ? NaN : n;
  }, [idParamFromQuery]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [trail, setTrail] = useState<Trail | null>(null);

  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");

  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadTrail() {
      if (!trailId || Number.isNaN(trailId)) {
        setError("Invalid trail id.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Expected to return { trail: {...} } or { error: '...' }
        const res = await fetch(`/api/trails/get/${trailId}`);
        const body = await res.json();

        if (!res.ok || body?.error) {
          throw new Error(body?.error || "Failed to load trail details");
        }

        if (!mounted) return;

        const t: Trail = body.trail;
        setTrail(t);
        setTitle(t.title || "");
        setDifficulty((t.difficulty as Difficulty) || "Easy");
        setDuration(t.duration || "");
        setDistance(t.distance || "");
        setExistingImageUrl(t.image_url || null);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load trail");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadTrail();

    return () => {
      mounted = false;
    };
  }, [trailId]);

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

    if (!title.trim()) return setError("Title is required"), undefined;
    if (!duration.trim()) return setError("Duration is required"), undefined;
    if (!distance.trim()) return setError("Distance is required"), undefined;

    if (!trailId || Number.isNaN(trailId)) {
      setError("Invalid trail id.");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("id", String(trailId));
      formData.append("title", title.trim());
      formData.append("difficulty", difficulty);
      formData.append("duration", duration.trim());
      formData.append("distance", distance.trim());
      if (imageFile) formData.append("image", imageFile);

      const res = await fetch("/api/trails/update-trail", {
        method: "POST",
        body: formData,
      });

      const body = await res.json();
      if (!res.ok || body?.error) {
        throw new Error(body?.error || "Failed to update trail");
      }

      router.push("/currated-trails/view-currated-trails");
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
              Edit Trail
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Update curated trail details
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Edit the title, difficulty, duration, distance and optionally replace the trail image.
            </p>
          </div>

          <Link href="/currated-trails/view-currated-trails">
            <button className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
              Back to trails
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
                    alt="New trail preview"
                    className="h-72 w-full object-cover"
                  />
                ) : existingImageUrl ? (
                  <img
                    src={existingImageUrl}
                    alt={title || "Trail image"}
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
                <Label htmlFor="trail-image">Replace image (optional)</Label>
                <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                  <input
                    id="trail-image"
                    type="file"
                    accept="image/*"
                    className="block w-full text-sm text-slate-700 dark:text-slate-300"
                    onChange={(e) => onPickImage(e.target.files?.[0] || null)}
                  />
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Uploads to Supabase storage bucket <span className="font-semibold">KulturAR-assets</span> inside folder{" "}
                    <span className="font-semibold">TRAILS</span>. Max 5MB.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                htmlFor="trail-title"
              >
                Trail title
              </label>
              <Input
                id="trail-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Trail title"
              />
            </div>

            <div>
              <label
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                htmlFor="trail-duration"
              >
                Duration
              </label>
              <Input
                id="trail-duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g., 2h 30m"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                htmlFor="trail-distance"
              >
                Distance
              </label>
              <Input
                id="trail-distance"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="e.g., 5.2 km"
              />
            </div>

            <div>
              <label
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                htmlFor="trail-difficulty"
              >
                Difficulty
              </label>
              <select
                id="trail-difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="h-10 w-full rounded-3xl border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="Easy">Easy</option>
                <option value="Moderate">Moderate</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              onClick={() => router.push("/currated-trails/view-currated-trails")}
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

export default function EditCurratedTrailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <p className="text-slate-500">Loading editor...</p>
        </div>
      }
    >
      <EditCurratedTrailForm />
    </Suspense>
  );
}

