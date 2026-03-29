// ============================================
// 📁 LOKASI: types/database.ts
// 📝 REPLACE — proper Supabase types
// ============================================

export type TargetType = 'phone' | 'bank_account';
export type ReportStatus = 'pending' | 'verified' | 'rejected';

export interface Profile {
  id: string;
  updated_at: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  website: string | null;
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

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          updated_at?: string | null;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          website?: string | null;
        };
        Update: {
          id?: string;
          updated_at?: string | null;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          website?: string | null;
        };
      };
      reports: {
        Row: Report;
        Insert: {
          id?: string;
          reporter_id?: string | null;
          target_number: string;
          target_name?: string | null;
          target_type: TargetType;
          category: string;
          chronology: string;
          evidence_url?: string | null;
          status?: ReportStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string | null;
          target_number?: string;
          target_name?: string | null;
          target_type?: TargetType;
          category?: string;
          chronology?: string;
          evidence_url?: string | null;
          status?: ReportStatus;
          created_at?: string;
        };
      };
    };
    Enums: {
      target_type_enum: TargetType;
      report_status_enum: ReportStatus;
    };
  };
}