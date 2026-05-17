'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardTab from './tabs/DashboardTab';
import LaporanTab from './tabs/LaporanTab';
import StatistikTab from './tabs/StatistikTab';
import PenggunaTab from './tabs/PenggunaTab';
import BlacklistTab from './tabs/BlacklistTab';
import ArtikelTab from './tabs/ArtikelTab';
import FeedbackTab from './tabs/FeedbackTab';
import type { Stats, Report, AdminUser, Tab } from './types';
import type { FeedbackItem } from './tabs/FeedbackTab';

// ─────────────────────────────────────────────
// Inner (wrapped in Suspense karena useSearchParams)
// ─────────────────────────────────────────────

function DashboardInner({
  stats,
  reports,
  users,
  feedbacks,
  token,
}: {
  stats:     Stats;
  reports:   Report[];
  users:     AdminUser[];
  feedbacks: FeedbackItem[];
  token:     string;
}) {
  const searchParams  = useSearchParams();
  const currentTab    = (searchParams.get('tab') as Tab) || 'dashboard';
  const initialSearch = searchParams.get('search') || '';

  switch (currentTab) {
    case 'dashboard':  return <DashboardTab stats={stats} reports={reports} />;
    case 'laporan':    return <LaporanTab reports={reports} initialSearch={initialSearch} />;
    case 'statistik':  return <StatistikTab stats={stats} reports={reports} />;
    case 'pengguna':   return <PenggunaTab users={users} />;
    case 'blacklist':  return <BlacklistTab token={token} />;
    case 'artikel':    return <ArtikelTab token={token} />;
    case 'feedback':   return <FeedbackTab feedbacks={feedbacks} token={token} />;
    default:           return <DashboardTab stats={stats} reports={reports} />;
  }
}

// ─────────────────────────────────────────────
// Skeleton fallback
// ─────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="h-8 w-40 bg-slate-200 rounded-xl animate-pulse" />
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-28 bg-white border border-slate-200 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────

export default function AdminDashboard(props: {
  stats:     Stats;
  reports:   Report[];
  users:     AdminUser[];
  feedbacks: FeedbackItem[];
  token:     string;
}) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardInner {...props} />
    </Suspense>
  );
}