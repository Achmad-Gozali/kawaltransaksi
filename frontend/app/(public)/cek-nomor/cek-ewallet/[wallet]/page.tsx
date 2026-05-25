import { notFound } from "next/navigation";
import { createClient } from "@/core/supabase/server";
import type { Metadata } from "next";
import { maskNumber, formatDateID } from "@/core/utils";
import EwalletPageClient from "./EwalletPageClient";

const ewalletData: Record<
  string,
  {
    name: string;
    fullName: string;
    logo: string;
    callCenter: string;
    website: string;
    websiteLabel: string;
    helpUrl: string;
    dbName: string;
    description: string;
    transferTips: string[];
    securityTips: string[];
    faqs: { question: string; answer: string }[];
  }
> = {
  gopay: {
    name: "GoPay",
    fullName: "GoPay",
    logo: "/ewallets/gopay.png",
    callCenter: "1500321",
    website: "https://www.gojek.com/gopay",
    websiteLabel: "gojek.com/gopay",
    helpUrl: "https://www.gojek.com/en-id/help",
    dbName: "GoPay",
    description:
      "GoPay adalah layanan dompet digital milik Gojek yang memungkinkan pengguna melakukan pembayaran, transfer, dan berbagai transaksi keuangan digital secara mudah dan cepat.",
    transferTips: [
      "Buka aplikasi Gojek dan pilih menu GoPay.",
      'Pilih "Kirim" lalu masukkan nomor HP tujuan.',
      "Pastikan nama penerima muncul sebelum konfirmasi.",
      "Masukkan jumlah transfer dan konfirmasi dengan PIN.",
    ],
    securityTips: [
      "Jangan pernah bagikan kode OTP GoPay ke siapapun termasuk CS.",
      "Aktifkan PIN dan verifikasi biometrik di aplikasi Gojek.",
      "Waspada akun GoPay palsu yang mengaku memberi reward.",
      "Pastikan nomor tujuan benar sebelum konfirmasi transfer.",
    ],
    faqs: [
      {
        question: "Cara cek akun GoPay dari penipuan?",
        answer:
          'Masukkan nomor HP yang terdaftar di GoPay ke kolom pencarian di atas, lalu klik "Cek Database".',
      },
      {
        question: "Cara melaporkan akun GoPay penipu?",
        answer:
          'Klik tombol "Lapor Akun" di halaman ini. Isi nomor HP GoPay penipu, kronologi penipuan, dan lampirkan bukti transaksi.',
      },
      {
        question: "Cara menghubungi GoPay untuk lapor penipuan?",
        answer:
          'Hubungi CS Gojek di 1500321 atau melalui fitur "Bantuan" di aplikasi Gojek.',
      },
      {
        question: "Bagaimana cara blokir akun GoPay penipu?",
        answer:
          "Laporkan langsung ke CS Gojek di 1500321 dengan menyertakan bukti transaksi dan kronologi kejadian.",
      },
    ],
  },
  dana: {
    name: "Dana",
    fullName: "DANA",
    logo: "/ewallets/dana.png",
    callCenter: "1500 445",
    website: "https://www.dana.id",
    websiteLabel: "dana.id",
    helpUrl: "https://www.dana.id/pusat-bantuan",
    dbName: "Dana",
    description:
      "DANA adalah dompet digital Indonesia yang menyediakan layanan pembayaran, transfer uang, dan berbagai fitur keuangan digital.",
    transferTips: [
      'Buka aplikasi DANA dan pilih menu "Kirim".',
      "Masukkan nomor HP atau scan QR code penerima.",
      "Verifikasi nama penerima yang muncul di layar.",
      "Masukkan jumlah dan konfirmasi dengan PIN DANA.",
    ],
    securityTips: [
      "Jangan bagikan PIN atau kode OTP DANA ke siapapun.",
      "Aktifkan DANA Protection di pengaturan keamanan aplikasi.",
      'Waspada modus "saldo gratis" atau "hadiah DANA" palsu.',
      "Selalu cek nama penerima sebelum konfirmasi transfer.",
    ],
    faqs: [
      {
        question: "Cara cek akun DANA dari penipuan?",
        answer:
          'Masukkan nomor HP yang terdaftar di DANA ke kolom pencarian di atas, lalu klik "Cek Database".',
      },
      {
        question: "Cara melaporkan akun DANA penipu?",
        answer:
          'Klik tombol "Lapor Akun" di halaman ini. Isi nomor HP DANA penipu, kronologi penipuan, dan lampirkan bukti.',
      },
      {
        question: "Cara menghubungi DANA untuk lapor penipuan?",
        answer:
          'Hubungi CS DANA di 1500 445 or melalui fitur "Bantuan" di aplikasi DANA.',
      },
      {
        question: "Bagaimana cara blokir akun DANA penipu?",
        answer:
          "Laporkan ke CS DANA di 1500 445 dengan menyertakan nomor HP penipu dan bukti transaksi.",
      },
    ],
  },
  ovo: {
    name: "OVO",
    fullName: "OVO",
    logo: "/ewallets/ovo.png",
    callCenter: "1500 696",
    website: "https://www.ovo.id",
    websiteLabel: "ovo.id",
    helpUrl: "https://www.ovo.id/bantuan",
    dbName: "OVO",
    description:
      "OVO adalah platform pembayaran digital terkemuka di Indonesia yang menawarkan layanan pembayaran, transfer, investasi, dan pinjaman dalam satu aplikasi.",
    transferTips: [
      'Buka aplikasi OVO dan pilih menu "Transfer".',
      "Masukkan nomor HP terdaftar OVO penerima.",
      "Pastikan nama akun OVO penerima sesuai.",
      "Masukkan nominal dan konfirmasi dengan Security Code OVO.",
    ],
    securityTips: [
      "Jangan bagikan Security Code OVO ke siapapun.",
      "Aktifkan OVO Secure di pengaturan aplikasi OVO.",
      "Waspada modus upgrade OVO Premier palsu yang meminta data.",
      "Pastikan transaksi dilakukan di aplikasi OVO resmi.",
    ],
    faqs: [
      {
        question: "Cara cek akun OVO dari penipuan?",
        answer:
          'Masukkan nomor HP yang terdaftar di OVO ke kolom pencarian di atas, lalu klik "Cek Database".',
      },
      {
        question: "Cara melaporkan akun OVO penipu?",
        answer:
          'Klik tombol "Lapor Akun" di halaman ini. Isi nomor HP OVO penipu, kronologi kejadian, dan lampirkan bukti.',
      },
      {
        question: "Cara menghubungi OVO untuk lapor penipuan?",
        answer:
          'Hubungi CS OVO di 1500 696 atau melalui fitur "Help" di aplikasi OVO.',
      },
      {
        question: "Bagaimana cara blokir akun OVO penipu?",
        answer:
          "Laporkan ke CS OVO di 1500 696 dengan bukti transaksi dan kronologi kejadian.",
      },
    ],
  },
  shopee: {
    name: "ShopeePay",
    fullName: "ShopeePay",
    logo: "/ewallets/shopeepay.png",
    callCenter: "1500 702",
    website: "https://shopee.co.id/shopeepay",
    websiteLabel: "shopee.co.id/shopeepay",
    helpUrl: "https://help.shopee.co.id",
    dbName: "ShopeePay",
    description:
      "ShopeePay adalah dompet digital terintegrasi dalam platform Shopee yang memungkinkan pembayaran belanja online, transfer saldo, dan berbagai transaksi digital lainnya.",
    transferTips: [
      "Buka aplikasi Shopee dan pilih menu ShopeePay.",
      'Pilih "Transfer" dan masukkan nomor HP tujuan.',
      "Konfirmasi nama penerima yang terdaftar di ShopeePay.",
      "Masukkan jumlah transfer dan verifikasi dengan PIN.",
    ],
    securityTips: [
      "Jangan bagikan kode OTP ShopeePay ke siapapun.",
      "Aktifkan verifikasi dua langkah di akun Shopee kamu.",
      "Waspada modus cashback atau koin Shopee gratis palsu.",
      "Transaksi ShopeePay hanya melalui aplikasi Shopee resmi.",
    ],
    faqs: [
      {
        question: "Cara cek akun ShopeePay dari penipuan?",
        answer:
          'Masukkan nomor HP yang terdaftar di ShopeePay ke kolom pencarian di atas, lalu klik "Cek Database".',
      },
      {
        question: "Cara melaporkan akun ShopeePay penipu?",
        answer:
          'Klik tombol "Lapor Akun" di halaman ini. Isi nomor HP ShopeePay penipu, kronologi penipuan, dan lampirkan bukti transaksi.',
      },
      {
        question: "Cara menghubungi ShopeePay untuk lapor penipuan?",
        answer:
          'Hubungi CS Shopee di 1500 702 atau melalui fitur "Bantuan" di aplikasi Shopee.',
      },
      {
        question: "Bagaimana cara blokir akun ShopeePay penipu?",
        answer:
          "Laporkan ke CS Shopee di 1500 702 dengan menyertakan bukti transaksi.",
      },
    ],
  },
  linkaja: {
    name: "LinkAja",
    fullName: "LinkAja",
    logo: "/ewallets/linkaja.png",
    callCenter: "1500 911",
    website: "https://www.linkaja.id",
    websiteLabel: "linkaja.id",
    helpUrl: "https://www.linkaja.id/bantuan",
    dbName: "LinkAja",
    description:
      "LinkAja adalah layanan uang elektronik berbasis aplikasi milik BUMN yang menyediakan layanan pembayaran digital, transfer, dan berbagai fitur keuangan untuk kebutuhan sehari-hari.",
    transferTips: [
      'Buka aplikasi LinkAja dan pilih "Kirim Uang".',
      "Masukkan nomor HP terdaftar LinkAja penerima.",
      "Verifikasi nama penerima sebelum melanjutkan.",
      "Masukkan nominal dan konfirmasi dengan PIN LinkAja.",
    ],
    securityTips: [
      "Jangan bagikan PIN atau kode OTP LinkAja ke siapapun.",
      "Aktifkan notifikasi transaksi untuk memantau aktivitas akun.",
      "Waspada modus hadiah atau subsidi LinkAja palsu.",
      "Laporkan segera jika ada transaksi mencurigakan ke CS LinkAja.",
    ],
    faqs: [
      {
        question: "Cara cek akun LinkAja dari penipuan?",
        answer:
          'Masukkan nomor HP yang terdaftar di LinkAja ke kolom pencarian di atas, lalu klik "Cek Database".',
      },
      {
        question: "Cara melaporkan akun LinkAja penipu?",
        answer:
          'Klik tombol "Lapor Akun" di halaman ini. Isi nomor HP LinkAja penipu, kronologi kejadian, dan lampirkan bukti.',
      },
      {
        question: "Cara menghubungi LinkAja untuk lapor penipuan?",
        answer:
          'Hubungi CS LinkAja di 1500 911 atau melalui fitur "Bantuan" di aplikasi LinkAja.',
      },
      {
        question: "Bagaimana cara blokir akun LinkAja penipu?",
        answer:
          "Laporkan ke CS LinkAja di 1500 911 dengan menyertakan bukti transaksi dan nomor HP penipu.",
      },
    ],
  },
};

const BASE_URL = "https://kawaltransaksi.com";

interface PageProps {
  params: Promise<{ wallet: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { wallet } = await params;
  const data = ewalletData[wallet.toLowerCase()];
  if (!data) return { title: "E-Wallet Tidak Ditemukan" };
  return {
    title: `Cek Akun ${data.name} - KawalTransaksi`,
    description: `Verifikasi nomor ${data.fullName} sebelum transfer. Cek apakah akun ${data.name} terindikasi penipuan di database komunitas KawalTransaksi.`,
  };
}

export const revalidate = 60;

export default async function EwalletDetailPage({ params }: PageProps) {
  const { wallet } = await params;
  const walletKey = wallet.toLowerCase();
  const data = ewalletData[walletKey];
  if (!data) notFound();

  const supabase = await createClient();

  type ReportRow = {
    target_number: string;
    target_name: string | null;
    status: string;
    created_at: string;
  };

  // [OK] OPTIMIZED: hapus query categoryData -- prop categoryBreakdown tidak dirender di EwalletPageClient
  const [{ data: primaryReports }, { data: linkedReports }] = await Promise.all(
    [
      supabase
        .from("reports")
        .select("target_number, target_name, status, created_at")
        .ilike("bank_name", `%${data.dbName}%`)
        .order("created_at", { ascending: false }),
      supabase
        .from("reports")
        .select("target_numbers, status, created_at")
        .filter(
          "target_numbers",
          "cs",
          `[{"type":"ewallet","bank":"${data.dbName}"}]`,
        )
        .order("created_at", { ascending: false }),
    ],
  );

  const linkedRows: ReportRow[] = [];
  (linkedReports ?? []).forEach((r: any) => {
    if (!Array.isArray(r.target_numbers)) return;
    r.target_numbers.forEach((item: any) => {
      if (
        typeof item === "object" &&
        item.type === "ewallet" &&
        item.bank?.toLowerCase() === data.dbName.toLowerCase() &&
        item.number
      ) {
        linkedRows.push({
          target_number: item.number,
          target_name: item.name ?? null,
          status: r.status,
          created_at: r.created_at,
        });
      }
    });
  });

  const seenNumbers = new Set<string>();
  const allRows: ReportRow[] = [];
  [...(primaryReports ?? []), ...linkedRows].forEach((r: any) => {
    if (!seenNumbers.has(r.target_number)) {
      seenNumbers.add(r.target_number);
      allRows.push(r);
    }
  });

  const totalCount = allRows.length;
  const verifiedCount = allRows.filter((r) => r.status === "verified").length;
  const pendingCount = allRows.filter((r) => r.status === "pending").length;

  const reports = allRows.slice(0, 6).map((r) => ({
    target_number: r.target_number,
    target_name: r.target_name,
    status: r.status,
    created_at: r.created_at,
    masked: maskNumber(r.target_number),
    dateFormatted: formatDateID(r.created_at),
  }));

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Cek Akun ${data.name} - KawalTransaksi`,
    description: `Verifikasi nomor ${data.fullName} sebelum transfer. Cek apakah akun ${data.name} terindikasi penipuan.`,
    url: `${BASE_URL}/cek-nomor/cek-ewallet/${walletKey}`,
    about: {
      "@type": "FinancialProduct",
      name: data.fullName,
      provider: {
        "@type": "Organization",
        name: data.fullName,
        telephone: data.callCenter,
        url: data.website,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <EwalletPageClient
        walletId={walletKey}
        walletData={data}
        reports={reports}
        totalCount={totalCount}
        verifiedCount={verifiedCount}
        pendingCount={pendingCount}
        categoryBreakdown={[]}
      />
    </>
  );
}
