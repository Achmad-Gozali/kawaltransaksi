import { createClient } from "@/core/supabase/server";
import DeveloperClient from "./DeveloperClient";

export const metadata = {
  title: "Developer API - KawalTransaksi",
  description:
    "REST API untuk verifikasi nomor HP, rekening bank, dan e-wallet. Gratis 300 request/hari.",
};

export default async function DeveloperPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // ✅ Tidak redirect — halaman bisa dilihat tanpa login
  // Session dikirim ke client kalau ada, null kalau tidak login
  return (
    <DeveloperClient
      token={session?.access_token ?? ""}
      userEmail={session?.user?.email ?? ""}
      isLoggedIn={!!session}
    />
  );
}
