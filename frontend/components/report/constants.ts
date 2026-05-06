export const MAX_EVIDENCE_FILES = 10;
export const MAX_TARGET_NUMBERS = 5;

export const STEPS = [
  { number: 1, label: 'Data Penipu' },
  { number: 2, label: 'Kronologi' },
  { number: 3, label: 'Bukti & Kirim' },
];

export const bankList = [
  // ── BANK PEMERINTAH (BUMN) ──
  { value: 'BRI', label: 'BRI (Bank Rakyat Indonesia)' },
  { value: 'BNI', label: 'BNI (Bank Negara Indonesia)' },
  { value: 'Mandiri', label: 'Bank Mandiri' },
  { value: 'BTN', label: 'BTN (Bank Tabungan Negara)' },
  { value: 'BSI', label: 'BSI (Bank Syariah Indonesia)' },

  // ── BANK SWASTA NASIONAL ──
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
  { value: 'Mayapada', label: 'Bank Mayapada' },
  { value: 'Artha Graha', label: 'Bank Artha Graha Internasional' },
  { value: 'Bumi Arta', label: 'Bank Bumi Arta' },
  { value: 'Capital', label: 'Bank Capital Indonesia' },
  { value: 'Maspion', label: 'Bank Maspion' },
  { value: 'MNC Bank', label: 'MNC Bank (Motion Banking)' },
  { value: 'Nationalnobu', label: 'Bank Nationalnobu' },
  { value: 'OKE Bank', label: 'OKE Bank' },
  { value: 'Sahabat Sampoerna', label: 'Bank Sahabat Sampoerna' },
  { value: 'Victoria', label: 'Bank Victoria International' },
  { value: 'Woori Saudara', label: 'Bank Woori Saudara' },
  { value: 'Shinhan', label: 'Bank Shinhan Indonesia' },
  { value: 'Hana', label: 'Bank KEB Hana Indonesia' },

  // ── BANK ASING ──
  { value: 'HSBC', label: 'HSBC Indonesia' },
  { value: 'Standard Chartered', label: 'Standard Chartered Indonesia' },
  { value: 'Citibank', label: 'Citibank Indonesia' },
  { value: 'Deutsche Bank', label: 'Deutsche Bank Indonesia' },
  { value: 'Bangkok Bank', label: 'Bangkok Bank Indonesia' },
  { value: 'Bank of China', label: 'Bank of China Indonesia' },
  { value: 'BNP Paribas', label: 'BNP Paribas Indonesia' },
  { value: 'ICBC Indonesia', label: 'ICBC Indonesia' },
  { value: 'UOB', label: 'UOB Indonesia' },

  // ── BANK DIGITAL ──
  { value: 'Jago', label: 'Bank Jago' },
  { value: 'Blu BCA', label: 'Blu by BCA Digital' },
  { value: 'Seabank', label: 'SeaBank Indonesia' },
  { value: 'Neo Commerce', label: 'Bank Neo Commerce' },
  { value: 'Allo Bank', label: 'Allo Bank' },
  { value: 'Superbank', label: 'Superbank' },
  { value: 'Aladin', label: 'Bank Aladin Syariah' },
  { value: 'Line Bank', label: 'LINE Bank (by Hana Bank)' },
  { value: 'Amar Bank', label: 'Amar Bank (Tunaiku)' },
  { value: 'TMRW', label: 'TMRW by UOB' },

  // ── BANK PEMBANGUNAN DAERAH (BPD) ──
  { value: 'BJB', label: 'BJB (Bank Jabar Banten)' },
  { value: 'Bank DKI', label: 'Bank DKI' },
  { value: 'BPD DIY', label: 'BPD DIY (Bank BPD DIY)' },
  { value: 'BPD Jateng', label: 'BPD Jawa Tengah (Bank Jateng)' },
  { value: 'BPD Jatim', label: 'BPD Jawa Timur (Bank Jatim)' },
  { value: 'BPD Bali', label: 'BPD Bali' },
  { value: 'BPD Aceh', label: 'BPD Aceh (Bank Aceh Syariah)' },
  { value: 'BPD Sumut', label: 'BPD Sumatera Utara (Bank Sumut)' },
  { value: 'BPD Sumbar', label: 'BPD Sumatera Barat (Bank Nagari)' },
  { value: 'BPD Sumsel Babel', label: 'BPD Sumsel Babel' },
  { value: 'BPD Riau Kepri', label: 'BPD Riau Kepri' },
  { value: 'BPD Jambi', label: 'BPD Jambi (Bank Jambi)' },
  { value: 'BPD Bengkulu', label: 'BPD Bengkulu (Bank Bengkulu)' },
  { value: 'BPD Lampung', label: 'BPD Lampung (Bank Lampung)' },
  { value: 'BPD Kalbar', label: 'BPD Kalimantan Barat (Bank Kalbar)' },
  { value: 'BPD Kalteng', label: 'BPD Kalimantan Tengah (Bank Kalteng)' },
  { value: 'BPD Kalsel', label: 'BPD Kalimantan Selatan (Bank Kalsel)' },
  { value: 'BPD Kaltimtara', label: 'BPD Kalimantan Timur & Utara (Bankaltimtara)' },
  { value: 'BPD SulutGo', label: 'BPD Sulawesi Utara & Gorontalo (Bank SulutGo)' },
  { value: 'BPD Sulteng', label: 'BPD Sulawesi Tengah (Bank Sulteng)' },
  { value: 'BPD Sulselbar', label: 'BPD Sulawesi Selatan & Barat (Bank Sulselbar)' },
  { value: 'BPD Sultra', label: 'BPD Sulawesi Tenggara (Bank Sultra)' },
  { value: 'BPD Maluku Malut', label: 'BPD Maluku & Maluku Utara (Bank Maluku Malut)' },
  { value: 'BPD Papua', label: 'BPD Papua (Bank Papua)' },
  { value: 'BPD NTB', label: 'BPD NTB Syariah' },
  { value: 'BPD NTT', label: 'BPD Nusa Tenggara Timur (Bank NTT)' },
  { value: 'Bank Banten', label: 'Bank Banten' },

  { value: 'Lainnya', label: 'Bank Lainnya' },
];

export const ewalletList = [
  // ── E-WALLET UTAMA ──
  { value: 'GoPay', label: 'GoPay' },
  { value: 'Dana', label: 'DANA' },
  { value: 'OVO', label: 'OVO' },
  { value: 'ShopeePay', label: 'ShopeePay' },
  { value: 'LinkAja', label: 'LinkAja' },

  // ── E-WALLET LAINNYA ──
  { value: 'iSaku', label: 'iSaku' },
  { value: 'DOKU', label: 'DOKU Wallet' },
  { value: 'Sakuku', label: 'Sakuku (BCA)' },
  { value: 'TrueMoney', label: 'TrueMoney' },
  { value: 'Flip', label: 'Flip' },
  { value: 'Jenius Pay', label: 'Jenius Pay (BTPN)' },
  { value: 'Jago Pay', label: 'Jago Pay (Bank Jago)' },
  { value: 'SpeedCash', label: 'SpeedCash' },
  { value: 'Cashlez', label: 'Cashlez' },
  { value: 'Netzme', label: 'Netzme' },

  // ── PAYLATER / PINJAMAN DIGITAL ──
  { value: 'PayLater Shopee', label: 'PayLater Shopee' },
  { value: 'PayLater Tokopedia', label: 'PayLater Tokopedia' },
  { value: 'GoPay Later', label: 'GoPay Later' },
  { value: 'Akulaku', label: 'Akulaku' },
  { value: 'Kredivo', label: 'Kredivo' },
  { value: 'Indodana', label: 'Indodana PayLater' },
  { value: 'Atome', label: 'Atome' },
  { value: 'Julo', label: 'Julo' },
  { value: 'Cicil', label: 'Cicil' },

  // ── DOMPET KRIPTO / ASET DIGITAL ──
  { value: 'Pintu', label: 'Pintu' },
  { value: 'Indodax', label: 'Indodax' },
  { value: 'Tokocrypto', label: 'Tokocrypto' },
  { value: 'Reku', label: 'Reku' },

  { value: 'Lainnya', label: 'E-Wallet / Dompet Digital Lainnya' },
];

export const platformList = [
  // ── PESAN & KOMUNIKASI ──
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Telegram', label: 'Telegram' },
  { value: 'SMS', label: 'SMS' },
  { value: 'Telepon', label: 'Telepon langsung' },
  { value: 'Email', label: 'Email' },
  { value: 'Line', label: 'LINE' },
  { value: 'Signal', label: 'Signal' },
  { value: 'WeChat', label: 'WeChat' },

  // ── MEDIA SOSIAL ──
  { value: 'Instagram', label: 'Instagram' },
  { value: 'Facebook', label: 'Facebook' },
  { value: 'Facebook Marketplace', label: 'Facebook Marketplace' },
  { value: 'TikTok', label: 'TikTok' },
  { value: 'TikTok Shop', label: 'TikTok Shop' },
  { value: 'Twitter/X', label: 'Twitter / X' },
  { value: 'YouTube', label: 'YouTube' },
  { value: 'LinkedIn', label: 'LinkedIn' },
  { value: 'Pinterest', label: 'Pinterest' },
  { value: 'Threads', label: 'Threads' },
  { value: 'Snapchat', label: 'Snapchat' },

  // ── E-COMMERCE ──
  { value: 'Tokopedia', label: 'Tokopedia' },
  { value: 'Shopee', label: 'Shopee' },
  { value: 'Lazada', label: 'Lazada' },
  { value: 'Bukalapak', label: 'Bukalapak' },
  { value: 'Blibli', label: 'Blibli' },
  { value: 'Zalora', label: 'Zalora' },
  { value: 'JD.ID', label: 'JD.ID' },
  { value: 'OLX', label: 'OLX / Jual Beli Online' },
  { value: 'Carousell', label: 'Carousell' },

  // ── APLIKASI OJEK / LAYANAN ──
  { value: 'Gojek', label: 'Gojek' },
  { value: 'Grab', label: 'Grab' },
  { value: 'Maxim', label: 'Maxim' },
  { value: 'inDrive', label: 'inDrive' },
  { value: 'Airbnb', label: 'Airbnb' },
  { value: 'Traveloka', label: 'Traveloka' },
  { value: 'Tiket.com', label: 'Tiket.com' },

  // ── WEBSITE / LAINNYA ──
  { value: 'Website', label: 'Website / Toko Online' },
  { value: 'Discord', label: 'Discord' },
  { value: 'Forum Online', label: 'Forum Online (Kaskus, Reddit, dll)' },
  { value: 'Aplikasi Kencan', label: 'Aplikasi Kencan (Tinder, Bumble, dll)' },
  { value: 'Game Online', label: 'Game Online / Platform Gaming' },
  { value: 'Lainnya', label: 'Platform Lainnya' },
];

export const categoryList = [
  // ── PENIPUAN BELANJA ──
  { value: 'Jual Beli Online', label: 'Jual Beli Online — barang tidak dikirim / tidak sesuai' },
  { value: 'Toko Online Palsu', label: 'Toko Online Palsu — website / akun penjual fiktif' },
  { value: 'Barang Tidak Sesuai', label: 'Barang Tidak Sesuai — produk berbeda dari yang dijanjikan' },
  { value: 'COD Palsu', label: 'COD Palsu — paket berisi barang tidak sesuai / sampah' },
  { value: 'Dropship Fiktif', label: 'Dropship / Reseller Fiktif — uang masuk tapi barang tidak ada' },

  // ── PENIPUAN INVESTASI & KEUANGAN ──
  { value: 'Investasi Bodong', label: 'Investasi Bodong — janji untung besar tapi uang raib' },
  { value: 'Trading Palsu', label: 'Trading Palsu — platform forex / kripto / saham ilegal' },
  { value: 'Arisan Online', label: 'Arisan Online Fiktif — uang arisan tidak dibayar' },
  { value: 'Pinjaman Online', label: 'Pinjaman Online Ilegal — bunga mencekik / penagihan kasar' },
  { value: 'Koperasi Bodong', label: 'Koperasi / Simpan Pinjam Bodong' },
  { value: 'Binary Option', label: 'Binary Option Ilegal' },
  { value: 'Kripto Palsu', label: 'Kripto / NFT Palsu — token atau proyek fiktif' },
  { value: 'Money Game', label: 'Money Game / Skema Ponzi' },
  { value: 'MLM Ilegal', label: 'MLM Ilegal — rekrut anggota berkedok investasi' },

  // ── PENIPUAN IDENTITAS & DATA ──
  { value: 'Phishing / Soceng', label: 'Phishing / Soceng — minta OTP, PIN, atau data pribadi' },
  { value: 'Modus Kurir/APK', label: 'Modus Kurir / File APK — disuruh install aplikasi mencurigakan' },
  { value: 'Impersonasi', label: 'Impersonasi — pura-pura jadi pejabat, polisi, atau CS bank' },
  { value: 'SIM Swap', label: 'SIM Swap — nomor HP diambil alih untuk akses akun' },
  { value: 'Pencurian Data', label: 'Pencurian Data Pribadi — KTP, foto selfie, dll disalahgunakan' },

  // ── PENIPUAN JASA & PEKERJAAN ──
  { value: 'Lowongan Kerja Palsu', label: 'Lowongan Kerja Palsu — minta uang pelatihan / seragam' },
  { value: 'Jasa Tidak Dikerjakan', label: 'Jasa Tidak Dikerjakan — sudah bayar tapi tidak ada hasilnya' },
  { value: 'Freelance Palsu', label: 'Freelance Palsu — klien kabur setelah pekerjaan selesai' },
  { value: 'Kerja Online Palsu', label: 'Kerja Online Palsu — like, follow, klik iklan berujung tipu' },
  { value: 'Joki / Titip Beli Palsu', label: 'Joki / Titip Beli Palsu — uang dikirim tapi tidak ada hasilnya' },

  // ── PENIPUAN RENTAL & PROPERTI ──
  { value: 'Rental / Sewa Fiktif', label: 'Rental / Sewa Fiktif — kendaraan atau properti tidak ada' },
  { value: 'Kos / Kontrakan Palsu', label: 'Kos / Kontrakan Palsu — iklan properti fiktif' },
  { value: 'Tiket Palsu', label: 'Tiket Palsu — tiket konser, pesawat, atau event tidak valid' },

  // ── PENIPUAN SOSIAL ──
  { value: 'Penipuan Percintaan', label: 'Penipuan Percintaan — kenalan online lalu minta uang' },
  { value: 'Pinjam Uang Tidak Bayar', label: 'Pinjam Uang Tidak Bayar — kenalan / teman online kabur' },
  { value: 'Hadiah / Undian Palsu', label: 'Hadiah / Undian Palsu — minta bayar pajak hadiah duluan' },
  { value: 'Donasi Palsu', label: 'Donasi / Galang Dana Palsu — penggalangan dana fiktif' },
  { value: 'Pura-pura Kecelakaan', label: 'Pura-pura Kecelakaan / Musibah — minta transfer darurat' },
  { value: 'Penipuan Umroh/Haji', label: 'Penipuan Umroh / Haji — travel ilegal, uang raib' },

  { value: 'Lainnya', label: 'Lainnya' },
];

export const reportedToOptions = [
  { value: 'polisi', label: 'Polisi / Bareskrim' },
  { value: 'ojk', label: 'OJK (Otoritas Jasa Keuangan)' },
  { value: 'bi', label: 'Bank Indonesia (BI)' },
  { value: 'kominfo', label: 'Kominfo' },
  { value: 'bssn', label: 'BSSN (Badan Siber dan Sandi Negara)' },
  { value: 'platform', label: 'Platform terkait (Shopee, Tokopedia, dll)' },
  { value: 'bank', label: 'Bank / Penyedia Rekening terkait' },
  { value: 'ylki', label: 'YLKI (Yayasan Lembaga Konsumen Indonesia)' },
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