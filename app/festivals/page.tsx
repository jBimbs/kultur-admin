import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default function FestivalsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Festivals
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Festival data and management
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Display festival information, celebration dates, and event details from your Supabase dataset.
            </p>
          </div>
          <Link href="/">
            <Button variant="outline">Back to dashboard</Button>
          </Link>
        </div>

        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle>Festivals</CardTitle>
            <CardDescription>Placeholder page for festival content.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              This page is ready for festival listings. Tie it into your festival table so users can browse and manage event records.
            </p>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Add search, filters, and detail views for festival information on this page.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
