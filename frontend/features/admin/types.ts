export interface RobotReason {
  rule: string;
  points: number;
  detail: string;
}

export interface Report {
  id: string;
  targetValue: string;
  targetType: string;
  targetName?: string | null;
  category?: string | null;
  chronology?: string | null;
  description?: string | null;
  status: string;
  createdAt: string;
  bankName?: string | null;
  walletName?: string | null;
  amount?: number | null;
  incidentDate?: string | null;
  platform?: string | null;
  linkUrl?: string | null;
  socialMediaAccounts?: string[] | null;
  suspectPhotoUrl?: string | null;
  hasOtherVictims?: string | null;
  reportedTo?: string[] | null;
  storeName?: string | null;
  suspectCity?: string | null;
  userId?: string | null;
  evidenceUrls?: string[];
  // snake_case fallback dari API
  target_value?: string;
  target_type?: string;
  target_name?: string | null;
  bank_name?: string | null;
  wallet_name?: string | null;
  created_at?: string;
  suspect_photo_url?: string | null;
  store_name?: string | null;
  suspect_city?: string | null;
  social_media_accounts?: string[] | null;
  reported_to?: string[] | null;
  has_other_victims?: string | null;
  evidence_urls?: string[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  reportCount?: number;
  // snake_case fallback dari API
  created_at?: string;
  report_count?: number;
}

export interface Stats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
}

// Agregat dari GET /api/admin/analytics -- dihitung di SQL, dipakai StatistikTab
// alih-alih menarik seluruh daftar laporan mentah lalu di-reduce di browser.
export interface AdminAnalytics {
  typeCounts: { targetType: string; count: number }[];
  categoryCounts: { category: string; count: number }[];
  platformCounts: { platform: string; count: number }[];
  /** 30 hari terakhir, sudah zero-filled & terurut (WIB). date = 'YYYY-MM-DD'. */
  dailyTrend: { date: string; total: number; verified: number; pending: number; loss: number }[];
  lossTotal: number;
  lossReportCount: number;
}

export const EMPTY_ANALYTICS: AdminAnalytics = {
  typeCounts: [],
  categoryCounts: [],
  platformCounts: [],
  dailyTrend: [],
  lossTotal: 0,
  lossReportCount: 0,
};

export type Tab =
  | 'dashboard'
  | 'laporan'
  | 'statistik'
  | 'pengguna'
  | 'blacklist'
  | 'artikel'
  | 'feedback'
  | 'apikeys'
  | 'robot';

export type StatusFilter = 'semua' | 'pending' | 'verified' | 'rejected';

export const reportedToLabel: Record<string, string> = {
  polisi:   'Polisi',
  ojk:      'OJK',
  platform: 'Platform',
  belum:    'Belum lapor',
};