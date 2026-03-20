-- ============================================================
-- RE Manager — Initial Schema
-- Run this in your Supabase SQL editor to set up the database
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create type user_role as enum ('admin', 'team_member', 'read_only');
create type team_member_sub_role as enum (
  'personal_assistant',
  'transaction_manager',
  'social_media_manager',
  'video_editor'
);

create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text not null,
  role user_role not null default 'team_member',
  sub_role team_member_sub_role,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Auto-create profile on user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'team_member')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- CONTACTS (CRM)
-- ============================================================
create type contact_type as enum ('client', 'lender', 'realtor', 'contractor');

create table contacts (
  id uuid primary key default uuid_generate_v4(),
  type contact_type not null,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  company text,
  notes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TRANSACTIONS
-- ============================================================
create type transaction_type as enum ('buyer', 'seller');

create type buyer_stage as enum (
  'pre_approval',
  'buyers_agreement',
  'home_search',
  'under_contract',
  'closed'
);

create type seller_stage as enum (
  'listing_agreement_signed',
  'listing_photos_video',
  'live_on_market',
  'under_contract',
  'closed'
);

create type under_contract_sub_phase as enum (
  -- Shared
  'offer_accepted',
  'due_diligence',
  'home_inspection',
  'repair_requests',
  'appraisal',
  'closing',
  -- Buyer-specific
  'financing_contingency',
  'loan_approval',
  'final_walkthrough',
  -- Seller-specific
  'inspection_response',
  'repair_negotiation'
);

create table transactions (
  id uuid primary key default uuid_generate_v4(),
  type transaction_type not null,
  -- Stage stored as text to accommodate both buyer/seller enums
  stage text not null,
  under_contract_sub_phase under_contract_sub_phase,
  transaction_manager_id uuid references profiles(id) on delete set null,
  property_address text not null,
  under_contract_date date,
  closing_date date,
  due_diligence_days integer not null default 10,
  due_diligence_end_date date,
  notes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Buyer-specific details
create table buyer_details (
  id uuid primary key default uuid_generate_v4(),
  transaction_id uuid references transactions(id) on delete cascade unique,
  desired_locations text[],
  min_bedrooms integer,
  max_bedrooms integer,
  min_bathrooms numeric(3,1),
  max_bathrooms numeric(3,1),
  min_sqft integer,
  max_sqft integer,
  min_acreage numeric(8,2),
  max_acreage numeric(8,2),
  max_price numeric(12,2),
  additional_notes text
);

-- Seller-specific details
create table seller_details (
  id uuid primary key default uuid_generate_v4(),
  transaction_id uuid references transactions(id) on delete cascade unique,
  listing_price numeric(12,2),
  days_on_market integer default 0,
  listing_photos_uploaded boolean default false,
  listing_video_uploaded boolean default false,
  active_marketing_notes text,
  mls_number text
);

-- Transaction ↔ Contact relationships
create table transaction_contacts (
  id uuid primary key default uuid_generate_v4(),
  transaction_id uuid references transactions(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  role text not null, -- e.g. 'client', 'lender', 'sellers_agent'
  unique(transaction_id, contact_id)
);

-- ============================================================
-- TASKS
-- ============================================================
create type task_status as enum ('pending', 'in_progress', 'completed', 'needs_review');

create table tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  status task_status not null default 'pending',
  assigned_to uuid references profiles(id) on delete cascade,
  assigned_by uuid references profiles(id) on delete set null,
  transaction_id uuid references transactions(id) on delete cascade,
  due_date date,
  follow_up_date date,
  review_requested_from uuid references profiles(id) on delete set null,
  is_auto_assigned boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- FILES
-- ============================================================
create table files (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  transaction_id uuid references transactions(id) on delete cascade,
  task_id uuid references tasks(id) on delete cascade,
  folder text, -- e.g. 'social_media', 'listing_photos'
  uploaded_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create type notification_type as enum (
  'task_assigned',
  'task_due_soon',
  'task_overdue',
  'review_requested',
  'transaction_stage_changed',
  'general'
);

create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  read boolean not null default false,
  link text, -- in-app route to navigate to
  created_at timestamptz not null default now()
);

-- ============================================================
-- SOCIAL MEDIA
-- ============================================================
create type social_post_status as enum ('draft', 'scheduled', 'published', 'cancelled');
create type social_platform as enum ('instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'other');

create table social_posts (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  caption text,
  platform social_platform[],
  status social_post_status not null default 'draft',
  scheduled_at timestamptz,
  published_at timestamptz,
  created_by uuid references profiles(id) on delete set null,
  transaction_id uuid references transactions(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table contacts enable row level security;
alter table transactions enable row level security;
alter table buyer_details enable row level security;
alter table seller_details enable row level security;
alter table transaction_contacts enable row level security;
alter table tasks enable row level security;
alter table files enable row level security;
alter table notifications enable row level security;
alter table social_posts enable row level security;

-- Helper: get current user's role
create or replace function get_my_role()
returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql security definer stable;

-- Profiles: everyone can read, only admin can update others
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_update_own" on profiles for update using (id = auth.uid());
create policy "profiles_admin_all" on profiles for all using (get_my_role() = 'admin');

-- Contacts: team members and admin can CRUD, read_only can select
create policy "contacts_select" on contacts for select using (get_my_role() in ('admin', 'team_member', 'read_only'));
create policy "contacts_insert" on contacts for insert with check (get_my_role() in ('admin', 'team_member'));
create policy "contacts_update" on contacts for update using (get_my_role() in ('admin', 'team_member'));
create policy "contacts_delete" on contacts for delete using (get_my_role() = 'admin');

-- Transactions: team members and admin can CRUD, read_only can select
create policy "transactions_select" on transactions for select using (get_my_role() in ('admin', 'team_member', 'read_only'));
create policy "transactions_insert" on transactions for insert with check (get_my_role() in ('admin', 'team_member'));
create policy "transactions_update" on transactions for update using (get_my_role() in ('admin', 'team_member'));
create policy "transactions_delete" on transactions for delete using (get_my_role() = 'admin');

-- Buyer/seller details follow transactions
create policy "buyer_details_select" on buyer_details for select using (get_my_role() in ('admin', 'team_member', 'read_only'));
create policy "buyer_details_insert" on buyer_details for insert with check (get_my_role() in ('admin', 'team_member'));
create policy "buyer_details_update" on buyer_details for update using (get_my_role() in ('admin', 'team_member'));

create policy "seller_details_select" on seller_details for select using (get_my_role() in ('admin', 'team_member', 'read_only'));
create policy "seller_details_insert" on seller_details for insert with check (get_my_role() in ('admin', 'team_member'));
create policy "seller_details_update" on seller_details for update using (get_my_role() in ('admin', 'team_member'));

-- Transaction contacts
create policy "transaction_contacts_select" on transaction_contacts for select using (get_my_role() in ('admin', 'team_member', 'read_only'));
create policy "transaction_contacts_insert" on transaction_contacts for insert with check (get_my_role() in ('admin', 'team_member'));
create policy "transaction_contacts_delete" on transaction_contacts for delete using (get_my_role() in ('admin', 'team_member'));

-- Tasks: users see tasks assigned to or by them; admin sees all
create policy "tasks_select" on tasks for select using (
  get_my_role() = 'admin'
  or assigned_to = auth.uid()
  or assigned_by = auth.uid()
  or review_requested_from = auth.uid()
);
create policy "tasks_insert" on tasks for insert with check (get_my_role() in ('admin', 'team_member'));
create policy "tasks_update" on tasks for update using (
  get_my_role() = 'admin'
  or assigned_to = auth.uid()
  or assigned_by = auth.uid()
);
create policy "tasks_delete" on tasks for delete using (get_my_role() = 'admin');

-- Files: follow transaction/task access
create policy "files_select" on files for select using (get_my_role() in ('admin', 'team_member', 'read_only'));
create policy "files_insert" on files for insert with check (get_my_role() in ('admin', 'team_member'));
create policy "files_delete" on files for delete using (get_my_role() = 'admin');

-- Notifications: users see their own only
create policy "notifications_select" on notifications for select using (user_id = auth.uid());
create policy "notifications_update" on notifications for update using (user_id = auth.uid());

-- Social posts: team members and admin
create policy "social_select" on social_posts for select using (get_my_role() in ('admin', 'team_member'));
create policy "social_insert" on social_posts for insert with check (get_my_role() in ('admin', 'team_member'));
create policy "social_update" on social_posts for update using (get_my_role() in ('admin', 'team_member'));
create policy "social_delete" on social_posts for delete using (get_my_role() = 'admin');

-- ============================================================
-- updated_at triggers
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger transactions_updated_at before update on transactions
  for each row execute function update_updated_at();

create trigger tasks_updated_at before update on tasks
  for each row execute function update_updated_at();

create trigger social_posts_updated_at before update on social_posts
  for each row execute function update_updated_at();
