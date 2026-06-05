"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

type Step = "details" | "image" | "confirmation";

export default function AddLocalCuisinesPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Step 1 data
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cityOrigin, setCityOrigin] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleStep1Submit = () => {
    setError(null);
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!description.trim()) {
      setError("Description is required");
      return;
    }
    if (!cityOrigin.trim()) {
      setError("City of origin is required");
      return;
    }
    setStep("image");
  };

  const handleStep2Submit = () => {
    setError(null);
    if (!imageFile) {
      setError("Please select an image");
      return;
    }
    setStep("confirmation");
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("city_origin", cityOrigin);
      formData.append("image", imageFile!);

      const response = await fetch("/api/local-cuisines/add", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to add cuisine");
      }

      // Redirect to cuisines view
      router.push("/local-cuisines/view-local-cuisines");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
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
            Add Cuisine
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Add a new local cuisine to your collection with details and image.
          </p>
        </div>
        <Link href="/local-cuisines/view-local-cuisines">
          <Button variant="outline">Back to cuisines</Button>
        </Link>
      </div>

      {/* Step Indicator */}
      <div className="flex gap-4 items-center justify-center">
        <div className={`flex flex-col items-center gap-2 ${step === "details" || step === "image" || step === "confirmation" ? "text-slate-900 dark:text-slate-100" : "text-slate-400"}`}>
          <div className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${step === "details" || step === "image" || step === "confirmation" ? "bg-blue-500 text-white" : "bg-slate-200 dark:bg-slate-700"}`}>
            1
          </div>
          <span className="text-xs font-medium">Details</span>
        </div>

        <div className={`h-1 w-12 ${(step === "image" || step === "confirmation") ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-700"}`} />

        <div className={`flex flex-col items-center gap-2 ${step === "image" || step === "confirmation" ? "text-slate-900 dark:text-slate-100" : "text-slate-400"}`}>
          <div className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${step === "image" || step === "confirmation" ? "bg-blue-500 text-white" : "bg-slate-200 dark:bg-slate-700"}`}>
            2
          </div>
          <span className="text-xs font-medium">Image</span>
        </div>

        <div className={`h-1 w-12 ${step === "confirmation" ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-700"}`} />

        <div className={`flex flex-col items-center gap-2 ${step === "confirmation" ? "text-slate-900 dark:text-slate-100" : "text-slate-400"}`}>
          <div className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${step === "confirmation" ? "bg-blue-500 text-white" : "bg-slate-200 dark:bg-slate-700"}`}>
            3
          </div>
          <span className="text-xs font-medium">Review</span>
        </div>
      </div>

      {/* Step 1: Details */}
      {step === "details" && (
        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle>Cuisine Details</CardTitle>
            <CardDescription>Enter the basic information about the cuisine.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Name *</label>
              <Input
                placeholder="e.g., Adobong Manok"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description *</label>
              <textarea
                placeholder="Describe the cuisine, its ingredients, preparation method, and significance..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400"
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">City of Origin *</label>
              <Input
                placeholder="e.g., Manila, Cebu, Davao"
                value={cityOrigin}
                onChange={(e) => setCityOrigin(e.target.value)}
                className="rounded-2xl"
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Link href="/local-cuisines/view-local-cuisines" className="flex-1">
                <Button variant="outline" className="w-full rounded-2xl">
                  Cancel
                </Button>
              </Link>
              <Button onClick={handleStep1Submit} className="flex-1 rounded-2xl">
                Next: Upload Image
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Image Upload */}
      {step === "image" && (
        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle>Upload Image</CardTitle>
            <CardDescription>Upload a high-quality image of the cuisine (max 5MB).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Image *</label>
              <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 dark:border-slate-600 dark:bg-slate-800">
                <div className="text-center">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img src={imagePreview} alt="Preview" className="mx-auto h-40 w-auto rounded-lg" />
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          id="image-input"
                        />
                        <label htmlFor="image-input" className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-700 dark:text-blue-400">
                          Change image
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-4xl">🍲</div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Drag and drop or click to select</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-input"
                      />
                      <label htmlFor="image-input" className="inline-block">
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

            <div className="flex gap-3 pt-4">
              <Button onClick={() => setStep("details")} variant="outline" className="flex-1 rounded-2xl">
                Back
              </Button>
              <Button onClick={handleStep2Submit} disabled={!imageFile} className="flex-1 rounded-2xl">
                Next: Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirmation */}
      {step === "confirmation" && (
        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle>Review & Confirm</CardTitle>
            <CardDescription>Please review the cuisine details before adding.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4 sm:col-span-2">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Name</p>
                  <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Description</p>
                  <p className="mt-1 text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap">{description}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">City of Origin</p>
                  <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{cityOrigin}</p>
                </div>
              </div>
              {imagePreview && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Image</p>
                  <img src={imagePreview} alt="Preview" className="mt-2 h-48 w-full rounded-2xl object-cover" />
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button onClick={() => setStep("image")} variant="outline" className="flex-1 rounded-2xl" disabled={loading}>
                Back
              </Button>
              <Button onClick={handleSubmit} className="flex-1 rounded-2xl" disabled={loading}>
                {loading ? "Adding..." : "Add Cuisine"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
