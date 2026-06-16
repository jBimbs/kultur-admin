import React from "react";
import { supabaseAdmin } from "@/lib/supabase";
import { DashboardClient } from "./dashboard-client";
import { User } from "@supabase/supabase-js"; // Import Supabase's User type

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

  // Use the native Supabase User type here to accurately map auth properties
  const activeUserMap = new Map<string, string | null>(
    authData.users.map((user: User) => [user.id, user.last_sign_in_at ?? null])
  );

  const realizedUsers = profiles.map((p: { id: string; origin_type: string | null; created_at: string | null }) => {
    const lastSignIn = activeUserMap.get(p.id);
    
    return {
      id: p.id,
      origin_type: p.origin_type ? p.origin_type.toString().trim().toLowerCase() : null,
      created_at: p.created_at ? new Date(p.created_at).getTime() : null,
      last_sign_in_at: lastSignIn ? new Date(lastSignIn).getTime() : null,
    };
  });

  return (
    <DashboardClient 
      initialUsers={realizedUsers} 
      // @ts-ignore
      mostVisitedLogs={mostVisitedData || []} 
      mostSavedItems={[]} // <-- Add this to satisfy the required prop type
    />
  );
}