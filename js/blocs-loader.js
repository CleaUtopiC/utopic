// Affiche dans #blocs les composants ajoutés depuis le backoffice pour la page courante.
(async function () {
  const mount = document.getElementById('blocs');
  if (!mount || typeof supabaseClient === 'undefined') return;
  const page = (location.pathname.split('/').pop() || 'index').replace(/\.html$/, '') || 'index';

  try {
    const { data, error } = await supabaseClient
      .from('sections')
      .select('type, props')
      .eq('page', page)
      .eq('visible', true)
      .order('ordre')
      .order('id');
    if (error || !data?.length) return;
    mount.replaceChildren(...data.map((r) => UtopicBlocks.render(r.type, r.props)).filter(Boolean));
  } catch (_) { /* la page reste telle quelle */ }
})();
