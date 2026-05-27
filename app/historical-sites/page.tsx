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

export default function HistoricalSitesPage() {
  return (
    <>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Historical Sites
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Manage historical site entries
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              View and maintain the list of sites, monuments, and locations that are important to local heritage.
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Back to dashboard</Button>
          </Link>
        </div>

        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle>Historical Sites</CardTitle>
            <CardDescription>Placeholder page for historical site content.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              This page is ready for your site listing or management UI. Connect it to your historical sites table or API to show the full inventory here.
            </p>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              You can add filters, search, and edit controls for historical site records from this page.
            </p>
          </CardFooter>
        </Card>
    </>
  );
}
