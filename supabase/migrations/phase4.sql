-- ============================================================
-- Phase 4: Email Logs + Storage Policies
-- Run this entire file in your Supabase SQL editor
-- ============================================================

-- Email log table
create table if not exists email_logs (
  id uuid primary key default uuid_generate_v4(),
  transaction_id uuid references transactions(id) on delete cascade,
  to_email text not null,
  to_name text,
  subject text not null,
  body text not null,
  template_used text,
  sent_by uuid references profiles(id) on delete set null,
  sent_at timestamptz not null default now()
);

alter table email_logs enable row level security;

create policy "email_logs_select" on email_logs
  for select using (get_my_role() in ('admin', 'team_member'));

create policy "email_logs_insert" on email_logs
  for insert with check (get_my_role() in ('admin', 'team_member'));

create policy "email_logs_delete" on email_logs
  for delete using (get_my_role() = 'admin');

-- ============================================================
-- Storage bucket policies for "transaction-files"
-- IMPORTANT: First create the bucket manually in:
--   Supabase Dashboard > Storage > New bucket
--   Name: transaction-files  |  Public: OFF
-- Then run the policies below:
-- ============================================================

create policy "files_storage_select"
  on storage.objects for select
  using (
    bucket_id = 'transaction-files'
    and (select role from public.profiles where id = auth.uid()) in ('admin', 'team_member', 'read_only')
  );

create policy "files_storage_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'transaction-files'
    and (select role from public.profiles where id = auth.uid()) in ('admin', 'team_member')
  );

create policy "files_storage_update"
  on storage.objects for update
  using (
    bucket_id = 'transaction-files'
    and (select role from public.profiles where id = auth.uid()) in ('admin', 'team_member')
  );

create policy "files_storage_delete"
  on storage.objects for delete
  using (
    bucket_id = 'transaction-files'
    and (select role from public.profiles where id = auth.uid()) = 'admin'
  );
