import { supabaseAdmin } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { PieChartFilter } from "@/components/pie-chart-filter";

type SupabaseAuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  last_sign_in_at?: string | null;
};

function parseDate(dateStr?: string | null) {
  return dateStr ? new Date(dateStr) : null;
}

function countSince(
  users: SupabaseAuthUser[],
  cutoff: Date,
  key: "created_at" | "last_sign_in_at" = "created_at"
) {
  return users.filter((user) => {
    const dateStr = user[key];
    const dateObj = parseDate(typeof dateStr === "string" ? dateStr : null);
    return dateObj ? dateObj >= cutoff : false;
  }).length;
}

function countBetween(
  users: SupabaseAuthUser[],
  start: Date,
  end: Date,
  key: "created_at" | "last_sign_in_at" = "created_at"
) {
  return users.filter((user) => {
    const dateStr = user[key];
    const dateObj = parseDate(typeof dateStr === "string" ? dateStr : null);
    return dateObj ? dateObj >= start && dateObj < end : false;
  }).length;
}

function countBefore(
  users: SupabaseAuthUser[],
  cutoff: Date,
  key: "created_at" | "last_sign_in_at" = "created_at"
) {
  return users.filter((user) => {
    const dateStr = user[key];
    const dateObj = parseDate(typeof dateStr === "string" ? dateStr : null);
    return dateObj ? dateObj < cutoff : false;
  }).length;
}

function startOfToday(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date) {
  const day = date.getDay();
  const start = new Date(date);
  start.setDate(date.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start;
}

function startOfPreviousWeek(date: Date) {
  const currentWeekStart = startOfWeek(date);
  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(currentWeekStart.getDate() - 7);
  return previousWeekStart;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfPreviousMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}
function startOfYesterday(date: Date) {
  const yesterday = new Date(date);
  yesterday.setDate(date.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  return yesterday;
}
function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1);
}

function startOfPreviousYear(date: Date) {
  return new Date(date.getFullYear() - 1, 0, 1);
}

type FetchResult = {
  users: SupabaseAuthUser[];
  fetchError?: string;
};

async function fetchUsers(): Promise<FetchResult> {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ limit: 100 });

  if (error) {
    return {
      users: [],
      fetchError: `Supabase user fetch failed: ${error.message}`,
    };
  }

  return {
    users: data?.users ?? [],
  };
}

export default async function AdminDashboard() {
  const { users, fetchError } = await fetchUsers();
  const now = new Date();
  const todayStart = startOfToday(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  const totalUsers = users.length;
  const yesterdayStart = startOfYesterday(now);
  const lastWeekStart = startOfPreviousWeek(now);
  const lastMonthStart = startOfPreviousMonth(now);
  const lastYearStart = startOfPreviousYear(now);

  const usersToday = countBetween(users, todayStart, now);
  const usersYesterday = countBetween(users, yesterdayStart, todayStart);
  const usersThisWeek = countBetween(users, weekStart, yesterdayStart);
  const usersLastWeek = countBetween(users, lastWeekStart, weekStart);
  const usersThisMonth = countBetween(users, monthStart, weekStart);
  const usersLastMonth = countBetween(users, lastMonthStart, monthStart);
  const usersThisYear = countBetween(users, yearStart, monthStart);
  const usersLastYear = countBetween(users, lastYearStart, yearStart);
  const usersOlder = countBefore(users, lastYearStart);

  const usersThisWeekTotal = countSince(users, weekStart);
  const usersThisMonthTotal = countSince(users, monthStart);
  const usersThisYearTotal = countSince(users, yearStart);

  const activeToday = countBetween(users, todayStart, now, "last_sign_in_at");
  const activeYesterday = countBetween(users, yesterdayStart, todayStart, "last_sign_in_at");
  const activeThisWeek = countBetween(users, weekStart, yesterdayStart, "last_sign_in_at");
  const activeLastWeek = countBetween(users, lastWeekStart, weekStart, "last_sign_in_at");
  const activeThisMonth = countBetween(users, monthStart, weekStart, "last_sign_in_at");
  const activeLastMonth = countBetween(users, lastMonthStart, monthStart, "last_sign_in_at");
  const activeThisYear = countBetween(users, yearStart, monthStart, "last_sign_in_at");
  const activeLastYear = countBetween(users, lastYearStart, yearStart, "last_sign_in_at");
  const activeOlder = countBefore(users, lastYearStart, "last_sign_in_at");

  const createdPieData = [
    { name: "Today", value: usersToday, color: "#3b82f6" },
    { name: "Yesterday", value: Math.max(0, usersYesterday), color: "#1d4ed8" },
    { name: "This Week", value: Math.max(0, usersThisWeek), color: "#60a5fa" },
    { name: "Last Week", value: Math.max(0, usersLastWeek), color: "#2563eb" },
    { name: "This Month", value: Math.max(0, usersThisMonth), color: "#818cf8" },
    { name: "Last Month", value: Math.max(0, usersLastMonth), color: "#4f46e5" },
    { name: "This Year", value: Math.max(0, usersThisYear), color: "#93c5fd" },
    { name: "Last Year", value: Math.max(0, usersLastYear), color: "#6366f1" },
    { name: "Older", value: Math.max(0, usersOlder), color: "#e2e8f0" },
  ].filter((d) => d.value > 0);

  const activePieData = [
    { name: "Today", value: activeToday, color: "#10b981" },
    { name: "Yesterday", value: Math.max(0, activeYesterday), color: "#0f766e" },
    { name: "This Week", value: Math.max(0, activeThisWeek), color: "#34d399" },
    { name: "Last Week", value: Math.max(0, activeLastWeek), color: "#047857" },
    { name: "This Month", value: Math.max(0, activeThisMonth), color: "#6ee7b7" },
    { name: "Last Month", value: Math.max(0, activeLastMonth), color: "#059669" },
    { name: "This Year", value: Math.max(0, activeThisYear), color: "#a7f3d0" },
    { name: "Last Year", value: Math.max(0, activeLastYear), color: "#15803d" },
    { name: "Older", value: Math.max(0, activeOlder), color: "#e2e8f0" },
  ].filter((d) => d.value > 0);

  const foreignersCount = users.filter((u) => u.user_metadata?.origin_type === "Foreigner").length;
  const filipinoCount = users.filter((u) => u.user_metadata?.origin_type === "Filipino" || u.user_metadata?.origin_type === "Local").length;
  const unknownOriginCount = Math.max(0, totalUsers - foreignersCount - filipinoCount);

  const originPieData = [
    { name: "Foreigner", value: foreignersCount, color: "#f59e0b" },
    { name: "Filipino", value: filipinoCount, color: "#3b82f6" },
    { name: "Unknown", value: unknownOriginCount, color: "#94a3b8" },
  ].filter((d) => d.value > 0);

  const stats = [
    {
      label: "Total users",
      value: totalUsers.toString(),
      description: "All registered auth users in your Database",
    },
    {
      label: "Filipino",
      value: filipinoCount.toString(),
      description: "Total users identified as Filipino by origin type",
    },
    {
      label: "Foreigners",
      value: foreignersCount.toString(),
      description: "Total users identified as foreigners by origin type",
    },
    {
      label: "New today",
      value: usersToday.toString(),
      description: "Users created in the last 24 hours",
    },
    {
      label: "New this week",
      value: usersThisWeekTotal.toString(),
      description: "Users created since the start of this week",
    },
    {
      label: "New this month",
      value: usersThisMonthTotal.toString(),
      description: "Users created since the start of this month",
    },
    {
      label: "New this year",
      value: usersThisYearTotal.toString(),
      description: "Users created since the start of this year",
    },
  ];

  const periodCounts = [
    { period: "Daily", value: usersToday.toString() },
    { period: "Weekly", value: usersThisWeekTotal.toString() },
    { period: "Monthly", value: usersThisMonthTotal.toString() },
    { period: "Yearly", value: usersThisYearTotal.toString() },
  ];

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Admin dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            User overview & growth metrics
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Monitor new user signups, active accounts, and user creation trends by day, week, month, and year.
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="w-full sm:w-auto">Export report</Button>
          <LogoutButton />
        </div>
      </section>

      {fetchError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
          <p className="font-semibold">Unable to load Database user data</p>
          <p>{fetchError}</p>
          <p className="mt-2 text-xs text-rose-700 dark:text-rose-300">
            Make sure your `SUPABASE_SERVICE_ROLE_KEY` is the correct service role key.
          </p>
        </div>
      ) : null}

      <PieChartFilter 
        createdPieData={createdPieData} 
        activePieData={activePieData} 
        originPieData={originPieData}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <CardHeader>
              <CardTitle>{stat.value}</CardTitle>
              <CardDescription>{stat.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle>Users created by period</CardTitle>
            <CardDescription>Summary of user creation totals in each timeframe.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {periodCounts.map((item) => (
                <div
                  key={item.period}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 dark:bg-slate-950"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.period}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Users created in this period</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle>Quick insight</CardTitle>
            <CardDescription>Based on Database auth users.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Users today</p>
                <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-slate-100">{usersToday}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Users created since midnight.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Users this week</p>
                <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-slate-100">{usersThisWeekTotal}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Users created since the start of the week.</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-slate-600 dark:text-slate-400">Data is loaded securely on the server.</p>
          </CardFooter>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">User list</p>
            <h2 className="mt-2 text-xl font-semibold">Latest signups</h2>
          </div>
          <Button variant="outline">View all users</Button>
        </div>

        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last sign-in</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email ?? "-"}</TableCell>
                  <TableCell>{user.created_at ? new Date(user.created_at).toLocaleString() : "-"}</TableCell>
                  <TableCell>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "Never"}</TableCell>
                  <TableCell>{user.last_sign_in_at ? "Active" : "Inactive"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <CardFooter>
            <p className="text-sm text-slate-600 dark:text-slate-400">Loaded from database user records.</p>
          </CardFooter>
        </Card>
      </section>
    </div>
  );
}