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

export default function ArtifactsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Artifacts
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Artifact catalog management
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Showcase artifact records and maintain the inventory of cultural objects from your backend.
            </p>
          </div>
          <Link href="/">
            <Button variant="outline">Back to dashboard</Button>
          </Link>
        </div>

        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle>Artifacts</CardTitle>
            <CardDescription>Placeholder page for artifacts content.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              This page can display artifacts, images, descriptions, and metadata from your Supabase table.
            </p>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Add editing workflows, detail views, and filtering for artifact records here.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
