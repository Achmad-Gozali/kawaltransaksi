// ============================================
// 📁 LOKASI: types/database.ts
// ✅ FIX: Format types yang BENAR untuk Supabase client v2+
//
//    ROOT CAUSE semua error "Property does not exist on type 'never'":
//    Supabase @supabase/ssr client membutuhkan Database type dengan
//    format PERSIS termasuk Relationships, Views, CompositeTypes.
//    Kalau salah satu missing → type inference gagal → return 'never'.
//
//    PERUBAHAN KUNCI:
//    1. Enum types diganti string di Row/Insert/Update
//       (Supabase client ga bisa resolve custom TS types di query)
//    2. Tambah Relationships: [] di setiap table
//    3. Tambah Views, CompositeTypes sections (wajib walau kosong)
//    4. Functions return type pakai undefined bukan void
// ============================================

export type TargetType = 'phone' | 'bank_account';
export type ReportStatus = 'pending' | 'verified' | 'rejected';
export type UserRole = 'user' | 'admin' | 'moderator';

// Helper types untuk dipakai di luar Supabase queries
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
          status: string;
          created_at: string;
          bank_name: string | null;
          loss_amount: number | null;
          incident_date: string | null;
          platform: string | null;
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
          status?: string;
          created_at?: string;
          bank_name?: string | null;
          loss_amount?: number | null;
          incident_date?: string | null;
          platform?: string | null;
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
          status?: string;
          created_at?: string;
          bank_name?: string | null;
          loss_amount?: number | null;
          incident_date?: string | null;
          platform?: string | null;
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
        Returns: {
          category: string;
          count: number;
        }[];
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
        }[];
      };
      update_report_status: {
        Args: {
          report_id: string;
          new_status: string;
        };
        Returns: undefined;
      };
      update_user_role: {
        Args: {
          target_user_id: string;
          new_role: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      target_type_enum: 'phone' | 'bank_account';
      report_status_enum: 'pending' | 'verified' | 'rejected';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}