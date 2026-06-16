"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

const CATEGORIES = ["Church", "House", "Monument", "Site"];

export default function AddSitePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateStep = () => {
    if (step === 1) {
      if (!name.trim() || !description.trim() || !city.trim()) {
        setError("Name, description, and city are required.");
        return false;
      }
    }

    if (step === 2) {
      if (!category || !latitude.trim() || !longitude.trim()) {
        setError("Category, latitude, and longitude are required.");
        return false;
      }

      if (Number.isNaN(Number(latitude)) || Number.isNaN(Number(longitude))) {
        setError("Latitude and longitude must be valid numbers.");
        return false;
      }
    }

    if (step === 3) {
      if (!imageFile) {
        setError("Please select an image for the site.");
        return false;
      }
    }

    setError(null);
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((current) => Math.min(current + 1, 4));
  };

  const handleBack = () => {
    setError(null);
    setStep((current) => Math.max(current - 1, 1));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);
    setError(null);

    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    setError(null);

    try {
      const file = imageFile;
      if (!file) {
        setError("Please select an image before proceeding.");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("description", description.trim());
      formData.append("city", city.trim());
      formData.append("category", category);
      formData.append("latitude", latitude);
      formData.append("longitude", longitude);
      formData.append("image", file);

      const response = await fetch("/api/historical-sites/add-site", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        setError(result.error || "Site creation failed.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      setTimeout(() => {
        router.push("/historical-sites/view-sites");
      }, 2000);
    } catch (err) {
      setError("An unexpected error occurred while adding the site.");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Add Historical Site
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Step {step} of 4
        </h1>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="site-name">
                Site name
              </label>
              <Input
                id="site-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Name of the site"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="site-description">
                Description
              </label>
              <textarea
                id="site-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-[120px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                placeholder="Describe the site and its importance"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="site-city">
                City
              </label>
              <Input
                id="site-city"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="City where the site is located"
                required
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="site-category">
                Category
              </label>
              <select
                id="site-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950"
                required
              >
                <option value="" disabled>Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="site-latitude">
                  Latitude
                </label>
                <Input
                  id="site-latitude"
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(event) => setLatitude(event.target.value)}
                  placeholder="Latitude"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="site-longitude">
                  Longitude
                </label>
                <Input
                  id="site-longitude"
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(event) => setLongitude(event.target.value)}
                  placeholder="Longitude"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="site-image">
                Site image
              </label>
              <Input
                id="site-image"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required
              />
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Uploads to Supabase storage bucket <span className="font-mono bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded text-slate-600 dark:text-slate-300">KulturAR-assets</span> inside folder <span className="font-mono bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded text-slate-600 dark:text-slate-300">SITES</span>. Max 5MB.
              </p>
            </div>
            {imagePreview ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <img src={imagePreview} alt="Selected site" className="max-h-64 w-full rounded-xl object-cover" />
              </div>
            ) : null}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Review the site information before proceeding.
            </p>
            <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-900">
              <div>
                <strong>Name:</strong> {name}
              </div>
              <div>
                <strong>Description:</strong> {description}
              </div>
              <div>
                <strong>City:</strong> {city}
              </div>
              <div>
                <strong>Category:</strong> {category}
              </div>
              <div>
                <strong>Latitude:</strong> {latitude}
              </div>
              <div>
                <strong>Longitude:</strong> {longitude}
              </div>
              {imagePreview ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
                  <img src={imagePreview} alt="Site preview" className="max-h-64 w-full rounded-xl object-cover" />
                </div>
              ) : null}
            </div>
          </div>
        )}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            Site added successfully. Redirecting to view sites...
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBack} disabled={step === 1 || loading}>
              Back
            </Button>
            {step < 4 ? (
              <Button onClick={handleNext} disabled={loading}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Adding site..." : "Proceed"}
              </Button>
            )}
          </div>
          <Link href="/historical-sites/view-sites" className="text-sm text-slate-600 underline hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}