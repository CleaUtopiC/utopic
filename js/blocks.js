// Catalogue des composants ajoutables à une page. Partagé par le site (rendu) et le backoffice (formulaires).
// Un composant = un type + des champs (props) + une fonction de rendu. Aucun HTML n'est injecté : tout passe par le DOM.
window.UtopicBlocks = (function () {
  // Autorise https/http/mailto/tel ou un chemin relatif ; refuse javascript:, data:, //hôte, etc.
  function safeUrl(u) {
    if (typeof u !== 'string') return null;
    const t = u.replace(/[\u0000- \u007f]/g, '');
    if (!t) return null;
    if (/^(https?:\/\/[^/]|mailto:|tel:)/i.test(t)) return t;
    if (/^[a-z][a-z0-9+.-]*:/i.test(t) || t.startsWith('//')) return null;
    return t;
  }

  function h(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'text') node.textContent = v;
      else node.setAttribute(k, v);
    }
    for (const c of children) if (c) node.append(c);
    return node;
  }

  function link(cls, text, href) {
    const url = safeUrl(href);
    if (!url || !text) return null;
    const external = /^https?:/i.test(url) && new URL(url).origin !== location.origin;
    return h('a', { class: cls, href: url, text, target: external ? '_blank' : null, rel: external ? 'noopener' : null });
  }

  function paragraphs(text) {
    return String(text || '').split(/\n{2,}/).map((par) => {
      const p = h('p');
      par.split('\n').forEach((line, i) => { if (i) p.append(document.createElement('br')); p.append(line); });
      return p;
    });
  }

  function header(p) {
    if (!p.titre) return null;
    return h('header', { class: 'section-header' },
      p.label ? h('span', { class: 'section-label', text: p.label }) : null,
      h('h2', { class: 'section-title', text: p.titre }),
      p.sous_titre ? h('p', { class: 'section-sub' }, h('em', { text: p.sous_titre })) : null);
  }

  function wrap(type, p, extraClass, ...children) {
    const fond = p.fond === 'beige' ? 'beige' : 'blanc';
    return h('section', { class: `blk blk--${type} blk--${fond} ${extraClass || ''}`.trim() },
      h('div', { class: 'blk__inner' }, ...children));
  }

  const FOND = { k: 'fond', t: 'select', l: 'Couleur de fond', opts: [['blanc', 'Blanc'], ['beige', 'Beige']] };

  const TYPES = {
    titre: {
      label: 'Titre de section',
      desc: 'Un titre centré avec une petite étiquette dorée et un sous-titre.',
      fields: [
        { k: 'label', t: 'text', l: 'Étiquette (petit texte doré)', max: 60 },
        { k: 'titre', t: 'text', l: 'Titre', req: true, max: 150 },
        { k: 'sous_titre', t: 'text', l: 'Sous-titre', max: 200 },
        FOND
      ],
      render: (p) => wrap('titre', p, '', header(p))
    },

    texte_image: {
      label: 'Texte + image',
      desc: 'Un titre, un texte, une image à gauche ou à droite et un bouton facultatif.',
      fields: [
        { k: 'label', t: 'text', l: 'Étiquette (petit texte doré)', max: 60 },
        { k: 'titre', t: 'text', l: 'Titre', req: true, max: 150 },
        { k: 'texte', t: 'textarea', l: 'Texte', req: true, max: 3000, hint: 'Une ligne vide sépare deux paragraphes.' },
        { k: 'image', t: 'image', l: 'Image', hint: 'Facultative.' },
        { k: 'image_alt', t: 'text', l: "Description de l'image", max: 200, hint: 'Obligatoire si une image est ajoutée (pour les personnes malvoyantes).' },
        { k: 'position', t: 'select', l: "Position de l'image", opts: [['droite', 'À droite'], ['gauche', 'À gauche']] },
        { k: 'bouton_texte', t: 'text', l: 'Texte du bouton', max: 40, hint: 'Facultatif.' },
        { k: 'bouton_lien', t: 'link', l: 'Lien du bouton', max: 500 },
        FOND
      ],
      check(p) {
        if (p.image && !p.image_alt) return "Décrivez l'image (champ « Description de l'image »).";
        if (!!p.bouton_texte !== !!p.bouton_lien) return 'Le bouton a besoin d\'un texte ET d\'un lien.';
        return '';
      },
      render(p) {
        const img = safeUrl(p.image);
        const media = img ? h('div', { class: 'blk__media' }, h('img', { src: img, alt: p.image_alt || '', loading: 'lazy' })) : null;
        const btn = link('btn btn--gold-outline', p.bouton_texte, p.bouton_lien);
        const text = h('div', { class: 'blk__text' },
          p.label ? h('span', { class: 'section-label', text: p.label }) : null,
          h('h2', { class: 'blk__title', text: p.titre }),
          ...paragraphs(p.texte), btn);
        const cls = [media ? (p.position === 'gauche' ? 'blk--img-gauche' : 'blk--img-droite') : 'blk--sans-image'].join(' ');
        return wrap('texte-image', p, cls, text, media);
      }
    },

    cta: {
      label: "Bandeau d'appel",
      desc: 'Une phrase d\'accroche et un bouton doré (comme « Un projet ? Parlons-en ! »).',
      fields: [
        { k: 'texte', t: 'text', l: "Phrase d'accroche", req: true, max: 200 },
        { k: 'bouton_texte', t: 'text', l: 'Texte du bouton', req: true, max: 40 },
        { k: 'bouton_lien', t: 'link', l: 'Lien du bouton', req: true, max: 500, hint: 'Ex. : contact.html' },
        FOND
      ],
      render: (p) => wrap('cta', p, '',
        h('p', { text: p.texte }),
        link('btn btn--gold-filled', p.bouton_texte, p.bouton_lien))
    },

    cartes: {
      label: 'Cartes (3 colonnes)',
      desc: 'Jusqu\'à trois cartes image + libellé + lien, comme les prestations de l\'accueil.',
      fields: [
        { k: 'label', t: 'text', l: 'Étiquette (petit texte doré)', max: 60 },
        { k: 'titre', t: 'text', l: 'Titre de la section', max: 150, hint: 'Facultatif.' },
        ...[1, 2, 3].flatMap((n) => [
          { g: `Carte ${n}${n > 1 ? ' (facultative)' : ''}`, k: `c${n}_titre`, t: 'text', l: 'Libellé', req: n === 1, max: 80 },
          { k: `c${n}_image`, t: 'image', l: 'Image', req: n === 1 },
          { k: `c${n}_lien`, t: 'link', l: 'Lien', max: 500, hint: 'Facultatif. Ex. : identite-visuelle.html' }
        ]),
        FOND
      ],
      check(p) {
        for (const n of [1, 2, 3]) {
          if ((p[`c${n}_titre`] || p[`c${n}_image`] || p[`c${n}_lien`]) && !(p[`c${n}_titre`] && p[`c${n}_image`])) {
            return `Carte ${n} : le libellé et l'image sont tous deux nécessaires.`;
          }
        }
        return '';
      },
      render(p) {
        const cards = [1, 2, 3].filter((n) => p[`c${n}_titre`] && safeUrl(p[`c${n}_image`])).map((n) => {
          const inner = [
            h('div', { class: 'blk-carte__img' }, h('img', { src: safeUrl(p[`c${n}_image`]), alt: '', loading: 'lazy' })),
            h('span', { class: 'blk-carte__label', text: p[`c${n}_titre`] })
          ];
          const href = safeUrl(p[`c${n}_lien`]);
          return href ? h('a', { class: 'blk-carte', href }, ...inner) : h('div', { class: 'blk-carte' }, ...inner);
        });
        if (!cards.length) return null;
        return wrap('cartes', p, '', header(p), h('div', { class: 'blk-cartes__grid' }, ...cards));
      }
    }
  };

  const ORDER = ['texte_image', 'titre', 'cta', 'cartes'];

  // Nettoie les props (valeurs vides retirées, champs inconnus ignorés) selon le schéma du type.
  function clean(type, raw) {
    const out = {};
    for (const f of TYPES[type]?.fields || []) {
      const v = typeof raw[f.k] === 'string' ? raw[f.k].replace(/\r\n/g, '\n').trim() : '';
      if (v) out[f.k] = v;
    }
    return out;
  }

  // Renvoie un message d'erreur en français, ou '' si valide.
  function validate(type, p) {
    const def = TYPES[type];
    if (!def) return 'Type de composant inconnu.';
    for (const f of def.fields) {
      const v = p[f.k] || '';
      const name = f.l.replace(/ \(.*\)$/, '');
      if (f.req && !v) return `« ${name} » est obligatoire${f.g ? ` (${f.g.toLowerCase()})` : ''}.`;
      if (f.max && v.length > f.max) return `« ${name} » est trop long (${f.max} caractères maximum).`;
      if (f.t === 'link' && v && !safeUrl(v)) return `« ${name} » : adresse invalide (https://… ou page du site).`;
      if (f.t === 'select' && v && !f.opts.some(([val]) => val === v)) return `« ${name} » : valeur inconnue.`;
    }
    return def.check ? def.check(p) : '';
  }

  function render(type, props) {
    const def = TYPES[type];
    if (!def || !props || typeof props !== 'object') return null;
    try { return def.render(props); } catch (_) { return null; }
  }

  function summary(type, p) {
    return p.titre || p.texte || p.c1_titre || p.bouton_texte || '(vide)';
  }

  return { TYPES, ORDER, safeUrl, clean, validate, render, summary };
})();
