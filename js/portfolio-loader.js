(async function () {
  const CATEGORY_MAP = {
    'page-iv':      'identite-visuelle',
    'page-print':   'print',
    'page-digital': 'digital'
  };

  const category = CATEGORY_MAP[document.body.className.trim()];
  if (!category) return;

  function esc(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function url(str) { return esc((str || '').trim()); }

  const grid  = document.querySelector('.sub-gallery__grid');
  const strip = document.querySelector('.sub-logos__strip');

  const [projResult, clientsResult] = await Promise.allSettled([
    grid  ? supabaseClient.from('projets').select('titre, image_url').eq('categorie', category).order('ordre') : Promise.resolve(null),
    strip ? supabaseClient.from('clients').select('nom, logo_url').order('ordre') : Promise.resolve(null)
  ]);

  // ---- Galerie projets (CSS-animated grid) ----
  if (grid && projResult.status === 'fulfilled' && projResult.value) {
    const { data, error } = projResult.value;
    if (!error && data?.length) {
      const visible = data.map(p =>
        `<div class="sub-gallery__item"><img src="${url(p.image_url)}" alt="${esc(p.titre)}" loading="lazy" onerror="this.style.display='none'"></div>`
      ).join('');
      const hidden = data.map(p =>
        `<div class="sub-gallery__item" aria-hidden="true"><img src="${url(p.image_url)}" alt="" loading="lazy" onerror="this.style.display='none'"></div>`
      ).join('');
      grid.innerHTML = visible + hidden;
      // Force CSS animation restart after innerHTML replacement
      grid.style.animation = 'none';
      grid.offsetHeight; // reflow
      grid.style.animation = '';
    }
  }

  // ---- Bandeau clients (CSS-animated strip) ----
  if (strip && clientsResult.status === 'fulfilled' && clientsResult.value) {
    const { data, error } = clientsResult.value;
    if (!error && data?.length) {
      const renderItem = (c, hidden) => {
        const attrs = hidden ? ' aria-hidden="true"' : '';
        return c.logo_url
          ? `<span class="sub-logos__item"${attrs}><img src="${url(c.logo_url)}" alt="${hidden ? '' : esc(c.nom)}" onerror="this.parentElement.style.display='none'"></span>`
          : `<span class="sub-logos__item"${attrs}>${esc(c.nom)}</span>`;
      };
      strip.innerHTML =
        data.map(c => renderItem(c, false)).join('') +
        data.map(c => renderItem(c, true)).join('');
    }
  }
})();
