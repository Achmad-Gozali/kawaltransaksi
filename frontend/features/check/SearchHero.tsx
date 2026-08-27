import type { ReactNode } from "react";

interface Props {
  title: string;
  description: string;
  hint?: ReactNode;
  children: ReactNode;
}

/**
 * Hero yang di-share cek-nomor/cek-rekening/cek-qris -- sebelumnya masing-
 * masing halaman menduplikasi markup ini sendiri-sendiri (termasuk kolom
 * ilustrasi di kanan). Sekarang konten dipusatkan, tanpa ilustrasi.
 */
export default function SearchHero({ title, description, hint, children }: Props) {
  return (
    <section className="relative bg-slate-100 pt-28 sm:pt-36 pb-0 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center text-center pb-16 sm:pb-24">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 leading-snug max-w-2xl">{title}</h1>
          <p className="text-slate-500 text-sm sm:text-base mb-8 leading-relaxed max-w-md">{description}</p>
          <div className="w-full flex justify-center">{children}</div>
          {hint && <p className="text-xs text-slate-400 mt-3">{hint}</p>}
        </div>
      </div>
      <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-10 sm:h-20 block">
        <path d="M0,20 C360,80 1080,0 1440,60 L1440,80 L0,80 Z" fill="#ffffff" />
      </svg>
    </section>
  );
}
