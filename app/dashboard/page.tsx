import React from "react";
import { supabaseAdmin } from "@/lib/supabase";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const { data: profiles, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, origin_type, created_at");

  if (profileError || !profiles) {
    console.error("Profiles table fetch failure:", profileError);
    return <div className="p-8 text-red-500">Error loading database connection profiles.</div>;
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (authError || !authData) {
    console.error("Auth users metadata list fetch failure:", authError);
    return <div className="p-8 text-red-500">Error loading authorization schemas.</div>;
  }

  const { data: mostVisitedData, error: visitedError } = await supabaseAdmin
    .from("most_visited")
    .select(`
      site_id, 
      visit_count, 
      last_visited_at,
      sites (
        name
      )
    `)
    .order("last_visited_at", { ascending: false })
    .limit(10); 

  if (visitedError) {
    console.error("Most visited table fetch failure:", visitedError);
  }

  const activeUserMap = new Map(
    authData.users.map((user) => [user.id, user.last_sign_in_at])
  );

  const realizedUsers = profiles.map((p) => ({
    id: p.id,
    origin_type: p.origin_type ? p.origin_type.toString().trim().toLowerCase() : null,
    created_at: p.created_at ? new Date(p.created_at).getTime() : null,
    last_sign_in_at: activeUserMap.get(p.id) ? new Date(activeUserMap.get(p.id)!).getTime() : null,
  }));

  return (
    <DashboardClient 
      initialUsers={realizedUsers} 
      // @ts-ignore
      mostVisitedLogs={mostVisitedData || []} 
    />
  );
}