import { createClient } from '@/lib/supabase-server';
import ReportForm from '@/components/ReportForm';
import { ShieldCheck, FileText, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import * as motion from 'motion/react-client';

export default async function ReportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return (
      <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900">
        <div className="max-w-5xl mx-auto px-6 pt-12 sm:pt-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center sm:text-left">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-slate-900 uppercase mb-3">
              Entri Laporan <span className="text-emerald-600 italic">Baru.</span>
            </h1>
            <p className="text-sm text-slate-500 font-medium">Lengkapi formulir di bawah ini dengan data yang valid beserta bukti digital.</p>
          </motion.div>

          <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
            <ReportForm />
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    { icon: Lock, title: 'Validasi Akses', desc: 'Login untuk memastikan laporan tidak dibuat oleh bot.' },
    { icon: FileText, title: 'Entri Data', desc: 'Masukkan nomor rekening/HP beserta screenshot bukti transaksi.' },
    { icon: ShieldCheck, title: 'Verifikasi & Rilis', desc: 'Auditor meninjau dan merilis laporan ke database publik.' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 font-sans overflow-hidden">

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 sm:pt-32 sm:pb-32 px-6 bg-white">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-emerald-100/30 rounded-full blur-[120px] -z-10" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-[0.9] text-slate-900 mb-8 uppercase">
            JANGAN DIAM. <br />
            <span className="text-emerald-600 italic">LAPORKAN</span> PENIPUNYA.
          </h1>
          <p className="text-slate-500 text-base md:text-lg font-medium leading-relaxed max-w-2xl mx-auto mb-10">
            Satu laporan tervalidasi dari Anda hari ini dapat mencegah ribuan orang kehilangan asetnya esok hari. Proses pelaporan dienkripsi dan anonim.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/login?redirectTo=%2Freport"
              className="px-8 py-4 bg-emerald-600 text-white rounded-md font-bold text-sm hover:bg-emerald-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              MULAI BUAT LAPORAN <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/database"
              className="px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-md font-bold text-sm hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm active:scale-95 uppercase tracking-widest"
            >
              CEK DATABASE
            </Link>
          </div>
        </div>
      </section>

      {/* Wave: white → slate-50 */}
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full block -mt-1 bg-white" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,40 C320,-20 800,80 1440,20 L1440,80 L0,80 Z" fill="#f8fafc" />
      </svg>

      {/* Protokol Pelaporan */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase mb-4">Protokol Pelaporan</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">3 Langkah sistematis menghentikan penipu</p>
          </div>

          <div className="hidden md:flex items-center mb-8 px-[calc(100%/6)]">
            {steps.map((_, i) => (
              <div key={i} className="contents">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="shrink-0 w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-sm z-10"
                >
                  {i + 1}
                </motion.div>
                {i < steps.length - 1 && (
                  <div className="flex-1 h-px bg-slate-200" />
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 pt-4">
            {steps.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center px-2"
              >
                <div className="md:hidden w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs mx-auto mb-5">
                  {i + 1}
                </div>
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-5 mx-auto">
                  <item.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-base font-black uppercase tracking-tight text-slate-900 mb-2.5">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[260px] mx-auto">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Wave: slate-50 → white */}
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full block bg-slate-50" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,0 C360,80 1080,0 1440,80 L1440,80 L0,80 Z" fill="#ffffff" />
      </svg>

      {/* CTA Berkontribusi */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tighter text-slate-900 uppercase mb-4">Siap Berkontribusi?</h2>
          <p className="text-slate-500 mb-10 max-w-lg mx-auto font-medium text-sm leading-relaxed">
            Daftarkan akun Anda secara gratis sekarang dan mulailah melindungi ekosistem digital dari kejahatan siber.
          </p>
          <Link
            href="/register"
            className="px-8 py-4 bg-emerald-600 text-white font-bold text-sm rounded-md hover:bg-emerald-500 transition-all uppercase tracking-widest shadow-md"
          >
            DAFTAR AKUN BARU
          </Link>
        </div>
      </section>

{/* Wave: white → footer */}
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full block bg-white" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,40 C360,-20 1080,80 1440,20 L1440,80 L0,80 Z" fill="#ffffff" />
      </svg>

    </div>
  );
}