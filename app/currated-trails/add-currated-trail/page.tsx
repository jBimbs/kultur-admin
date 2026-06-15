"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase"; // Make sure this path matches your setup

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Step = "stops" | "details" | "image" | "confirmation";

type Difficulty = "Easy" | "Moderate" | "Hard";

// New types for the stops
type Site = {
  id: number;
  name: string; // Change 'name' to 'title' if your sites table uses a different column
};

type TrailStop = {
  site_id: number;
  site_name: string;
  notes: string;
};

type AddPayload = {
  title: string;
  description: string;
  difficulty: Difficulty;
  duration: string;
  distance: string;
  imageFile: File;
  trailStops: TrailStop[];
};

export default function AddCurratedTrailPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("stops");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Step 1 data: Trail Stops ---
  const [availableSites, setAvailableSites] = useState<Site[]>([]);
  const [trailStops, setTrailStops] = useState<TrailStop[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [stopNotes, setStopNotes] = useState<string>("");

  // Fetch available sites on mount
  useEffect(() => {
    async function fetchSites() {
      // Adjust "name" to match your actual column in the sites table
      const { data, error } = await supabase.from("sites").select("id, name");
      if (data) setAvailableSites(data);
      if (error) console.error("Failed to fetch sites:", error);
    }
    fetchSites();
  }, []);

  // --- Step 2 data: Details ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");

  // --- Step 3 data: Image ---
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // --- Handlers ---
  const handleAddStop = () => {
    if (!selectedSiteId) return;

    const site = availableSites.find((s) => s.id.toString() === selectedSiteId);
    if (!site) return;

    const newStop: TrailStop = {
      site_id: site.id,
      site_name: site.name,
      notes: stopNotes.trim(),
    };

    setTrailStops([...trailStops, newStop]);
    setSelectedSiteId("");
    setStopNotes("");
  };

  const handleRemoveStop = (indexToRemove: number) => {
    setTrailStops(trailStops.filter((_, index) => index !== indexToRemove));
  };

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
    if (!imageFile) return setError("Please select an image");
    setStep("confirmation");
  };

  const handleSubmit = async () => {
    const payload: AddPayload | null =
      imageFile &&
      title.trim() &&
      description.trim() &&
      duration.trim() &&
      distance.trim() &&
      trailStops.length > 0
        ? {
            title: title.trim(),
            description: description.trim(),
            difficulty,
            duration: duration.trim(),
            distance: distance.trim(),
            imageFile,
            trailStops,
          }
        : null;

    if (!payload) {
      setError("Missing required fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("title", payload.title);
      formData.append("description", payload.description);
      formData.append("difficulty", payload.difficulty);
      formData.append("duration", payload.duration);
      formData.append("distance", payload.distance);
      formData.append("image", payload.imageFile);
      // Append stops as a JSON string so your API route can parse it
      formData.append("trailStops", JSON.stringify(payload.trailStops)); 

      const response = await fetch("/api/trails/add-trail", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to add trail");
      }

      router.push("/currated-trails/view-currated-trails");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Content Management
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Add Trail
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Add a new curated trail (stops, details + image) to your Supabase dataset.
          </p>
        </div>

        <Link href="/currated-trails/view-currated-trails">
          <Button variant="outline">Back to trails</Button>
        </Link>
      </div>

      {/* 4-Step Indicator */}
      <div className="flex gap-2 sm:gap-4 items-center justify-center overflow-x-auto pb-4">
        <StepBubble active={true} num={1} label="Stops" />
        <div className={`h-1 w-8 sm:w-12 ${step === "details" || step === "image" || step === "confirmation" ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-700"}`} />
        <StepBubble active={step === "details" || step === "image" || step === "confirmation"} num={2} label="Details" />
        <div className={`h-1 w-8 sm:w-12 ${step === "image" || step === "confirmation" ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-700"}`} />
        <StepBubble active={step === "image" || step === "confirmation"} num={3} label="Image" />
        <div className={`h-1 w-8 sm:w-12 ${step === "confirmation" ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-700"}`} />
        <StepBubble active={step === "confirmation"} num={4} label="Review" />
      </div>

      {/* Step 1: Trail Stops */}
      {step === "stops" && (
        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle>Route Map & Stops</CardTitle>
            <CardDescription>Select the sites that make up this curated trail.</CardDescription>
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
                  <option value="" disabled>-- Choose a site --</option>
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
              <Button 
                type="button" 
                variant="secondary" 
                onClick={handleAddStop}
                disabled={!selectedSiteId}
                className="w-full rounded-2xl"
              >
                Add Stop to Route
              </Button>
            </div>

            {trailStops.length > 0 ? (
              <div className="space-y-3 pt-4">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Current Route:</h4>
                {trailStops.map((stop, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-2xl gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">{stop.site_name}</span>
                      </div>
                      {stop.notes && <p className="text-xs text-slate-500 mt-2 pl-8">{stop.notes}</p>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveStop(idx)} className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl">
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">No stops added yet.</p>
            )}

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
                {error}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button onClick={handleStep1Submit} className="rounded-2xl px-8">
                Next: Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Details */}
      {step === "details" && (
        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle>Trail Details</CardTitle>
            <CardDescription>Enter the public-facing metadata for this trail.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Title *</label>
              <Input
                placeholder="e.g., Bonifacio Trial House"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-2xl"
              />
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
              <Input
                placeholder="e.g., 2h 30m"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Distance *</label>
              <Input
                placeholder="e.g., 5.2 km"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className="rounded-2xl"
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button onClick={() => setStep("stops")} variant="outline" className="flex-1 rounded-2xl">
                Back to Stops
              </Button>
              <Button onClick={handleStep2Submit} className="flex-1 rounded-2xl">
                Next: Upload Image
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Image upload */}
      {step === "image" && (
        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle>Upload Image</CardTitle>
            <CardDescription>Upload a high-quality image of the trail (max 5MB).</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Image *</label>
              <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 dark:border-slate-600 dark:bg-slate-800">
                <div className="text-center">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="mx-auto h-40 w-auto rounded-lg object-cover"
                      />

                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          id="trail-image-input"
                        />
                        <label
                          htmlFor="trail-image-input"
                          className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-700 dark:text-blue-400"
                        >
                          Change image
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-4xl">🥾</div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Drag and drop or click to select</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="trail-image-input"
                      />
                      <label htmlFor="trail-image-input" className="inline-block">
                        <span className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-700 dark:text-blue-400">
                          Browse files
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button onClick={() => setStep("details")} variant="outline" className="flex-1 rounded-2xl">
                Back to Details
              </Button>
              <Button onClick={handleStep3Submit} disabled={!imageFile} className="flex-1 rounded-2xl">
                Next: Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {step === "confirmation" && (
        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle>Review & Confirm</CardTitle>
            <CardDescription>Please review the trail details before adding.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4 sm:col-span-2">
                
                {/* Review Route */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Trail Route ({trailStops.length} stops)</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-slate-900 dark:text-slate-100 pl-2">
                    {trailStops.map((stop, idx) => (
                      <li key={idx} className="mb-1">
                        <span className="font-medium">{stop.site_name}</span> 
                        {stop.notes && <span className="text-slate-500 ml-2">({stop.notes})</span>}
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Title</p>
                  <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{title}</p>
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

              {imagePreview && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Image</p>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mt-2 h-48 w-full rounded-2xl object-cover"
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button onClick={() => setStep("image")} variant="outline" className="flex-1 rounded-2xl" disabled={loading}>
                Back to Image
              </Button>
              <Button onClick={handleSubmit} className="flex-1 rounded-2xl" disabled={loading}>
                {loading ? "Adding..." : "Add Trail"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function StepBubble({ active, num, label }: { active: boolean; num: number; label: string }) {
  return (
    <div
      className={`flex flex-col items-center gap-2 ${
        active ? "text-slate-900 dark:text-slate-100" : "text-slate-400"
      }`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${
          active ? "bg-blue-500 text-white" : "bg-slate-200 dark:bg-slate-700"
        }`}
      >
        {num}
      </div>
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}