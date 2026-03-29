'use client';

// ============================================
// 📁 LOKASI: app/check/[slug]/ShareButtons.tsx
// 📝 BARU — share buttons (copy, WhatsApp, Twitter)
// ============================================

import { useState } from 'react';
import { Copy, Check, MessageCircle } from 'lucide-react';

interface ShareButtonsProps {
  slug: string;
  shareText: string;
}

export default function ShareButtons({ slug, shareText }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const pageUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/check/${slug}`
    : `/check/${slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback untuk browser lama
      const el = document.createElement('textarea');
      el.value = pageUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`${shareText}\n${pageUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleTwitter = () => {
    const text = encodeURIComponent(`${shareText} ${pageUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6">
      <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-1">
        Sebarkan Informasi
      </h4>
      <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
        Bagikan halaman ini agar lebih banyak orang terlindungi.
      </p>

      <div className="space-y-2">
        {/* Copy Link */}
        <button
          onClick={handleCopy}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95 ${
            copied
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          {copied ? (
            <><Check className="w-3.5 h-3.5" /> Link Tersalin!</>
          ) : (
            <><Copy className="w-3.5 h-3.5" /> Salin Link</>
          )}
        </button>

        {/* WhatsApp */}
        <button
          onClick={handleWhatsApp}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366]/20 transition-all active:scale-95"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Share ke WhatsApp
        </button>

        {/* Twitter / X */}
        <button
          onClick={handleTwitter}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-zinc-900/5 text-zinc-700 hover:bg-zinc-900/10 transition-all active:scale-95"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.26 5.632L18.243 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Share ke X / Twitter
        </button>
      </div>
    </div>
  );
}