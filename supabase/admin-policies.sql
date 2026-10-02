-- ============================================================
-- admin-policies.sql — Utopi'C · Écriture réservée à l'admin
-- À coller dans : Supabase > SQL Editor > New query > Run
-- Idempotent : peut être relancé sans casse.
--
-- Pourquoi une table `admins` en plus du rôle `authenticated` ?
-- Les inscriptions publiques sont ouvertes sur ce projet (disable_signup=false) :
-- n'importe qui peut créer un compte avec la clé anon publique et devenir
-- `authenticated`. On exige donc en plus d'être listé dans `admins`.
-- ============================================================


-- ---------- 1. Liste des administrateurs ----------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security;
-- Aucune policy sur `admins` : illisible et non modifiable via l'API.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;


-- ---------- 2. Tables avis / projets ----------
grant select, insert, update, delete on public.avis, public.projets to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Lecture pour les connectés (au cas où la lecture publique existante ne vise que `anon`)
drop policy if exists "avis_select_authenticated" on public.avis;
create policy "avis_select_authenticated" on public.avis
  for select to authenticated using (true);

drop policy if exists "avis_admin_insert" on public.avis;
create policy "avis_admin_insert" on public.avis
  for insert to authenticated with check (public.is_admin());

drop policy if exists "avis_admin_update" on public.avis;
create policy "avis_admin_update" on public.avis
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "avis_admin_delete" on public.avis;
create policy "avis_admin_delete" on public.avis
  for delete to authenticated using (public.is_admin());

drop policy if exists "projets_select_authenticated" on public.projets;
create policy "projets_select_authenticated" on public.projets
  for select to authenticated using (true);

drop policy if exists "projets_admin_insert" on public.projets;
create policy "projets_admin_insert" on public.projets
  for insert to authenticated with check (public.is_admin());

drop policy if exists "projets_admin_update" on public.projets;
create policy "projets_admin_update" on public.projets
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "projets_admin_delete" on public.projets;
create policy "projets_admin_delete" on public.projets
  for delete to authenticated using (public.is_admin());


-- ---------- 3. Storage : bucket `images` ----------
-- Garde-fous côté serveur : images uniquement, 5 Mo max (s'applique aux nouveaux envois).
update storage.buckets
   set file_size_limit = 5242880,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
 where id = 'images';

drop policy if exists "images_admin_select" on storage.objects;
create policy "images_admin_select" on storage.objects
  for select to authenticated using (bucket_id = 'images' and public.is_admin());

drop policy if exists "images_admin_insert" on storage.objects;
create policy "images_admin_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'images' and public.is_admin());

drop policy if exists "images_admin_update" on storage.objects;
create policy "images_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'images' and public.is_admin())
  with check (bucket_id = 'images' and public.is_admin());

drop policy if exists "images_admin_delete" on storage.objects;
create policy "images_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'images' and public.is_admin());


-- ---------- 4. Déclarer Cléa comme admin ----------
-- À lancer APRÈS avoir créé son utilisateur (Authentication > Users > Add user).
-- Remplacer l'email puis exécuter :
--
-- insert into public.admins (user_id)
-- select id from auth.users where email = 'EMAIL_DE_CLEA@exemple.fr'
-- on conflict do nothing;
--
-- Vérification (doit renvoyer 1 ligne) :
-- select u.email from public.admins a join auth.users u on u.id = a.user_id;
