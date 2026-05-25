export type TargetType = 'phone' | 'bank_account' | 'ewallet';

export interface TargetEntry {
  number: string;
  name: string;
  type: TargetType;
  bank_name: string;
  ewallet_name: string;
}

export interface EvidenceFile {
  file: File;
  preview: string;
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