import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { formatDateID, safeJsonLd } from "@/core/utils";
import { forwardedClientHeaders } from "@/core/http";
import BankPageClient from "./BankPageClient";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const bankData: Record<string, {
  name: string; fullName: string; logo: string; kodeBank: string;
  callCenter: string; website: string; dbName: string; description: string;
}> = {
  bca:     { name: "BCA",        fullName: "Bank Central Asia",     logo: "/banks/bca.png",     kodeBank: "014", callCenter: "1500888", website: "https://www.bca.co.id",         dbName: "BCA",     description: "Bank Central Asia (BCA) adalah bank swasta terbesar di Indonesia yang melayani jutaan nasabah dengan berbagai produk perbankan." },
  bri:     { name: "BRI",        fullName: "Bank Rakyat Indonesia",  logo: "/banks/bri.png",     kodeBank: "002", callCenter: "1500017", website: "https://www.bri.co.id",         dbName: "BRI",     description: "Bank Rakyat Indonesia (BRI) adalah salah satu bank BUMN terbesar di Indonesia yang fokus melayani segmen mikro, kecil, dan menengah." },
  bni:     { name: "BNI",        fullName: "Bank Negara Indonesia",  logo: "/banks/bni.png",     kodeBank: "009", callCenter: "1500046", website: "https://www.bni.co.id",         dbName: "BNI",     description: "Bank Negara Indonesia (BNI) adalah bank BUMN yang melayani berbagai kebutuhan perbankan perorangan dan korporasi di seluruh Indonesia." },
  mandiri: { name: "Mandiri",    fullName: "Bank Mandiri",           logo: "/banks/mandiri.png", kodeBank: "008", callCenter: "14000",   website: "https://www.bankmandiri.co.id", dbName: "Mandiri", description: "Bank Mandiri adalah bank BUMN terbesar di Indonesia berdasarkan total aset, yang melayani nasabah perorangan hingga korporasi besar." },
  cimb:    { name: "CIMB Niaga", fullName: "Bank CIMB Niaga",        logo: "/banks/cimb.png",    kodeBank: "022", callCenter: "14041",   website: "https://www.cimbniaga.co.id",  dbName: "CIMB",    description: "CIMB Niaga adalah bank swasta terbesar kedua di Indonesia yang menawarkan layanan perbankan lengkap untuk nasabah retail dan korporasi." },
  bsi:     { name: "BSI",        fullName: "Bank Syariah Indonesia", logo: "/banks/bsi.png",     kodeBank: "451", callCenter: "14040",   website: "https://www.bankbsi.co.id",    dbName: "BSI",     description: "Bank Syariah Indonesia (BSI) adalah bank syariah terbesar di Indonesia hasil merger tiga bank syariah BUMN yang melayani nasabah berdasarkan prinsip syariah." },
};

const BASE_URL = "https://kawaltransaksi.com";

interface PageProps { params: Promise<{ bank: string }>; }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { bank } = await params;
  const bankKey = bank.toLowerCase();
  const data = bankData[bankKey];
  if (!data) return { title: "Bank Tidak Ditemukan - KawalTransaksi", robots: { index: false, follow: false } };

  const title = `Cek Rekening ${data.name} Penipu — Verifikasi Nomor Rekening | KawalTransaksi`;
  const description = `Cek rekening ${data.name} penipu dan cek nomor rekening ${data.name} sebelum transfer. Verifikasi nomor rekening ${data.fullName} lewat database laporan penipuan komunitas KawalTransaksi.`;
  const url = `${BASE_URL}/cek-rekening/${bankKey}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      locale: "id_ID",
      siteName: "KawalTransaksi",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export const revalidate = 60;

export default async function BankDetailPage({ params }: PageProps) {
  const { bank } = await params;
  const bankKey = bank.toLowerCase();
  const data = bankData[bankKey];
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
    const res = await fetch(`${BACKEND_URL}/api/reports/public/bank/${encodeURIComponent(data.dbName)}`, {
      headers: await forwardedClientHeaders(),
      next: { revalidate: 60 },
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
    name: `Cek Rekening ${data.name} Penipu — Verifikasi Nomor Rekening | KawalTransaksi`,
    description: `Cek rekening ${data.name} penipu dan cek nomor rekening ${data.name} sebelum transfer. Verifikasi nomor rekening ${data.fullName} lewat database laporan penipuan komunitas.`,
    url: `${BASE_URL}/cek-rekening/${bankKey}`,
    about: { "@type": "FinancialProduct", name: data.fullName, provider: { "@type": "BankOrCreditUnion", name: data.fullName, telephone: data.callCenter, url: data.website } },
  };

  const breadcrumbData = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Beranda", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Cek Rekening", item: `${BASE_URL}/cek-rekening` },
      { "@type": "ListItem", position: 3, name: data.name, item: `${BASE_URL}/cek-rekening/${bankKey}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbData) }} />
      <BankPageClient bankId={bankKey} bankData={data} reports={reports} totalCount={totalCount} verifiedCount={verifiedCount} pendingCount={pendingCount} isLoggedIn={isLoggedIn} />
    </>
  );
}