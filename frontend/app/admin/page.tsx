import { Suspense } from "react";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/core/supabase/server";
import AdminDashboard from "./AdminDashboard";
import type { FeedbackItem } from "./tabs/FeedbackTab";

export const dynamic = "force-dynamic";

// ── Fetch users ───────────────────────────────────────────────────────────────

async function fetchUsers() {
  const supabase = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_banned, updated_at")
    .order("updated_at", { ascending: false });

  if (!profiles) return [];

  const { data: counts } = await supabase.from("reports").select("reporter_id");

  const reportCounts: Record<string, number> = {};
  counts?.forEach((r: { reporter_id: string }) => {
    reportCounts[r.reporter_id] = (reportCounts[r.reporter_id] || 0) + 1;
  });

  return profiles.map((p: any) => ({
    ...p,
    created_at: p.updated_at,
    report_count: reportCounts[p.id] || 0,
  }));
}

// ── Fetch feedbacks ───────────────────────────────────────────────────────────

async function fetchFeedbacks(): Promise<FeedbackItem[]> {
  const supabase = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[ADMIN] Gagal fetch feedback:", error.message);
    return [];
  }

  return (data ?? []) as FeedbackItem[];
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";

  const [
    { count: totalReports },
    { count: pendingCount },
    { count: verifiedCount },
    { count: rejectedCount },
    { data: reports },
    users,
    feedbacks,
  ] = await Promise.all([
    supabase.from("reports").select("*", { count: "exact", head: true }),
    supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "verified"),
    supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "rejected"),
    supabase.rpc("get_reports_admin"),
    fetchUsers(),
    fetchFeedbacks(),
  ]);

  const stats = {
    total: totalReports || 0,
    pending: pendingCount || 0,
    verified: verifiedCount || 0,
    rejected: rejectedCount || 0,
  };

  return (
    <Suspense
      fallback={
        <div className="max-w-[1200px] mx-auto px-6 py-6">
          <div className="h-8 w-32 bg-zinc-200 rounded-lg animate-pulse mb-4" />
          <div className="grid grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-white border border-zinc-200 rounded-xl animate-pulse"
              />
            ))}
          </div>
        </div>
      }
    >
      <AdminDashboard
        stats={stats}
        reports={(reports ?? []) as any[]}
        users={users ?? []}
        feedbacks={feedbacks}
        token={token}
      />
    </Suspense>
  );
}
