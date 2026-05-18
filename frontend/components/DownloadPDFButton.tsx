'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

interface ReportData {
  id: string;
  target_number: string;
  target_name: string | null;
  target_type: string;
  category: string;
  chronology: string;
  status: string;
  created_at: string;
  bank_name?: string | null;
  loss_amount?: number | string | null;
  incident_date?: string | null;
  platform?: string | null;
  link_url?: string | null;
  social_media_accounts?: string[] | null;
  has_other_victims?: string | null;
  reported_to?: string[] | null;
  store_name?: string | null;
  suspect_city?: string | null;
}

interface Props {
  report: ReportData;
  reporterName: string | null;
  reporterEmail: string;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const fmtRupiah = (v: number | string) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(v));

const statusLabel = (s: string) =>
  ({ pending: 'Menunggu Verifikasi', verified: 'Terverifikasi', rejected: 'Ditolak', withdrawn: 'Sedang Direvisi' }[s] ?? s);

const targetTypeLabel = (t: string) =>
  ({ phone: 'Nomor Telepon / WhatsApp', bank_account: 'Rekening Bank', ewallet: 'Dompet Digital (E-Wallet)' }[t] ?? t);

const reportedToLabel = (v: string) =>
  ({ polisi: 'Kepolisian', ojk: 'OJK (Otoritas Jasa Keuangan)', platform: 'Platform / Marketplace', belum: 'Belum dilaporkan' }[v] ?? v);

// ─────────────────────────────────────────────
// PDF
// ─────────────────────────────────────────────

async function generatePDF(report: ReportData, reporterName: string | null, reporterEmail: string) {
  const { jsPDF } = await import('jspdf');

  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW   = doc.internal.pageSize.getWidth();
  const PH   = doc.internal.pageSize.getHeight();
  const L    = 25;   // left margin
  const R    = 25;   // right margin
  const CW   = PW - L - R;
  let y      = 0;

  // Colors (RGB)
  const INK      : [number,number,number] = [20, 20, 20];
  const SUBTEXT  : [number,number,number] = [100, 100, 100];
  const FAINT    : [number,number,number] = [160, 160, 160];
  const ACCENT   : [number,number,number] = [16, 185, 129];

  // ── Helpers ────────────────────────────────────────────────────────────────

  const setF = (size: number, style: 'normal' | 'bold' = 'normal', color = INK) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    doc.setTextColor(...color);
  };

  const write = (text: string, x: number, wy: number, opts?: any) => doc.text(text, x, wy, opts);

  const rule = (ry: number, color = FAINT, lw = 0.2) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(lw);
    doc.line(L, ry, PW - R, ry);
  };

  const needY = (n: number) => {
    if (y + n > PH - 22) {
      doc.addPage();
      y = 24;
      footer();
    }
  };

  // ── Footer ─────────────────────────────────────────────────────────────────

  const footer = () => {
    const fy = PH - 12;
    setF(6.5, 'normal', FAINT);
    write('KawalTransaksi  ·  kawaltransaksi.com', L, fy);
    write(`Halaman ${doc.getCurrentPageInfo().pageNumber}`, PW - R, fy, { align: 'right' });
  };

  // ── Section title ──────────────────────────────────────────────────────────

  const section = (title: string) => {
    needY(16);
    y += 6;
    setF(10, 'bold', INK);
    write(title, L, y);
    y += 3;
    rule(y, INK, 0.3);
    y += 6;
  };

  // ── Label + value (single row) ─────────────────────────────────────────────

  const row = (label: string, value: string) => {
    if (!value || value === '—') return;
    needY(12);
    setF(7.5, 'normal', FAINT);
    write(label, L, y);
    y += 4.5;
    setF(9.5, 'bold', INK);
    const lines: string[] = doc.splitTextToSize(value, CW);
    lines.forEach((l: string) => { needY(5); write(l, L, y); y += 5; });
    y += 2;
  };

  // ── Two-column row ─────────────────────────────────────────────────────────

  const row2 = (
    l1: string, v1: string,
    l2?: string, v2?: string
  ) => {
    if (!v1 && !v2) return;
    needY(14);
    const half = CW / 2;
    const startY = y;

    // Left
    setF(7.5, 'normal', FAINT);
    write(l1, L, startY);
    setF(9.5, 'bold', INK);
    const ll: string[] = doc.splitTextToSize(v1 || '—', half - 4);
    ll.forEach((ln: string, i: number) => write(ln, L, startY + 4.5 + i * 5));
    const lh = 4.5 + ll.length * 5;

    // Right
    let rh = 0;
    if (l2 && v2) {
      setF(7.5, 'normal', FAINT);
      write(l2, L + half, startY);
      setF(9.5, 'bold', INK);
      const rl: string[] = doc.splitTextToSize(v2, half - 4);
      rl.forEach((ln: string, i: number) => write(ln, L + half, startY + 4.5 + i * 5));
      rh = 4.5 + rl.length * 5;
    }

    y = startY + Math.max(lh, rh) + 3;
  };

  // ═══════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════

  y = 24;
  footer();

  // Logo text
  setF(20, 'bold', INK);
  write('Kawal', L, y);
  const kw = doc.getTextWidth('Kawal');
  doc.setTextColor(...ACCENT);
  write('Transaksi', L + kw + 1.5, y);

  // Right: doc title
  setF(8, 'normal', SUBTEXT);
  write('LAPORAN RESMI INDIKASI PENIPUAN', PW - R, y, { align: 'right' });

  y += 5;

  // Tagline left
  setF(8, 'normal', FAINT);
  write('kawaltransaksi.com  ·  Platform Anti-Penipuan Digital Indonesia', L, y);

  // Right: doc number
  setF(8, 'normal', SUBTEXT);
  write(`No. KT-${report.id.slice(0, 8).toUpperCase()}`, PW - R, y, { align: 'right' });

  y += 5;
  rule(y, INK, 0.4);
  y += 10;

  // ── Meta info ─────────────────────────────────────────────────────────────

  row2(
    'Nomor Laporan',   `KT-${report.id.slice(0, 8).toUpperCase()}`,
    'Tanggal Cetak',   fmtDateTime(new Date().toISOString())
  );
  row2(
    'Tanggal Laporan', fmtDate(report.created_at),
    'Status',          statusLabel(report.status)
  );

  y += 4;

  // ═══════════════════════════════════════════════════════
  // 1. IDENTITAS PELAPOR
  // ═══════════════════════════════════════════════════════

  section('1.  Identitas Pelapor');
  row2(
    'Nama Pelapor',  reporterName ?? 'Tidak dicantumkan',
    'Email Pelapor', reporterEmail
  );

  // ═══════════════════════════════════════════════════════
  // 2. DATA TERLAPOR
  // ═══════════════════════════════════════════════════════

  section('2.  Data Pihak Terlapor');
  row2('Nomor yang Dilaporkan', report.target_number, 'Jenis', targetTypeLabel(report.target_type));
  row2('Nama / Alias', report.target_name ?? '—', 'Kategori Penipuan', report.category);
  if (report.bank_name || report.platform)   row2('Bank', report.bank_name ?? '—', 'Platform', report.platform ?? '—');
  if (report.store_name || report.suspect_city) row2('Nama Toko', report.store_name ?? '—', 'Provinsi', report.suspect_city ?? '—');

  const socmeds = (report.social_media_accounts ?? []).filter(Boolean);
  if (socmeds.length > 0) row('Akun Media Sosial', socmeds.join('  ·  '));
  if (report.link_url)    row('URL Terkait', report.link_url);

  // ═══════════════════════════════════════════════════════
  // 3. DETAIL KEJADIAN
  // ═══════════════════════════════════════════════════════

  const hasEvent = report.incident_date || report.loss_amount || report.has_other_victims;
  const hasReported = (report.reported_to ?? []).filter(Boolean).length > 0;

  if (hasEvent || hasReported) {
    section('3.  Detail Kejadian');
    if (report.incident_date || report.loss_amount)
      row2(
        'Tanggal Kejadian',   report.incident_date ? fmtDate(report.incident_date) : '—',
        'Perkiraan Kerugian', report.loss_amount ? fmtRupiah(report.loss_amount as number) : '—'
      );
    if (report.has_other_victims)
      row('Korban Lain', report.has_other_victims === 'yes' ? 'Ada korban lain selain pelapor' : 'Hanya pelapor');
    if (hasReported)
      row('Sudah Dilaporkan ke', (report.reported_to ?? []).filter(Boolean).map(reportedToLabel).join('  ·  '));
  }

  // ═══════════════════════════════════════════════════════
  // 4. KRONOLOGI
  // ═══════════════════════════════════════════════════════

  section('4.  Kronologi Kejadian');
  setF(9.5, 'normal', INK);
  const clines: string[] = doc.splitTextToSize(report.chronology, CW);
  clines.forEach((l: string) => {
    needY(5.5);
    write(l, L, y);
    y += 5.5;
  });
  y += 4;

  // ═══════════════════════════════════════════════════════
  // 5. PERNYATAAN
  // ═══════════════════════════════════════════════════════

  needY(55);
  section('5.  Pernyataan Pelapor');
  setF(9.5, 'normal', INK);
  const plines: string[] = doc.splitTextToSize(
    'Saya yang bertanda tangan di bawah ini menyatakan bahwa seluruh informasi yang tercantum dalam laporan ini adalah benar dan dapat dipertanggungjawabkan. Laporan ini dibuat dengan itikad baik untuk melindungi masyarakat dari tindak penipuan digital.',
    CW
  );
  plines.forEach((l: string) => { write(l, L, y); y += 5.5; });

  y += 12;

  // Tanda tangan
  needY(28);
  const sx = PW - R - 44;
  setF(9, 'normal', SUBTEXT);
  write(fmtDate(new Date().toISOString()), sx, y, { align: 'center' });
  y += 5;
  write('Yang membuat laporan,', sx, y, { align: 'center' });
  y += 14;
  rule(y, SUBTEXT, 0.3);
  // center line between sx area
  doc.setDrawColor(...SUBTEXT);
  doc.setLineWidth(0.3);
  doc.line(sx - 20, y, sx + 20, y);
  y += 4;
  setF(9.5, 'bold', INK);
  write(reporterName ?? reporterEmail, sx, y, { align: 'center' });
  y += 4.5;
  setF(8.5, 'normal', FAINT);
  write(reporterEmail, sx, y, { align: 'center' });

  y += 14;

  // ═══════════════════════════════════════════════════════
  // CATATAN
  // ═══════════════════════════════════════════════════════

  needY(28);
  rule(y, FAINT, 0.2);
  y += 5;
  setF(8, 'bold', SUBTEXT);
  write('Catatan', L, y);
  y += 4.5;
  setF(7.5, 'normal', FAINT);
  const dlines: string[] = doc.splitTextToSize(
    `Dokumen ini dibuat secara mandiri oleh pengguna terdaftar di kawaltransaksi.com dan bukan merupakan produk hukum resmi. Dokumen ini dapat digunakan sebagai bukti pendukung pelaporan kepada pihak berwenang. Ref: KT-${report.id.slice(0, 8).toUpperCase()}  ·  ${fmtDateTime(new Date().toISOString())}`,
    CW
  );
  dlines.forEach((l: string) => { write(l, L, y); y += 4; });

  // ── Save ──────────────────────────────────────────────────────────────────

  doc.save(`KawalTransaksi-Laporan-${report.target_number}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─────────────────────────────────────────────
// Button
// ─────────────────────────────────────────────

export default function DownloadPDFButton({ report, reporterName, reporterEmail }: Props) {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try { await generatePDF(report, reporterName, reporterEmail); }
    catch (e) { console.error(e); alert('Gagal membuat PDF. Coba lagi.'); }
    finally { setLoading(false); }
  };

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-600 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
    >
      {loading
        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Membuat PDF...</>
        : <><Download className="w-3.5 h-3.5" />Download PDF</>
      }
    </button>
  );
}