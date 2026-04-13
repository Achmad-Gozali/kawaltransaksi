import { ImageResponse } from 'next/og';
import { createClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const revalidate = 3600;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

function formatCompact(num: number): string {
  if (num >= 1_000_000_000) return `Rp${(num / 1_000_000_000).toFixed(1)} M+`;
  if (num >= 1_000_000) return `Rp${(num / 1_000_000).toFixed(1)} Jt+`;
  return `Rp${num.toLocaleString('id-ID')}`;
}

export default async function Image() {
  const supabase = await createClient();

  const [
    { count: totalReports },
    { count: verifiedCount },
    { data: lossData },
  ] = await Promise.all([
    supabase.from('reports').select('*', { count: 'exact', head: true }),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'verified'),
    supabase.from('reports').select('loss_amount'),
  ]);

  const totalLoss = (lossData ?? []).reduce((sum, r) => sum + (Number(r.loss_amount) || 0), 0);

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 80px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Grid background dots */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            opacity: 0.5,
          }}
        />

        {/* Top — Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              background: '#0f172a',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#22c55e',
              fontSize: 20,
              fontWeight: 900,
            }}
          >
            K
          </div>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: -0.5 }}>
            KAWALTRANSAKSI
          </span>
          <div
            style={{
              marginLeft: 12,
              fontSize: 11,
              fontWeight: 700,
              color: '#22c55e',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 999,
              padding: '3px 10px',
              letterSpacing: 1,
            }}
          >
            GRATIS
          </div>
        </div>

        {/* Middle — Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
            <span style={{ fontSize: 88, fontWeight: 900, color: '#0f172a', letterSpacing: -3 }}>
              TRANSAKSI
            </span>
            <span style={{ fontSize: 88, fontWeight: 900, color: '#16a34a', fontStyle: 'italic', letterSpacing: -3 }}>
              AMAN,
            </span>
            <span style={{ fontSize: 88, fontWeight: 900, color: '#0f172a', letterSpacing: -3 }}>
              HATI TENANG
            </span>
          </div>
          <p style={{ fontSize: 22, color: '#64748b', margin: 0, marginTop: 8, fontWeight: 400 }}>
            Verifikasi nomor HP, rekening bank, dan e-wallet sebelum transfer. Gratis.
          </p>
        </div>

        {/* Bottom — Stats */}
        <div
          style={{
            display: 'flex',
            gap: 24,
          }}
        >
          {[
            { label: 'LAPORAN', value: `${totalReports ?? 0}+`, color: '#0f172a' },
            { label: 'VERIFIED', value: `${verifiedCount ?? 0}+`, color: '#16a34a' },
            { label: 'KERUGIAN', value: formatCompact(totalLoss), color: '#dc2626' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                flex: 1,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                padding: '20px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 2 }}>
                {stat.label}
              </span>
              <span style={{ fontSize: 36, fontWeight: 900, color: stat.color, letterSpacing: -1 }}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}