"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { UserPieChart } from "@/components/user-pie-chart";

type ChartData = {
  name: string;
  value: number;
  color: string;
};

type Timeframe =
  | "Today"
  | "Yesterday"
  | "This Week"
  | "Last Week"
  | "This Month"
  | "Last Month"
  | "This Year"
  | "Last Year";

const TIMEFRAMES: Timeframe[] = [
  "Today",
  "Yesterday",
  "This Week",
  "Last Week",
  "This Month",
  "Last Month",
  "This Year",
  "Last Year",
];

const TIMEFRAME_BUCKETS: Record<Timeframe, Array<string>> = {
  Today: ["Today"],
  Yesterday: ["Yesterday"],
  "This Week": ["Today", "Yesterday", "This Week"],
  "Last Week": ["Last Week"],
  "This Month": ["Today", "Yesterday", "This Week", "This Month"],
  "Last Month": ["Last Month"],
  "This Year": ["Today", "Yesterday", "This Week", "This Month", "This Year"],
  "Last Year": ["Last Year"],
};

function filterDataByTimeframe(data: ChartData[], timeframe: Timeframe) {
  const buckets = TIMEFRAME_BUCKETS[timeframe] ?? [];
  return data.filter((entry) => buckets.includes(entry.name));
}

export function PieChartFilter({
  createdPieData,
  activePieData,
}: {
  createdPieData: ChartData[];
  activePieData: ChartData[];
}) {
  const availableTimeframes = useMemo(
    () =>
      TIMEFRAMES.filter((timeframe) =>
        createdPieData.some((entry) => entry.name === timeframe) ||
        activePieData.some((entry) => entry.name === timeframe)
      ),
    [createdPieData, activePieData]
  );

  const [timeframe, setTimeframe] = useState<Timeframe>("This Month");

  useEffect(() => {
    if (availableTimeframes.length === 0) {
      return;
    }

    if (!availableTimeframes.includes(timeframe)) {
      setTimeframe(availableTimeframes[0]);
    }
  }, [availableTimeframes, timeframe]);

  const createdData = useMemo(
    () => filterDataByTimeframe(createdPieData, timeframe),
    [createdPieData, timeframe]
  );
  const activeData = useMemo(
    () => filterDataByTimeframe(activePieData, timeframe),
    [activePieData, timeframe]
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Timeframe filter
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
            Showing {timeframe} data
          </h2>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              {timeframe}
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Select timeframe</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {availableTimeframes.map((option) => (
              <DropdownMenuItem
                key={option}
                onSelect={() => setTimeframe(option)}
                className="flex items-center justify-between"
              >
                <span>{option}</span>
                {timeframe === option ? (
                  <CheckIcon className="h-4 w-4 text-slate-900 dark:text-slate-100" />
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle>Users Created</CardTitle>
            <CardDescription>Distribution of user creation dates for the selected window.</CardDescription>
          </CardHeader>
          <CardContent>
            <UserPieChart data={createdData} />
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle>Active Users</CardTitle>
            <CardDescription>Distribution of sign-in activity for the selected window.</CardDescription>
          </CardHeader>
          <CardContent>
            <UserPieChart data={activeData} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
