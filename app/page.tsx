"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle,CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function Reveal({
  children,
  delayMs = 0,
}: {
  children: React.ReactNode;
  delayMs?: number;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), delayMs);
    return () => window.clearTimeout(t);
  }, [delayMs]);

  return (
    <div
      className="will-change-transform"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0px)" : "translateY(10px)",
        transition:
          "transform 500ms cubic-bezier(0.22, 1, 0.36, 1), opacity 500ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {children}
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = searchParams.get("redirect") ?? "/dashboard";

  useEffect(() => {
    const checkSession = async () => {
      const sessionCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("admin_session="));
      if (sessionCookie) {
        router.replace(callbackUrl);
      }
    };

    checkSession();
  }, [router, callbackUrl]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const validationResponse = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const validationResult = await validationResponse.json();

    if (!validationResponse.ok || validationResult.error) {
      setError(validationResult.error || "Invalid credentials.");
      setLoading(false);
      return;
    }

    router.replace(callbackUrl);
  }

  return (
    <div className="w-full max-w-xl p-6">
      <Card className="w-full rounded-[2rem] border border-slate-200 bg-[#f1f1f1] p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900/95">
        <CardHeader className="space-y-4 pb-4">
          <Reveal delayMs={0}>
            <div className="flex items-center justify-center">
              <img
                src="/original-logo.png"
                alt="Admin login logo"
                className="h-32 w-auto object-contain sm:h-36"
                draggable={false}
              />
            </div>
          </Reveal>

          <Reveal delayMs={120}>
            <CardTitle className="text-center text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
              Admin Login
            </CardTitle>
          </Reveal>
          <Reveal delayMs={220}>
            <CardDescription className="text-center text-slate-600 dark:text-slate-400">
              Enter your credentials to access the KulturAR dashboard.
            </CardDescription>
          </Reveal>
        </CardHeader>

        <CardContent className="px-2 sm:px-6">
          <Reveal delayMs={220}>
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-slate-700 dark:text-slate-300"
                  htmlFor="email"
                >
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@kulturar.com"
                  className="h-12 rounded-xl border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-950"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-slate-700 dark:text-slate-300"
                  htmlFor="password"
                >
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-950"
                  required
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
                  {error}
                </div>
              ) : null}

              <div className="pt-2">
                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl border-0 bg-gradient-to-r from-[#69b35a] to-[#cbe34c] font-semibold text-slate-900 transition-opacity hover:opacity-90 dark:text-slate-950"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign-in"}
                </Button>
              </div>
            </form>
          </Reveal>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div
      className="absolute inset-0 z-0 flex min-h-screen w-full items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      <Suspense
        fallback={
          <div className="rounded-md bg-white/80 px-4 py-2 font-medium shadow-sm backdrop-blur-sm">
            Loading...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}