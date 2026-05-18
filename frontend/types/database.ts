// ============================================
// 📁 LOKASI: types/database.ts
// ✅ UPDATE: Tambah RPC get_stats, get_laporan_publik, get_laporan_stats
// ============================================

export type TargetType    = 'phone' | 'bank_account' | 'ewallet';
export type ReportStatus  = 'pending' | 'verified' | 'rejected' | 'withdrawn';
export type UserRole      = 'user' | 'admin' | 'moderator';
export type FeedbackCategory = 'bug' | 'feature' | 'ui_ux' | 'other';
export type FeedbackUrgency  = 'low' | 'medium' | 'high' | 'critical';
export type FeedbackStatus   = 'pending' | 'in_review' | 'fixed' | 'closed';

export interface Profile {
  id: string;
  updated_at: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  website: string | null;
  role: UserRole;
}

export interface Report {
  id: string;
  reporter_id: string | null;
  target_number: string;
  target_name: string | null;
  target_type: TargetType;
  category: string;
  chronology: string;
  evidence_url: string | null;
  status: ReportStatus;
  created_at: string;
}

export interface Feedback {
  id: string;
  user_id: string | null;
  user_email: string | null;
  category: FeedbackCategory;
  title: string;
  description: string;
  page_url: string | null;
  urgency: FeedbackUrgency;
  screenshot_urls: string[];
  status: FeedbackStatus;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          updated_at: string | null;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          website: string | null;
          role: string;
        };
        Insert: {
          id: string;
          updated_at?: string | null;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          website?: string | null;
          role?: string;
        };
        Update: {
          id?: string;
          updated_at?: string | null;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          website?: string | null;
          role?: string;
        };
        Relationships: [];
      };

      reports: {
        Row: {
          id: string;
          reporter_id: string | null;
          target_number: string;
          target_name: string | null;
          target_type: string;
          category: string;
          chronology: string;
          evidence_url: string | null;
          evidence_urls: string[] | null;
          status: string;
          created_at: string;
          bank_name: string | null;
          loss_amount: number | null;
          incident_date: string | null;
          platform: string | null;
          link_url: string | null;
          social_media_accounts: string[] | null;
          suspect_photo_url: string | null;
          has_other_victims: string | null;
          reported_to: string[] | null;
          store_name: string | null;
          suspect_city: string | null;
        };
        Insert: {
          id?: string;
          reporter_id?: string | null;
          target_number: string;
          target_name?: string | null;
          target_type: string;
          category: string;
          chronology: string;
          evidence_url?: string | null;
          evidence_urls?: string[] | null;
          status?: string;
          created_at?: string;
          bank_name?: string | null;
          loss_amount?: number | null;
          incident_date?: string | null;
          platform?: string | null;
          link_url?: string | null;
          social_media_accounts?: string[] | null;
          suspect_photo_url?: string | null;
          has_other_victims?: string | null;
          reported_to?: string[] | null;
          store_name?: string | null;
          suspect_city?: string | null;
        };
        Update: {
          id?: string;
          reporter_id?: string | null;
          target_number?: string;
          target_name?: string | null;
          target_type?: string;
          category?: string;
          chronology?: string;
          evidence_url?: string | null;
          evidence_urls?: string[] | null;
          status?: string;
          created_at?: string;
          bank_name?: string | null;
          loss_amount?: number | null;
          incident_date?: string | null;
          platform?: string | null;
          link_url?: string | null;
          social_media_accounts?: string[] | null;
          suspect_photo_url?: string | null;
          has_other_victims?: string | null;
          reported_to?: string[] | null;
          store_name?: string | null;
          suspect_city?: string | null;
        };
        Relationships: [];
      };

      articles: {
        Row: {
          id: string;
          title: string;
          slug: string;
          summary: string;
          content: string;
          published_at: string;
          total_reports: number | null;
          total_loss: number | null;
          top_category: string | null;
          top_platform: string | null;
          top_bank: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          summary: string;
          content: string;
          published_at?: string;
          total_reports?: number | null;
          total_loss?: number | null;
          top_category?: string | null;
          top_platform?: string | null;
          top_bank?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          summary?: string;
          content?: string;
          published_at?: string;
          total_reports?: number | null;
          total_loss?: number | null;
          top_category?: string | null;
          top_platform?: string | null;
          top_bank?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      feedback: {
        Row: {
          id: string;
          user_id: string | null;
          user_email: string | null;
          category: string;
          title: string;
          description: string;
          page_url: string | null;
          urgency: string;
          screenshot_urls: string[];
          status: string;
          admin_reply: string | null;
          replied_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          user_email?: string | null;
          category: string;
          title: string;
          description: string;
          page_url?: string | null;
          urgency?: string;
          screenshot_urls?: string[];
          status?: string;
          admin_reply?: string | null;
          replied_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          user_email?: string | null;
          category?: string;
          title?: string;
          description?: string;
          page_url?: string | null;
          urgency?: string;
          screenshot_urls?: string[];
          status?: string;
          admin_reply?: string | null;
          replied_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };

    Views: {
      [_ in never]: never;
    };

    Functions: {
      // ── Baru: stats cek-nomor ────────────────────────────────────────────
      get_stats_nomor: {
        Args: Record<string, never>;
        Returns: {
          total_laporan: number;
          total_nomor: number;
          total_kerugian: number;
        };
      };

      // ── Baru: stats cek-rekening ─────────────────────────────────────────
      get_stats_rekening: {
        Args: Record<string, never>;
        Returns: {
          total_laporan: number;
          total_rekening: number;
          total_kerugian: number;
        };
      };

      // ── Baru: stats homepage ──────────────────────────────────────────────
      get_stats: {
        Args: Record<string, never>;
        Returns: {
          total: number;
          verified: number;
          total_loss: number;
        };
      };

      // ── Baru: laporan publik dengan grouping + pagination di DB ───────────
      get_laporan_publik: {
        Args: {
          p_type?: string;
          p_sort?: string;
          p_q?: string;
          p_page?: number;
          p_per_page?: number;
        };
        Returns: {
          data: {
            target_number: string;
            target_name: string | null;
            target_type: string;
            bank_name: string | null;
            category: string | null;
            latest_at: string;
            earliest_at: string;
            total: number;
            verified_count: number;
            pending_count: number;
          }[];
          total_unique: number;
        };
      };

      // ── Baru: stats untuk StatsChart ──────────────────────────────────────
      get_laporan_stats: {
        Args: Record<string, never>;
        Returns: {
          target_type: string;
          bank_name: string | null;
          category: string | null;
          status: string;
          created_at: string;
        }[];
      };

      // ── Baru: check page data ─────────────────────────────────────────────
      get_check_page_data: {
        Args: { p_number: string };
        Returns: {
          reports: any[];
          linked: any[];
        };
      };

      // ── Existing ──────────────────────────────────────────────────────────
      get_category_counts: {
        Args: Record<string, never>;
        Returns: { category: string; count: number }[];
      };
      get_reports_admin: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          reporter_email: string;
          target_number: string;
          target_name: string | null;
          target_type: string;
          category: string;
          chronology: string;
          evidence_url: string | null;
          evidence_urls: string[] | null;
          status: string;
          created_at: string;
          bank_name: string | null;
          loss_amount: number | null;
          incident_date: string | null;
          platform: string | null;
          link_url: string | null;
          social_media_accounts: string[] | null;
          suspect_photo_url: string | null;
          has_other_victims: string | null;
          reported_to: string[] | null;
          target_numbers: Json | null;
          store_name: string | null;
          suspect_city: string | null;
        }[];
      };
      update_report_status: {
        Args: { report_id: string; new_status: string };
        Returns: undefined;
      };
      update_user_role: {
        Args: { target_user_id: string; new_role: string };
        Returns: undefined;
      };
    };

    Enums: {
      target_type_enum:   'phone' | 'bank_account';
      report_status_enum: 'pending' | 'verified' | 'rejected' | 'withdrawn';
    };

    CompositeTypes: {
      [_ in never]: never;
    };
  };
}