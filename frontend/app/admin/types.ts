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
  target_numbers?: {
    number: string;
    type: string;
    bank: string | null;
    name: string | null;
  }[] | null;
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

export type Tab = 'dashboard' | 'laporan' | 'statistik' | 'pengguna' | 'blacklist';
export type StatusFilter = 'semua' | 'pending' | 'verified' | 'rejected' | 'withdrawn';

export const reportedToLabel: Record<string, string> = {
  polisi:   'Polisi',
  ojk:      'OJK',
  platform: 'Platform',
  belum:    'Belum lapor',
};