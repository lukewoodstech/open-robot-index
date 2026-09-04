-- Open Robot Index: Phase 1 schema
-- Apply in the Supabase SQL editor or with `supabase db push`.

create extension if not exists "pgcrypto";

-- Enums -------------------------------------------------------------------

create type robot_form as enum ('arm','bimanual','desktop','mobile_base','mobile_manipulator','quadruped','humanoid');
create type sdk_access as enum ('full','gated','none');
create type open_hardware as enum ('yes','partial','no');
create type lerobot_support as enum ('native','supported','compatible','community','none');
create type confidence as enum ('high','medium','verify');
create type image_kind as enum ('hero','gallery','logo');
create type news_category as enum ('price_change','new_sku','sdk_change','availability','new_open_source','funding','other');
create type news_status as enum ('draft','approved','rejected');
create type proposal_kind as enum ('new_robot','field_update','tier_update','news_item');
create type proposal_status as enum ('pending','approved','rejected');

-- Tables ------------------------------------------------------------------

create table companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  country     text,
  website     text,
  description text,
  logo_url    text,
  logo_source text,
  created_at  timestamptz not null default now()
);

create table sources (
  id           uuid primary key default gen_random_uuid(),
  url          text not null,
  title        text,
  publisher    text,
  retrieved_at date not null default current_date,
  quote        text check (quote is null or array_length(regexp_split_to_array(quote, '\s+'), 1) <= 15),
  created_at   timestamptz not null default now()
);

create table robots (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  name               text not null,
  company_id         uuid not null references companies(id) on delete restrict,
  form               robot_form not null,
  summary            text not null,
  sdk_access         sdk_access not null,
  sdk_note           text not null check (length(trim(sdk_note)) > 0),
  languages          text[] not null default '{}',
  access_level       text,
  open_hardware      open_hardware not null default 'no',
  open_hardware_note text,
  lerobot_support    lerobot_support not null default 'none',
  sim_support        text,
  availability       text,
  confidence         confidence not null default 'verify',
  confidence_note    text,
  dof                integer,
  payload_kg         numeric(6,2),
  height_cm          numeric(6,1),
  weight_kg          numeric(6,2),
  hero_image_id      uuid,
  last_checked       date not null default current_date,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  -- Verify rows must say what is contested.
  constraint verify_needs_note check (confidence <> 'verify' or (confidence_note is not null and length(trim(confidence_note)) > 0))
);

create index robots_company_idx on robots(company_id);
create index robots_form_idx on robots(form);
create index robots_sdk_idx on robots(sdk_access);

create table robot_tiers (
  id            uuid primary key default gen_random_uuid(),
  robot_id      uuid not null references robots(id) on delete cascade,
  tier_name     text not null,
  price_usd     numeric(10,2),
  price_note    text,
  currency_note text,
  includes_sdk  boolean not null default false,
  compute       text,
  source_id     uuid references sources(id) on delete set null,
  checked_at    date not null default current_date,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  unique (robot_id, tier_name)
);

create index robot_tiers_robot_idx on robot_tiers(robot_id);

create table images (
  id           uuid primary key default gen_random_uuid(),
  robot_id     uuid not null references robots(id) on delete cascade,
  url          text not null,
  storage_path text,
  source_url   text not null,
  attribution  text not null,
  kind         image_kind not null default 'gallery',
  created_at   timestamptz not null default now()
);

create index images_robot_idx on images(robot_id);

alter table robots
  add constraint robots_hero_image_fk foreign key (hero_image_id) references images(id) on delete set null;

-- Which sources back which robot (many-to-many, shown on the robot page).
create table robot_sources (
  robot_id  uuid not null references robots(id) on delete cascade,
  source_id uuid not null references sources(id) on delete cascade,
  field     text,
  primary key (robot_id, source_id)
);

create table news_items (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  summary      text not null,
  url          text not null,
  publisher    text,
  published_at date,
  category     news_category not null default 'other',
  robot_ids    uuid[] not null default '{}',
  company_ids  uuid[] not null default '{}',
  status       news_status not null default 'draft',
  created_at   timestamptz not null default now()
);

create index news_items_status_idx on news_items(status, published_at desc);

create table proposals (
  id           uuid primary key default gen_random_uuid(),
  kind         proposal_kind not null,
  target_table text,
  target_id    uuid,
  payload      jsonb not null,
  evidence     uuid[] not null default '{}',
  agent_notes  text,
  status       proposal_status not null default 'pending',
  created_at   timestamptz not null default now(),
  reviewed_at  timestamptz
);

create index proposals_status_idx on proposals(status, created_at desc);

-- updated_at trigger --------------------------------------------------------

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger robots_set_updated_at before update on robots
  for each row execute function set_updated_at();

-- Row level security ----------------------------------------------------------
-- Public site reads with the anon key. Only the service role (seed script,
-- admin actions in Phase 2, agents in Phase 3) can write. Agents write ONLY to
-- proposals; that is enforced in application code and by giving the agent jobs a
-- dedicated key in Phase 3.

alter table companies    enable row level security;
alter table sources      enable row level security;
alter table robots       enable row level security;
alter table robot_tiers  enable row level security;
alter table images       enable row level security;
alter table robot_sources enable row level security;
alter table news_items   enable row level security;
alter table proposals    enable row level security;

create policy "public read companies"    on companies    for select using (true);
create policy "public read sources"      on sources      for select using (true);
create policy "public read robots"       on robots       for select using (true);
create policy "public read robot_tiers"  on robot_tiers  for select using (true);
create policy "public read images"       on images       for select using (true);
create policy "public read robot_sources" on robot_sources for select using (true);
create policy "public read approved news" on news_items  for select using (status = 'approved');
-- proposals: no public policy at all. Service role bypasses RLS.
