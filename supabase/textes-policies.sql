-- ============================================================
-- textes-policies.sql — Utopi'C · Textes éditables depuis l'espace admin
-- À coller dans : Supabase > SQL Editor > New query > Run
-- Prérequis : admin-policies.sql déjà exécuté (fonction public.is_admin()).
-- Idempotent : peut être relancé sans casse.
--
-- Modèle : une ligne (page, cle) = un texte modifié. Absence de ligne =
-- le texte d'origine du HTML s'affiche. Page spéciale 'site' = menu et pied de page.
-- ============================================================

create table if not exists public.textes_editables (
  id     bigint generated always as identity primary key,
  page   text not null,
  cle    text not null,
  valeur text not null,
  maj_le timestamptz not null default now()
);

-- Si cette ligne échoue ("could not create unique index"), il y a des doublons (page, cle) :
--   select page, cle, count(*) from public.textes_editables group by 1, 2 having count(*) > 1;
-- Supprimer les doublons puis relancer.
create unique index if not exists textes_editables_page_cle_key
  on public.textes_editables (page, cle);

alter table public.textes_editables enable row level security;

grant select on public.textes_editables to anon, authenticated;
grant insert, update, delete on public.textes_editables to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Lecture publique (le site affiche ces textes aux visiteurs)
drop policy if exists "textes_select_public" on public.textes_editables;
create policy "textes_select_public" on public.textes_editables
  for select to anon, authenticated using (true);

-- Écriture réservée à l'admin
drop policy if exists "textes_admin_insert" on public.textes_editables;
create policy "textes_admin_insert" on public.textes_editables
  for insert to authenticated with check (public.is_admin());

drop policy if exists "textes_admin_update" on public.textes_editables;
create policy "textes_admin_update" on public.textes_editables
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "textes_admin_delete" on public.textes_editables;
create policy "textes_admin_delete" on public.textes_editables
  for delete to authenticated using (public.is_admin());

-- Date de modification automatique
create or replace function public.textes_touch()
returns trigger language plpgsql set search_path = '' as $$
begin new.maj_le = now(); return new; end $$;

drop trigger if exists textes_touch on public.textes_editables;
create trigger textes_touch before update on public.textes_editables
  for each row execute function public.textes_touch();
