-- ============================================================
-- admin-mfa.sql — Utopi'C · Double authentification obligatoire
-- À coller dans : Supabase > SQL Editor > New query > Run
-- (après admin-policies.sql). Idempotent.
--
-- Toutes les policies d'écriture (avis, projets, bucket images) passent par
-- is_admin() : en exigeant ici une session "aal2" (mot de passe + code TOTP),
-- un mot de passe volé ne suffit plus pour modifier le site.
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
     and exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;


-- ---------- Téléphone perdu / changé ----------
-- Supprime la double authentification du compte : à la prochaine connexion,
-- l'espace admin proposera de la réactiver avec un nouveau QR code.
--
-- delete from auth.mfa_factors
-- where user_id = (select id from auth.users where email = 'EMAIL_DE_CLEA');
