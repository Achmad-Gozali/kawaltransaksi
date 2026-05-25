// ============================================
//  LOKASI: frontend/features/admin/types.ts
// ============================================

export interface RobotReason {
  rule: string;
  points: number;
  detail: string;
}

export interface Report {
  id: string;
  reporter_email: string;
  target_number: string;
  target_name: string | null;
  target_type: string;
  category: string;
  chronology: string;
  evidence_url: string | null;
  evidence_urls?: string[] | null;
  target_numbers?: TargetNumber[] | null;
  status: string;
  created_at: string;
  bank_name?: string | null;
  loss_amount?: number | string | null;
  incident_date?: string | null;
  platform?: string | null;
  link_url?: string | null;
  social_media_accounts?: string[] | null;
  suspect_photo_url?: string | null;
  has_other_victims?: string | null;
  reported_to?: string[] | null;
  store_name?: string | null;
  suspect_city?: string | null;
  // Robot fields
  robot_score?: number | null;
  robot_status?: string | null;
  robot_reasons?: RobotReason[] | null;
}

export interface TargetNumber {
  number: string;
  type?: string;
  bank?: string | null;
  name?: string | null;
}

export interface AdminUser {
  id: string;
  full_name: string | null;
  role: string;
  email: string;
  created_at: string;
  is_banned: boolean;
  report_count: number;
  updated_at: string | null;
}

export interface AdminArticle {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content?: string;
  status: string;
  cover_image: string | null;
  published_at: string;
  total_reports: number | null;
  top_category: string | null;
  created_at: string;
}

export interface BlacklistEntry {
  ip: string;
  reason: string;
  auto: boolean;
  admin?: string;
  created_at: string;
}

export interface IpLogEntry {
  ip: string;
  reason: string;
  endpoint: string;
  created_at: string;
}

export interface Stats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
}

// Robot types
export interface RobotBlacklist {
  id: string;
  target_number: string;
  level: 'medium' | 'high' | 'critical';
  total_reports: number;
  unique_reporters: number;
  last_reported_at: string | null;
  updated_at: string;
}

export interface RobotHealth {
  id: string;
  checked_at: string;
  processed: number;
  verified: number;
  rejected: number;
  errors: number;
  avg_duration_ms: number;
  pending_total: number;
  error_rate: number;
}

export interface RobotTrend {
  id: string;
  target_number: string;
  report_count: number;
  is_viral: boolean;
  detected_at: string;
  updated_at: string;
}

export interface RobotLog {
  id: string;
  report_id: string | null;
  action: string;
  verdict: string | null;
  score: number | null;
  reasons: unknown[];
  error: string | null;
  duration_ms: number | null;
  created_at: string;
}

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

export type StatusFilter = 'semua' | 'pending' | 'verified' | 'rejected' | 'withdrawn';

export const reportedToLabel: Record<string, string> = {
  polisi:   'Polisi',
  ojk:      'OJK',
  platform: 'Platform',
  belum:    'Belum lapor',
};