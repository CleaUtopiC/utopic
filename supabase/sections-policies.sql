-- ============================================================
-- sections-policies.sql — Utopi'C · Composants ajoutables par page
-- À coller dans : Supabase > SQL Editor > New query > Run
-- Prérequis : admin-policies.sql déjà exécuté (fonction public.is_admin()).
-- Idempotent : peut être relancé sans casse.
--
-- Une ligne = un composant posé sur une page (page = nom du fichier sans .html).
-- `props` contient les champs du composant (voir js/blocks.js).
-- ============================================================

create table if not exists public.sections (
  id     bigint generated always as identity primary key,
  page   text    not null check (char_length(page) <= 60),
  type   text    not null check (char_length(type) <= 40),
  ordre  integer not null default 0,
  visible boolean not null default true,
  props  jsonb   not null default '{}'::jsonb
         check (jsonb_typeof(props) = 'object' and pg_column_size(props) <= 20000),
  cree_le timestamptz not null default now()
);

create index if not exists sections_page_ordre_idx on public.sections (page, ordre);

alter table public.sections enable row level security;

grant select on public.sections to anon, authenticated;
grant insert, update, delete on public.sections to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Visiteurs : uniquement les composants visibles
drop policy if exists "sections_select_visible" on public.sections;
create policy "sections_select_visible" on public.sections
  for select to anon, authenticated using (visible);

-- Admin : voit aussi les composants masqués
drop policy if exists "sections_admin_select" on public.sections;
create policy "sections_admin_select" on public.sections
  for select to authenticated using (public.is_admin());

drop policy if exists "sections_admin_insert" on public.sections;
create policy "sections_admin_insert" on public.sections
  for insert to authenticated with check (public.is_admin());

drop policy if exists "sections_admin_update" on public.sections;
create policy "sections_admin_update" on public.sections
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "sections_admin_delete" on public.sections;
create policy "sections_admin_delete" on public.sections
  for delete to authenticated using (public.is_admin());
