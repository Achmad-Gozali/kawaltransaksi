export const MAX_EVIDENCE_FILES = 10;
export const MAX_TARGET_NUMBERS = 5;

export const STEPS = [
  { number: 1, label: 'Data Penipu' },
  { number: 2, label: 'Kronologi' },
  { number: 3, label: 'Bukti & Kirim' },
];

export const bankList = [
  // ── BANK PEMERINTAH (BUMN) ──
  { value: 'BRI',     label: 'BRI (Bank Rakyat Indonesia)' },
  { value: 'BNI',     label: 'BNI (Bank Negara Indonesia)' },
  { value: 'Mandiri', label: 'Bank Mandiri' },
  { value: 'BTN',     label: 'BTN (Bank Tabungan Negara)' },

  // ── BANK SWASTA NASIONAL BESAR ──
  { value: 'BCA',         label: 'BCA (Bank Central Asia)' },
  { value: 'CIMB Niaga',  label: 'CIMB Niaga' },
  { value: 'Danamon',     label: 'Bank Danamon' },
  { value: 'Permata',     label: 'Bank Permata' },
  { value: 'Panin',       label: 'Bank Panin' },
  { value: 'Mega',        label: 'Bank Mega' },
  { value: 'Maybank',     label: 'Maybank Indonesia' },
  { value: 'OCBC',        label: 'OCBC Indonesia' },
  { value: 'Sinarmas',    label: 'Bank Sinarmas' },
  { value: 'BTPN',        label: 'Bank BTPN (Jenius)' },
  { value: 'Bukopin',     label: 'Bank KB Bukopin' },
  { value: 'MNC Bank',    label: 'MNC Bank (Motion)' },
  { value: 'Mestika',     label: 'Bank Mestika Dharma' },
  { value: 'Sampoerna',   label: 'Bank Sahabat Sampoerna' },
  { value: 'UOB',         label: 'UOB Indonesia' },
  { value: 'HSBC',        label: 'HSBC Indonesia' },
  { value: 'Standard Chartered', label: 'Standard Chartered Indonesia' },
  { value: 'Citibank',    label: 'Citibank Indonesia' },
  { value: 'Commonwealth', label: 'Commonwealth Bank Indonesia' },

  // ── BANK SYARIAH ──
  { value: 'BSI',              label: 'BSI (Bank Syariah Indonesia)' },
  { value: 'Muamalat',         label: 'Bank Muamalat Indonesia' },
  { value: 'Panin Dubai Syariah', label: 'Bank Panin Dubai Syariah' },
  { value: 'BTPN Syariah',     label: 'BTPN Syariah' },
  { value: 'Mega Syariah',     label: 'Bank Mega Syariah' },
  { value: 'BCA Syariah',      label: 'BCA Syariah' },
  { value: 'Bukopin Syariah',  label: 'Bank KB Bukopin Syariah' },
  { value: 'Aladin Syariah',   label: 'Bank Aladin Syariah' },

  // ── BANK DIGITAL ──
  { value: 'Seabank',      label: 'SeaBank Indonesia' },
  { value: 'Jago',         label: 'Bank Jago' },
  { value: 'Blu BCA',      label: 'blu by BCA Digital' },
  { value: 'Allo Bank',    label: 'Allo Bank' },
  { value: 'Neo Commerce', label: 'Bank Neo Commerce (BNC)' },
  { value: 'Amar',         label: 'Bank Amar (Tunaiku)' },
  { value: 'LINE Bank',    label: 'LINE Bank (Hana Bank)' },
  { value: 'TMRW',         label: 'TMRW by UOB' },
  { value: 'Superbank',    label: 'Superbank' },

  // ── BANK PEMBANGUNAN DAERAH (BPD) ──
  { value: 'Bank Aceh',       label: 'Bank Aceh Syariah' },
  { value: 'Bank Sumut',      label: 'Bank Sumut' },
  { value: 'Bank Nagari',     label: 'Bank Nagari (Sumbar)' },
  { value: 'Bank Riau Kepri', label: 'Bank Riau Kepri Syariah' },
  { value: 'Bank Jambi',      label: 'Bank Jambi' },
  { value: 'Bank Sumsel Babel', label: 'Bank Sumsel Babel' },
  { value: 'Bank Lampung',    label: 'Bank Lampung' },
  { value: 'Bank Bengkulu',   label: 'Bank Bengkulu' },
  { value: 'BJB',             label: 'BJB (Bank Jabar Banten)' },
  { value: 'BJB Syariah',     label: 'BJB Syariah' },
  { value: 'BPD Banten',      label: 'Bank Banten' },
  { value: 'Bank DKI',        label: 'Bank DKI' },
  { value: 'BPD DIY',         label: 'BPD DIY (Bank BPD DIY)' },
  { value: 'Bank Jateng',     label: 'Bank Jateng' },
  { value: 'Bank Jatim',      label: 'Bank Jatim' },
  { value: 'Bank Kalbar',     label: 'Bank Kalbar' },
  { value: 'Bank Kalsel',     label: 'Bank Kalsel' },
  { value: 'Bank Kalteng',    label: 'Bank Kalteng' },
  { value: 'Bank Kaltimtara', label: 'Bank Kaltimtara' },
  { value: 'Bank Sulselbar',  label: 'Bank Sulselbar' },
  { value: 'Bank Sulteng',    label: 'Bank Sulteng' },
  { value: 'Bank Sultenggara', label: 'Bank Sultra (Sultenggara)' },
  { value: 'Bank Sulut Go',   label: 'Bank SulutGo' },
  { value: 'Bank Maluku Malut', label: 'Bank Maluku Malut' },
  { value: 'Bank NTB Syariah', label: 'Bank NTB Syariah' },
  { value: 'Bank NTT',        label: 'Bank NTT' },
  { value: 'Bank Papua',      label: 'Bank Papua' },
  { value: 'BPD Bali',        label: 'BPD Bali' },

  // ── LAINNYA ──
  { value: 'Lainnya', label: 'Bank Lainnya' },
];

export const ewalletList = [
  // ── POPULER ──
  { value: 'GoPay',     label: 'GoPay' },
  { value: 'Dana',      label: 'DANA' },
  { value: 'OVO',       label: 'OVO' },
  { value: 'ShopeePay', label: 'ShopeePay' },
  { value: 'LinkAja',   label: 'LinkAja' },

  // ── RITEL ──
  { value: 'iSaku',     label: 'iSaku' },
  { value: 'Sakuku',    label: 'Sakuku' },
  { value: 'SpeedCash', label: 'SpeedCash' },
  { value: 'Virgo',     label: 'Virgo' },

  // ── FINTECH ──
  { value: 'DOKU',      label: 'DOKU Wallet' },
  { value: 'AstraPay',  label: 'AstraPay' },
  { value: 'Netzme',    label: 'Netzme' },
  { value: 'Flip',      label: 'Flip' },
  { value: 'TrueMoney', label: 'TrueMoney' },
  { value: 'Paytren',   label: 'PayTren' },
  { value: 'Wokee',     label: 'Wokee' },

  // ── PAYLATER ──
  { value: 'Akulaku',   label: 'Akulaku' },
  { value: 'Kredivo',   label: 'Kredivo' },
  { value: 'Indodana',  label: 'Indodana' },
  { value: 'Cicil',     label: 'Cicil' },

  // ── LAINNYA ──
  { value: 'Lainnya',   label: 'E-Wallet / Dompet Digital Lainnya' },
];

export const platformList = [
  // ── PESAN & KOMUNIKASI ──
  { value: 'WhatsApp',  label: 'WhatsApp' },
  { value: 'Telegram',  label: 'Telegram' },
  { value: 'SMS',       label: 'SMS' },
  { value: 'Telepon',   label: 'Telepon langsung' },
  { value: 'Email',     label: 'Email' },
  { value: 'Line',      label: 'LINE' },
  { value: 'Messenger', label: 'Facebook Messenger' },

  // ── MEDIA SOSIAL ──
  { value: 'Instagram', label: 'Instagram' },
  { value: 'Facebook',  label: 'Facebook' },
  { value: 'TikTok',    label: 'TikTok' },
  { value: 'Twitter/X', label: 'Twitter / X' },
  { value: 'YouTube',   label: 'YouTube' },
  { value: 'Pinterest', label: 'Pinterest' },
  { value: 'LinkedIn',  label: 'LinkedIn' },
  { value: 'Threads',   label: 'Threads' },
  { value: 'Discord',   label: 'Discord' },
  { value: 'Snapchat',  label: 'Snapchat' },

  // ── MARKETPLACE / E-COMMERCE ──
  { value: 'Facebook Marketplace', label: 'Facebook Marketplace' },
  { value: 'TikTok Shop',          label: 'TikTok Shop' },
  { value: 'Tokopedia',            label: 'Tokopedia' },
  { value: 'Shopee',               label: 'Shopee' },
  { value: 'Lazada',               label: 'Lazada' },
  { value: 'Bukalapak',            label: 'Bukalapak' },
  { value: 'Blibli',               label: 'Blibli' },
  { value: 'Zalora',               label: 'Zalora' },
  { value: 'Orami',                label: 'Orami' },
  { value: 'OLX',                  label: 'OLX' },
  { value: 'Carousell',            label: 'Carousell' },
  { value: 'Kaskus FJB',           label: 'Kaskus (Forum Jual Beli)' },

  // ── TRANSPORTASI & OJOL ──
  { value: 'Gojek',   label: 'Gojek' },
  { value: 'Grab',    label: 'Grab' },
  { value: 'Maxim',   label: 'Maxim' },
  { value: 'InDrive', label: 'inDrive' },

  // ── WEBSITE / LAINNYA ──
  { value: 'Website Pribadi', label: 'Website / Toko Online Pribadi' },
  { value: 'Lainnya',         label: 'Platform Lainnya' },
];

export const categoryList = [
  // ── JUAL BELI & TRANSAKSI ──
  { value: 'Jual Beli Online',       label: 'Jual Beli Online' },
  { value: 'Toko Online Palsu',      label: 'Toko Online Palsu' },
  { value: 'Rekber Palsu',           label: 'Rekber / Escrow Palsu' },
  { value: 'Tiket Palsu',            label: 'Tiket Palsu' },
  { value: 'Rental / Sewa Fiktif',   label: 'Rental / Sewa Fiktif' },
  { value: 'Jasa Tidak Terbayar',    label: 'Jasa Tidak Terbayar' },
  { value: 'COD Bermasalah',         label: 'COD Bermasalah' },

  // ── INVESTASI & KEUANGAN ──
  { value: 'Investasi Bodong',       label: 'Investasi Bodong' },
  { value: 'Trading Palsu',          label: 'Trading Palsu' },
  { value: 'Pig Butchering',         label: 'Pig Butchering' },
  { value: 'Arisan Berantai',        label: 'Arisan Berantai / Ponzi' },
  { value: 'Pinjaman Online',        label: 'Pinjaman Online Ilegal' },
  { value: 'Gesek Tunai',            label: 'Gesek Tunai / Kartu Kredit' },
  { value: 'Money Game',             label: 'Money Game / MLM Ilegal' },

  // ── PENCURIAN AKUN & DATA ──
  { value: 'Phishing / Soceng',      label: 'Phishing / Soceng' },
  { value: 'Modus Kurir/APK',        label: 'Modus Kurir / APK Berbahaya' },
  { value: 'SIM Swap',               label: 'SIM Swap / Pembajakan Nomor' },
  { value: 'Skimming',               label: 'Skimming / Pembobolan Rekening' },
  { value: 'Pencurian Akun',         label: 'Pencurian Akun Medsos / Game' },
  { value: 'QR Code Palsu',          label: 'QR Code Palsu' },
  { value: 'Pencurian Data',         label: 'Pencurian Data Pribadi / KTP' },

  // ── PENIPUAN IDENTITAS ──
  { value: 'Impersonasi',            label: 'Impersonasi Pejabat / CS Bank' },
  { value: 'Deepfake',               label: 'Deepfake / Kloning Suara AI' },
  { value: 'Penipuan Bansos',        label: 'Penipuan Berkedok Bansos' },
  { value: 'Penipuan Pajak',         label: 'Penipuan Berkedok Pajak / Bea Cukai' },
  { value: 'Penipuan Keluarga',      label: 'Pura-pura Keluarga / Kecelakaan' },

  // ── MANIPULASI SOSIAL ──
  { value: 'Penipuan Percintaan',    label: 'Penipuan Percintaan' },
  { value: 'Hadiah / Undian Palsu',  label: 'Hadiah / Undian Palsu' },
  { value: 'Donasi Palsu',           label: 'Donasi / Penggalangan Dana Palsu' },
  { value: 'Pemerasan / Ancaman',    label: 'Pemerasan / Ancaman' },
  { value: 'Konten Asusila',         label: 'Pemerasan Konten Asusila' },

  // ── PEKERJAAN & BISNIS ──
  { value: 'Lowongan Kerja Palsu',   label: 'Lowongan Kerja Palsu / TPPO' },
  { value: 'Kerja Freelance Palsu',  label: 'Kerja Freelance Palsu' },
  { value: 'Joki / Boosting Palsu',  label: 'Joki / Boosting Game Palsu' },
  { value: 'Endorse Palsu',          label: 'Endorse / Paid Promote Palsu' },
  { value: 'Waralaba Palsu',         label: 'Waralaba / Franchise Palsu' },

  // ── LAINNYA ──
  { value: 'Lainnya',                label: 'Lainnya' },
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
