import { createClient } from "@/core/supabase/server";
import type { Metadata } from "next";
import ReportForm from "@/components/ReportForm";
import ReportLanding from "@/components/ReportLanding";

export const metadata: Metadata = {
  title: "Laporkan Penipuan - KawalTransaksi",
  description:
    "Laporkan nomor rekening atau nomor telepon terduga pelaku penipuan. Bantu lindungi masyarakat Indonesia dari ancaman penipuan digital.",
};

export default async function ReportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sudah login → langsung form
  if (user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <ReportForm />
        </div>
      </div>
    );
  }

  // Belum login → landing page mirip Kredibel
  return <ReportLanding />;
}
