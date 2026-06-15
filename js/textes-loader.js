(async function () {
  const filename = window.location.pathname.split('/').pop() || 'index.html';

  function set(selector, valeur) {
    const el = document.querySelector(selector);
    if (el) el.innerHTML = valeur;
  }

  const PAGES = {
    'index.html': {
      page: 'index',
      apply(cle, valeur) {
        const MAP = {
          hero_tagline:            () => set('.hero__tagline', valeur),
          hero_subtitle:           () => set('.hero__subtitle', valeur),
          hero_cta:                () => set('.hero__cta', valeur),
          realisations_titre:      () => set('.realisations .section-title', valeur),
          realisations_sous_titre: () => set('.realisations .section-sub em', valeur),
          prestations_titre:       () => set('.prestations__title', valeur),
          experiences_titre:       () => set('.experiences-intro .section-title', valeur),
        };
        MAP[cle]?.();
      }
    },

    'a-propos.html': {
      page: 'a-propos',
      apply(cle, valeur) {
        const paras = document.querySelectorAll('.ap-intro__body');
        const MAP = {
          apropos_titre: () => set('.ap-intro__title', valeur),
          apropos_p1:    () => { if (paras[0]) paras[0].innerHTML = valeur; },
          apropos_p2:    () => { if (paras[1]) paras[1].innerHTML = valeur; },
          apropos_p3:    () => { if (paras[2]) paras[2].innerHTML = valeur; },
        };
        MAP[cle]?.();
      }
    },

    'contact.html': {
      page: 'contact',
      apply(cle, valeur) {
        const MAP = {
          contact_titre: () => set('.contact-page__header .section-title', valeur),
          contact_telephone: () => {
            const el = document.querySelector('a[href^="tel:"]');
            if (el) { el.textContent = valeur; el.href = 'tel:' + valeur.replace(/\s/g, ''); }
          },
          contact_email: () => {
            const el = document.querySelector('a[href^="mailto:"]');
            if (el) { el.textContent = valeur; el.href = 'mailto:' + valeur; }
          },
        };
        MAP[cle]?.();
      }
    }
  };

  const cfg = PAGES[filename];
  if (!cfg) return;

  try {
    const { data, error } = await supabaseClient
      .from('textes_editables')
      .select('cle, valeur')
      .eq('page', cfg.page);

    if (error || !data?.length) return;

    for (const { cle, valeur } of data) {
      cfg.apply(cle, valeur);
    }
  } catch (_) { /* keep static fallback */ }
})();
