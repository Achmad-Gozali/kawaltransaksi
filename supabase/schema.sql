-- ============================================
-- 📁 LOKASI: supabase/schema.sql
-- ============================================

-- Create a table for public profiles
create table if not exists profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,

  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using (true);

create policy "Users can insert their own profile."
  on profiles for insert
  with check ((select auth.uid()) = id);

create policy "Users can update own profile."
  on profiles for update
  using ((select auth.uid()) = id);

-- ============================================
-- Reports table
-- ============================================

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

-- ============================================
-- ✅ FIX: RPC get_category_counts — dipanggil di app/page.tsx
-- Sebelumnya MISSING dari schema → runtime error
-- ============================================

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

-- ============================================
-- Auto-create profile on signup
-- ============================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- Storage bucket for evidence
-- ============================================

insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', true)
on conflict (id) do nothing;

-- Storage policies
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