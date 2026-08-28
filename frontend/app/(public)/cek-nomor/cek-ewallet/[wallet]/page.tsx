import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { formatDateID, safeJsonLd } from "@/core/utils";
import { forwardedClientHeaders } from "@/core/http";
import EwalletPageClient from "./EwalletPageClient";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const ewalletData: Record<string, {
  name: string; fullName: string; logo: string; callCenter: string;
  website: string; dbName: string; description: string;
}> = {
  gopay:   { name: "GoPay",     fullName: "GoPay",     logo: "/ewallets/gopay.png",     callCenter: "1500321",  website: "https://www.gojek.com/gopay",    dbName: "GoPay",     description: "GoPay adalah layanan dompet digital milik Gojek yang memungkinkan pengguna melakukan pembayaran, transfer, dan berbagai transaksi keuangan digital secara mudah dan cepat." },
  dana:    { name: "Dana",      fullName: "DANA",      logo: "/ewallets/dana.png",      callCenter: "1500 445", website: "https://www.dana.id",            dbName: "Dana",      description: "DANA adalah dompet digital Indonesia yang menyediakan layanan pembayaran, transfer uang, dan berbagai fitur keuangan digital." },
  ovo:     { name: "OVO",       fullName: "OVO",       logo: "/ewallets/ovo.png",       callCenter: "1500 696", website: "https://www.ovo.id",             dbName: "OVO",       description: "OVO adalah platform pembayaran digital terkemuka di Indonesia yang menawarkan layanan pembayaran, transfer, investasi, dan pinjaman dalam satu aplikasi." },
  shopee:  { name: "ShopeePay", fullName: "ShopeePay", logo: "/ewallets/shopeepay.png", callCenter: "1500 702", website: "https://shopee.co.id/shopeepay", dbName: "ShopeePay", description: "ShopeePay adalah dompet digital terintegrasi dalam platform Shopee yang memungkinkan pembayaran belanja online, transfer saldo, dan berbagai transaksi digital lainnya." },
  linkaja: { name: "LinkAja",   fullName: "LinkAja",   logo: "/ewallets/linkaja.png",   callCenter: "1500 911", website: "https://www.linkaja.id",         dbName: "LinkAja",   description: "LinkAja adalah layanan uang elektronik berbasis aplikasi milik BUMN yang menyediakan layanan pembayaran digital, transfer, dan berbagai fitur keuangan untuk kebutuhan sehari-hari." },
};

const BASE_URL = "https://kawaltransaksi.com";

interface PageProps { params: Promise<{ wallet: string }>; }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { wallet } = await params;
  const data = ewalletData[wallet.toLowerCase()];
  if (!data) return { title: "E-Wallet Tidak Ditemukan" };
  return {
    title: `Cek Akun ${data.name} - KawalTransaksi`,
    description: `Verifikasi nomor ${data.fullName} sebelum transfer. Cek apakah akun ${data.name} terindikasi penipuan di database komunitas KawalTransaksi.`,
  };
}

export const dynamic = "force-dynamic";

export default async function EwalletDetailPage({ params }: PageProps) {
  const { wallet } = await params;
  const walletKey = wallet.toLowerCase();
  const data = ewalletData[walletKey];
  if (!data) notFound();

  const cookieStore = await cookies();
  const isLoggedIn  = !!cookieStore.get("refresh_token")?.value;

  type ApiReportRow = {
    targetValue: string;
    targetName: string | null;
    status: string;
    createdAt: string;
  };
  let allRows: ApiReportRow[] = [];

  try {
    const res = await fetch(`${BACKEND_URL}/api/reports/public/ewallet/${encodeURIComponent(data.dbName)}`, {
      headers: await forwardedClientHeaders(),
    });
    if (res.ok) allRows = (await res.json()).data?.primary ?? [];
  } catch {}

  const totalCount    = allRows.length;
  const verifiedCount = allRows.filter(r => r.status === "verified").length;
  const pendingCount  = allRows.filter(r => r.status === "pending").length;
  const reports = allRows.slice(0, 6).map(r => ({
    target_number: r.targetValue,
    target_name:   r.targetName,
    status:        r.status,
    displayNumber: r.targetValue,
    dateFormatted: formatDateID(r.createdAt),
  }));

  const structuredData = {
    "@context": "https://schema.org", "@type": "WebPage",
    name: `Cek Akun ${data.name} - KawalTransaksi`,
    description: `Verifikasi nomor ${data.fullName} sebelum transfer. Cek apakah akun ${data.name} terindikasi penipuan.`,
    url: `${BASE_URL}/cek-nomor/cek-ewallet/${walletKey}`,
    about: { "@type": "FinancialProduct", name: data.fullName, provider: { "@type": "Organization", name: data.fullName, telephone: data.callCenter, url: data.website } },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(structuredData) }} />
      <EwalletPageClient walletId={walletKey} walletData={data} reports={reports} totalCount={totalCount} verifiedCount={verifiedCount} pendingCount={pendingCount} isLoggedIn={isLoggedIn} />
    </>
  );
}