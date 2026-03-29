import Link from 'next/link';
import {
  Search, ArrowRight, ShieldAlert, Shield, Lock, Eye,
  ArrowUpRight, Phone, Landmark, ShieldCheck
} from 'lucide-react';
import * as motion from 'motion/react-client';
import { createClient } from '@/lib/supabase-server';
import { formatDateID } from '@/lib/utils';

// ✅ ISR: revalidasi tiap 60 detik, tidak re-fetch setiap request
export const revalidate = 60;

// ✅ Pindahkan helper ke luar component (pure functions)
function maskNumber(num: string): string {
  if (num.length <= 6) return num;
  return num.slice(0, 4) + '····' + num.slice(-3);
}

// ✅ FIX: Hapus fungsi formatDate() yang duplikasi dengan formatDateID dari utils
// Sekarang pakai formatDateID langsung dari @/lib/utils

export default async function HomePage() {
  const supabase = await createClient();

  // ✅ Semua query jalan PARALEL dengan Promise.all
  const [
    { count: totalReports },
    { count: verifiedCount },
    { data: rawRecentReports },
    { data: rawCategoryData },
  ] = await Promise.all([
    supabase
      .from('reports')
      .select('*', { count: 'exact', head: true }),

    supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'verified'),

    supabase
      .from('reports')
      .select('id, target_number, target_name, category, created_at, status')
      .order('created_at', { ascending: false })
      .limit(6),

    supabase.rpc('get_category_counts'),
  ]);

  const recentReports = (rawRecentReports as any[] | null) ?? [];

  const sortedCategories = ((rawCategoryData as any[] | null) ?? [])
    .slice(0, 6)
    .map((r: any) => [r.category, Number(r.count)] as [string, number]);
  const maxCategoryCount = sortedCategories[0]?.[1] || 1;

  return (
    <div>

      {/* ===== HERO ===== */}
      <section className="relative bg-white border-b border-zinc-100 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-gradient-to-b from-red-50 to-transparent rounded-full opacity-60" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 pt-20 pb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-600 text-[11px] font-bold uppercase tracking-widest mb-8">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              Database Terverifikasi Komunitas
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-zinc-900 tracking-tight mb-6 leading-[1.05]">
              Cek Nomor,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-red-500 to-orange-500">
                Hindari Penipuan.
              </span>
            </h1>

            <p className="text-lg text-zinc-500 mb-10 max-w-xl mx-auto leading-relaxed">
              Verifikasi nomor HP atau rekening bank sebelum bertransaksi.
              Gratis, cepat, dan didukung oleh komunitas.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link
              href="/cek-nomor"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-zinc-900 text-white text-base font-bold hover:bg-black transition-all active:scale-95 shadow-lg shadow-zinc-900/10"
            >
              <Phone className="w-5 h-5" />
              Cek Nomor HP
            </Link>
            <Link
              href="/cek-rekening"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-white text-zinc-900 text-base font-bold border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 transition-all active:scale-95 shadow-sm"
            >
              <Landmark className="w-5 h-5" />
              Cek Rekening Bank
            </Link>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="mt-16 flex justify-center gap-12"
          >
            <div className="text-center">
              <p className="text-3xl font-extrabold text-zinc-900">{totalReports || 0}</p>
              <p className="text-xs text-zinc-400 font-medium mt-1 uppercase tracking-wider">Total Laporan</p>
            </div>
            <div className="w-px bg-zinc-200" />
            <div className="text-center">
              <p className="text-3xl font-extrabold text-zinc-900">{verifiedCount || 0}</p>
              <p className="text-xs text-zinc-400 font-medium mt-1 uppercase tracking-wider">Terverifikasi</p>
            </div>
            <div className="w-px bg-zinc-200" />
            <div className="text-center">
              <p className="text-3xl font-extrabold text-zinc-900">24/7</p>
              <p className="text-xs text-zinc-400 font-medium mt-1 uppercase tracking-wider">Monitoring</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== CARA KERJA ===== */}
      <section className="py-20 bg-white border-b border-zinc-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3">Cara Kerja</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
              Mudah, Cepat, 3 Langkah.
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 relative">
            <div className="hidden sm:block absolute top-8 h-px bg-zinc-200 -z-0" style={{ left: '18%', right: '18%' }} />
            {[
              { step: '01', icon: Search, title: 'Masukkan Nomor', desc: 'Ketik nomor HP atau nomor rekening yang ingin kamu verifikasi.', color: 'bg-blue-50 text-blue-600 border-blue-100' },
              { step: '02', icon: Eye, title: 'Cek Database', desc: 'Sistem mencocokkan nomor dengan database laporan komunitas secara real-time.', color: 'bg-amber-50 text-amber-600 border-amber-100' },
              { step: '03', icon: ShieldCheck, title: 'Lihat Hasilnya', desc: 'Dapatkan info lengkap — apakah nomor aman, pernah dilaporkan, atau terverifikasi penipu.', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative text-center flex flex-col items-center"
              >
                <div className={`w-16 h-16 rounded-2xl border-2 ${item.color} flex items-center justify-center mb-5 shadow-sm z-10 bg-white`}>
                  <item.icon className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest mb-2">{item.step}</span>
                <h3 className="text-base font-bold text-zinc-900 mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed max-w-xs">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="py-20 bg-zinc-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3">Mengapa CekNoScam?</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
              Perlindungan dari komunitas,<br />untuk komunitas.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Search, title: 'Pencarian Instan', desc: 'Hasil real-time dari database yang terus diperbarui komunitas.', color: 'bg-blue-50 text-blue-600' },
              { icon: ShieldAlert, title: 'Lapor Cepat', desc: 'Formulir laporan sederhana dengan verifikasi AI otomatis.', color: 'bg-red-50 text-red-600' },
              { icon: Eye, title: 'Verifikasi Manual', desc: 'Setiap laporan ditinjau tim moderator sebelum dipublikasi.', color: 'bg-amber-50 text-amber-600' },
              { icon: Lock, title: 'Privasi Terjaga', desc: 'Identitas pelapor tidak pernah dipublikasikan ke publik.', color: 'bg-emerald-50 text-emerald-600' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-white border border-zinc-200 rounded-2xl p-6 hover:shadow-lg hover:border-zinc-300 transition-all group"
              >
                <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 mb-1.5">{item.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STATISTICS ===== */}
      {sortedCategories.length > 0 && (
        <section className="py-20 bg-white border-y border-zinc-100">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">Statistik</p>
                <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Modus Penipuan Terbanyak</h2>
              </div>
              <p className="text-sm text-zinc-400 font-medium">Berdasarkan {totalReports || 0} laporan</p>
            </div>
            <div className="space-y-6">
              {sortedCategories.map(([category, count], i) => {
                const percentage = (count / maxCategoryCount) * 100;
                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="group"
                  >
                    <div className="flex justify-between items-baseline mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-zinc-300 w-6">{String(i + 1).padStart(2, '0')}</span>
                        <span className="text-sm font-bold text-zinc-900">{category}</span>
                      </div>
                      <span className="text-xs font-bold text-zinc-400 tabular-nums">{count} laporan</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${percentage}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full bg-zinc-900 rounded-full group-hover:bg-red-600 transition-colors duration-300"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ===== RECENT REPORTS ===== */}
      {recentReports.length > 0 && (
        <section className="py-20 bg-zinc-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">Terbaru</p>
                <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Laporan Masuk</h2>
              </div>
              <Link href="/report" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-900 hover:text-red-600 transition-colors">
                Buat Laporan <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentReports.map((report: any, i: number) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={`/check/${report.target_number}`}
                    className="block bg-white border border-zinc-200 rounded-xl p-5 hover:shadow-md hover:border-zinc-300 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${
                        report.status === 'verified' ? 'bg-red-50 text-red-600' :
                        report.status === 'rejected' ? 'bg-zinc-100 text-zinc-400' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {report.status === 'verified' ? 'Verified' : report.status === 'rejected' ? 'Rejected' : 'Pending'}
                      </span>
                      {/* ✅ FIX: Pakai formatDateID dari utils, bukan formatDate lokal */}
                      <span className="text-[11px] text-zinc-400 font-medium">{formatDateID(report.created_at)}</span>
                    </div>
                    <p className="text-lg font-extrabold text-zinc-900 mb-0.5 font-mono tracking-wide">{maskNumber(report.target_number)}</p>
                    {report.target_name && (
                      <p className="text-xs text-zinc-400 mb-3">a.n. {report.target_name}</p>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                      <span className="text-[11px] font-medium text-zinc-400">{report.category}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== CTA ===== */}
      <section className="py-24 bg-zinc-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-5">
              Lindungi Sesama dari Penipuan
            </h2>
            <p className="text-zinc-400 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
              Setiap laporan yang Anda kirim membantu mencegah orang lain menjadi korban. Mulai kontribusi sekarang.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/report" className="px-8 py-4 bg-white text-zinc-900 font-bold text-sm rounded-xl hover:bg-zinc-100 transition-all active:scale-95">
                Buat Laporan
              </Link>
              <Link href="/register" className="px-8 py-4 bg-zinc-800 text-zinc-300 font-bold text-sm rounded-xl border border-zinc-700 hover:bg-zinc-700 hover:text-white transition-all active:scale-95">
                Daftar Akun
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}