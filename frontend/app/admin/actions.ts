"use server";

import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/core/supabase/server";
import { revalidatePath } from "next/cache";

const VALID_STATUSES = [
  "verified",
  "rejected",
  "pending",
  "withdrawn",
] as const;
const VALID_ROLES = ["user", "admin", "moderator"] as const;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ValidStatus = (typeof VALID_STATUSES)[number];
type ValidRole = (typeof VALID_ROLES)[number];

function createAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

async function validateAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") throw new Error("Forbidden");
  return user;
}

export async function updateReportStatus(
  reportId: string,
  status: ValidStatus,
) {
  // Validasi UUID
  if (!UUID_REGEX.test(reportId)) throw new Error("ID laporan tidak valid.");

  // Validasi status whitelist
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(
      `Status tidak valid. Nilai yang diizinkan: ${VALID_STATUSES.join(", ")}.`,
    );
  }

  await validateAdmin();

  // Pakai admin client dengan service role — konsisten dengan action lain
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("reports")
    .update({ status })
    .eq("id", reportId);

  if (error) throw new Error("Gagal update status: " + error.message);

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/dashboard");
}

export async function updateUserRole(userId: string, role: ValidRole) {
  if (!UUID_REGEX.test(userId)) throw new Error("ID pengguna tidak valid.");
  if (!VALID_ROLES.includes(role)) throw new Error("Role tidak valid.");

  const admin = await validateAdmin();
  if (admin.id === userId)
    throw new Error("Tidak dapat mengubah role diri sendiri.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  if (error) throw new Error("Gagal update role: " + error.message);

  revalidatePath("/admin");
}

export async function banUser(userId: string) {
  if (!UUID_REGEX.test(userId)) throw new Error("ID pengguna tidak valid.");

  const admin = await validateAdmin();
  if (admin.id === userId) throw new Error("Tidak dapat memban diri sendiri.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_banned: true })
    .eq("id", userId);
  if (error) throw new Error("Gagal memblokir pengguna: " + error.message);

  revalidatePath("/admin");
}

export async function unbanUser(userId: string) {
  if (!UUID_REGEX.test(userId)) throw new Error("ID pengguna tidak valid.");

  await validateAdmin();

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_banned: false })
    .eq("id", userId);
  if (error) throw new Error("Gagal membuka blokir pengguna: " + error.message);

  revalidatePath("/admin");
}
