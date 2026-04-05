import { notFound } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { maskNumber, formatDateID } from '@/lib/utils';
import BankPageClient from './BankPageClient';

const bankData: Record<string, {
  name: string; fullName: string; logo: string; kodeBank: string;
  callCenter: string; website: string; websiteLabel: string; description: string;
  transferTips: string[]; securityTips: string[];
  faqs: { question: string; answer: string }[];
}> = {
  bca: {
    name: 'BCA', fullName: 'Bank Central Asia', logo: '/banks/bca.png', kodeBank: '014',
    callCenter: '1500888', website: 'https://www.bca.co.id', websiteLabel: 'www.bca.co.id',
    description: 'PT Bank Central Asia Tbk (BCA) adalah bank swasta terbesar di Indonesia. Didirikan pada 21 Februari 1957, BCA kini melayani jutaan nasabah dengan berbagai layanan perbankan digital dan konvensional.',
    transferTips: ['Gunakan kode bank BCA 014 saat transfer dari bank lain.', 'Pastikan nomor rekening terdiri dari 10 digit angka.', 'Verifikasi nama penerima yang muncul sebelum konfirmasi.', 'Simpan bukti transfer sebagai referensi transaksi.'],
    securityTips: ['Jangan pernah berikan kode OTP myBCA ke siapapun termasuk CS BCA.', 'Aktifkan notifikasi transaksi di aplikasi myBCA.', 'Waspada modus social engineering mengatasnamakan BCA.', 'Gunakan hanya aplikasi myBCA resmi untuk transaksi digital.'],
    faqs: [
      { question: 'Cara cek rekening BCA dari penipuan?', answer: 'Masukkan nomor rekening BCA yang ingin dicek ke kolom pencarian di atas, lalu klik "Cek Database".' },
      { question: 'Cara melaporkan rekening BCA penipu?', answer: 'Klik tombol "Lapor Rekening" di halaman ini. Isi nomor rekening, nama bank (BCA), kronologi penipuan, dan unggah bukti transfer.' },
      { question: 'Cara menghubungi BCA untuk lapor penipuan?', answer: 'Hubungi Halo BCA di 1500888 (24 jam) atau datang langsung ke kantor cabang BCA terdekat.' },
      { question: 'Berapa kode bank BCA untuk transfer?', answer: 'Kode bank BCA adalah 014.' },
    ],
  },
  bri: {
    name: 'BRI', fullName: 'Bank Rakyat Indonesia', logo: '/banks/bri.png', kodeBank: '002',
    callCenter: '14017', website: 'https://www.bri.co.id', websiteLabel: 'www.bri.co.id',
    description: 'PT Bank Rakyat Indonesia (Persero) Tbk adalah bank BUMN terbesar di Indonesia berdasarkan aset. Didirikan pada 16 Desember 1895, BRI fokus melayani segmen UMKM dan masyarakat pedesaan di seluruh Indonesia.',
    transferTips: ['Gunakan kode bank BRI 002 saat transfer dari bank lain.', 'Nomor rekening BRI terdiri dari 15 digit angka.', 'Verifikasi nama penerima sebelum konfirmasi transfer.', 'Gunakan BRImo untuk transfer real-time 24 jam.'],
    securityTips: ['Jangan bagikan PIN atau password BRImo ke siapapun.', 'Aktifkan fitur keamanan biometrik di aplikasi BRImo.', 'Waspada penipuan berkedok program BRI subsidi atau hadiah.', 'Laporkan transaksi mencurigakan ke BRI Contact 14017.'],
    faqs: [
      { question: 'Cara cek rekening BRI dari penipuan?', answer: 'Masukkan nomor rekening BRI yang ingin dicek ke kolom pencarian di atas, lalu klik "Cek Database".' },
      { question: 'Cara melaporkan rekening BRI penipu?', answer: 'Klik tombol "Lapor Rekening" di halaman ini. Isi nomor rekening BRI, kronologi penipuan, dan lampirkan bukti.' },
      { question: 'Cara menghubungi BRI untuk lapor penipuan?', answer: 'Hubungi Contact BRI di 14017 atau (021) 500017 (24 jam).' },
      { question: 'Berapa kode bank BRI untuk transfer?', answer: 'Kode bank BRI adalah 002.' },
    ],
  },
  bni: {
    name: 'BNI', fullName: 'Bank Negara Indonesia', logo: '/banks/bni.png', kodeBank: '009',
    callCenter: '1500046', website: 'https://www.bni.co.id', websiteLabel: 'www.bni.co.id',
    description: 'PT Bank Negara Indonesia (Persero) Tbk adalah bank BUMN tertua di Indonesia, didirikan pada 5 Juli 1946. BNI melayani nasabah ritel, korporasi, dan internasional dengan jaringan luas di dalam dan luar negeri.',
    transferTips: ['Gunakan kode bank BNI 009 saat transfer dari bank lain.', 'Nomor rekening BNI terdiri dari 10 digit angka.', 'Cek nama penerima sebelum konfirmasi di BNI Mobile.', 'Transfer antar BNI gratis melalui aplikasi BNI Mobile Banking.'],
    securityTips: ['Jangan pernah berikan kode OTP BNI ke siapapun.', 'Aktifkan notifikasi SMS/email untuk setiap transaksi BNI.', 'Waspada phishing mengatasnamakan BNI melalui email atau SMS.', 'Gunakan hanya website resmi bni.co.id untuk internet banking.'],
    faqs: [
      { question: 'Cara cek rekening BNI dari penipuan?', answer: 'Masukkan nomor rekening BNI yang ingin dicek ke kolom pencarian di atas, lalu klik "Cek Database".' },
      { question: 'Cara melaporkan rekening BNI penipu?', answer: 'Klik tombol "Lapor Rekening" di halaman ini. Isi nomor rekening BNI, kronologi kejadian, dan unggah bukti.' },
      { question: 'Cara menghubungi BNI untuk lapor penipuan?', answer: 'Hubungi BNI Call di 1500046 (24 jam) atau (021) 1500046.' },
      { question: 'Berapa kode bank BNI untuk transfer?', answer: 'Kode bank BNI adalah 009.' },
    ],
  },
  mandiri: {
    name: 'Mandiri', fullName: 'Bank Mandiri', logo: '/banks/mandiri.png', kodeBank: '008',
    callCenter: '14000', website: 'https://www.bankmandiri.co.id', websiteLabel: 'www.bankmandiri.co.id',
    description: 'PT Bank Mandiri (Persero) Tbk adalah bank terbesar di Indonesia berdasarkan total aset. Didirikan pada 2 Oktober 1998 sebagai hasil merger empat bank BUMN.',
    transferTips: ['Gunakan kode bank Mandiri 008 saat transfer dari bank lain.', 'Nomor rekening Mandiri terdiri dari 13 digit angka.', "Verifikasi nama penerima di aplikasi Livin sebelum konfirmasi.", "Transfer sesama Mandiri gratis melalui Livin' by Mandiri."],
    securityTips: ['Jangan bagikan MPIN atau kode OTP Mandiri ke siapapun.', "Aktifkan fitur keamanan di aplikasi Livin' by Mandiri.", 'Waspada modus soceng mengatasnamakan Bank Mandiri.', 'Pastikan URL internet banking adalah bankmandiri.co.id.'],
    faqs: [
      { question: 'Cara cek rekening Mandiri dari penipuan?', answer: 'Masukkan nomor rekening Mandiri yang ingin dicek ke kolom pencarian di atas, lalu klik "Cek Database".' },
      { question: 'Cara melaporkan rekening Mandiri penipu?', answer: 'Klik tombol "Lapor Rekening" di halaman ini. Lengkapi form dengan nomor rekening Mandiri, kronologi penipuan, dan bukti pendukung.' },
      { question: 'Cara menghubungi Bank Mandiri untuk lapor penipuan?', answer: 'Hubungi Mandiri Call di 14000 atau (021) 5299-7777 (24 jam).' },
      { question: 'Berapa kode bank Mandiri untuk transfer?', answer: 'Kode bank Mandiri adalah 008.' },
    ],
  },
  cimb: {
    name: 'CIMB Niaga', fullName: 'Bank CIMB Niaga', logo: '/banks/cimb.png', kodeBank: '022',
    callCenter: '14041', website: 'https://www.cimbniaga.co.id', websiteLabel: 'www.cimbniaga.co.id',
    description: 'PT Bank CIMB Niaga Tbk adalah bank swasta terbesar kedua di Indonesia. Merupakan bagian dari grup CIMB Malaysia.',
    transferTips: ['Gunakan kode bank CIMB Niaga 022 saat transfer dari bank lain.', 'Nomor rekening CIMB Niaga terdiri dari 13-16 digit angka.', 'Verifikasi nama penerima di aplikasi OCTO Mobile sebelum konfirmasi.', 'Transfer sesama CIMB Niaga gratis melalui aplikasi OCTO Mobile.'],
    securityTips: ['Jangan bagikan kode OTP OCTO Mobile ke siapapun.', 'Aktifkan OCTO Secure untuk perlindungan transaksi berlapis.', 'Waspada phishing mengatasnamakan CIMB Niaga melalui email.', 'Gunakan hanya aplikasi OCTO Mobile resmi dari Play Store/App Store.'],
    faqs: [
      { question: 'Cara cek rekening CIMB Niaga dari penipuan?', answer: 'Masukkan nomor rekening CIMB Niaga yang ingin dicek ke kolom pencarian di atas, lalu klik "Cek Database".' },
      { question: 'Cara melaporkan rekening CIMB Niaga penipu?', answer: 'Klik tombol "Lapor Rekening" di halaman ini. Isi nomor rekening CIMB Niaga, kronologi penipuan, dan lampirkan bukti transfer.' },
      { question: 'Cara menghubungi CIMB Niaga untuk lapor penipuan?', answer: 'Hubungi Phone Banking CIMB Niaga di 14041 atau (021) 2997-9999 (24 jam).' },
      { question: 'Berapa kode bank CIMB Niaga untuk transfer?', answer: 'Kode bank CIMB Niaga adalah 022.' },
    ],
  },
  bsi: {
    name: 'BSI', fullName: 'Bank Syariah Indonesia', logo: '/banks/bsi.png', kodeBank: '451',
    callCenter: '14040', website: 'https://www.bankbsi.co.id', websiteLabel: 'www.bankbsi.co.id',
    description: 'PT Bank Syariah Indonesia Tbk (BSI) adalah bank syariah terbesar di Indonesia, hasil merger Bank BRI Syariah, Bank BNI Syariah, dan Bank Syariah Mandiri pada 1 Februari 2021.',
    transferTips: ['Gunakan kode bank BSI 451 saat transfer dari bank lain.', 'Nomor rekening BSI terdiri dari 10-13 digit angka.', 'Verifikasi nama penerima di aplikasi BSI Mobile sebelum konfirmasi.', 'Transfer sesama BSI gratis melalui aplikasi BSI Mobile.'],
    securityTips: ['Jangan pernah berikan kode OTP BSI Mobile ke siapapun.', 'Aktifkan verifikasi biometrik di aplikasi BSI Mobile.', 'Waspada modus penipuan berkedok program BSI atau promo syariah.', 'Pastikan hanya menggunakan aplikasi BSI Mobile resmi.'],
    faqs: [
      { question: 'Cara cek rekening BSI dari penipuan?', answer: 'Masukkan nomor rekening BSI yang ingin dicek ke kolom pencarian di atas, lalu klik "Cek Database".' },
      { question: 'Cara melaporkan rekening BSI penipu?', answer: 'Klik tombol "Lapor Rekening" di halaman ini. Isi nomor rekening BSI, kronologi penipuan, dan unggah bukti.' },
      { question: 'Cara menghubungi BSI untuk lapor penipuan?', answer: 'Hubungi BSI Call di 14040 (24 jam).' },
      { question: 'Berapa kode bank BSI untuk transfer?', answer: 'Kode bank BSI adalah 451.' },
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

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { }
        },
      },
    }
  );

  const [
    { data: recentReports },
    { count: totalCount },
    { count: verifiedCount },
    { count: pendingCount },
    { data: categoryData },
  ] = await Promise.all([
    supabase.from('reports').select('target_number, target_name, status, created_at').eq('target_type', 'bank_account').ilike('bank_name', `%${data.name}%`).order('created_at', { ascending: false }).limit(6),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('target_type', 'bank_account').ilike('bank_name', `%${data.name}%`),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('target_type', 'bank_account').ilike('bank_name', `%${data.name}%`).eq('status', 'verified'),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('target_type', 'bank_account').ilike('bank_name', `%${data.name}%`).eq('status', 'pending'),
    supabase.from('reports').select('category').eq('target_type', 'bank_account').ilike('bank_name', `%${data.name}%`),
  ]);

  const reports = (recentReports ?? []).map((r) => ({
    target_number: r.target_number as string,
    target_name: r.target_name as string | null,
    status: r.status as string,
    created_at: r.created_at as string,
    masked: maskNumber(r.target_number as string),
    dateFormatted: formatDateID(r.created_at as string),
  }));

  const categoryMap: Record<string, number> = {};
  (categoryData ?? []).forEach((r: { category: string | null }) => {
    if (r.category) categoryMap[r.category] = (categoryMap[r.category] || 0) + 1;
  });
  const categoryBreakdown = Object.entries(categoryMap)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <BankPageClient
      bankData={data}
      reports={reports}
      totalCount={totalCount ?? 0}
      verifiedCount={verifiedCount ?? 0}
      pendingCount={pendingCount ?? 0}
      categoryBreakdown={categoryBreakdown}
    />
  );
}