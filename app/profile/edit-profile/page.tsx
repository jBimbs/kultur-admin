"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AdminSession = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  suffix?: string | null;
  city?: string | null;
};

export default function EditProfilePage() {
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [passwordVisible, setPasswordVisible] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const res = await fetch("/api/session", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          throw new Error(payload?.error || `Failed to load profile (HTTP ${res.status})`);
        }

        const data = (await res.json()) as AdminSession;
        if (!mounted) return;

        setAdmin(data);
        setFirstName(data.first_name ?? "");
        setLastName(data.last_name ?? "");
        setSuffix(data.suffix ?? "");
        setCity(data.city ?? "");
        setEmail(data.email ?? "");
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!admin) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        id: admin.id,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        suffix: suffix.trim() ? suffix.trim() : null,
        city: city.trim() ? city.trim() : null,
        email: email.trim() || null,
        // password optional: only send when user typed something
        password: password.trim() ? password.trim() : null,
      };

      const res = await fetch("/api/admin/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || `Failed to update profile (HTTP ${res.status})`);
      }

      setSuccess("Profile updated successfully.");
      setPassword("");

      // Refresh local data
      const reload = await fetch("/api/session", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (reload.ok) {
        const refreshed = (await reload.json()) as AdminSession;
        setAdmin(refreshed);
        setFirstName(refreshed.first_name ?? "");
        setLastName(refreshed.last_name ?? "");
        setSuffix(refreshed.suffix ?? "");
        setCity(refreshed.city ?? "");
        setEmail(refreshed.email ?? "");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  const submitDisabled = loading || saving;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Profile
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Edit profile</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Update your personal information.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/profile/view-profile">
            <Button variant="outline">Back to profile</Button>
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
          <CardHeader>
            <CardTitle className="text-lg">Admin information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              {success ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  {success}
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    autoComplete="given-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="suffix">Suffix (optional)</Label>
                  <Input
                    id="suffix"
                    value={suffix}
                    onChange={(e) => setSuffix(e.target.value)}
                    placeholder="e.g. Jr."
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City Positioned</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    autoComplete="address-level2"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password (leave empty to keep current)</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={passwordVisible ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New password"
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-900"
                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                    onClick={() => setPasswordVisible((v) => !v)}
                  >
                    <img
                      src="/hide.png"
                      alt={passwordVisible ? "Hide password" : "Show password"}
                      className="h-4 w-4"
                    />

                  </button>

                </div>
              </div>


              {error ? <div className="text-sm text-rose-600">{error}</div> : null}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitDisabled}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

