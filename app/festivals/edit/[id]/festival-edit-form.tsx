"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Festival = {
  id: number;
  name: string | null;
  description: string | null;
  city: string | null;
  month_celebrated: string | null;
  image_url: string | null;
};

export default function FestivalEditForm({ festival }: { festival: Festival }) {
  const router = useRouter();
  const [name, setName] = useState(festival.name || "");
  const [description, setDescription] = useState(festival.description || "");
  const [city, setCity] = useState(festival.city || "");
  const [month, setMonth] = useState(festival.month_celebrated || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim() || !description.trim()) {
      setError("Name and description are required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/festivals/update-festival", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: festival.id,
          name: name.trim(),
          description: description.trim(),
          city: city.trim(),
          month_celebrated: month.trim(),
        }),
      });

      const body = await res.json();
      if (!res.ok || body.error) {
        setError(body.error || "Failed to update festival.");
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/festivals/view-festivals"), 2000);
      }
    } catch (err) {
      setError("Unexpected error updating festival.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      {festival.image_url ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
          <img src={festival.image_url} alt={festival.name || "Festival image"} className="h-72 w-full object-cover" />
        </div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="festival-name">
            Festival name
          </label>
          <Input id="festival-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Festival name" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="festival-city">
            City
          </label>
          <Input id="festival-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="festival-description">
          Description
        </label>
        <textarea
          id="festival-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[140px] w-full rounded-3xl border border-input bg-transparent px-3 py-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="Festival description"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-1">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="festival-month">
            Month celebrated
          </label>
          <Input id="festival-month" value={month} onChange={(e) => setMonth(e.target.value)} placeholder="Month celebrated" />
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          Festival updated. Redirecting to festivals list...
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button variant="outline" onClick={() => router.push("/festivals/view-festivals")} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
