"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent } from "@/components/ui/card";
import { 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  Tooltip, 
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

// --- TYPE DEFINITIONS ---
type UserRecord = {
  id: string;
  origin_type: string | null;
  created_at: number | null;
  last_sign_in_at: number | null;
};

type VisitLog = {
  site_id: number;
  visit_count: number;
  last_visited_at: string;
  sites?: {
    name: string;
  } | null;
};

type SavedItemLog = {
  item_id: number;
  item_name: string;
  item_type: string;
  save_count: number;
};

type DashboardClientProps = {
  initialUsers: UserRecord[];
  mostVisitedLogs: VisitLog[];
};

export function DashboardClient({ 
  initialUsers = [], 
  mostVisitedLogs = [] 
}: DashboardClientProps) {
  const [timeframe, setTimeframe] = useState("this_year");
  const [topSavedItems, setTopSavedItems] = useState<SavedItemLog[]>([]);
  
  // Default state for the Line Graph
  const [activeUsersMonthlyData, setActiveUsersMonthlyData] = useState([
    { name: "Jan", localActive: 0, foreignActive: 0, totalActive: 0 },
    { name: "Feb", localActive: 0, foreignActive: 0, totalActive: 0 },
    { name: "Mar", localActive: 0, foreignActive: 0, totalActive: 0 },
    { name: "Apr", localActive: 0, foreignActive: 0, totalActive: 0 },
    { name: "May", localActive: 0, foreignActive: 0, totalActive: 0 },
    { name: "Jun", localActive: 0, foreignActive: 0, totalActive: 0 },
    { name: "Jul", localActive: 0, foreignActive: 0, totalActive: 0 },
    { name: "Aug", localActive: 0, foreignActive: 0, totalActive: 0 },
    { name: "Sep", localActive: 0, foreignActive: 0, totalActive: 0 },
    { name: "Oct", localActive: 0, foreignActive: 0, totalActive: 0 },
    { name: "Nov", localActive: 0, foreignActive: 0, totalActive: 0 },
    { name: "Dec", localActive: 0, foreignActive: 0, totalActive: 0 },
  ]);
  
  // Initialize the modern Supabase SSR browser client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // --- DYNAMIC DATA FETCHING ---
  useEffect(() => {
    async function fetchDashboardData() {
      // 1. Fetch Top Saved Items
      const { data: savedData, error: savedError } = await supabase
        .from('saved_items')
        .select('item_id, item_name, item_type');

      if (savedError) {
        console.error("Error fetching saved items:", savedError);
      } else if (savedData) {
        const aggregatedData = savedData.reduce((acc: Record<number, SavedItemLog>, curr) => {
          const key = curr.item_id;
          if (!acc[key]) {
            acc[key] = { 
              item_id: curr.item_id, 
              item_name: curr.item_name, 
              item_type: curr.item_type, 
              save_count: 0 
            };
          }
          acc[key].save_count += 1;
          return acc;
        }, {});

        const sortedTop5 = Object.values(aggregatedData)
          .sort((a, b) => b.save_count - a.save_count)
          .slice(0, 5);

        setTopSavedItems(sortedTop5);
      }

      // 2. Fetch Profiles for Active Users Line Graph
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('origin_type, updated_at, created_at');

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      } else if (profilesData && profilesData.length > 0) {
        
        // Find the most recent year in your database instead of using the system clock.
        // Since your dummy data is in 2026, this ensures the chart actually displays it.
        const years = profilesData.map(p => {
          const d = p.updated_at || p.created_at;
          return d ? new Date(d).getFullYear() : new Date().getFullYear();
        });
        const targetYear = Math.max(...years);

        // Create a fresh array of buckets to populate
        const monthlyBuckets = [
          { name: "Jan", localActive: 0, foreignActive: 0, totalActive: 0 },
          { name: "Feb", localActive: 0, foreignActive: 0, totalActive: 0 },
          { name: "Mar", localActive: 0, foreignActive: 0, totalActive: 0 },
          { name: "Apr", localActive: 0, foreignActive: 0, totalActive: 0 },
          { name: "May", localActive: 0, foreignActive: 0, totalActive: 0 },
          { name: "Jun", localActive: 0, foreignActive: 0, totalActive: 0 },
          { name: "Jul", localActive: 0, foreignActive: 0, totalActive: 0 },
          { name: "Aug", localActive: 0, foreignActive: 0, totalActive: 0 },
          { name: "Sep", localActive: 0, foreignActive: 0, totalActive: 0 },
          { name: "Oct", localActive: 0, foreignActive: 0, totalActive: 0 },
          { name: "Nov", localActive: 0, foreignActive: 0, totalActive: 0 },
          { name: "Dec", localActive: 0, foreignActive: 0, totalActive: 0 },
        ];

        profilesData.forEach((profile) => {
          // Track recent activity via updated_at, fallback to created_at
          const activeDateString = profile.updated_at || profile.created_at;
          if (!activeDateString) return;

          const date = new Date(activeDateString);

          if (date.getFullYear() === targetYear) {
            const monthIndex = date.getMonth(); 

            if (monthIndex >= 0 && monthIndex < 12) {
              if (profile.origin_type === "filipino") {
                monthlyBuckets[monthIndex].localActive += 1;
              } else if (profile.origin_type === "foreigner") {
                monthlyBuckets[monthIndex].foreignActive += 1;
              }
              monthlyBuckets[monthIndex].totalActive += 1;
            }
          }
        });

        setActiveUsersMonthlyData(monthlyBuckets);
      }
    }

    fetchDashboardData();
  }, [supabase]);


  // --- EXISTING DASHBOARD METRICS CALCULATION (TOP CARDS) ---
  const overallUsersCount = initialUsers.length;

  const filteredMetrics = useMemo(() => {
    const now = new Date();
    
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    const currentDay = now.getDay();
    const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - currentDay).getTime();
    const startOfLastWeek = startOfThisWeek - 7 * 24 * 60 * 60 * 1000;
    const endOfLastWeek = startOfThisWeek;

    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    const endOfLastMonth = startOfThisMonth;

    const startOfThisYear = new Date(now.getFullYear(), 0, 1).getTime();
    const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1).getTime();
    const endOfLastYear = startOfThisYear;

    const usersInTimeframe = initialUsers.filter((u) => {
      if (!u.created_at) return false;
      
      switch (timeframe) {
        case "today": return u.created_at >= startOfToday;
        case "this_week": return u.created_at >= startOfThisWeek;
        case "last_week": return u.created_at >= startOfLastWeek && u.created_at < endOfLastWeek;
        case "this_month": return u.created_at >= startOfThisMonth;
        case "last_month": return u.created_at >= startOfLastMonth && u.created_at < endOfLastMonth;
        case "this_year": return u.created_at >= startOfThisYear;
        case "last_year": return u.created_at >= startOfLastYear && u.created_at < endOfLastYear;
        default: return true;
      }
    });

    const totalUsers = usersInTimeframe.length;
    const foreignersInTimeframe = usersInTimeframe.filter((u) => u.origin_type === "foreigner");
    const localsInTimeframe = usersInTimeframe.filter((u) => u.origin_type === "filipino");

    const foreignersCount = foreignersInTimeframe.length;
    const localCount = localsInTimeframe.length;
    
    const isSignInActive = (lastSignIn: number | null) => {
      if (!lastSignIn) return false;
      switch (timeframe) {
        case "today": return lastSignIn >= startOfToday;
        case "this_week": return lastSignIn >= startOfThisWeek;
        case "last_week": return lastSignIn >= startOfLastWeek && lastSignIn < endOfLastWeek;
        case "this_month": return lastSignIn >= startOfThisMonth;
        case "last_month": return lastSignIn >= startOfLastMonth && lastSignIn < endOfLastMonth;
        case "this_year": return lastSignIn >= startOfThisYear;
        case "last_year": return lastSignIn >= startOfLastYear && lastSignIn < endOfLastYear;
        default: return true;
      }
    };

    const activeForeigners = foreignersInTimeframe.filter((u) => isSignInActive(u.last_sign_in_at)).length;
    const activeLocals = localsInTimeframe.filter((u) => isSignInActive(u.last_sign_in_at)).length;
    const activeCount = activeForeigners + activeLocals;

    return { totalUsers, foreignersCount, localCount, activeCount };
  }, [initialUsers, timeframe]);

  const { totalUsers, foreignersCount, localCount, activeCount } = filteredMetrics;

  const localPercentage = totalUsers > 0 ? ((localCount / totalUsers) * 100).toFixed(1) : "0.0";
  const foreignPercentage = totalUsers > 0 ? ((foreignersCount / totalUsers) * 100).toFixed(1) : "0.0";

  const localPieData = [
    { value: localCount || 0, color: "#2563EB" },
    { value: Math.max(0, totalUsers - localCount) || 1, color: "#93C5FD" }
  ];

  const foreignPieData = [
    { value: foreignersCount || 0, color: "#0F766E" },
    { value: Math.max(0, totalUsers - foreignersCount) || 1, color: "#A7F3D0" }
  ];

  const COLORS = ["#F97316", "#3B82F6", "#10B981", "#8B5CF6", "#EC4899", "#6366F1"];

  const totalSiteVisits = mostVisitedLogs.reduce((acc, curr) => acc + curr.visit_count, 0);
  
  const sitePieChartData = mostVisitedLogs.map((log, index) => ({
    name: log.sites?.name || `Site ${log.site_id}`,
    value: log.visit_count,
    percentage: totalSiteVisits > 0 ? ((log.visit_count / totalSiteVisits) * 100).toFixed(1) : "0.0",
    color: COLORS[index % COLORS.length]
  }));

  // Map the dynamically fetched topSavedItems to the pie chart
  const totalSavesCount = topSavedItems.reduce((acc, curr) => acc + curr.save_count, 0);

  const savedItemsPieChartData = topSavedItems.map((item, index) => ({
    name: item.item_name || `Item ${item.item_id}`,
    value: item.save_count,
    percentage: totalSavesCount > 0 ? ((item.save_count / totalSavesCount) * 100).toFixed(1) : "0.0",
    color: COLORS[index % COLORS.length]
  }));

  // --- RENDER UI ---
  return (
    <div className="min-h-screen p-8 font-sans antialiased text-gray-950">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">DASHBOARD OVERVIEW</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">User analysis and management</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Display dashboard overview of overall users, total users created, foreign user, local users and active users via timeframes.
          </p>
        </div>
          
        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-8 mb-2">
              <div>
                <h1 className="text-sm font-bold tracking-widest text-gray-900 uppercase">Timeframe Filter</h1>
                <p className="text-xs font-medium text-gray-400 mt-0.5">Filters overview cards statistics</p>
              </div>

              <div className="relative inline-block px-4">
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2 pr-8 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 cursor-pointer focus:outline-none transition"
                >
                  <option value="today">Today</option>
                  <option value="this_week">This Week</option>
                  <option value="last_week">Last Week</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="this_year">This Year</option>
                  <option value="last_year">Last Year</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex flex-row items-center justify-between w-full py-2 text-center">
              <div className="flex-1 border-r border-gray-100 px-2">
                <span className="text-4xl font-normal tracking-tight text-[#4ADE80] block">{overallUsersCount}</span>
                <p className="mt-2 text-xs font-medium text-gray-500">Overall Users</p>
              </div>
              <div className="flex-1 border-r border-gray-100 px-2">
                <span className="text-4xl font-normal tracking-tight text-gray-900 block">{totalUsers}</span>
                <p className="mt-2 text-xs font-medium text-gray-500">Total Users Created</p>
              </div>
              <div className="flex-1 border-r border-gray-100 px-2">
                <span className="text-4xl font-normal tracking-tight text-gray-900 block">{foreignersCount}</span>
                <p className="mt-2 text-xs font-medium text-gray-500">Foreign Users</p>
              </div>
              <div className="flex-1 border-r border-gray-100 px-2">
                <span className="text-4xl font-normal tracking-tight text-gray-900 block">{localCount}</span>
                <p className="mt-2 text-xs font-medium text-gray-500">Local Users</p>
              </div>
              <div className="flex-1 px-2">
                <span className="text-4xl font-normal tracking-tight text-gray-900 block">{activeCount}</span>
                <p className="mt-2 text-xs font-medium text-gray-500">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          
          <Card className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <span className="text-xs font-semibold tracking-wide text-gray-400 uppercase">Local Distribution</span>
            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative h-40 w-40 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={localPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={64}
                      paddingAngle={4}
                      cornerRadius={10}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                    >
                      {localPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-gray-900">{localPercentage}%</span>
                  <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Local</span>
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-xs font-bold text-gray-700">{localCount} of {totalUsers} total users</p>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <span className="text-xs font-semibold tracking-wide text-gray-400 uppercase">Foreign Distribution</span>
            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative h-40 w-40 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={foreignPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={64}
                      paddingAngle={4}
                      cornerRadius={10}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                    >
                      {foreignPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-gray-900">{foreignPercentage}%</span>
                  <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Foreign</span>
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-xs font-bold text-gray-700">{foreignersCount} of {totalUsers} total users</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold tracking-wide text-gray-900 uppercase">Active Users Trend</h3>
              <p className="text-xs font-medium text-gray-400 mt-0.5">Monthly breakdown for the latest active year</p>
            </div>
            
            <div className="flex items-center gap-4 text-[11px] font-semibold">
              <div className="flex items-center gap-1.5 text-blue-600">
                <span className="h-2 w-2 rounded-full bg-blue-600 block" /> Local Active
              </div>
              <div className="flex items-center gap-1.5 text-teal-700">
                <span className="h-2 w-2 rounded-full bg-teal-700 block" /> Foreign Active
              </div>
              <div className="flex items-center gap-1.5 text-gray-900">
                <span className="h-2 w-2 rounded-full bg-gray-900 block" /> Combined Total
              </div>
            </div>
          </div>
          
          <div className="w-full h-[320px] mt-4 pt-2 pl-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={activeUsersMonthlyData}
                margin={{ top: 15, right: 20, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                  dataKey="name"
                  axisLine={true}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#4B5563", fontWeight: 500 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#6B7280" }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ stroke: "#9CA3AF", strokeWidth: 1, strokeDasharray: "3 3" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #E5E7EB",
                    fontSize: "12px",
                    color: "#111827",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="localActive"
                  name="Local Active"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#2563EB", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="foreignActive"
                  name="Foreign Active"
                  stroke="#0F766E"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#0F766E", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="totalActive"
                  name="Total Active"
                  stroke="#111827"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 2, fill: "#111827", strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="mt-8 space-y-4">
          <h2 className="text-2xl font-medium tracking-tight text-gray-900">Activity Log</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Shows the activity log of users such as the most visited sites.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-xl border-0 shadow-sm bg-white">
              <CardContent className="p-6">
                <h3 className="text-xl font-medium tracking-wide text-gray-900 mb-6">Most Visited Sites</h3>
                <ul className="space-y-3">
                  {mostVisitedLogs.length > 0 ? (
                    mostVisitedLogs.map((log, idx) => {
                      const siteName = log.sites?.name || `Site ${log.site_id}`;
                      return (
                        <li key={idx} className="text-sm font-normal text-gray-800 break-words flex items-center gap-2">
                          <span 
                            className="h-2 w-2 rounded-full inline-block shrink-0" 
                            style={{ backgroundColor: COLORS[idx % COLORS.length] }} 
                          />
                          {siteName}
                        </li>
                      );
                    })
                  ) : (
                    <li className="text-sm text-gray-500">No sites visited yet.</li>
                  )}
                </ul>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-0 shadow-sm bg-white">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex flex-col sm:flex-row justify-between gap-6 sm:gap-4 flex-1 items-center">
                  
                  <ul className="space-y-3 min-w-[140px] self-start sm:self-center">
                    {sitePieChartData.length > 0 ? (
                      sitePieChartData.map((data, idx) => (
                        <li key={idx} className="text-sm font-normal text-gray-800 break-words pr-2 flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full block shrink-0" style={{ backgroundColor: data.color }} />
                            <span className="font-bold text-gray-900">{data.percentage}%</span>
                          </div>
                          <span className="text-gray-400 text-[11px] font-medium ml-3.5 pl-px truncate max-w-[120px]">
                            {data.name}
                          </span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-gray-500">No data available.</li>
                    )}
                  </ul>

                  <div className="flex-1 relative h-40 w-40 flex items-center justify-center">
                    {sitePieChartData.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={sitePieChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={48}
                              outerRadius={64}
                              paddingAngle={4}
                              cornerRadius={10}
                              startAngle={90}
                              endAngle={-270}
                              dataKey="value"
                            >
                              {sitePieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                borderRadius: "8px",
                                border: "1px solid #E5E7EB",
                                fontSize: "12px",
                                color: "#111827",
                              }}
                              formatter={(value: any, name: any, props: any) => {
                                const visits = props?.payload?.value ?? value ?? 0;
                                const displayName = props?.payload?.name || name || "Unknown Site";
                                return [`${visits} visits`, displayName];
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-xl font-bold text-gray-900">{totalSiteVisits}</span>
                          <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Visits</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-xs text-gray-400">Awaiting visitor data</span>
                      </div>
                    )}
                  </div>

                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <h2 className="text-2xl font-medium tracking-tight text-gray-900">Saved Performance Log</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Shows user interaction with landmarks, festivals, artifacts, and cuisines by tracking saving metrics.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-xl border-0 shadow-sm bg-white">
              <CardContent className="p-6">
                <h3 className="text-xl font-medium tracking-wide text-gray-900 mb-6">Most Saved Items (Top 5)</h3>
                <ul className="space-y-3">
                  {topSavedItems.length > 0 ? (
                    topSavedItems.map((item, idx) => {
                      return (
                        <li key={idx} className="text-sm font-normal text-gray-800 break-words flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span 
                              className="h-2 w-2 rounded-full inline-block shrink-0" 
                              style={{ backgroundColor: COLORS[idx % COLORS.length] }} 
                            />
                            <span className="truncate">{item.item_name}</span>
                          </div>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider shrink-0 ml-2">
                            {item.item_type}
                          </span>
                        </li>
                      );
                    })
                  ) : (
                    <li className="text-sm text-gray-500">Loading saved items...</li>
                  )}
                </ul>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-0 shadow-sm bg-white">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex flex-col sm:flex-row justify-between gap-6 sm:gap-4 flex-1 items-center">
                  
                  <ul className="space-y-3 min-w-[140px] self-start sm:self-center">
                    {savedItemsPieChartData.length > 0 ? (
                      savedItemsPieChartData.map((data, idx) => (
                        <li key={idx} className="text-sm font-normal text-gray-800 break-words pr-2 flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full block shrink-0" style={{ backgroundColor: data.color }} />
                            <span className="font-bold text-gray-900">{data.percentage}%</span>
                          </div>
                          <span className="text-gray-400 text-[11px] font-medium ml-3.5 pl-px truncate max-w-[120px]">
                            {data.name}
                          </span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-gray-500">No details available.</li>
                    )}
                  </ul>

                  <div className="flex-1 relative h-40 w-40 flex items-center justify-center">
                    {savedItemsPieChartData.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={savedItemsPieChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={48}
                              outerRadius={64}
                              paddingAngle={4}
                              cornerRadius={10}
                              startAngle={90}
                              endAngle={-270}
                              dataKey="value"
                            >
                              {savedItemsPieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                borderRadius: "8px",
                                border: "1px solid #E5E7EB",
                                fontSize: "12px",
                                color: "#111827",
                              }}
                              formatter={(value: any, name: any, props: any) => {
                                const saves = props?.payload?.value ?? value ?? 0;
                                const displayName = props?.payload?.name || name || "Unknown Item";
                                return [`${saves} saves`, displayName];
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-xl font-bold text-gray-900">{totalSavesCount}</span>
                          <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Saves</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-xs text-gray-400">Loading data...</span>
                      </div>
                    )}
                  </div>

                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}