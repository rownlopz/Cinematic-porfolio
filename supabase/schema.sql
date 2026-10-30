-- =====================================================================
-- Cinematic Portfolio — Supabase schema, RLS policies, storage
-- Run the whole file once in: Supabase Dashboard > SQL Editor > New query
-- Safe to re-run (idempotent where practical).
-- =====================================================================

-- ---------- Admin allow-list ----------
-- Only users listed here can write content. Add yourself AFTER creating your auth user
-- (see README step 3):  insert into public.admin_users (user_id) values ('<your auth user uuid>');
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

-- An admin may read the allow-list (to confirm their own access); nobody can write it via the API.
drop policy if exists "admins read admin_users" on public.admin_users;
create policy "admins read admin_users" on public.admin_users
  for select to authenticated using (public.is_admin());

-- ---------- updated_at helper ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- Site settings (single row, id = 1) ----------
create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  -- identity / hero
  display_name text not null default 'YOUR NAME',
  hero_headline text not null default 'EDITING REALITY. DESIGNING THE UNSEEN.',
  hero_subline text not null default 'Video editing, motion design, and AI-powered visuals built to make ideas impossible to ignore.',
  hero_skills text[] not null default array['AFTER EFFECTS','PREMIERE PRO','AI VIDEO','MOTION DESIGN'],
  roles text[] not null default array['Video Editor','Motion Graphics Designer','Filmmaker','AI Video Creator','Creative Visual Storyteller'],
  portrait_url text,
  hero_bg_url text,
  -- about
  about_heading text not null default 'CREATIVE EDITOR / VISUAL STORYTELLER',
  about_body text not null default 'I''m a creative editor and visual storyteller working at the intersection of editing, motion design, and AI-powered filmmaking. I turn ideas into visual experiences through rhythm, movement, and creative experimentation.',
  about_skills text[] not null default array['Adobe After Effects','Adobe Premiere Pro','AI-assisted creative production','Motion graphics','Cinematic editing','Visual storytelling'],
  about_image_url text,
  location text,
  -- showreel
  showreel_url text,            -- YouTube / Vimeo / direct file URL
  showreel_poster_url text,
  showreel_title text not null default 'SHOWREEL',
  -- AI section
  ai_title text not null default 'THE NEW CREATIVE PIPELINE.',
  ai_body text not null default 'Conventional editing, motion graphics and generative AI working together: AI helps develop concepts and raw visuals, then editing and motion design give them rhythm, polish and a point of view.',
  pipeline_steps text[] not null default array['IDEA','SCRIPT','VISUAL DEVELOPMENT','AI GENERATION','EDITING','MOTION DESIGN','FINAL DELIVERY'],
  -- contact
  contact_headline text not null default 'HAVE AN IDEA? LET''S MAKE IT IMPOSSIBLE TO IGNORE.',
  contact_email text,
  social_links jsonb not null default '[]'::jsonb,   -- [{"label":"Instagram","url":"https://..."}]
  -- SEO
  seo_title text,
  seo_description text,
  og_image_url text,
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values (1) on conflict (id) do nothing;
drop trigger if exists trg_settings_touch on public.site_settings;
create trigger trg_settings_touch before update on public.site_settings
  for each row execute function public.touch_updated_at();

-- ---------- Categories ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  sort_order int not null default 0
);
insert into public.categories (name, slug, sort_order) values
  ('Video Editing','video-editing',1),
  ('Motion Graphics','motion-graphics',2),
  ('AI Video','ai-video',3),
  ('Filmmaking','filmmaking',4),
  ('Visual Effects','visual-effects',5),
  ('Commercials','commercials',6),
  ('Social Media Content','social-media-content',7)
on conflict (slug) do nothing;

-- ---------- Projects ----------
do $$ begin
  create type public.publish_status as enum ('draft','published');
exception when duplicate_object then null; end $$;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (char_length(title) between 1 and 140),
  short_description text not null default '' check (char_length(short_description) <= 400),
  creative_approach text not null default '' check (char_length(creative_approach) <= 4000),
  category_id uuid references public.categories(id) on delete set null,
  thumbnail_url text,
  cover_url text,
  video_url text,               -- YouTube / Vimeo / direct URL
  video_path text,              -- storage path if uploaded to the media bucket
  tools text[] not null default '{}',
  project_date date,
  featured boolean not null default false,
  accent_color text not null default '#e10600' check (accent_color ~ '^#[0-9a-fA-F]{6}$'),
  is_placeholder boolean not null default false,  -- shows a "PLACEHOLDER" label publicly
  status public.publish_status not null default 'draft',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_status_order on public.projects (status, sort_order);
drop trigger if exists trg_projects_touch on public.projects;
create trigger trg_projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

-- ---------- Services ----------
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  thumbnail_url text,
  accent_color text not null default '#e10600' check (accent_color ~ '^#[0-9a-fA-F]{6}$'),
  visible boolean not null default true,
  sort_order int not null default 0
);

-- ---------- Testimonials ----------
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  author text not null,
  role text,
  visible boolean not null default true,
  sort_order int not null default 0
);

-- ---------- AI tools ----------
create table if not exists public.tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role_description text not null default '',
  kind text not null default 'ai' check (kind in ('ai','software')),
  visible boolean not null default true,
  sort_order int not null default 0
);

-- ---------- Pipeline examples (how tools were used on a project) ----------
create table if not exists public.pipeline_examples (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  tools text[] not null default '{}',
  project_id uuid references public.projects(id) on delete set null,
  visible boolean not null default true,
  sort_order int not null default 0
);

-- ---------- Contact messages ----------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 254),
  project_type text,
  budget text,
  message text not null check (char_length(message) between 5 and 5000),
  ip_hash text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.site_settings     enable row level security;
alter table public.categories        enable row level security;
alter table public.projects          enable row level security;
alter table public.services          enable row level security;
alter table public.testimonials      enable row level security;
alter table public.tools             enable row level security;
alter table public.pipeline_examples enable row level security;
alter table public.messages          enable row level security;

-- Public read policies (published / visible content only)
drop policy if exists "public read settings" on public.site_settings;
create policy "public read settings" on public.site_settings for select to anon, authenticated using (true);

drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories for select to anon, authenticated using (true);

drop policy if exists "public read published projects" on public.projects;
create policy "public read published projects" on public.projects for select to anon, authenticated
  using (status = 'published' or public.is_admin());

drop policy if exists "public read visible services" on public.services;
create policy "public read visible services" on public.services for select to anon, authenticated
  using (visible or public.is_admin());

drop policy if exists "public read visible testimonials" on public.testimonials;
create policy "public read visible testimonials" on public.testimonials for select to anon, authenticated
  using (visible or public.is_admin());

drop policy if exists "public read visible tools" on public.tools;
create policy "public read visible tools" on public.tools for select to anon, authenticated
  using (visible or public.is_admin());

drop policy if exists "public read visible examples" on public.pipeline_examples;
create policy "public read visible examples" on public.pipeline_examples for select to anon, authenticated
  using (visible or public.is_admin());

-- Admin write policies
do $$
declare t text;
begin
  foreach t in array array['site_settings','categories','projects','services','testimonials','tools','pipeline_examples']
  loop
    execute format('drop policy if exists "admin insert %1$s" on public.%1$s', t);
    execute format('create policy "admin insert %1$s" on public.%1$s for insert to authenticated with check (public.is_admin())', t);
    execute format('drop policy if exists "admin update %1$s" on public.%1$s', t);
    execute format('create policy "admin update %1$s" on public.%1$s for update to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format('drop policy if exists "admin delete %1$s" on public.%1$s', t);
    execute format('create policy "admin delete %1$s" on public.%1$s for delete to authenticated using (public.is_admin())', t);
  end loop;
end $$;

-- Messages: nobody can read/write through the public API except the admin.
-- Inserts from the contact form go through a server route using the service-role key.
drop policy if exists "admin read messages" on public.messages;
create policy "admin read messages" on public.messages for select to authenticated using (public.is_admin());
drop policy if exists "admin update messages" on public.messages;
create policy "admin update messages" on public.messages for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin delete messages" on public.messages;
create policy "admin delete messages" on public.messages for delete to authenticated using (public.is_admin());

-- =====================================================================
-- Storage: one public-read bucket, admin-only writes, restricted types & sizes
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true,
  52428800,  -- 50 MB (the Supabase free-plan per-file ceiling; raise on paid plans)
  array['image/jpeg','image/png','image/webp','image/avif','image/gif','video/mp4','video/webm','video/quicktime']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects for select to anon, authenticated
  using (bucket_id = 'media');

drop policy if exists "media admin insert" on storage.objects;
create policy "media admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "media admin update" on storage.objects;
create policy "media admin update" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin()) with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "media admin delete" on storage.objects;
create policy "media admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());

-- =====================================================================
-- Starter content (clearly labelled placeholders — replace in /admin)
-- =====================================================================
insert into public.services (title, description, sort_order, accent_color)
select * from (values
  ('Professional Video Editing','Story-first cuts with deliberate pacing, sound design, colour and subtitles.',1,'#e10600'),
  ('Motion Graphics & Animation','Kinetic typography, title sequences and animated graphics built in After Effects.',2,'#f5ff00'),
  ('AI Video Production','Concept-to-screen workflows using generative AI, finished with real editing craft.',3,'#1e5bff'),
  ('Cinematic Reels & Social Content','Vertical and square edits designed to stop the scroll.',4,'#e10600'),
  ('Visual Effects & Compositing','Compositing, clean-up and effects shots that sit naturally in the frame.',5,'#f5ff00'),
  ('Promotional & Brand Videos','Launch films, brand pieces and promos with a clear creative point of view.',6,'#1e5bff')
) as v(title, description, sort_order, accent_color)
where not exists (select 1 from public.services);

insert into public.tools (name, role_description, kind, sort_order)
select * from (values
  ('Claude AI','Creative ideation, scripting and workflow assistance.','ai',1),
  ('Google Gemini','Research, creative exploration and multimodal assistance.','ai',2),
  ('Google Flow','AI-assisted visual storytelling and video generation.','ai',3),
  ('After Effects','Motion design, compositing and finishing.','software',4),
  ('Premiere Pro','Editing, pacing and final delivery.','software',5)
) as v(name, role_description, kind, sort_order)
where not exists (select 1 from public.tools);

insert into public.projects (slug, title, short_description, creative_approach, category_id, tools, featured, status, sort_order, is_placeholder, accent_color)
select 'placeholder-project-' || n, 'Placeholder Project 0' || n,
       'Placeholder entry. Replace this with a real project in the admin dashboard.',
       'Describe your creative approach here.',
       (select id from public.categories order by sort_order offset (n-1) limit 1),
       array['After Effects','Premiere Pro'], n = 1, 'published', n, true,
       (array['#e10600','#f5ff00','#1e5bff'])[n]
from generate_series(1,3) as n
where not exists (select 1 from public.projects);
