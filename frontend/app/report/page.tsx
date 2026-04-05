import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import ReportForm from '@/components/ReportForm';
import Link from 'next/link';

async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { }
        },
      },
    }
  );
}

export default async function ReportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return (
      <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900">
        <div className="max-w-5xl mx-auto px-6 pt-12 sm:pt-20">
          <div className="mb-10 text-center sm:text-left">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-slate-900 uppercase mb-3">
              Entri Laporan <span className="text-emerald-600 italic">Baru.</span>
            </h1>
            <p className="text-sm text-slate-500 font-medium">Lengkapi formulir di bawah ini dengan data yang valid beserta bukti digital.</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-8 sm:p-12 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
            <ReportForm />
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
          <polyline points="10 17 15 12 10 7"/>
          <line x1="15" y1="12" x2="3" y2="12"/>
        </svg>
      ),
      title: 'Login Untuk Melapor',
      desc: 'Sebelum melapor, pastikan Anda sudah login pada akun KawalTransaksi Anda.',
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
      ),
      title: 'Isi Form Laporan',
      desc: 'Laporkan nomor rekening atau nomor telepon terduga pelaku penipuan.',
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      ),
      title: 'Kirim Laporan',
      desc: 'Klik tombol "Laporkan" untuk mengirim laporan.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto px-6 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">

          {/* Kiri — steps */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mb-4 leading-snug">
              Laporkan Nomor Rekening Atau Nomor Telepon Penipuan
            </h1>
            <p className="text-slate-500 text-base leading-relaxed mb-12">
              Laporan kamu sangat berarti untuk mencegah terjadinya penipuan di masa mendatang.
            </p>
            <div className="space-y-10">
              {steps.map((item, i) => (
                <div key={i} className="flex gap-5 items-start">
                  <div className="w-12 h-12 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">{item.icon}</div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base mb-1.5">{item.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kanan — card login */}
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 text-center mb-2">Masuk Dulu Yuk!</h2>
            <p className="text-slate-500 text-sm text-center mb-8 leading-relaxed">
              Kamu perlu login terlebih dahulu untuk mulai membuat laporan.
            </p>

            {/* Grid 2 kolom — pakai items-stretch agar tinggi sama */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {/* Card Login */}
              <div className="border border-slate-200 rounded-xl p-5 flex flex-col">
                <div className="flex-1">
                  <p className="font-bold text-sm text-slate-900 mb-1 text-center">Masuk</p>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed text-center">
                    Sudah punya akun? Masuk sekarang.
                  </p>
                </div>
                <Link
                  href="/login?redirectTo=%2Freport"
                  className="block w-full py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors text-center uppercase tracking-wider mt-auto"
                >
                  Login
                </Link>
              </div>

              {/* Card Register */}
              <div className="border border-slate-200 rounded-xl p-5 flex flex-col">
                <div className="flex-1">
                  <p className="font-bold text-sm text-slate-900 mb-1 text-center">Daftar</p>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed text-center">
                    Belum punya akun? Daftar gratis.
                  </p>
                </div>
                <Link
                  href="/register"
                  className="block w-full py-2.5 border border-slate-200 text-slate-900 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors text-center uppercase tracking-wider mt-auto"
                >
                  Register
                </Link>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">atau</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Google Login */}
            <Link
              href="/login?redirectTo=%2Freport"
              className="flex items-center justify-center gap-3 w-full py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.3 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.6-8 19.6-20 0-1.3-.1-2.7-.4-4z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5L31.8 33c-2 1.4-4.6 2.3-7.8 2.3-5.2 0-9.6-3.5-11.2-8.2l-6.6 5.1C9.5 39.5 16.2 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.9 6l5.7 5c3.4-3.1 5.9-7.7 5.9-13.4 0-1.3-.1-2.7-.4-4z"/>
              </svg>
              Lanjutkan dengan Google
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}