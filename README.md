# CekNoScam MVP

Platform komunitas untuk mengecek dan melaporkan nomor telepon atau rekening terindikasi penipuan.

## Setup Environment Variables

Buat file `.env.local` dan isi dengan kredensial Supabase Anda:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Database Setup

Jalankan SQL script yang ada di `supabase/schema.sql` di SQL Editor dashboard Supabase Anda.

## Storage Setup

1. Buka dashboard Supabase.
2. Pergi ke menu **Storage**.
3. Buat bucket baru bernama `evidence`.
4. Pastikan bucket tersebut bersifat **Public**.

## Features

- **Cek Nomor:** Cari nomor HP atau rekening di halaman utama.
- **Laporan Komunitas:** Lihat riwayat laporan dan status (Verified/Pending).
- **Laporkan Penipuan:** Login untuk mengirim laporan baru beserta bukti screenshot.
- **Autentikasi:** Sistem login dan daftar menggunakan Supabase Auth.
