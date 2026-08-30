export type TargetType = 'phone' | 'bank_account' | 'ewallet' | 'qris';

export interface TargetEntry {
  // Untuk phone/bank_account/ewallet: diketik user. Untuk qris: NMID hasil
  // decode foto (read-only, diisi otomatis oleh TargetEntryCard, bukan input).
  number: string;
  // Untuk phone/bank_account/ewallet: nama pemilik (opsional, manual).
  // Untuk qris: nama merchant hasil decode (wajib ada, read-only).
  name: string;
  // '' = belum dipilih (placeholder dropdown). Field target lain baru muncul
  // setelah user memilih tipe secara eksplisit -- pola sama dgn dropdown
  // Kategori Penipuan.
  type: TargetType | '';
  bank_name: string;
  ewallet_name: string;
  custom_bank_name?: string;
  custom_ewallet_name?: string;
  // qris-only, di bawah ini. qris_payload adalah field yang BENAR-BENAR
  // dikirim ke server (server re-parse dari nol) -- number/name di atas
  // cuma untuk validasi step & tampilan, server mengabaikannya untuk qris.
  qris_payload?: string;
  qris_merchant_city?: string;
  // Data URL foto QRIS untuk thumbnail di UI. Transient -- TIDAK dikirim ke
  // server. Disimpan di sini (bukan useState lokal TargetEntryCard) supaya
  // tidak hilang saat komponen unmount/remount pindah sub-layar Step 1.
  qris_preview?: string;
}

export interface EvidenceFile {
  file: File;
  preview: string;
  // true kalau file ini didorong otomatis dari decode foto QRIS di Step 1
  // (bukan ditambahkan manual di Step 3) -- dipakai untuk mengganti (bukan
  // menumpuk) evidence saat user scan ulang QRIS-nya.
  isQrisSource?: boolean;
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
  store_name: string;
  suspect_city: string;
}