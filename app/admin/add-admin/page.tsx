"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";



function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium">
      {children}
    </label>
  );
}

const Label = FieldLabel;






type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message?: string }
  | { status: "error"; message: string };

export default function AddAdminPage() {
  const router = useRouter();

  const [city, setCity] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });

  const canSubmit = useMemo(() => {
    const cityOk = city.trim().length > 0;
    const firstOk = firstName.trim().length > 0;
    const lastOk = lastName.trim().length > 0;
    const emailOk = email.trim().length > 0;
    const passOk = password.length > 0;
    const confirmOk = confirmPassword.length > 0;
    const matchOk = password === confirmPassword;
    return cityOk && firstOk && lastOk && emailOk && passOk && confirmOk && matchOk;
  }, [city, firstName, lastName, email, password, confirmPassword]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const cityValue = city.trim();
    const firstNameValue = firstName.trim();
    const lastNameValue = lastName.trim();
    const suffixValue = suffix.trim();
    const emailValue = email.trim().toLowerCase();

    if (!cityValue || !firstNameValue || !lastNameValue || !emailValue || !password || !confirmPassword) {
      setSubmitState({ status: "error", message: "Please fill in all required fields." });
      return;
    }

    if (password !== confirmPassword) {
      setSubmitState({ status: "error", message: "Password and confirm password do not match." });
      return;
    }

    setSubmitState({ status: "submitting" });

    try {
      // Lightweight client-side check for existing admin email (optional but helpful)
      // Uses anon supabase (same style as view-admin page).
      const { data: existing, error: existingErr } = await supabase
        .from("admin")
        .select("id")
        .eq("email", emailValue)
        .maybeSingle();

      if (existingErr) {
        // Non-fatal; proceed to API.
      } else if (existing) {
        setSubmitState({ status: "error", message: "An admin with this email already exists." });
        return;
      }

      const res = await fetch("/api/admin/add-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: cityValue,
          first_name: firstNameValue,
          last_name: lastNameValue,
          suffix: suffixValue ? suffixValue : undefined,
          email: emailValue,
          password,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string; success?: boolean; message?: string };

      if (!res.ok) {
        setSubmitState({ status: "error", message: data?.error || "Failed to create admin." });
        return;
      }

      setSubmitState({ status: "success", message: data?.message || "Admin created successfully." });

      // Redirect after a short delay so the user can see success.
      setTimeout(() => {
        router.push("/admin/view-admin");
      }, 500);
    } catch (err) {
      setSubmitState({ status: "error", message: "Request failed. Please try again." });
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Admin Management
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Add admin</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Create a new administrator in the Supabase <span className="font-medium">admin</span> table.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="outline">Back to dashboard</Button>
          </Link>
          <Link href="/admin/view-admin">
            <Button variant="outline">View admins</Button>
          </Link>
        </div>
      </div>

      <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-xl">Admin details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label htmlFor="city" className="text-sm font-medium">Which city positioned? (city)</label>
                    <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Manila" />
                  </div>
                </div>
              </div>


            <div>
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                autoComplete="given-name"
              />
            </div>

            <div>
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                autoComplete="family-name"
              />
            </div>

            <div>
              <Label htmlFor="suffix">Suffix (optional)</Label>
              <Input
                id="suffix"
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
                placeholder="Jr., Sr., III, ..."
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            <div className="sm:col-span-2">
              {submitState.status === "error" ? (
                <div className="mb-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                  {submitState.message}
                </div>
              ) : submitState.status === "success" ? (
                <div className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                  {submitState.message || "Success"}
                </div>
              ) : null}

              {password && confirmPassword && password !== confirmPassword ? (
                <div className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                  Passwords must match.
                </div>
              ) : null}

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-end">
                <Button
                  type="submit"
                  disabled={!canSubmit || submitState.status === "submitting"}
                  className="sm:w-auto"
                >
                  {submitState.status === "submitting" ? "Creating..." : "Create admin"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

