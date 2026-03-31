'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, ArrowUpRight, ExternalLink,
  Phone, Hash, Globe, PlusCircle,
  ShieldCheck, ChevronDown,
} from 'lucide-react';
import RekeningSearchForm from '@/components/RekeningSearchForm';

// ── TYPES ─────────────────────────────────────────────────────────────────────
interface BankData {
  name: string;
  fullName: string;
  logo: string;
  kodeBank: string;
  callCenter: string;
  website: string;
  websiteLabel: string;
  description: string;
  faqs: { question: string; answer: string }[];
}

interface ReportRow {
  target_number: string;
  target_name: string | null;
  status: string;
  created_at: string;
  masked: string;
  dateFormatted: string;
}

interface Props {
  bankData: BankData;
  reports: ReportRow[];
  totalCount: number;
  verifiedCount: number;
  pendingCount: number;
}

// ── FAQ ACCORDION ─────────────────────────────────────────────────────────────
function FaqAccordion({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <div className="divide-y divide-slate-100">
      {faqs.map((faq, i) => (
        <div key={i}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
          >
            <span className="text-sm font-bold text-slate-900 pr-4">{faq.question}</span>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`}
            />
          </button>
          {openIndex === i && (
            <div className="px-6 pb-5">
              <p className="text-sm text-slate-600 font-medium leading-relaxed">{faq.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── MAIN CLIENT COMPONENT ─────────────────────────────────────────────────────
export default function BankPageClient({ bankData: data, reports, totalCount, verifiedCount, pendingCount }: Props) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans">

      {/* TOP NAV */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/cek-rekening" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-semibold transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Link>
          <span className="hidden sm:block text-[10px] font-black text-slate-400 uppercase tracking-widest">
            KawalTransaksi · Verifikasi Rekening
          </span>
        </div>
      </div>

      {/* HERO — Info Bank + Search */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-10 sm:py-14">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-10">

            {/* Kiri: Logo + Info */}
            <div className="flex-1">
              <div className="w-32 h-14 relative mb-5">
                <Image src={data.logo} alt={`Logo ${data.fullName}`} fill className="object-contain object-left" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-slate-900 mb-1 uppercase">
                {data.fullName}
              </h1>
              <p className="text-slate-500 text-sm font-medium mb-5 max-w-lg leading-relaxed">
                {data.description}
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={data.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-all uppercase tracking-widest"
                >
                  <Globe className="w-3.5 h-3.5" /> Kunjungi Website
                </a>
                <a
                  href={`tel:${data.callCenter}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:border-emerald-500 hover:text-emerald-600 transition-all uppercase tracking-widest shadow-sm"
                >
                  <Phone className="w-3.5 h-3.5" /> {data.callCenter}
                </a>
              </div>
            </div>

            {/* Kanan: Kode Bank + Call Center card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 min-w-[200px] shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                  <Hash className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kode Bank</p>
                  <p className="text-xl font-black text-slate-900 tracking-tight">{data.kodeBank}</p>
                </div>
              </div>
              <div className="w-full h-px bg-slate-200" />
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                  <Phone className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Call Center</p>
                  <p className="text-xl font-black text-slate-900 tracking-tight">{data.callCenter}</p>
                </div>
              </div>
              <div className="w-full h-px bg-slate-200" />
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                  <Globe className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Website Resmi</p>
                  <a
                    href={data.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                  >
                    {data.websiteLabel} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="border-t border-slate-100 pt-8">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              Cek nomor rekening {data.name}
            </p>
            <RekeningSearchForm />
          </div>
        </div>
      </section>

      {/* STATISTIK */}
      <section className="max-w-5xl mx-auto px-6 pt-10 mb-10">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-sm text-center">
            <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter">{totalCount}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Total Laporan</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-sm text-center">
            <p className="text-3xl sm:text-4xl font-black text-red-600 tracking-tighter">{verifiedCount}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Verified Scam</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-sm text-center">
            <p className="text-3xl sm:text-4xl font-black text-amber-500 tracking-tighter">{pendingCount}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Pending</p>
          </div>
        </div>
      </section>

      {/* DAFTAR LAPORAN TERKINI */}
      <section className="max-w-5xl mx-auto px-6 mb-10">
        <div className="flex items-end justify-between mb-5 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              Rekening {data.name} Dilaporkan
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
              Data real-time dari komunitas
            </p>
          </div>
          <Link href="/report" className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest flex items-center gap-1 transition-colors">
            Lapor Rekening <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {reports.length > 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {/* Desktop Table */}
            <table className="w-full text-left hidden md:table">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nomor Rekening</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((report, i) => (
                  <tr key={i} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5">
                      <p className="text-sm font-black text-slate-900 font-mono tracking-wider">{report.masked}</p>
                      <p className="text-[10px] text-slate-500 font-medium uppercase mt-1">a.n. {report.target_name || 'Tidak Diketahui'}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider border ${
                        report.status === 'verified' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[11px] text-slate-500 font-medium">{report.dateFormatted}</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Link href={`/check/${report.target_number}`} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 shadow-sm transition-all">
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-slate-100">
              {reports.map((report, i) => (
                <Link key={i} href={`/check/${report.target_number}`} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-black text-slate-900 font-mono">{report.masked}</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">a.n. {report.target_name || 'Tidak Diketahui'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                      report.status === 'verified' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {report.status}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
            <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">Belum Ada Laporan</h3>
            <p className="text-xs text-slate-500 font-medium">Tidak ada rekening {data.name} yang dilaporkan saat ini.</p>
          </div>
        )}
      </section>

      {/* FAQ */}
      <section className="max-w-5xl mx-auto px-6 mb-10">
        <div className="mb-5 pb-4 border-b border-slate-200">
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
            Tentang cek rekening {data.name}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <FaqAccordion faqs={data.faqs} />
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6">
        <div className="bg-emerald-600 rounded-2xl p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-lg border border-emerald-700">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[60px] pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tighter mb-3 uppercase">
              Temukan Rekening {data.name} Penipu?
            </h2>
            <p className="text-emerald-50 text-xs sm:text-sm max-w-lg mx-auto mb-7 font-medium leading-relaxed">
              Laporan kamu membantu melindungi jutaan orang dari penipuan. Sertakan bukti transfer untuk mempercepat verifikasi.
            </p>
            <Link
              href="/report"
              className="px-8 py-3.5 bg-white text-emerald-700 hover:bg-slate-50 font-bold text-sm rounded-xl transition-all inline-flex items-center gap-2 uppercase tracking-widest shadow-md"
            >
              <PlusCircle className="w-4 h-4" /> Lapor Rekening {data.name}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}