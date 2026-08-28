import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kontak - KawalTransaksi',
  description: 'Hubungi tim KawalTransaksi untuk pertanyaan, laporan, atau kerja sama.',
};

function IconGmail() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 20H4C2.9 20 2 19.1 2 18V6L12 13L22 6V18C22 19.1 21.1 20 20 20H18V9.5L12 13.5L6 9.5V20Z" fill="#EA4335"/>
      <path d="M2 6L12 13L22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6Z" fill="#EA4335"/>
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497"/>
          <stop offset="10%" stopColor="#fdf497"/>
          <stop offset="50%" stopColor="#fd5949"/>
          <stop offset="68%" stopColor="#d6249f"/>
          <stop offset="100%" stopColor="#285AEB"/>
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5.5" fill="url(#ig-grad)"/>
      <circle cx="12" cy="12" r="4.5" fill="none" stroke="white" strokeWidth="1.8"/>
      <circle cx="17.2" cy="6.8" r="1.1" fill="white"/>
    </svg>
  );
}

function IconWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
      <path fill="#25D366" d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.978-1.419A9.953 9.953 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2Z"/>
      <path fill="white" d="M8.57 7.5c-.198 0-.52.074-.793.37C7.5 8.165 6.75 8.87 6.75 10.305c0 1.435 1.043 2.822 1.188 3.018.146.195 2.04 3.196 5.002 4.356 2.47.974 2.963.78 3.498.731.535-.049 1.726-.706 1.97-1.388.244-.682.244-1.267.171-1.388-.073-.122-.268-.195-.56-.342-.293-.146-1.727-.852-1.994-.95-.268-.097-.463-.146-.659.146-.195.293-.756.95-.927 1.145-.17.195-.34.22-.633.073-.292-.146-1.234-.455-2.351-1.45-.869-.775-1.456-1.731-1.627-2.023-.17-.293-.018-.45.128-.596.13-.13.293-.34.44-.51.146-.17.195-.293.293-.488.097-.195.048-.366-.025-.512-.073-.146-.647-1.59-.893-2.172-.22-.535-.45-.463-.634-.472-.163-.007-.358-.009-.554-.009Z"/>
    </svg>
  );
}

export default function KontakPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Hubungi Kami</h1>
          <p className="text-slate-500 text-sm">Ada pertanyaan, masukan, atau ingin bekerja sama? Jangan ragu untuk menghubungi kami.</p>
        </div>

        <div className="space-y-3">
          <a href="mailto:kawaltransaksi@gmail.com"
            className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all group">
            <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
              <IconGmail />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Email</p>
              <p className="text-sm text-slate-500">kawaltransaksi@gmail.com</p>
            </div>
          </a>

          <a href="https://www.instagram.com/achmadgozali27_/" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all group">
            <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
              <IconInstagram />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Instagram</p>
              <p className="text-sm text-slate-500">@achmadgozali27_</p>
            </div>
          </a>

          <a href="https://wa.me/6282249244647" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all group">
            <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
              <IconWhatsApp />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">WhatsApp</p>
              <p className="text-sm text-slate-500">Respons dalam 1x24 jam</p>
            </div>
          </a>
        </div>

        <div className="mt-8 p-5 bg-slate-50 border border-slate-200 rounded-xl">
          <p className="text-sm font-bold text-slate-800 mb-1">Jam Operasional</p>
          <p className="text-sm text-slate-500">Senin - Jumat, 09.00 - 17.00 WIB</p>
          <p className="text-xs text-slate-400 mt-2">Untuk laporan darurat terkait penipuan aktif, kirim email dengan subjek <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">[URGENT]</span></p>
        </div>
      </div>
    </div>
  );
}