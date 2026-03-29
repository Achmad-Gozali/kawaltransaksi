-- ============================================
-- 📁 LOKASI: supabase/schema.sql
-- ✅ FIX:
--    1. Tambah kolom 'role' di profiles (sebelumnya MISSING)
--    2. Tambah RPC get_reports_admin (sebelumnya MISSING → admin panel broken)
--    3. Tambah RPC update_report_status (sebelumnya MISSING → approve/reject broken)
--    4. Fix RLS policy profiles — block user self-promote ke admin
--    5. Tambah admin update policy untuk reports
-- ============================================

-- =============================================
-- Profiles table
-- =============================================

create table if not exists profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  -- ✅ FIX: Kolom role WAJIB ada — sebelumnya missing dari schema
  -- tapi dipakai di admin layout, actions, dan middleware
  role text default 'user' check (role in ('user', 'admin', 'moderator')),

  constraint username_length check (char_length(username) >= 3)
);

-- Row Level Security
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using (true);

create policy "Users can insert their own profile."
  on profiles for insert
  with check ((select auth.uid()) = id);

-- ✅ FIX: User TIDAK bisa update kolom role sendiri
-- Sebelumnya policy lama bikin user bisa self-promote ke admin
create policy "Users can update own profile except role."
  on profiles for update
  using ((select auth.uid()) = id)
  with check (
    (select auth.uid()) = id
    -- Role harus tetap sama dengan yang ada di DB
    and role = (select p.role from profiles p where p.id = auth.uid())
  );

-- =============================================
-- Reports table
-- =============================================

do $$ begin
  create type target_type_enum as enum ('phone', 'bank_account');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type report_status_enum as enum ('pending', 'verified', 'rejected');
exception
  when duplicate_object then null;
end $$;

create table if not exists reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid references profiles(id) on delete set null,
  target_number text not null,
  target_name text,
  target_type target_type_enum not null,
  category text not null,
  chronology text not null,
  evidence_url text,
  status report_status_enum default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for faster queries
create index if not exists idx_reports_target_number on reports(target_number);
create index if not exists idx_reports_status on reports(status);
create index if not exists idx_reports_created_at on reports(created_at desc);
create index if not exists idx_reports_category on reports(category);
-- ✅ NEW: Index untuk dashboard user — query by reporter_id
create index if not exists idx_reports_reporter_id on reports(reporter_id);

-- Row Level Security for reports
alter table reports enable row level security;

create policy "Reports are viewable by everyone."
  on reports for select
  using (true);

create policy "Authenticated users can create reports."
  on reports for insert
  with check ((select auth.uid()) is not null);

create policy "Users can update their own reports if pending."
  on reports for update
  using (
    (select auth.uid()) = reporter_id
    and status = 'pending'
  );

-- ✅ NEW: Admin bisa update semua reports (untuk approve/reject)
create policy "Admins can update all reports."
  on reports for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- =============================================
-- RPC Functions
-- =============================================

-- ✅ get_category_counts — dipanggil di app/page.tsx (homepage)
create or replace function public.get_category_counts()
returns table(category text, count bigint)
language sql
security definer
as $$
  select category, count(*) as count
  from reports
  where status = 'verified'
  group by category
  order by count desc;
$$;

-- ✅ FIX: get_reports_admin — SEBELUMNYA MISSING
-- Dipanggil di app/admin/page.tsx untuk daftar laporan + email pelapor
create or replace function public.get_reports_admin()
returns table(
  id uuid,
  reporter_email text,
  target_number text,
  target_name text,
  target_type text,
  category text,
  chronology text,
  evidence_url text,
  status text,
  created_at timestamptz
)
language sql
security definer
as $$
  select
    r.id,
    coalesce(u.email, 'unknown') as reporter_email,
    r.target_number,
    r.target_name,
    r.target_type::text,
    r.category,
    r.chronology,
    r.evidence_url,
    r.status::text,
    r.created_at
  from reports r
  left join auth.users u on u.id = r.reporter_id
  order by r.created_at desc;
$$;

-- ✅ FIX: update_report_status — SEBELUMNYA MISSING
-- Dipanggil di app/admin/actions.ts untuk approve/reject laporan
create or replace function public.update_report_status(
  report_id uuid,
  new_status text
)
returns void
language plpgsql
security definer
as $$
begin
  -- Validasi status
  if new_status not in ('pending', 'verified', 'rejected') then
    raise exception 'Invalid status: %', new_status;
  end if;

  update reports
  set status = new_status::report_status_enum
  where id = report_id;

  if not found then
    raise exception 'Report not found: %', report_id;
  end if;
end;
$$;

-- ✅ NEW: update_user_role — untuk admin manage user roles
-- Lebih aman daripada direct update karena security definer
create or replace function public.update_user_role(
  target_user_id uuid,
  new_role text
)
returns void
language plpgsql
security definer
as $$
begin
  -- Validasi role
  if new_role not in ('user', 'admin', 'moderator') then
    raise exception 'Invalid role: %', new_role;
  end if;

  update profiles
  set role = new_role, updated_at = now()
  where id = target_user_id;

  if not found then
    raise exception 'User not found: %', target_user_id;
  end if;
end;
$$;

-- =============================================
-- Auto-create profile on signup
-- =============================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role, updated_at)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'user',
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- Storage bucket for evidence
-- =============================================

insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', true)
on conflict (id) do nothing;

create policy "Anyone can view evidence files."
  on storage.objects for select
  using (bucket_id = 'evidence');

create policy "Authenticated users can upload evidence."
  on storage.objects for insert
  with check (
    bucket_id = 'evidence'
    and (select auth.uid()) is not null
  );

create policy "Users can delete their own evidence."
  on storage.objects for delete
  using (
    bucket_id = 'evidence'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );