import { createClient } from "@/core/supabase/server";
import { redirect } from "next/navigation";
import EditReportForm from "./EditReportForm";

export default async function EditReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: report } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .eq("reporter_id", user.id)
    .single();

  if (!report) redirect("/dashboard/laporan");

  return <EditReportForm report={report} />;
}
