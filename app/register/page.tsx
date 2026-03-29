import AuthForm from '@/components/AuthForm';
import { Shield, ShieldCheck, Eye, Lock, HeartHandshake } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex">

      {/* LEFT */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between px-14 py-16 bg-white border-r border-zinc-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-lg tracking-tight text-zinc-900">
            CEK<span className="text-red-500">NO</span>SCAM
          </span>
        </Link>

        <div className="space-y-10">
          <div>
            <h2 className="text-4xl font-extrabold text-zinc-900 tracking-tight leading-[1.1] mb-4">
              Daftar Gratis,<br />
              <span className="text-red-500">Mulai Berkontribusi.</span>
            </h2>
            <p className="text-zinc-500 text-base leading-relaxed max-w-sm">
              Buat akun CekNoScam dan mulai melaporkan nomor penipu untuk melindungi sesama pengguna internet Indonesia.
            </p>
          </div>

          <div className="space-y-5">
            {[
              { icon: ShieldCheck, title: 'Gratis selamanya', desc: 'Tidak ada biaya atau langganan apapun.' },
              { icon: Eye, title: 'Laporan kamu berarti', desc: 'Setiap laporan membantu mencegah korban baru.' },
              { icon: Lock, title: 'Identitas terlindungi', desc: 'Data pelapor tidak pernah dipublikasikan.' },
              { icon: HeartHandshake, title: 'Komunitas nyata', desc: 'Ribuan pengguna aktif menjaga database bersama.' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-9 h-9 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-zinc-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900">{item.title}</p>
                  <p className="text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-zinc-400 font-medium italic">
          "Komunitas yang kuat dimulai dari satu langkah kecil."
        </p>
      </div>

      {/* RIGHT */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-16 bg-zinc-50">
        <div className="w-full max-w-md">
          <div className="flex lg:hidden items-center justify-center gap-2 mb-10">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-lg tracking-tight text-zinc-900">
              CEK<span className="text-red-500">NO</span>SCAM
            </span>
          </div>
          <AuthForm type="register" />
        </div>
      </div>

    </div>
  );
}