"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AdminSession = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  suffix?: string | null;
  city?: string | null;
};


export default function ViewProfilePage() {
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/session", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          const msg = payload?.error || `Failed to load profile (HTTP ${res.status})`;
          throw new Error(msg);
        }

        const data = (await res.json()) as AdminSession;
        if (!mounted) return;

        setAdmin(data);
      } catch (e) {
        if (!mounted) return;
        setAdmin(null);
        setError(e instanceof Error ? e.message : "Failed to load profile");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const fullName = admin
    ? [admin.first_name, admin.last_name].filter(Boolean).join(" ")
    : "";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Profile
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Admin Profile</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Information of the currently logged-in admin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="outline">Back to dashboard</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-600">Loading profile…</div>
      ) : error ? (
        <div className="text-center py-8 text-rose-600">{error}</div>
      ) : !admin ? (
        <div className="text-center py-8 text-slate-600">No admin session found.</div>
      ) : (
        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="relative">
            <div className="absolute right-3 top-4">
              <Link href="/profile/edit-profile">
                <Button>Edit profile</Button>
              </Link>
            </div>
            <CardTitle className="pt-2 text-lg">
              {fullName || "Unnamed admin"}
              {admin.suffix ? (
                <span className="ml-2 text-sm text-slate-500">{admin.suffix}</span>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <span className="text-slate-500">City Positioned:</span>{" "}
              <span className="font-medium">{admin.city || "Unknown"}</span>
            </div>
            <div className="text-sm">
              <span className="text-slate-500">Email:</span>{" "}
              <span className="font-medium">{admin.email || "—"}</span>
            </div>
            
            <div className="text-sm">
              <span className="text-slate-500">Password:</span>{" "}
              <span className="font-medium">{(admin as any).password || "Unknown"}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

