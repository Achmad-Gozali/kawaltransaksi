# KawalTransaksi

Platform verifikasi anti-penipuan untuk nomor HP, rekening bank, dan e-wallet di Indonesia.

## Stack

- **Frontend**: Next.js 16, TypeScript, Tailwind v4, shadcn/ui
- **Backend**: Fastify 5, Drizzle ORM, PostgreSQL 16
- **Auth**: JWT + argon2 + Google OAuth
- **Infra**: Docker Compose + Nginx

## Getting Started

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Struktur

```
app/
├── (auth)/       # login, register, reset password
├── (protected)/  # dashboard, profile
├── (public)/     # halaman publik
└── admin/        # admin panel

features/
├── admin/
├── auth/
├── check/
└── report/

core/
├── auth/
├── storage/
└── utils.ts
```