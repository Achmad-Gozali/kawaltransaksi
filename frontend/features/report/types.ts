export type TargetType = 'phone' | 'bank_account' | 'ewallet';

export interface TargetEntry {
  number: string;
  name: string;
  type: TargetType;
  bank_name: string;
  ewallet_name: string;
}

export interface AnalysisResult {
  authenticity_score: number;
  relevance_score: number;
  has_concrete_evidence: boolean;
  is_likely_authentic: boolean;
  summary: string;
  red_flags: string[];
}

export interface EvidenceFile {
  file: File;
  preview: string;
  analysis: AnalysisResult | null;
  isAnalyzing: boolean;
}

export type PhotoScanPayload = Pick<
  AnalysisResult,
  | 'authenticity_score'
  | 'relevance_score'
  | 'has_concrete_evidence'
  | 'is_likely_authentic'
>;

export interface TextAnalysis {
  risk_level: 'low' | 'medium' | 'high';
  chronology_score: number;
  analysis: string;
  suggested_category: string | null;
}

export interface ReportFormData {
  category: string;
  chronology: string;
  loss_amount: string;
  incident_date: string;
  platform: string;
  link_url: string;
  social_media_accounts: string[];
  has_other_victims: '' | 'yes' | 'no';
  reported_to: string[];
  store_name: string;
  suspect_city: string;
}
