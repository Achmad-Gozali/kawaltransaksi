// ============================================
// 📁 LOKASI: types/database.ts
// ✅ UPDATE: Tambah tabel articles
// ============================================

export type TargetType = 'phone' | 'bank_account' | 'ewallet';
export type ReportStatus = 'pending' | 'verified' | 'rejected' | 'withdrawn';
export type UserRole = 'user' | 'admin' | 'moderator';

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
          evidence_urls: string[] | null;
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
          evidence_urls: string[] | null;
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
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
      target_type_enum: 'phone' | 'bank_account';
      report_status_enum: 'pending' | 'verified' | 'rejected' | 'withdrawn';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}