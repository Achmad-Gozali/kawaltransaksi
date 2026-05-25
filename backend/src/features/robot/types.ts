// ============================================
//  LOKASI: backend/src/features/robot/types.ts
// ============================================

export interface RobotReport {
  id: string;
  reporter_id: string | null;
  target_number: string;
  chronology: string;
  evidence_urls: string[] | null;
  evidence_url: string | null;
  status: string;
  created_at: string;
  loss_amount: number | null;
  incident_date: string | null;
  has_other_victims: string | null;
}

export interface RobotProfile {
  id: string;
  created_at?: string | null;
  email?: string | null;
  full_name?: string | null;
}

export type RobotVerdict = 'verified' | 'pending' | 'rejected';

export interface ScoringResult {
  score: number;
  verdict: RobotVerdict;
  reasons: ScoringReason[];
}

export interface ScoringReason {
  rule: string;
  points: number;
  detail: string;
}