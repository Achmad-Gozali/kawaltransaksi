import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import type { Metadata } from 'next';
import { maskNumber, formatDateID } from '@/lib/utils';
import BankPageClient from './BankPageClient';

// ── DATA BANK (hardcode, statis) ──────────────────────────────────────────────
export const bankData: Record<string, {
  name: string;
  fullName: string;
  logo: string;
  kodeBank: string;
  callCenter: string;
  website: string;
  websiteLabel: string;
  description: string;
  faqs: { question: string; answer: string }[];
}> = {
  bca: {
    name: 'BCA',
    fullName: 'Bank Central Asia',
    logo: '/banks/bca.png',
    kodeBank: '014',
    callCenter: '1500888',
    website: 'https://www.bca.co.id',
    websiteLabel: 'www.bca.co.id',
    description: 'PT Bank Central Asia Tbk (BCA) adalah bank swasta terbesar di Indonesia. Didirikan pada 21 Februari 1957, BCA kini melayani jutaan nasabah dengan berbagai layanan perbankan digital dan konvensional.',
    faqs: [
      { question: 'Cara cek rekening BCA dari penipuan?', answer: 'Masukkan nomor rekening BCA yang ingin dicek ke kolom pencarian di atas, lalu klik "Cek Database". Sistem akan mencocokkan nomor tersebut dengan database laporan komunitas KawalTransaksi.' },
      { question: 'Cara melaporkan rekening BCA penipu?', answer: 'Klik tombol "Lapor Rekening" di halaman ini atau buka menu Laporkan. Isi nomor rekening, nama bank (BCA), kronologi penipuan, dan unggah bukti transfer. Laporan akan diverifikasi oleh tim moderator.' },
      { question: 'Cara menghubungi BCA untuk lapor penipuan?', answer: 'Hubungi Halo BCA di 1500888 (24 jam) atau datang langsung ke kantor cabang BCA terdekat dengan membawa bukti transaksi. BCA juga memiliki fitur pelaporan melalui aplikasi myBCA.' },
      { question: 'Berapa kode bank BCA untuk transfer?', answer: 'Kode bank BCA adalah 014. Kode ini digunakan saat transfer antar bank dari bank lain ke rekening BCA.' },
    ],
  },
  bri: {
    name: 'BRI',
    fullName: 'Bank Rakyat Indonesia',
    logo: '/banks/bri.png',
    kodeBank: '002',
    callCenter: '14017',
    website: 'https://www.bri.co.id',
    websiteLabel: 'www.bri.co.id',
    description: 'PT Bank Rakyat Indonesia (Persero) Tbk adalah bank BUMN terbesar di Indonesia berdasarkan aset. Didirikan pada 16 Desember 1895, BRI fokus melayani segmen UMKM dan masyarakat pedesaan di seluruh Indonesia.',
    faqs: [
      { question: 'Cara cek rekening BRI dari penipuan?', answer: 'Masukkan nomor rekening BRI yang ingin dicek ke kolom pencarian di atas, lalu klik "Cek Database". Sistem akan mencocokkan nomor tersebut dengan database laporan komunitas KawalTransaksi.' },
      { question: 'Cara melaporkan rekening BRI penipu?', answer: 'Klik tombol "Lapor Rekening" di halaman ini. Isi nomor rekening BRI, kronologi penipuan, dan lampirkan bukti. Tim moderator akan memverifikasi laporan dalam 1x24 jam.' },
      { question: 'Cara menghubungi BRI untuk lapor penipuan?', answer: 'Hubungi Contact BRI di 14017 atau (021) 500017 (24 jam). Kamu juga bisa melapor melalui aplikasi BRImo atau datang ke kantor cabang BRI terdekat dengan membawa bukti transaksi.' },
      { question: 'Berapa kode bank BRI untuk transfer?', answer: 'Kode bank BRI adalah 002. Kode ini digunakan saat transfer antar bank dari bank lain ke rekening BRI.' },
    ],
  },
  bni: {
    name: 'BNI',
    fullName: 'Bank Negara Indonesia',
    logo: '/banks/bni.png',
    kodeBank: '009',
    callCenter: '1500046',
    website: 'https://www.bni.co.id',
    websiteLabel: 'www.bni.co.id',
    description: 'PT Bank Negara Indonesia (Persero) Tbk adalah bank BUMN tertua di Indonesia, didirikan pada 5 Juli 1946. BNI melayani nasabah ritel, korporasi, dan internasional dengan jaringan luas di dalam dan luar negeri.',
    faqs: [
      { question: 'Cara cek rekening BNI dari penipuan?', answer: 'Masukkan nomor rekening BNI yang ingin dicek ke kolom pencarian di atas, lalu klik "Cek Database". Sistem akan mencocokkan nomor tersebut dengan database laporan komunitas KawalTransaksi.' },
      { question: 'Cara melaporkan rekening BNI penipu?', answer: 'Klik tombol "Lapor Rekening" di halaman ini. Isi nomor rekening BNI, kronologi kejadian, dan unggah bukti. Laporan akan masuk ke database dan diverifikasi oleh moderator KawalTransaksi.' },
      { question: 'Cara menghubungi BNI untuk lapor penipuan?', answer: 'Hubungi BNI Call di 1500046 (24 jam) atau (021) 1500046. Laporan juga bisa disampaikan melalui aplikasi BNI Mobile Banking atau datang ke kantor cabang BNI terdekat.' },
      { question: 'Berapa kode bank BNI untuk transfer?', answer: 'Kode bank BNI adalah 009. Kode ini digunakan saat transfer antar bank dari bank lain ke rekening BNI.' },
    ],
  },
  mandiri: {
    name: 'Mandiri',
    fullName: 'Bank Mandiri',
    logo: '/banks/mandiri.png',
    kodeBank: '008',
    callCenter: '14000',
    website: 'https://www.bankmandiri.co.id',
    websiteLabel: 'www.bankmandiri.co.id',
    description: 'PT Bank Mandiri (Persero) Tbk adalah bank terbesar di Indonesia berdasarkan total aset. Didirikan pada 2 Oktober 1998 sebagai hasil merger empat bank BUMN, Bank Mandiri kini melayani segmen retail, komersial, dan korporasi.',
    faqs: [
      { question: 'Cara cek rekening Mandiri dari penipuan?', answer: 'Masukkan nomor rekening Mandiri yang ingin dicek ke kolom pencarian di atas, lalu klik "Cek Database". Sistem akan mencocokkan nomor tersebut dengan database laporan komunitas KawalTransaksi.' },
      { question: 'Cara melaporkan rekening Mandiri penipu?', answer: 'Klik tombol "Lapor Rekening" di halaman ini. Lengkapi form dengan nomor rekening Mandiri, kronologi penipuan, dan bukti pendukung. Laporan akan diverifikasi dalam 1x24 jam.' },
      { question: 'Cara menghubungi Bank Mandiri untuk lapor penipuan?', answer: "Hubungi Mandiri Call di 14000 atau (021) 5299-7777 (24 jam). Pelaporan juga bisa dilakukan melalui aplikasi Livin' by Mandiri atau di kantor cabang terdekat." },
      { question: 'Berapa kode bank Mandiri untuk transfer?', answer: 'Kode bank Mandiri adalah 008. Kode ini digunakan saat transfer antar bank dari bank lain ke rekening Bank Mandiri.' },
    ],
  },
  cimb: {
    name: 'CIMB Niaga',
    fullName: 'Bank CIMB Niaga',
    logo: '/banks/cimb.png',
    kodeBank: '022',
    callCenter: '14041',
    website: 'https://www.cimbniaga.co.id',
    websiteLabel: 'www.cimbniaga.co.id',
    description: 'PT Bank CIMB Niaga Tbk adalah bank swasta terbesar kedua di Indonesia. Merupakan bagian dari grup CIMB Malaysia, bank ini menawarkan layanan perbankan ritel, syariah, dan korporasi yang lengkap.',
    faqs: [
      { question: 'Cara cek rekening CIMB Niaga dari penipuan?', answer: 'Masukkan nomor rekening CIMB Niaga yang ingin dicek ke kolom pencarian di atas, lalu klik "Cek Database". Sistem akan mencocokkan nomor tersebut dengan database laporan komunitas KawalTransaksi.' },
      { question: 'Cara melaporkan rekening CIMB Niaga penipu?', answer: 'Klik tombol "Lapor Rekening" di halaman ini. Isi nomor rekening CIMB Niaga, kronologi penipuan, dan lampirkan bukti transfer. Tim moderator KawalTransaksi akan memproses laporan kamu.' },
      { question: 'Cara menghubungi CIMB Niaga untuk lapor penipuan?', answer: 'Hubungi Phone Banking CIMB Niaga di 14041 atau (021) 2997-9999 (24 jam). Laporan juga bisa disampaikan melalui aplikasi OCTO Mobile atau kantor cabang CIMB Niaga terdekat.' },
      { question: 'Berapa kode bank CIMB Niaga untuk transfer?', answer: 'Kode bank CIMB Niaga adalah 022. Kode ini digunakan saat transfer antar bank dari bank lain ke rekening CIMB Niaga.' },
    ],
  },
  bsi: {
    name: 'BSI',
    fullName: 'Bank Syariah Indonesia',
    logo: '/banks/bsi.png',
    kodeBank: '451',
    callCenter: '14040',
    website: 'https://www.bankbsi.co.id',
    websiteLabel: 'www.bankbsi.co.id',
    description: 'PT Bank Syariah Indonesia Tbk (BSI) adalah bank syariah terbesar di Indonesia, hasil merger Bank BRI Syariah, Bank BNI Syariah, dan Bank Syariah Mandiri pada 1 Februari 2021. BSI melayani perbankan berbasis prinsip syariah Islam.',
    faqs: [
      { question: 'Cara cek rekening BSI dari penipuan?', answer: 'Masukkan nomor rekening BSI yang ingin dicek ke kolom pencarian di atas, lalu klik "Cek Database". Sistem akan mencocokkan nomor tersebut dengan database laporan komunitas KawalTransaksi.' },
      { question: 'Cara melaporkan rekening BSI penipu?', answer: 'Klik tombol "Lapor Rekening" di halaman ini. Isi nomor rekening BSI, kronologi penipuan, dan unggah bukti. Laporan akan diverifikasi oleh tim moderator KawalTransaksi.' },
      { question: 'Cara menghubungi BSI untuk lapor penipuan?', answer: 'Hubungi BSI Call di 14040 (24 jam). Pelaporan juga bisa dilakukan melalui aplikasi BSI Mobile atau datang langsung ke kantor cabang BSI terdekat dengan membawa bukti transaksi.' },
      { question: 'Berapa kode bank BSI untuk transfer?', answer: 'Kode bank BSI adalah 451. Kode ini digunakan saat transfer antar bank dari bank lain ke rekening Bank Syariah Indonesia.' },
    ],
  },
};

interface PageProps {
  params: Promise<{ bank: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { bank } = await params;
  const data = bankData[bank.toLowerCase()];
  if (!data) return { title: 'Bank Tidak Ditemukan' };
  return {
    title: `Cek Rekening ${data.name} - KawalTransaksi`,
    description: `Verifikasi nomor rekening ${data.fullName} sebelum transfer. Cek apakah rekening ${data.name} terindikasi penipuan di database komunitas KawalTransaksi.`,
  };
}

export const revalidate = 60;

export default async function BankDetailPage({ params }: PageProps) {
  const { bank } = await params;
  const bankKey = bank.toLowerCase();
  const data = bankData[bankKey];

  if (!data) notFound();

  const supabase = await createClient();

  const [
    { data: recentReports },
    { count: totalCount },
    { count: verifiedCount },
    { count: pendingCount },
  ] = await Promise.all([
    supabase
      .from('reports')
      .select('target_number, target_name, status, created_at')
      .eq('target_type', 'bank_account')
      .ilike('bank_name', `%${data.name}%`)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('target_type', 'bank_account').ilike('bank_name', `%${data.name}%`),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('target_type', 'bank_account').ilike('bank_name', `%${data.name}%`).eq('status', 'verified'),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('target_type', 'bank_account').ilike('bank_name', `%${data.name}%`).eq('status', 'pending'),
  ]);

  const reports = (recentReports ?? []).map((r) => ({
    target_number: r.target_number as string,
    target_name: r.target_name as string | null,
    status: r.status as string,
    created_at: r.created_at as string,
    masked: maskNumber(r.target_number as string),
    dateFormatted: formatDateID(r.created_at as string),
  }));

  return (
    <BankPageClient
      bankData={data}
      reports={reports}
      totalCount={totalCount ?? 0}
      verifiedCount={verifiedCount ?? 0}
      pendingCount={pendingCount ?? 0}
    />
  );
}