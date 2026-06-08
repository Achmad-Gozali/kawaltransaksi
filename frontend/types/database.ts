// ============================================
//  LOKASI: frontend/types/database.ts
// ============================================

export type TargetType       = 'phone' | 'bank_account' | 'ewallet';
export type ReportStatus     = 'pending' | 'verified' | 'rejected' | 'withdrawn';
export type UserRole         = 'user' | 'admin' | 'moderator';
export type FeedbackCategory = 'bug' | 'feature' | 'ui_ux' | 'other';
export type FeedbackUrgency  = 'low' | 'medium' | 'high' | 'critical';
export type FeedbackStatus   = 'pending' | 'in_review' | 'fixed' | 'closed';
export type ArticleStatus    = 'draft' | 'published';
export type BlacklistLevel   = 'medium' | 'high' | 'critical';
export type AppealStatus     = 'pending' | 'approved' | 'rejected';

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
  // Robot fields
  robot_score: number | null;
  robot_status: string | null;
  robot_verdict_at: string | null;
  robot_reasons: Json | null;
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
          email: string | null;
          is_banned: boolean;
          failed_attempts: number;
          locked_until: string | null;
          welcome_sent: boolean;
        };
        Insert: {
          id: string;
          updated_at?: string | null;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          website?: string | null;
          role?: string;
          email?: string | null;
          is_banned?: boolean;
          failed_attempts?: number;
          locked_until?: string | null;
          welcome_sent?: boolean;
        };
        Update: {
          id?: string;
          updated_at?: string | null;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          website?: string | null;
          role?: string;
          email?: string | null;
          is_banned?: boolean;
          failed_attempts?: number;
          locked_until?: string | null;
          welcome_sent?: boolean;
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
          // Robot fields
          robot_score: number | null;
          robot_status: string | null;
          robot_verdict_at: string | null;
          robot_reasons: Json | null;
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
          robot_score?: number | null;
          robot_status?: string | null;
          robot_verdict_at?: string | null;
          robot_reasons?: Json | null;
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
          robot_score?: number | null;
          robot_status?: string | null;
          robot_verdict_at?: string | null;
          robot_reasons?: Json | null;
        };
        Relationships: [];
      };

      // -- Blacklist (robot) ---------------------------------------------------
      blacklist: {
        Row: {
          id: string;
          target_number: string;
          level: string; // medium | high | critical
          total_reports: number;
          unique_reporters: number;
          last_reported_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          target_number: string;
          level?: string;
          total_reports?: number;
          unique_reporters?: number;
          last_reported_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          target_number?: string;
          level?: string;
          total_reports?: number;
          unique_reporters?: number;
          last_reported_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };

      // -- Robot Trends --------------------------------------------------------
      robot_trends: {
        Row: {
          id: string;
          target_number: string;
          report_count: number;
          is_viral: boolean;
          detected_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          target_number: string;
          report_count?: number;
          is_viral?: boolean;
          detected_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          target_number?: string;
          report_count?: number;
          is_viral?: boolean;
          detected_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // -- Robot Logs (audit) --------------------------------------------------
      robot_logs: {
        Row: {
          id: string;
          report_id: string | null;
          action: string;
          verdict: string | null;
          score: number | null;
          reasons: Json;
          error: string | null;
          duration_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id?: string | null;
          action: string;
          verdict?: string | null;
          score?: number | null;
          reasons?: Json;
          error?: string | null;
          duration_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string | null;
          action?: string;
          verdict?: string | null;
          score?: number | null;
          reasons?: Json;
          error?: string | null;
          duration_ms?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };

      // -- Robot Health --------------------------------------------------------
      robot_health: {
        Row: {
          id: string;
          checked_at: string;
          processed: number;
          verified: number;
          rejected: number;
          errors: number;
          avg_duration_ms: number;
          pending_total: number;
          error_rate: number;
        };
        Insert: {
          id?: string;
          checked_at?: string;
          processed?: number;
          verified?: number;
          rejected?: number;
          errors?: number;
          avg_duration_ms?: number;
          pending_total?: number;
          error_rate?: number;
        };
        Update: {
          id?: string;
          checked_at?: string;
          processed?: number;
          verified?: number;
          rejected?: number;
          errors?: number;
          avg_duration_ms?: number;
          pending_total?: number;
          error_rate?: number;
        };
        Relationships: [];
      };

      // -- Appeal System -------------------------------------------------------
      report_appeals: {
        Row: {
          id: string;
          report_id: string;
          user_id: string;
          reason: string;
          status: string; // pending | approved | rejected
          evidence_urls: string[] | null;  // <- tambah
          loss_amount: number | null;      // <- tambah
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          user_id: string;
          reason: string;
          status?: string;
          evidence_urls?: string[] | null;  // <- tambah
          loss_amount?: number | null;      // <- tambah
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          user_id?: string;
          reason?: string;
          status?: string;
          evidence_urls?: string[] | null;  // <- tambah
          loss_amount?: number | null;      // <- tambah
          reviewed_at?: string | null;
          created_at?: string;
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
          status: string;
          cover_image: string | null;
          total_reports: number | null;
          total_loss: number | null;
          top_category: string | null;
          top_platform: string | null;
          top_bank: string | null;
          period_start: string | null;
          period_end: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          summary: string;
          content: string;
          published_at?: string;
          status?: string;
          cover_image?: string | null;
          total_reports?: number | null;
          total_loss?: number | null;
          top_category?: string | null;
          top_platform?: string | null;
          top_bank?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          summary?: string;
          content?: string;
          published_at?: string;
          status?: string;
          cover_image?: string | null;
          total_reports?: number | null;
          total_loss?: number | null;
          top_category?: string | null;
          top_platform?: string | null;
          top_bank?: string | null;
          period_start?: string | null;
          period_end?: string | null;
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

api_keys: {
  Row: {
    id: string;
    user_id: string;
    name: string;
    key_hash: string;        // NOT NULL sekarang
    key_prefix: string;      // NOT NULL sekarang
    environment: string;
    requests_today: number;
    requests_total: number;
    daily_limit: number;
    last_reset_at: string | null;
    last_used_at: string | null;
    expires_at: string | null;
    failed_attempts: number;
    is_active: boolean;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    name: string;
    key_hash: string;        // wajib diisi
    key_prefix: string;      // wajib diisi
    environment?: string;
    requests_today?: number;
    requests_total?: number;
    daily_limit?: number;
    last_reset_at?: string | null;
    last_used_at?: string | null;
    expires_at?: string | null;
    failed_attempts?: number;
    is_active?: boolean;
    created_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    name?: string;
    key_hash?: string;
    key_prefix?: string;
    environment?: string;
    requests_today?: number;
    requests_total?: number;
    daily_limit?: number;
    last_reset_at?: string | null;
    last_used_at?: string | null;
    expires_at?: string | null;
    failed_attempts?: number;
    is_active?: boolean;
    created_at?: string;
  };
  Relationships: [];
};
    };

    Views: { [_ in never]: never };

    Functions: {
      get_stats_nomor: {
        Args: Record<string, never>;
        Returns: { total_laporan: number; total_nomor: number; total_kerugian: number };
      };
      get_stats_rekening: {
        Args: Record<string, never>;
        Returns: { total_laporan: number; total_rekening: number; total_kerugian: number };
      };
      get_stats: {
        Args: Record<string, never>;
        Returns: { total: number; verified: number; total_loss: number };
      };
      get_laporan_publik: {
        Args: { p_type?: string; p_sort?: string; p_q?: string; p_page?: number; p_per_page?: number };
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
      get_laporan_stats: {
        Args: Record<string, never>;
        Returns: { target_type: string; bank_name: string | null; category: string | null; status: string; created_at: string }[];
      };
      get_check_page_data: {
        Args: { p_number: string };
        Returns: { reports: any[]; linked: any[] };
      };
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
          robot_score: number | null;
          robot_status: string | null;
          robot_reasons: Json | null;
        }[];
      };
      increment_api_usage: {
        Args: { key_id: string };
        Returns: undefined;
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

    CompositeTypes: { [_ in never]: never };
  };
}