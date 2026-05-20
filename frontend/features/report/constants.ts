export const MAX_EVIDENCE_FILES = 10;
export const MAX_TARGET_NUMBERS = 5;

export const STEPS = [
  { number: 1, label: 'Data Penipu' },
  { number: 2, label: 'Kronologi' },
  { number: 3, label: 'Bukti & Kirim' },
];

export const bankList = [
  { value: 'BRI', label: 'BRI (Bank Rakyat Indonesia)' },
  { value: 'BNI', label: 'BNI (Bank Negara Indonesia)' },
  { value: 'Mandiri', label: 'Bank Mandiri' },
  { value: 'BTN', label: 'BTN (Bank Tabungan Negara)' },
  { value: 'BSI', label: 'BSI (Bank Syariah Indonesia)' },
  { value: 'BCA', label: 'BCA (Bank Central Asia)' },
  { value: 'CIMB Niaga', label: 'CIMB Niaga' },
  { value: 'Danamon', label: 'Bank Danamon' },
  { value: 'Permata', label: 'Bank Permata' },
  { value: 'OCBC', label: 'OCBC Indonesia' },
  { value: 'Panin', label: 'Bank Panin' },
  { value: 'Mega', label: 'Bank Mega' },
  { value: 'Maybank', label: 'Maybank Indonesia' },
  { value: 'Sinarmas', label: 'Bank Sinarmas' },
  { value: 'BTPN', label: 'BTPN (Jenius)' },
  { value: 'Bukopin', label: 'Bank KB Bukopin' },
  { value: 'Muamalat', label: 'Bank Muamalat' },
  { value: 'Jago', label: 'Bank Jago' },
  { value: 'Blu BCA', label: 'Blu by BCA Digital' },
  { value: 'Seabank', label: 'SeaBank Indonesia' },
  { value: 'Neo Commerce', label: 'Bank Neo Commerce' },
  { value: 'Allo Bank', label: 'Allo Bank' },
  { value: 'BJB', label: 'BJB (Bank Jabar Banten)' },
  { value: 'Bank DKI', label: 'Bank DKI' },
  { value: 'Lainnya', label: 'Bank Lainnya' },
];

export const ewalletList = [
  { value: 'GoPay', label: 'GoPay' },
  { value: 'Dana', label: 'DANA' },
  { value: 'OVO', label: 'OVO' },
  { value: 'ShopeePay', label: 'ShopeePay' },
  { value: 'LinkAja', label: 'LinkAja' },
  { value: 'iSaku', label: 'iSaku' },
  { value: 'DOKU', label: 'DOKU Wallet' },
  { value: 'Sakuku', label: 'Sakuku (BCA)' },
  { value: 'Akulaku', label: 'Akulaku' },
  { value: 'Kredivo', label: 'Kredivo' },
  { value: 'Lainnya', label: 'E-Wallet / Dompet Digital Lainnya' },
];

export const platformList = [
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Telegram', label: 'Telegram' },
  { value: 'SMS', label: 'SMS' },
  { value: 'Telepon', label: 'Telepon langsung' },
  { value: 'Email', label: 'Email' },
  { value: 'Instagram', label: 'Instagram' },
  { value: 'Facebook', label: 'Facebook' },
  { value: 'Facebook Marketplace', label: 'Facebook Marketplace' },
  { value: 'TikTok', label: 'TikTok' },
  { value: 'TikTok Shop', label: 'TikTok Shop' },
  { value: 'Twitter/X', label: 'Twitter / X' },
  { value: 'Tokopedia', label: 'Tokopedia' },
  { value: 'Shopee', label: 'Shopee' },
  { value: 'Lazada', label: 'Lazada' },
  { value: 'Bukalapak', label: 'Bukalapak' },
  { value: 'Blibli', label: 'Blibli' },
  { value: 'OLX', label: 'OLX / Jual Beli Online' },
  { value: 'Gojek', label: 'Gojek' },
  { value: 'Grab', label: 'Grab' },
  { value: 'Lainnya', label: 'Platform Lainnya' },
];

export const categoryList = [
  { value: 'Jual Beli Online', label: 'Jual Beli Online — barang tidak dikirim / tidak sesuai' },
  { value: 'Toko Online Palsu', label: 'Toko Online Palsu — website / akun penjual fiktif' },
  { value: 'Investasi Bodong', label: 'Investasi Bodong — janji untung besar tapi uang raib' },
  { value: 'Trading Palsu', label: 'Trading Palsu — platform forex / kripto / saham ilegal' },
  { value: 'Phishing / Soceng', label: 'Phishing / Soceng — minta OTP, PIN, atau data pribadi' },
  { value: 'Modus Kurir/APK', label: 'Modus Kurir / File APK — disuruh install aplikasi mencurigakan' },
  { value: 'Impersonasi', label: 'Impersonasi — pura-pura jadi pejabat, polisi, atau CS bank' },
  { value: 'Lowongan Kerja Palsu', label: 'Lowongan Kerja Palsu — minta uang pelatihan / seragam' },
  { value: 'Pinjaman Online', label: 'Pinjaman Online Ilegal — bunga mencekik / penagihan kasar' },
  { value: 'Penipuan Percintaan', label: 'Penipuan Percintaan — kenalan online lalu minta uang' },
  { value: 'Hadiah / Undian Palsu', label: 'Hadiah / Undian Palsu — minta bayar pajak hadiah duluan' },
  { value: 'Rental / Sewa Fiktif', label: 'Rental / Sewa Fiktif — kendaraan atau properti tidak ada' },
  { value: 'Lainnya', label: 'Lainnya' },
];

export const reportedToOptions = [
  { value: 'polisi', label: 'Polisi / Bareskrim' },
  { value: 'ojk', label: 'OJK (Otoritas Jasa Keuangan)' },
  { value: 'bi', label: 'Bank Indonesia (BI)' },
  { value: 'kominfo', label: 'Kominfo' },
  { value: 'platform', label: 'Platform terkait (Shopee, Tokopedia, dll)' },
  { value: 'bank', label: 'Bank / Penyedia Rekening terkait' },
  { value: 'belum', label: 'Belum lapor' },
];

export const provinsiList = [
  'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau',
  'Jambi', 'Bengkulu', 'Sumatera Selatan', 'Kepulauan Bangka Belitung',
  'Lampung', 'Banten', 'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah',
  'DI Yogyakarta', 'Jawa Timur', 'Bali', 'Nusa Tenggara Barat',
  'Nusa Tenggara Timur', 'Kalimantan Barat', 'Kalimantan Tengah',
  'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara',
  'Sulawesi Utara', 'Gorontalo', 'Sulawesi Tengah', 'Sulawesi Barat',
  'Sulawesi Selatan', 'Sulawesi Tenggara', 'Maluku', 'Maluku Utara',
  'Papua Barat', 'Papua Barat Daya', 'Papua', 'Papua Pegunungan',
  'Papua Selatan', 'Papua Tengah',
];
