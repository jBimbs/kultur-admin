"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function AddFestivalPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [month, setMonth] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longlitude, setLongitude] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateStep = () => {
    if (step === 1) {
      if (!name.trim() || !description.trim()) {
        setError("Name and description are required.");
        return false;
      }
    }

    if (step === 2) {
      if (!city.trim() || !month.trim()) {
        setError("City and month celebrated are required.");
        return false;
      }

      if (latitude && Number.isNaN(Number(latitude))) {
        setError("Latitude must be a valid number.");
        return false;
      }

      if (longlitude && Number.isNaN(Number(longlitude))) {
        setError("Longitude must be a valid number.");
        return false;
      }
    }

    if (step === 3) {
      if (!imageFile) {
        setError("Please select an image for the festival.");
        return false;
      }
    }

    setError(null);
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, 3));
  };

  const handleBack = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);
    setError(null);

    if (file) setImagePreview(URL.createObjectURL(file));
    else setImagePreview(null);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    setError(null);

    try {
      const file = imageFile;
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("description", description.trim());
      formData.append("city", city.trim());
      formData.append("month_celebrated", month.trim());
      if (latitude) formData.append("latitude", latitude);
      if (longlitude) formData.append("longlitude", longlitude);
      if (file) formData.append("image", file);

      const res = await fetch("/api/festivals/add-festival", {
        method: "POST",
        body: formData,
      });

      const body = await res.json();
      if (!res.ok || body.error) {
        setError(body.error || "Failed to add festival.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      setTimeout(() => {
        router.push("/festivals/view-festivals");
      }, 2000);
    } catch (err) {
      setError("Unexpected error while adding festival.");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Add Festival</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Step {step} of 3</h1>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="festival-name">Festival name</label>
              <Input id="festival-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name of the festival" required />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="festival-description">Description</label>
              <textarea id="festival-description" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[120px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" placeholder="Describe the festival" required />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="festival-city">City</label>
              <Input id="festival-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City where celebrated" required />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="festival-month">Month celebrated</label>
              <Input id="festival-month" value={month} onChange={(e) => setMonth(e.target.value)} placeholder="e.g. March" required />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="festival-lat">Latitude</label>
                <Input id="festival-lat" type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="Latitude" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="festival-lng">Longitude</label>
                <Input id="festival-lng" type="number" step="any" value={longlitude} onChange={(e) => setLongitude(e.target.value)} placeholder="Longitude" />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="festival-image">Festival image</label>
              <Input id="festival-image" type="file" accept="image/*" onChange={handleFileChange} required />
            </div>

            {imagePreview ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <img src={imagePreview} alt="Selected festival" className="max-h-64 w-full rounded-xl object-cover" />
              </div>
            ) : null}
          </div>
        )}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">{error}</div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">Festival has been added. Redirecting...</div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBack} disabled={step === 1 || loading}>Back</Button>
            {step < 3 ? (
              <Button onClick={handleNext} disabled={loading}>Next</Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Adding festival...' : 'Proceed'}</Button>
            )}
          </div>
          <Link href="/festivals/view-festivals" className="text-sm text-slate-600 underline hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">Cancel</Link>
        </div>
      </div>
    </div>
  );
}
