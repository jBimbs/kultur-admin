"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { supabase } from "@/lib/supabase";

type Step = "stops" | "details" | "image" | "confirmation";

type Difficulty = "Easy" | "Moderate" | "Hard";

type Site = {
  id: number;
  name: string;
};

type TrailStop = {
  site_id: number;
  site_name: string;
  notes: string;
};

type TrailRow = {
  id: number;
  title: string | null;
  description: string | null;
  difficulty: Difficulty | null;
  duration: string | null;
  distance: string | null;
  image_url: string | null;
};

export default function EditCurratedTrailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const idNum = useMemo(() => {
    const raw = params.id;
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [params.id]);

  const [step, setStep] = useState<Step>("stops");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [availableSites, setAvailableSites] = useState<Site[]>([]);
  const [trailStops, setTrailStops] = useState<TrailStop[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [stopNotes, setStopNotes] = useState<string>("");

  // Step 2
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");

  // Step 3
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!idNum) return;

    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [
          { data: sites, error: sitesErr },
          { data: trail, error: trailErr },
          { data: stops, error: stopsErr }
        ] = await Promise.all([
          supabase.from("sites").select("id, name"),
          supabase
            .from("trails")
            .select("id, title, description, difficulty, duration, distance, image_url")
            .eq("id", idNum)
            .single(),
          supabase
            .from("trail_stops")
            .select("site_id, notes, stop_order, sites(name)")
            .eq("trail_id", idNum)
            .order("stop_order", { ascending: true }),
        ]);

        if (!mounted) return;
        if (sitesErr) throw new Error(sitesErr.message);
        if (trailErr) throw new Error(trailErr.message);
        if (stopsErr) throw new Error(stopsErr.message);

        const t = trail as unknown as TrailRow;

        setAvailableSites((sites as Site[]) ?? []);
        setTitle(t?.title ?? "");
        setDescription(t?.description ?? "");
        setDifficulty((t?.difficulty as Difficulty) ?? "Easy");
        setDuration(t?.duration ?? "");
        setDistance(t?.distance ?? "");
        setExistingImageUrl(t?.image_url ?? null);

        // Pre-fill preview with existing image
        setImagePreview(t?.image_url ?? null);

        // Safely extract the site name depending on how Supabase returns the join
        const mappedStops: TrailStop[] =
          (stops as any[] | null | undefined)?.map((s) => {
            const siteName = Array.isArray(s.sites) ? s.sites[0]?.name : s.sites?.name;

            return {
              site_id: s.site_id,
              site_name: siteName ?? "",
              notes: s.notes ?? "",
            };
          }) ?? [];

        setTrailStops(mappedStops);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load trail");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [idNum]);

  // --- STOP MANAGEMENT FUNCTIONS ---
  const handleAddStop = () => {
    if (!selectedSiteId) return;
    const site = availableSites.find((s) => s.id.toString() === selectedSiteId);
    if (!site) return;

    const newStop: TrailStop = {
      site_id: site.id,
      site_name: site.name,
      notes: stopNotes.trim(),
    };

    setTrailStops((prev) => [...prev, newStop]);
    setSelectedSiteId("");
    setStopNotes("");
  };

  const handleRemoveStop = (indexToRemove: number) => {
    setTrailStops((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleMoveStop = (index: number, direction: 'up' | 'down') => {
    const newStops = [...trailStops];
    if (direction === 'up' && index > 0) {
      [newStops[index - 1], newStops[index]] = [newStops[index], newStops[index - 1]];
    } else if (direction === 'down' && index < newStops.length - 1) {
      [newStops[index + 1], newStops[index]] = [newStops[index], newStops[index + 1]];
    }
    setTrailStops(newStops);
  };

  const handleUpdateNote = (index: number, newNotes: string) => {
    const newStops = [...trailStops];
    newStops[index].notes = newNotes;
    setTrailStops(newStops);
  };
  // ---------------------------------

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setImageFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleStep1Submit = () => {
    setError(null);
    if (trailStops.length === 0) return setError("At least one trail stop is required.");
    setStep("details");
  };

  const handleStep2Submit = () => {
    setError(null);
    if (!title.trim()) return setError("Title is required");
    if (!description.trim()) return setError("Description is required");
    if (!difficulty) return setError("Difficulty is required");
    if (!duration.trim()) return setError("Duration is required");
    if (!distance.trim()) return setError("Distance is required");

    setStep("image");
  };

  const handleStep3Submit = () => {
    setError(null);
    if (!imagePreview) return setError("Please select an image");
    setStep("confirmation");
  };

  const handleSubmit = async () => {
    if (!idNum) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("id", String(idNum));
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("difficulty", difficulty);
      formData.append("duration", duration.trim());
      formData.append("distance", distance.trim());

      if (imageFile) {
        formData.append("image", imageFile);
      }

      // The backend will receive this ordered array. 
      // It should delete existing stops for this trail_id and insert these with stop_order = index + 1
      formData.append("trailStops", JSON.stringify(trailStops));

      const response = await fetch("/api/trails/update-trail", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to update trail");
      }

      router.push("/currated-trails/view-currated-trails");
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Content Management</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Edit Trail</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Update curated trail stops, details and image.
          </p>
        </div>

        <Link href="/currated-trails/view-currated-trails">
          <Button variant="outline">Back to trails</Button>
        </Link>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2 sm:gap-4 items-center justify-center overflow-x-auto pb-4">
        <StepBubble active num={1} label="Stops" />
        <div className={`h-1 w-8 sm:w-12 ${step === "details" || step === "image" || step === "confirmation" ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-700"}`} />
        <StepBubble active={step === "details" || step === "image" || step === "confirmation"} num={2} label="Details" />
        <div className={`h-1 w-8 sm:w-12 ${step === "image" || step === "confirmation" ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-700"}`} />
        <StepBubble active={step === "image" || step === "confirmation"} num={3} label="Image" />
        <div className={`h-1 w-8 sm:w-12 ${step === "confirmation" ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-700"}`} />
        <StepBubble active={step === "confirmation"} num={4} label="Review" />
      </div>

      {step === "stops" && (
        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle>Route Map & Stops</CardTitle>
            <CardDescription>Select and organize the sites that make up this curated trail.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900/50 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Select Site</label>
                <select
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="" disabled>
                    -- Choose a site to add --
                  </option>
                  {availableSites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Route Notes (Optional)</label>
                <Input
                  placeholder="e.g., Start at the balcony..."
                  value={stopNotes}
                  onChange={(e) => setStopNotes(e.target.value)}
                  className="rounded-2xl"
                />
              </div>

              <Button type="button" variant="secondary" onClick={handleAddStop} disabled={!selectedSiteId || loading} className="w-full rounded-2xl">
                Add Stop to Route
              </Button>
            </div>

            {trailStops.length > 0 ? (
              <div className="space-y-3 pt-4">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Current Route (Order matters):</h4>
                {trailStops.map((stop, idx) => (
                  <div
                    key={`${stop.site_id}-${idx}`}
                    className="flex flex-col p-4 border border-slate-200 dark:border-slate-800 rounded-2xl gap-3 bg-white dark:bg-slate-900"
                  >
                    {/* Top Row: Info and Reorder Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{stop.site_name}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg"
                          onClick={() => handleMoveStop(idx, 'up')}
                          disabled={idx === 0 || loading}
                          title="Move Up"
                        >
                          ↑
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg"
                          onClick={() => handleMoveStop(idx, 'down')}
                          disabled={idx === trailStops.length - 1 || loading}
                          title="Move Down"
                        >
                          ↓
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveStop(idx)}
                          className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg ml-2"
                          disabled={loading}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>

                    {/* Bottom Row: Editable Notes Input */}
                    <div className="pl-10 pr-2">
                      <Input
                        placeholder="Add notes for this stop..."
                        value={stop.notes}
                        onChange={(e) => handleUpdateNote(idx, e.target.value)}
                        className="rounded-xl h-9 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 border-transparent hover:border-slate-200 focus:border-slate-300 transition-colors"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">No stops added yet.</p>
            )}

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">{error}</div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button onClick={handleStep1Submit} className="rounded-2xl px-8" disabled={loading}>
                Next: Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "details" && (
        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle>Trail Details</CardTitle>
            <CardDescription>Enter the public-facing metadata for this trail.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Title *</label>
              <Input placeholder="e.g., Bonifacio Trial House" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-2xl" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description *</label>
              <textarea
                placeholder="Describe the trail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400"
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Difficulty *</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="Easy">Easy</option>
                <option value="Moderate">Moderate</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Duration *</label>
              <Input placeholder="e.g., 2h 30m" value={duration} onChange={(e) => setDuration(e.target.value)} className="rounded-2xl" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Distance *</label>
              <Input placeholder="e.g., 5.2 km" value={distance} onChange={(e) => setDistance(e.target.value)} className="rounded-2xl" />
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">{error}</div>
            )}

            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button onClick={() => setStep("stops")} variant="outline" className="flex-1 rounded-2xl" disabled={loading}>
                Back to Stops
              </Button>
              <Button onClick={handleStep2Submit} className="flex-1 rounded-2xl" disabled={loading}>
                Next: Upload Image
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "image" && (
        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle>Upload Image</CardTitle>
            <CardDescription>Upload a high-quality image of the trail (max 5MB). Leave blank to keep current image.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Image *</label>
              <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 dark:border-slate-600 dark:bg-slate-800">
                <div className="text-center">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img src={imagePreview} alt="Preview" className="mx-auto h-40 w-auto rounded-lg object-cover" />
                      <div>
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="trail-image-input" />
                        <label htmlFor="trail-image-input" className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-700 dark:text-blue-400">
                          Change image
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-4xl">🥾</div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Drag and drop or click to select</p>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="trail-image-input" />
                      <label htmlFor="trail-image-input" className="inline-block">
                        <span className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-700 dark:text-blue-400">Browse files</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">{error}</div>
            )}

            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button onClick={() => setStep("details")} variant="outline" className="flex-1 rounded-2xl" disabled={loading}>
                Back to Details
              </Button>
              <Button onClick={handleStep3Submit} disabled={loading} className="flex-1 rounded-2xl">
                Next: Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "confirmation" && (
        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle>Review & Confirm</CardTitle>
            <CardDescription>Please review the trail details before saving.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4 sm:col-span-2">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Trail Route ({trailStops.length} stops)</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-slate-900 dark:text-slate-100 pl-2">
                    {trailStops.map((stop, idx) => (
                      <li key={`${stop.site_id}-${idx}`} className="mb-1">
                        <span className="font-medium">{stop.site_name}</span>
                        {stop.notes ? <span className="text-slate-500 ml-2">({stop.notes})</span> : null}
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Title</p>
                  <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{title || ""}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Description</p>
                  <p className="mt-1 text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap">{description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Difficulty</p>
                    <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{difficulty}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Duration</p>
                    <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{duration}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Distance</p>
                  <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{distance}</p>
                </div>
              </div>

              {imagePreview ? (
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Image</p>
                  <img src={imagePreview} alt="Preview" className="mt-2 h-48 w-full rounded-2xl object-cover" />
                </div>
              ) : null}
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">{error}</div>
            )}

            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button onClick={() => setStep("image")} variant="outline" className="flex-1 rounded-2xl" disabled={loading}>
                Back to Image
              </Button>
              <Button onClick={handleSubmit} className="flex-1 rounded-2xl" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StepBubble({ active, num, label }: { active: boolean; num: number; label: string }) {
  return (
    <div className={`flex flex-col items-center gap-2 ${active ? "text-slate-900 dark:text-slate-100" : "text-slate-400"}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${active ? "bg-blue-500 text-white" : "bg-slate-200 dark:bg-slate-700"}`}>
        {num}
      </div>
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}