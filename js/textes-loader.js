// Remplace chaque [data-edit] par la valeur enregistrée dans Supabase ; le HTML sert de valeur par défaut.
// Les clés `site_*` (menu, pied de page) sont partagées par toutes les pages.
(async function () {
  const nodes = document.querySelectorAll('[data-edit]');
  if (!nodes.length || typeof supabaseClient === 'undefined') return;
  const page = (location.pathname.split('/').pop() || 'index').replace(/\.html$/, '') || 'index';

  try {
    const { data, error } = await supabaseClient
      .from('textes_editables')
      .select('page, cle, valeur')
      .in('page', [page, 'site']);
    if (error || !data?.length) return;

    const values = new Map(data.map((r) => [`${r.page}:${r.cle}`, r.valeur]));
    for (const el of nodes) {
      const cle = el.dataset.edit;
      const v = values.get(`${cle.startsWith('site_') ? 'site' : page}:${cle}`);
      if (typeof v === 'string') UtopicText.apply(el, v);
    }
  } catch (_) { /* garde le texte statique */ }
})();
