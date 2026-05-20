'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

interface DailyChartProps {
  reports: { created_at: string }[];
}

type Period = '7d' | '30d' | 'all';

export default function DailyChart({ reports }: DailyChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);
  const [period, setPeriod] = useState<Period>('7d');

  // ÔöÇÔöÇ Hitung data berdasarkan period ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
  const chartData = useMemo(() => {
    const days: Record<string, number> = {};

    if (period === 'all') {
      // Cek apakah semua data dalam bulan yang sama
      const months = new Set(
        reports.map((r) => {
          const d = new Date(r.created_at);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        })
      );

      const useDaily = months.size <= 1; // semua dalam 1 bulan ÔåÆ group by hari

      reports.forEach((r) => {
        const d = new Date(r.created_at);
        const key = useDaily
          ? d.toLocaleDateString('en-CA') // YYYY-MM-DD
          : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        days[key] = (days[key] || 0) + 1;
      });

      const sorted = Object.entries(days).sort((a, b) => a[0].localeCompare(b[0]));
      return {
        labels: sorted.map(([key]) => {
          if (useDaily) {
            const d = new Date(key);
            return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
          }
          const [y, m] = key.split('-');
          return new Date(Number(y), Number(m) - 1).toLocaleDateString('id-ID', {
            month: 'short',
            year: '2-digit',
          });
        }),
        data: sorted.map(([, count]) => count),
      };
    }

    // 7 hari atau 30 hari
    const numDays = period === '7d' ? 7 : 30;
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days[d.toLocaleDateString('en-CA')] = 0;
    }

    reports.forEach((r) => {
      const d = new Date(r.created_at).toLocaleDateString('en-CA');
      if (d in days) days[d]++;
    });

    const entries = Object.entries(days);
    return {
      labels: entries.map(([date]) => {
        const d = new Date(date);
        return period === '30d'
          ? d.toLocaleDateString('id-ID', { day: 'numeric' })
          : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      }),
      data: entries.map(([, count]) => count),
    };
  }, [reports, period]);

  // ÔöÇÔöÇ Render Chart.js ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
  useEffect(() => {
    let cancelled = false;

    async function renderChart() {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);

      if (cancelled || !canvasRef.current) return;

      // Destroy old chart
      if (chartRef.current) {
        chartRef.current.destroy();
      }

      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const textColor = isDark ? '#b4b2a9' : '#888780';
      const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

      // Gradient fill
      const gradient = ctx.createLinearGradient(0, 0, 0, 200);
      gradient.addColorStop(0, isDark ? 'rgba(29,158,117,0.35)' : 'rgba(29,158,117,0.2)');
      gradient.addColorStop(1, 'rgba(29,158,117,0)');

      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: chartData.labels,
          datasets: [{
            data: chartData.data,
            borderColor: '#1D9E75',
            backgroundColor: gradient,
            fill: true,
            tension: 0.4,
            pointRadius: period === '30d' ? 2 : 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#1D9E75',
            pointBorderColor: isDark ? '#2C2C2A' : '#fff',
            pointBorderWidth: 2,
            borderWidth: 2.5,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 400, easing: 'easeOutQuart' },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: isDark ? '#444' : '#1e1e1e',
              titleFont: { size: 12 },
              bodyFont: { size: 13, weight: 'bold' as const },
              padding: 10,
              cornerRadius: 8,
              displayColors: false,
              callbacks: {
                label: (ctx: any) => `${ctx.parsed.y} laporan`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                color: textColor,
                font: { size: 10 },
                maxRotation: 0,
                autoSkip: period === '30d',
                maxTicksLimit: period === '30d' ? 10 : undefined,
              },
            },
            y: {
              beginAtZero: true,
              grid: { color: gridColor },
              ticks: {
                color: textColor,
                font: { size: 11 },
                stepSize: 1,
                precision: 0,
              },
            },
          },
        },
      });
    }

    renderChart();

    return () => {
      cancelled = true;
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [chartData, period]);

  // ÔöÇÔöÇ Total laporan di period ini ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
  const totalInPeriod = chartData.data.reduce((a, b) => a + b, 0);

  return (
    <div>
      {/* Header: title + period toggle */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Laporan masuk</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">{totalInPeriod} laporan dalam periode ini</p>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
          {([
            { value: '7d', label: '7 Hari' },
            { value: '30d', label: '30 Hari' },
            { value: 'all', label: 'Semua' },
          ] as { value: Period; label: string }[]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${
                period === opt.value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart canvas */}
      <div style={{ position: 'relative', height: '200px' }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
