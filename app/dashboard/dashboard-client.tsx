"use client";

import React, { useState, useMemo } from "react";
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

type DashboardClientProps = {
  initialUsers: UserRecord[];
  mostVisitedLogs: VisitLog[];
};

export function DashboardClient({ initialUsers, mostVisitedLogs }: DashboardClientProps) {
  const [timeframe, setTimeframe] = useState("this_year");

  // 1. Calculate overall metrics independent of dropdown filter bounds
  const overallUsersCount = initialUsers.length;

  // 2. Dynamic Timeframe Range Evaluator for top card summary blocks
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

  // Data configured for Distribution Donut Charts
  const localPieData = [
    { value: localCount || 0, color: "#2563EB" },
    { value: Math.max(0, totalUsers - localCount) || 1, color: "#93C5FD" }
  ];

  const foreignPieData = [
    { value: foreignersCount || 0, color: "#0F766E" },
    { value: Math.max(0, totalUsers - foreignersCount) || 1, color: "#A7F3D0" }
  ];

  // Continuous Jan-Dec Monthly Distribution Processor for Active Users Trend
  const activeUsersMonthlyData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const monthlyBuckets = months.map((monthName) => ({
      name: monthName,
      localActive: 0,
      foreignActive: 0,
      totalActive: 0,
    }));

    initialUsers.forEach((user) => {
      if (!user.last_sign_in_at) return;
      
      const date = new Date(user.last_sign_in_at);
      if (date.getFullYear() === currentYear) {
        const monthIndex = date.getMonth();
        
        if (monthIndex >= 0 && monthIndex < 12) {
          if (user.origin_type === "filipino") {
            monthlyBuckets[monthIndex].localActive += 1;
          } else if (user.origin_type === "foreigner") {
            monthlyBuckets[monthIndex].foreignActive += 1;
          }
          monthlyBuckets[monthIndex].totalActive += 1;
        }
      }
    });

    return monthlyBuckets;
  }, [initialUsers]);

  // Color theme variables applied structurally for the heritage sites
  const COLORS = ["#F97316", "#3B82F6", "#10B981", "#8B5CF6", "#EC4899", "#6366F1"];

  const totalSiteVisits = mostVisitedLogs.reduce((acc, curr) => acc + curr.visit_count, 0);
  
  const sitePieChartData = mostVisitedLogs.map((log, index) => ({
    name: log.sites?.name || `Site ${log.site_id}`,
    value: log.visit_count,
    percentage: totalSiteVisits > 0 ? ((log.visit_count / totalSiteVisits) * 100).toFixed(1) : "0.0",
    color: COLORS[index % COLORS.length]
  }));

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-8 font-sans antialiased text-gray-950">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">DASHBOARD OVERVIEW</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">User analysis and management</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Display dashboard overview of overall users, total users created, foreign user, local users and active users via timeframes.
          </p>
        </div>
          
        {/* --- MAIN HEADER METRICS OVERVIEW DASHBOARD --- */}
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

        {/* --- RADIAL DISTRIBUTION PIE CHARTS ROW --- */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          
          {/* Local Users PieChart */}
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

          {/* Foreign Users PieChart */}
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

        {/* --- CHRONOLOGICAL MONTHLY ACTIVE USER METRIC COMPARISON GRAPH --- */}
        <Card className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold tracking-wide text-gray-900 uppercase">Active Users Trend</h3>
              <p className="text-xs font-medium text-gray-400 mt-0.5">Monthly breakdown for the current year</p>
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
          
          <div className="flex-1 relative w-full min-h-[260px] pt-2 pl-2">
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

        {/* --- HERITAGE SITES ACTIVITY LOG SECTION --- */}
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
                  
                  {/* Left Side: Dynamic List with exact matching Color Indicators */}
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

                  {/* Right Side: Exact Rounded Donut Matching Local/Foreign Ring Aesthetics */}
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
                              formatter={(value: unknown, name: string, props: any) => {
                                const visits = props?.payload?.value ?? 0;
                                return [`${visits} visits`, props?.payload?.name || name];
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        {/* Central text structure alignment */}
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

      </div>
    </div>
  );
}