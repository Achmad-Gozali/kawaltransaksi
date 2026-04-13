import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import type { Metadata } from 'next';
import { maskNumber, formatDateID } from '@/lib/utils';
import BankPageClient from './BankPageClient';

const bankData: Record<string, {
  name: string; fullName: string; logo: string; kodeBank: string;
  callCenter: string; website: string; websiteLabel: string;
  helpUrl: string; dbName: string; description: string;
  transferTips: string[]; securityTips: string[];
  faqs: { question: string; answer: string }[];
}> = {
  bca: {
    name: 'BCA', fullName: 'Bank Central Asia', logo: '/banks/bca.png',
    kodeBank: '014', callCenter: '1500888',
    website: 'https://www.bca.co.id', websiteLabel: 'bca.co.id',
    helpUrl: 'https://www.bca.co.id/id/Tentang-BCA/Hubungi-BCA', dbName: 'BCA',
    description: 'Bank Central Asia (BCA) adalah bank swasta terbesar di Indonesia yang melayani jutaan nasabah dengan berbagai produk perbankan.',
    transferTips: ['Login ke myBCA / KlikBCA / BCA mobile.', 'Pilih menu Transfer dan masukkan nomor rekening tujuan.', 'Verifikasi nama penerima yang muncul sebelum konfirmasi.', 'Masukkan jumlah transfer dan konfirmasi dengan KeyBCA / OTP.'],
    securityTips: ['Jangan pernah bagikan KeyBCA atau kode OTP ke siapapun.', 'Pastikan URL myBCA adalah klikbca.com (bukan situs palsu).', 'Aktifkan notifikasi transaksi di BCA mobile.', 'Hubungi Halo BCA 1500888 jika ada transaksi mencurigakan.'],
    faqs: [
      { question: 'Cara cek rekening BCA penipuan?', answer: 'Masukkan nomor rekening BCA ke kolom pencarian di atas, lalu klik "Cek Database".' },
      { question: 'Cara laporkan rekening BCA penipu?', answer: 'Klik "Lapor Rekening", isi nomor rekening dan kronologi, lalu upload bukti transfer.' },
      { question: 'Cara blokir rekening BCA penipu?', answer: 'Hubungi Halo BCA 1500888 dan laporkan dengan bukti transaksi lengkap.' },
      { question: 'Bagaimana cara membekukan rekening BCA penipuan?', answer: 'Datang langsung ke cabang BCA terdekat dengan membawa bukti penipuan, atau hubungi Halo BCA 1500888.' },
    ],
  },
  bri: {
    name: 'BRI', fullName: 'Bank Rakyat Indonesia', logo: '/banks/bri.png',
    kodeBank: '002', callCenter: '1500017',
    website: 'https://www.bri.co.id', websiteLabel: 'bri.co.id',
    helpUrl: 'https://bri.co.id/web/guest/kontak', dbName: 'BRI',
    description: 'Bank Rakyat Indonesia (BRI) adalah salah satu bank BUMN terbesar di Indonesia yang fokus melayani segmen mikro, kecil, dan menengah.',
    transferTips: ['Login ke BRImo atau Internet Banking BRI.', 'Pilih Transfer dan masukkan nomor rekening tujuan.', 'Pastikan nama penerima sesuai sebelum melanjutkan.', 'Konfirmasi dengan PIN / OTP yang dikirim ke HP terdaftar.'],
    securityTips: ['Jangan bagikan PIN BRImo atau kode OTP ke siapapun.', 'Waspada SMS/email palsu mengatasnamakan BRI.', 'Aktifkan notifikasi transaksi BRImo.', 'Laporkan ke Contact BRI 1500017 jika ada transaksi mencurigakan.'],
    faqs: [
      { question: 'Cara cek rekening BRI penipuan?', answer: 'Masukkan nomor rekening BRI ke kolom pencarian di atas.' },
      { question: 'Cara laporkan rekening BRI penipu?', answer: 'Klik "Lapor Rekening" dan isi formulir dengan nomor rekening, kronologi, serta bukti.' },
      { question: 'Cara blokir rekening BRI penipu?', answer: 'Hubungi Contact BRI 1500017 atau datang ke cabang BRI terdekat.' },
      { question: 'Apakah BRI bisa membekukan rekening penipu?', answer: 'Ya, hubungi Contact BRI 1500017 dan sertakan bukti penipuan untuk proses tindak lanjut.' },
    ],
  },
  bni: {
    name: 'BNI', fullName: 'Bank Negara Indonesia', logo: '/banks/bni.png',
    kodeBank: '009', callCenter: '1500046',
    website: 'https://www.bni.co.id', websiteLabel: 'bni.co.id',
    helpUrl: 'https://www.bni.co.id/id-id/beranda/hubungikami', dbName: 'BNI',
    description: 'Bank Negara Indonesia (BNI) adalah bank BUMN yang melayani berbagai kebutuhan perbankan perorangan dan korporasi di seluruh Indonesia.',
    transferTips: ['Login ke BNI Mobile Banking atau Internet Banking BNI.', 'Pilih Transfer dan masukkan nomor rekening BNI tujuan.', 'Verifikasi nama penerima yang muncul.', 'Konfirmasi dengan token BNI atau OTP yang dikirim ke HP.'],
    securityTips: ['Jangan bagikan token BNI atau kode OTP ke siapapun.', 'Selalu akses BNI Mobile Banking via aplikasi resmi BNI.', 'Aktifkan BNI SMS Notifikasi untuk pantau transaksi.', 'Hubungi BNI Call 1500046 jika ada aktivitas mencurigakan.'],
    faqs: [
      { question: 'Cara cek rekening BNI penipuan?', answer: 'Masukkan nomor rekening BNI ke kolom pencarian di atas.' },
      { question: 'Cara laporkan rekening BNI penipu?', answer: 'Klik "Lapor Rekening" di halaman ini dan isi kronologi penipuan serta bukti transfer.' },
      { question: 'Cara blokir rekening BNI penipu?', answer: 'Hubungi BNI Call 1500046 dengan menyertakan bukti transaksi.' },
      { question: 'Bagaimana BNI menangani laporan penipuan?', answer: 'BNI akan memverifikasi laporan dan dapat melakukan pembekuan rekening jika terbukti terlibat penipuan.' },
    ],
  },
  mandiri: {
    name: 'Mandiri', fullName: 'Bank Mandiri', logo: '/banks/mandiri.png',
    kodeBank: '008', callCenter: '14000',
    website: 'https://www.bankmandiri.co.id', websiteLabel: 'bankmandiri.co.id',
    helpUrl: 'https://www.bankmandiri.co.id/kontak-kami', dbName: 'Mandiri',
    description: 'Bank Mandiri adalah bank BUMN terbesar di Indonesia berdasarkan total aset, yang melayani nasabah perorangan hingga korporasi besar.',
    transferTips: ['Login ke Livin by Mandiri atau Internet Banking Mandiri.', 'Pilih menu Transfer dan masukkan nomor rekening tujuan.', 'Pastikan nama penerima sesuai sebelum konfirmasi.', 'Konfirmasi transaksi dengan PIN Livin atau token Mandiri.'],
    securityTips: ['Jangan bagikan PIN Livin atau token Mandiri ke siapapun.', 'Waspada phishing yang mengatasnamakan Mandiri.', 'Aktifkan notifikasi transaksi di Livin by Mandiri.', 'Hubungi Mandiri Call 14000 jika ada transaksi mencurigakan.'],
    faqs: [
      { question: 'Cara cek rekening Mandiri penipuan?', answer: 'Masukkan nomor rekening Mandiri ke kolom pencarian di atas.' },
      { question: 'Cara laporkan rekening Mandiri penipu?', answer: 'Klik "Lapor Rekening" dan lengkapi formulir dengan bukti penipuan.' },
      { question: 'Cara blokir rekening Mandiri penipu?', answer: 'Hubungi Mandiri Call 14000 atau kunjungi cabang Mandiri terdekat dengan bukti.' },
      { question: 'Apakah Mandiri bisa membekukan rekening terduga penipu?', answer: 'Ya, Bank Mandiri dapat memproses pembekuan rekening berdasarkan laporan resmi yang disertai bukti.' },
    ],
  },
  cimb: {
    name: 'CIMB Niaga', fullName: 'Bank CIMB Niaga', logo: '/banks/cimb.png',
    kodeBank: '022', callCenter: '14041',
    website: 'https://www.cimbniaga.co.id', websiteLabel: 'cimbniaga.co.id',
    helpUrl: 'https://www.cimbniaga.co.id/id/personal/bantuan', dbName: 'CIMB',
    description: 'CIMB Niaga adalah bank swasta terbesar kedua di Indonesia yang menawarkan layanan perbankan lengkap untuk nasabah retail dan korporasi.',
    transferTips: ['Login ke OCTO Mobile atau CIMB Clicks.', 'Pilih Transfer dan masukkan nomor rekening CIMB Niaga tujuan.', 'Verifikasi nama penerima sebelum konfirmasi.', 'Konfirmasi dengan PIN OCTO Mobile atau token.'],
    securityTips: ['Jangan bagikan PIN OCTO atau kode OTP ke siapapun.', 'Pastikan menggunakan aplikasi OCTO Mobile resmi dari CIMB Niaga.', 'Aktifkan notifikasi transaksi di OCTO Mobile.', 'Hubungi Phone Banking CIMB Niaga 14041 jika ada masalah.'],
    faqs: [
      { question: 'Cara cek rekening CIMB Niaga penipuan?', answer: 'Masukkan nomor rekening CIMB Niaga ke kolom pencarian di atas.' },
      { question: 'Cara laporkan rekening CIMB Niaga penipu?', answer: 'Klik "Lapor Rekening" di halaman ini dan isi formulir penipuan lengkap.' },
      { question: 'Cara blokir rekening CIMB Niaga penipu?', answer: 'Hubungi Phone Banking CIMB Niaga 14041 dengan menyertakan bukti transaksi.' },
      { question: 'Apakah CIMB Niaga bisa membekukan rekening penipu?', answer: 'Ya, CIMB Niaga dapat memproses pembekuan berdasarkan laporan resmi yang disertai bukti.' },
    ],
  },
  bsi: {
    name: 'BSI', fullName: 'Bank Syariah Indonesia', logo: '/banks/bsi.png',
    kodeBank: '451', callCenter: '14040',
    website: 'https://www.bankbsi.co.id', websiteLabel: 'bankbsi.co.id',
    helpUrl: 'https://www.bankbsi.co.id/company-info/hubungi-kami', dbName: 'BSI',
    description: 'Bank Syariah Indonesia (BSI) adalah bank syariah terbesar di Indonesia hasil merger tiga bank syariah BUMN yang melayani nasabah berdasarkan prinsip syariah.',
    transferTips: ['Login ke BSI Mobile atau Internet Banking BSI.', 'Pilih Transfer dan masukkan nomor rekening BSI tujuan.', 'Verifikasi nama penerima sebelum melanjutkan.', 'Konfirmasi transaksi dengan PIN atau OTP BSI.'],
    securityTips: ['Jangan bagikan PIN BSI Mobile atau kode OTP ke siapapun.', 'Pastikan menggunakan aplikasi BSI Mobile resmi dari Play Store/App Store.', 'Aktifkan notifikasi SMS/push notification BSI.', 'Hubungi Contact BSI 14040 jika ada aktivitas mencurigakan.'],
    faqs: [
      { question: 'Cara cek rekening BSI penipuan?', answer: 'Masukkan nomor rekening BSI ke kolom pencarian di atas.' },
      { question: 'Cara laporkan rekening BSI penipu?', answer: 'Klik "Lapor Rekening" dan isi formulir dengan nomor rekening, kronologi, dan bukti.' },
      { question: 'Cara blokir rekening BSI penipu?', answer: 'Hubungi Contact BSI 14040 atau kunjungi cabang BSI terdekat dengan membawa bukti.' },
      { question: 'Apakah BSI bisa membekukan rekening terduga penipu?', answer: 'Ya, BSI dapat memproses pembekuan rekening berdasarkan laporan resmi yang disertai bukti kuat.' },
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

  type ReportRow = { target_number: string; target_name: string | null; status: string; created_at: string };

  const [
    { data: primaryReports },
    { data: linkedReports },
    { data: categoryData },
  ] = await Promise.all([
    // Primary: laporan dengan bank_name sesuai bank
    supabase
      .from('reports')
      .select('target_number, target_name, status, created_at')
      .ilike('bank_name', `%${data.dbName}%`)
      .order('created_at', { ascending: false }),
    // Linked: laporan dengan nomor tambahan di target_numbers JSONB
    supabase
      .from('reports')
      .select('target_numbers, status, created_at')
      .filter('target_numbers', 'cs', `[{"type":"bank_account","bank":"${data.dbName}"}]`)
      .order('created_at', { ascending: false }),
    // Category breakdown
    supabase
      .from('reports')
      .select('category')
      .ilike('bank_name', `%${data.dbName}%`),
  ]);

  // Flatten linked JSONB entries jadi rows
  const linkedRows: ReportRow[] = [];
  (linkedReports ?? []).forEach((r: any) => {
    if (!Array.isArray(r.target_numbers)) return;
    r.target_numbers.forEach((item: any) => {
      if (
        typeof item === 'object' &&
        item.type === 'bank_account' &&
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

  // Merge primary + linked, deduplikasi by target_number
  // Ini satu-satunya source of truth untuk semua angka
  const seenNumbers = new Set<string>();
  const allRows: ReportRow[] = [];
  [...(primaryReports ?? []), ...linkedRows].forEach((r: any) => {
    if (!seenNumbers.has(r.target_number)) {
      seenNumbers.add(r.target_number);
      allRows.push(r);
    }
  });

  // Hitung dari deduplicated rows — tidak ada double counting
  const totalCount = allRows.length;
  const verifiedCount = allRows.filter(r => r.status === 'verified').length;
  const pendingCount = allRows.filter(r => r.status === 'pending').length;

  // Ambil 6 terbaru untuk display
  const reports = allRows.slice(0, 6).map((r) => ({
    target_number: r.target_number,
    target_name: r.target_name,
    status: r.status,
    created_at: r.created_at,
    masked: maskNumber(r.target_number),
    dateFormatted: formatDateID(r.created_at),
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
      bankId={bankKey}
      bankData={data}
      reports={reports}
      totalCount={totalCount}
      verifiedCount={verifiedCount}
      pendingCount={pendingCount}
      categoryBreakdown={categoryBreakdown}
    />
  );
}