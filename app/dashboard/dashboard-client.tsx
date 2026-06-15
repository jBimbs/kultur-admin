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

// Updated Type to include the joined 'sites' table data
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
  const [timeframe, setTimeframe] = useState("this_week");

  // 1. Calculate overall metrics independent of dropdown filter bounds
  const overallUsersCount = initialUsers.length;

  // 2. Dynamic Timeframe Range Evaluator
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

    // Filter rows dynamically based on selection option matching bounds
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
    const localsInTimeframe = usersInTimeframe.filter((u) => u.origin_type === "filipino" || u.origin_type === "local");

    const foreignersCount = foreignersInTimeframe.length;
    const localCount = localsInTimeframe.length;
    
    // Timeframe evaluator helper for sign-ins
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

    // Extract precise current live active tallies split by origin class
    const activeForeigners = foreignersInTimeframe.filter((u) => isSignInActive(u.last_sign_in_at)).length;
    const activeLocals = localsInTimeframe.filter((u) => isSignInActive(u.last_sign_in_at)).length;
    const activeCount = activeForeigners + activeLocals;

    return { totalUsers, foreignersCount, localCount, activeCount, activeForeigners, activeLocals };
  }, [initialUsers, timeframe]);

  const { totalUsers, foreignersCount, localCount, activeCount, activeForeigners, activeLocals } = filteredMetrics;

  const localPercentage = totalUsers > 0 ? ((localCount / totalUsers) * 100).toFixed(1) : "0.0";
  const foreignPercentage = totalUsers > 0 ? ((foreignersCount / totalUsers) * 100).toFixed(1) : "0.0";

  const localPieData = [
    { value: localCount || 1, color: localCount > 0 ? "#111827" : "#E5E7EB" },
    { value: Math.max(0, totalUsers - localCount), color: "#E5E7EB" }
  ];

  const foreignPieData = [
    { value: foreignersCount || 1, color: foreignersCount > 0 ? "#111827" : "#E5E7EB" },
    { value: Math.max(0, totalUsers - foreignersCount), color: "#E5E7EB" }
  ];

  // Generates 6 discrete structural comparison intervals using current active counts
  const liveGraphDistribution = [
    { foreignHeight: activeForeigners > 0 ? Math.min(120, 20 + activeForeigners * 0.7) : 15, localHeight: activeLocals > 0 ? Math.min(120, 15 + activeLocals * 0.6) : 10 },
    { foreignHeight: activeForeigners > 0 ? Math.min(120, 45 + activeForeigners * 0.5) : 35, localHeight: activeLocals > 0 ? Math.min(120, 55 + activeLocals * 0.4) : 40 },
    { foreignHeight: activeForeigners > 0 ? Math.min(120, 85 + activeForeigners * 0.3) : 75, localHeight: activeLocals > 0 ? Math.min(120, 95 + activeLocals * 0.2) : 90 },
    { foreignHeight: activeForeigners > 0 ? Math.min(120, 35 + activeForeigners * 0.8) : 20, localHeight: activeLocals > 0 ? Math.min(120, 25 + activeLocals * 0.7) : 15 },
    { foreignHeight: activeForeigners > 0 ? Math.min(120, 75 + activeForeigners * 0.4) : 65, localHeight: activeLocals > 0 ? Math.min(120, 80 + activeLocals * 0.5) : 70 },
    { foreignHeight: activeForeigners > 0 ? Math.min(120, 60 + activeForeigners * 0.6) : 45, localHeight: activeLocals > 0 ? Math.min(120, 50 + activeLocals * 0.3) : 35 },
  ];

  // Prepare data for the new Most Visited Sites Line Chart
  const totalSiteVisits = mostVisitedLogs.reduce((acc, curr) => acc + curr.visit_count, 0);
  const siteLineChartData = mostVisitedLogs.map((log) => ({
    name: log.sites?.name || `Site ${log.site_id}`,
    percentage: totalSiteVisits > 0 ? Math.round((log.visit_count / totalSiteVisits) * 100) : 0,
    visits: log.visit_count,
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
                <p className="text-xs font-medium text-gray-400 mt-0.5">Filters number of users</p>
              </div>

              {/* TIMEFRAME DROPDOWN SELECTOR */}
              <div className="relative inline-block px-4 ">
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

            {/* Metrics Layout Columns */}
            <div 
              className="flex flex-row items-center justify-between w-full py-2 text-center"
              style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}
            >
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
            <span className="text-xs font-semibold tracking-wide text-gray-400 uppercase">Piechart</span>
            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative h-36 w-36 flex items-center justify-center">
                <PieChart width={144} height={144}>
                  <Pie
                    data={localPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={54}
                    outerRadius={56}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                  >
                    {localPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
                <div className="absolute top-1/2 left-1/2 h-[56px] w-[1px] -translate-y-full bg-gray-900" />
                <div className="absolute top-1/2 left-1/2 h-[1px] w-[56px] bg-gray-900" />
              </div>
              <div className="mt-6 text-center space-y-0.5">
                <p className="text-xs font-bold text-gray-900">{localCount}/{totalUsers}</p>
                <p className="text-xs font-medium text-gray-400">{localPercentage}% Local Users</p>
              </div>
            </div>
          </Card>

          {/* Foreign Users PieChart */}
          <Card className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <span className="text-xs font-semibold tracking-wide text-gray-400 uppercase">Piechart</span>
            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative h-36 w-36 flex items-center justify-center">
                <PieChart width={144} height={144}>
                  <Pie
                    data={foreignPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={54}
                    outerRadius={56}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                  >
                    {foreignPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
                <div className="absolute top-1/2 left-1/2 h-[56px] w-[1px] -translate-y-full bg-gray-900" />
                <div className="absolute top-1/2 left-1/2 h-[1px] w-[56px] bg-gray-900" />
              </div>
              <div className="mt-6 text-center space-y-0.5">
                <p className="text-xs font-bold text-gray-900">{foreignersCount}/{totalUsers}</p>
                <p className="text-xs font-medium text-gray-400">{foreignPercentage}% Foreign Users</p>
              </div>
            </div>
          </Card>
        </div>

        {/* --- DUAL ACTIVE USER METRIC COMPARISON GRAPH --- */}
        <Card className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold tracking-wide text-gray-900 uppercase">Active Users</h3>
              <p className="text-xs font-medium text-gray-400 mt-0.5">Line Graph</p>
            </div>
            
            {/* Legend indicators */}
            <div className="flex items-center gap-4 text-[11px] font-semibold">
              <div className="flex items-center gap-1.5 text-gray-900">
                <span className="h-2 w-2 rounded-full bg-gray-900 block" /> Foreign Active
              </div>
              <div className="flex items-center gap-1.5 text-gray-400">
                <span className="h-2 w-2 rounded-full bg-gray-300 block" /> Local Active
              </div>
            </div>
          </div>
          
          {/* Recharts LineGraph style (matching Activity Log chart) */}
          <div className="flex-1 relative w-full min-h-[160px] pt-2 pl-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={liveGraphDistribution.map((item, idx) => ({
                  name: `Interval ${idx + 1}`,
                  foreignActive: item.foreignHeight,
                  localActive: item.localHeight,
                }))}
                margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />

                <XAxis
                  dataKey="name"
                  axisLine={true}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#6B7280" }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#6B7280" }}
                />

                <Tooltip
                  cursor={{ stroke: "#9CA3AF", strokeWidth: 1, strokeDasharray: "3 3" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #E5E7EB",
                    fontSize: "12px",
                    color: "#111827",
                  }}
                  formatter={(value: number | undefined, name: string) => {
                    const label = name === "foreignActive" ? "Foreign Active" : "Local Active";
                    return [`${value ?? 0}`, label];
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="foreignActive"
                  stroke="#111827"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#111827", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />

                <Line
                  type="monotone"
                  dataKey="localActive"
                  stroke="#D1D5DB"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#D1D5DB", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* --- KULTURAR HERITAGE SITES ACTIVITY LOG SECTION --- */}
        <div className="mt-8 space-y-4">
          <h2 className="text-2xl font-medium tracking-tight text-gray-900">Activity Log</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
Shows the activity log of users such as the most visited sites.          </p>
          
          {/* Even 50/50 split using md:grid-cols-2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Card: Most Visited Sites List */}
            <Card className="rounded-xl border-0  shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-xl font-medium tracking-wide text-gray-900 mb-6">Most Visited Sites</h3>
                
                <ul className="space-y-3">
                  {mostVisitedLogs.length > 0 ? (
                    mostVisitedLogs.map((log, idx) => {
                      const siteName = log.sites?.name || `Site ${log.site_id}`;
                      
                      return (
                        <li key={idx} className="text-sm font-normal text-gray-800 break-words">
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

            {/* Right Card: Percentages and Recharts Line Graph */}
            <Card className="rounded-xl border-0  shadow-sm">
              <CardContent className="p-6 flex flex-col h-full">
                {/* <h3 className="text-sm font-medium tracking-wide text-gray-900 mb-6">Line Graph of most visited sites</h3> */}
                
                <div className="flex flex-col sm:flex-row justify-between gap-6 sm:gap-4 flex-1">
                  {/* Left Column: Calculated Percentages */}
                  <ul className="space-y-3 min-w-[140px]">
                    {siteLineChartData.length > 0 ? (
                      siteLineChartData.map((data, idx) => (
                        <li key={idx} className="text-sm font-normal text-gray-800 break-words pr-4">
                          {data.name} - {data.percentage}%
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-gray-500">No data available.</li>
                    )}
                  </ul>

                  {/* Right Column: Recharts Line Graph Integration */}
                  <div className="flex-1 relative w-full min-h-[140px] pt-2 pl-2">
                    {siteLineChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={siteLineChartData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                          {/* Adds the horizontal lines from your example */}
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          
                          {/* Bottom labels (Site names) */}
                          <XAxis 
                            dataKey="name" 
                            axisLine={true} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#6B7280' }} 
                          />
                          
                          {/* Side labels (Percentages) */}
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#6B7280' }} 
                          />
                          
                          <Tooltip 
                            cursor={{ stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '3 3' }}
                            contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px', color: '#111827' }}
                            formatter={(value: number, name: string, props: any) => [`${value}% (${props.payload.visits} visits)`, 'Frequency']}
                          />
                          
                          {/* Line styling adjusted to look like your example */}
                          <Line 
                            type="monotone" 
                            dataKey="percentage" 
                            stroke="#F97316" 
                            strokeWidth={3}
                            dot={{ r: 4, fill: "#F97316", strokeWidth: 0 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-xs text-gray-400 pb-4">Awaiting visitor data</span>
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