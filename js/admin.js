(function () {
  const db = supabaseClient;
  const $ = (id) => document.getElementById(id);

  const CATEGORIES = [
    { value: 'identite-visuelle', label: 'Identité visuelle' },
    { value: 'print', label: 'Print' },
    { value: 'digital', label: 'Digital' }
  ];
  const IMAGE_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

  const state = { avis: [], projets: [], editing: null, imageUrl: null };

  // ---------- Utilitaires ----------

  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children) if (c) node.append(c);
    return node;
  }

  let toastTimer;
  function toast(msg, isError) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.toggle('is-error', !!isError);
    t.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-visible'), isError ? 6000 : 3000);
  }

  function friendlyError(error) {
    console.error(error);
    if (!error) return 'Une erreur est survenue.';
    if (error.code === '42501' || /row-level security|permission|Unauthorized/i.test(error.message || '')) {
      return "Action refusée : ce compte n'a pas les droits d'écriture.";
    }
    if (/Failed to fetch|NetworkError/i.test(error.message || '')) {
      return 'Connexion Internet indisponible. Réessayez.';
    }
    return 'Une erreur est survenue. Réessayez ou contactez Kacper.';
  }

  function confirmDialog(message) {
    const dlg = $('confirmDialog');
    $('confirmText').textContent = message;
    dlg.returnValue = '';
    dlg.showModal();
    return new Promise((resolve) => {
      dlg.addEventListener('close', () => resolve(dlg.returnValue === 'ok'), { once: true });
    });
  }

  function isHttpUrl(str) {
    try { return ['http:', 'https:'].includes(new URL(str).protocol); } catch (_) { return false; }
  }

  function nextOrdre(items) {
    return items.reduce((m, i) => Math.max(m, i.ordre || 0), 0) + 1;
  }

  function parseOrdre(value, fallback) {
    const n = parseInt(value, 10);
    return Number.isFinite(n) && n >= 0 ? Math.min(n, 9999) : fallback;
  }

  // ---------- Vues ----------

  function show(view) {
    $('bootMsg').hidden = true;
    $('loginView').hidden = view !== 'login';
    $('mfaView').hidden = view !== 'mfa';
    $('appView').hidden = view !== 'app';
    $('userBar').hidden = view !== 'app';
  }

  function resetData() {
    state.avis = [];
    state.projets = [];
    $('avisList').replaceChildren();
    $('projetsGroups').replaceChildren();
    $('userEmail').textContent = '';
  }

  // ---------- Authentification ----------

  async function denyAccess(message, error) {
    if (error) console.error(error);
    await db.auth.signOut();
    resetData();
    show('login');
    $('loginError').textContent = message;
  }

  async function enterApp(session) {
    try {
      await openSession(session);
    } catch (err) {
      await denyAccess('Une erreur est survenue. Réessayez.', err);
    }
  }

  async function openSession(session) {
    const { data: aal, error: aalError } = await db.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalError) return denyAccess('Une erreur est survenue. Réessayez.', aalError);
    if (aal.currentLevel !== 'aal2') return startMfa(aal.nextLevel === 'aal2');

    const { data: isAdmin, error } = await db.rpc('is_admin');
    if (error || isAdmin !== true) return denyAccess("Ce compte n'a pas accès à l'espace admin.", error);
    $('userEmail').textContent = session.user.email || '';
    show('app');
    await Promise.all([loadAvis(), loadProjets()]);
  }

  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('loginEmail').value.trim();
    const password = $('loginPassword').value;
    const errBox = $('loginError');
    errBox.textContent = '';
    if (!email || !password) { errBox.textContent = 'Renseignez votre e-mail et votre mot de passe.'; return; }

    const btn = $('loginSubmit');
    btn.disabled = true;
    btn.textContent = 'Connexion…';
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    btn.disabled = false;
    btn.textContent = 'Se connecter';

    if (error) {
      errBox.textContent = error.status === 429
        ? 'Trop de tentatives. Patientez quelques minutes avant de réessayer.'
        : 'Identifiants incorrects.';
      return;
    }
    $('loginPassword').value = '';
    await enterApp(data.session);
  });

  // ---------- Double authentification (TOTP) ----------

  let mfaFactorId = null;

  async function startMfa(hasFactor) {
    $('mfaError').textContent = '';
    $('mfaCode').value = '';
    $('mfaEnroll').hidden = hasFactor;
    $('mfaVerifyIntro').hidden = !hasFactor;
    $('mfaTitle').textContent = hasFactor ? 'Code de vérification' : 'Activer la double authentification';

    if (hasFactor) {
      const { data, error } = await db.auth.mfa.listFactors();
      if (error || !data.totp.length) return denyAccess('Une erreur est survenue. Réessayez.', error);
      mfaFactorId = data.totp[0].id;
    } else {
      // Nettoie une inscription commencée puis abandonnée (sinon l'enrôlement est refusé).
      const { data: factors } = await db.auth.mfa.listFactors();
      for (const f of factors?.all || []) {
        if (f.status === 'unverified') await db.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data, error } = await db.auth.mfa.enroll({ factorType: 'totp', friendlyName: "Utopi'C admin" });
      if (error) return denyAccess('Impossible de préparer la double authentification. Réessayez.', error);
      mfaFactorId = data.id;
      const qr = data.totp.qr_code;
      const svg = qr.startsWith('data:image/svg+xml') ? qr.slice(qr.indexOf(',') + 1) : null;
      $('mfaQr').src = svg && svg.trimStart().startsWith('<')
        ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
        : qr;
      $('mfaSecret').textContent = data.totp.secret;
    }
    show('mfa');
    $('mfaCode').focus();
  }

  $('mfaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = $('mfaCode').value.replace(/\s/g, '');
    const errBox = $('mfaError');
    errBox.textContent = '';
    if (!/^\d{6}$/.test(code)) { errBox.textContent = 'Saisissez les 6 chiffres affichés par l\'application.'; return; }

    const btn = $('mfaSubmit');
    btn.disabled = true;
    const { error } = await db.auth.mfa.challengeAndVerify({ factorId: mfaFactorId, code });
    btn.disabled = false;
    if (error) {
      errBox.textContent = error.status === 429
        ? 'Trop de tentatives. Patientez quelques minutes avant de réessayer.'
        : 'Code incorrect ou expiré. Réessayez avec le nouveau code.';
      $('mfaCode').select();
      return;
    }
    const { data } = await db.auth.getSession();
    await enterApp(data.session);
  });

  $('mfaCancel').addEventListener('click', () => db.auth.signOut());

  $('logoutBtn').addEventListener('click', async () => {
    await db.auth.signOut();
  });

  db.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      resetData();
      show('login');
    }
  });

  // ---------- Onglets ----------

  const tabs = [...document.querySelectorAll('[role="tab"]')];
  function selectTab(tab) {
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      $(t.getAttribute('aria-controls')).hidden = !on;
    }
    tab.focus();
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') selectTab(tabs[(i + 1) % tabs.length]);
      if (e.key === 'ArrowLeft') selectTab(tabs[(i - 1 + tabs.length) % tabs.length]);
    });
  });

  // ---------- Liste générique ----------

  function stars(n) {
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  function renderItem({ item, index, total, badge, title, subtitle, excerpt, onEdit, onDelete, onMove }) {
    const thumb = item.image_url
      ? el('img', { class: 'adm-item__thumb', src: item.image_url, alt: '', loading: 'lazy' })
      : el('div', { class: 'adm-item__thumb adm-item__thumb--empty', 'aria-hidden': 'true', text: '—' });

    return el('li', { class: 'adm-item' },
      el('div', { class: 'adm-item__move' },
        el('button', {
          type: 'button', class: 'adm-icon-btn', text: '↑',
          'aria-label': `Monter « ${title} »`, disabled: index === 0,
          onclick: () => onMove(-1)
        }),
        el('span', { class: 'adm-item__pos', text: String(index + 1), 'aria-hidden': 'true' }),
        el('button', {
          type: 'button', class: 'adm-icon-btn', text: '↓',
          'aria-label': `Descendre « ${title} »`, disabled: index === total - 1,
          onclick: () => onMove(1)
        })
      ),
      thumb,
      el('div', { class: 'adm-item__body' },
        badge ? el('span', { class: `adm-badge adm-badge--${badge.kind}`, text: badge.text }) : null,
        el('p', { class: 'adm-item__title', text: title }),
        subtitle ? el('p', { class: 'adm-item__sub', text: subtitle }) : null,
        excerpt ? el('p', { class: 'adm-item__excerpt', text: excerpt }) : null
      ),
      el('div', { class: 'adm-item__actions' },
        el('button', { type: 'button', class: 'adm-btn adm-btn--ghost', text: 'Modifier', 'aria-label': `Modifier « ${title} »`, onclick: onEdit }),
        el('button', { type: 'button', class: 'adm-btn adm-btn--danger-ghost', text: 'Supprimer', 'aria-label': `Supprimer « ${title} »`, onclick: onDelete })
      )
    );
  }

  // Réordonne un groupe (swap + renumérotation 1..n) et n'enregistre que les lignes modifiées.
  async function move(table, group, index, delta) {
    const target = index + delta;
    if (target < 0 || target >= group.length) return;
    const list = group.slice();
    [list[index], list[target]] = [list[target], list[index]];
    const changes = list
      .map((item, i) => ({ id: item.id, ordre: i + 1, old: item.ordre }))
      .filter((c) => c.ordre !== c.old);

    const results = await Promise.all(
      changes.map((c) => db.from(table).update({ ordre: c.ordre }).eq('id', c.id).select('id'))
    );
    const failed = results.find((r) => r.error || !r.data?.length);
    if (failed) toast(friendlyError(failed.error || { code: '42501' }), true);
    return table === 'avis' ? loadAvis() : loadProjets();
  }

  async function removeRow(table, id, label) {
    if (!(await confirmDialog(`Supprimer définitivement « ${label} » ? Cette action est irréversible.`))) return;
    const { data, error } = await db.from(table).delete().eq('id', id).select('id');
    if (error || !data?.length) { toast(friendlyError(error || { code: '42501' }), true); return; }
    toast('Supprimé.');
    return table === 'avis' ? loadAvis() : loadProjets();
  }

  // ---------- Avis & articles ----------

  async function loadAvis() {
    const { data, error } = await db.from('avis').select('*').order('ordre').order('id');
    if (error) { toast(friendlyError(error), true); return; }
    state.avis = data;
    renderAvis();
  }

  function renderAvis() {
    const list = $('avisList');
    if (!state.avis.length) {
      list.replaceChildren(el('li', { class: 'adm-empty', text: 'Aucun avis pour le moment.' }));
      return;
    }
    list.replaceChildren(...state.avis.map((a, i) => {
      const isArticle = a.note === null;
      return renderItem({
        item: a, index: i, total: state.avis.length,
        badge: isArticle ? { kind: 'article', text: 'Article de presse' } : { kind: 'avis', text: 'Avis ' + stars(a.note) },
        title: a.auteur || '(sans nom)',
        subtitle: isArticle ? (a.lien_externe || 'Pas de lien') : null,
        excerpt: a.texte,
        onEdit: () => openAvis(a),
        onDelete: () => removeRow('avis', a.id, a.auteur || 'cet élément'),
        onMove: (d) => move('avis', state.avis, i, d)
      });
    }));
  }

  function avisType() {
    return document.querySelector('#avisForm input[name="type"]:checked').value;
  }

  function applyAvisType() {
    const type = avisType();
    for (const block of document.querySelectorAll('#avisForm [data-only]')) {
      block.hidden = block.dataset.only !== type;
    }
    $('avisAuteurLabel').textContent = type === 'avis' ? 'Nom du client' : 'Nom du média / du journal';
    $('avisTexteLabel').textContent = type === 'avis' ? "Texte de l'avis" : "Description (ex. : titre, numéro, date)";
    $('avisDialogTitle').textContent = (state.editing ? 'Modifier ' : 'Ajouter ') + (type === 'avis' ? 'un avis' : 'un article de presse');
  }

  function openAvis(row, type) {
    state.editing = row || null;
    const form = $('avisForm');
    form.reset();
    form.querySelector('.adm-error').textContent = '';
    const t = row ? (row.note === null ? 'article' : 'avis') : type;
    form.querySelector(`input[name="type"][value="${t}"]`).checked = true;
    $('avisAuteur').value = row?.auteur || '';
    $('avisTexte').value = row?.texte || '';
    $('avisNote').value = String(row?.note || 5);
    $('avisLien').value = row?.lien_externe || '';
    $('avisOrdre').value = row ? row.ordre : nextOrdre(state.avis);
    setImage('avis', row?.image_url || null);
    applyAvisType();
    $('avisDialog').showModal();
    $('avisAuteur').focus();
  }

  for (const r of document.querySelectorAll('#avisForm input[name="type"]')) r.addEventListener('change', applyAvisType);
  for (const b of document.querySelectorAll('[data-new-avis]')) b.addEventListener('click', () => openAvis(null, b.dataset.newAvis));

  $('avisForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const errBox = form.querySelector('.adm-error');
    const type = avisType();
    const auteur = $('avisAuteur').value.trim();
    const texte = $('avisTexte').value.trim();
    const lien = $('avisLien').value.trim();

    errBox.textContent = '';
    if (!auteur) { errBox.textContent = 'Le nom est obligatoire.'; $('avisAuteur').focus(); return; }
    if (type === 'avis' && !texte) { errBox.textContent = "Le texte de l'avis est obligatoire."; $('avisTexte').focus(); return; }
    if (type === 'article' && lien && !isHttpUrl(lien)) { errBox.textContent = 'Le lien doit commencer par https://'; $('avisLien').focus(); return; }

    const note = parseInt($('avisNote').value, 10);
    const payload = {
      auteur,
      texte,
      note: type === 'avis' ? Math.min(5, Math.max(1, note)) : null,
      lien_externe: type === 'article' ? (lien || null) : null,
      image_url: type === 'article' ? state.imageUrl : null,
      ordre: parseOrdre($('avisOrdre').value, nextOrdre(state.avis))
    };
    await save('avis', payload, form, $('avisDialog'), loadAvis);
  });

  // ---------- Projets ----------

  async function loadProjets() {
    const { data, error } = await db.from('projets').select('*').order('ordre').order('id');
    if (error) { toast(friendlyError(error), true); return; }
    state.projets = data;
    renderProjets();
  }

  function projetsOf(cat) {
    return state.projets.filter((p) => p.categorie === cat);
  }

  function renderProjets() {
    const groups = CATEGORIES.map(({ value, label }) => {
      const items = projetsOf(value);
      const list = el('ol', { class: 'adm-list' });
      if (!items.length) list.append(el('li', { class: 'adm-empty', text: 'Aucun projet dans cette catégorie.' }));
      items.forEach((p, i) => list.append(renderItem({
        item: p, index: i, total: items.length,
        title: p.titre || '(sans titre)',
        excerpt: p.description,
        onEdit: () => openProjet(p),
        onDelete: () => removeRow('projets', p.id, p.titre || 'ce projet'),
        onMove: (d) => move('projets', items, i, d)
      })));
      return el('section', { class: 'adm-group', 'aria-labelledby': `grp-${value}` },
        el('div', { class: 'adm-group__head' },
          el('h2', { id: `grp-${value}`, text: `${label} (${items.length})` }),
          el('button', { type: 'button', class: 'adm-btn adm-btn--ghost', text: `+ Ajouter en ${label}`, onclick: () => openProjet(null, value) })
        ),
        list
      );
    });
    $('projetsGroups').replaceChildren(...groups);
  }

  function openProjet(row, categorie) {
    state.editing = row || null;
    const form = $('projetForm');
    form.reset();
    form.querySelector('.adm-error').textContent = '';
    $('projetDialogTitle').textContent = row ? 'Modifier le projet' : 'Ajouter un projet';
    const cat = row?.categorie || categorie || 'identite-visuelle';
    $('projetCategorie').value = cat;
    $('projetTitre').value = row?.titre || '';
    $('projetDescription').value = row?.description || '';
    $('projetOrdre').value = row ? row.ordre : nextOrdre(projetsOf(cat));
    setImage('projet', row?.image_url || null);
    $('projetDialog').showModal();
    $('projetTitre').focus();
  }

  $('newProjetBtn').addEventListener('click', () => openProjet(null));

  $('projetCategorie').addEventListener('change', () => {
    if (!state.editing) $('projetOrdre').value = nextOrdre(projetsOf($('projetCategorie').value));
  });

  $('projetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const errBox = form.querySelector('.adm-error');
    const categorie = $('projetCategorie').value;
    const titre = $('projetTitre').value.trim();

    errBox.textContent = '';
    if (!CATEGORIES.some((c) => c.value === categorie)) { errBox.textContent = 'Choisissez une catégorie.'; return; }
    if (!titre) { errBox.textContent = 'Le titre est obligatoire.'; $('projetTitre').focus(); return; }
    if (!state.imageUrl) { errBox.textContent = 'Ajoutez une image du projet.'; return; }

    const payload = {
      categorie,
      titre,
      description: $('projetDescription').value.trim() || null,
      image_url: state.imageUrl,
      ordre: parseOrdre($('projetOrdre').value, nextOrdre(projetsOf(categorie)))
    };
    await save('projets', payload, form, $('projetDialog'), loadProjets);
  });

  // ---------- Enregistrement ----------

  async function save(table, payload, form, dialog, reload) {
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    const query = state.editing
      ? db.from(table).update(payload).eq('id', state.editing.id).select('id')
      : db.from(table).insert(payload).select('id');
    const { data, error } = await query;
    btn.disabled = false;

    if (error || !data?.length) {
      form.querySelector('.adm-error').textContent = friendlyError(error || { code: '42501' });
      return;
    }
    dialog.close();
    toast(state.editing ? 'Modifications enregistrées.' : 'Ajouté.');
    state.editing = null;
    await reload();
  }

  for (const f of [$('avisForm'), $('projetForm')]) {
    f.addEventListener('input', () => { f.querySelector('.adm-error').textContent = ''; });
  }

  for (const b of document.querySelectorAll('[data-close]')) {
    b.addEventListener('click', () => b.closest('dialog').close());
  }

  // ---------- Images ----------

  function setImage(scope, url) {
    state.imageUrl = url;
    const box = document.querySelector(`[data-upload="${scope}"]`);
    const img = box.querySelector('.adm-upload__preview');
    img.hidden = !url;
    if (url) img.src = url; else img.removeAttribute('src');
    box.querySelector('.adm-upload__status').textContent = url ? 'Image prête.' : 'JPG, PNG ou WebP · 5 Mo max';
    const clear = box.querySelector('[data-clear-image]');
    if (clear) clear.hidden = !url;
  }

  async function hasImageSignature(file) {
    const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const jpg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    const png = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
    const webp = String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP';
    return jpg || png || webp;
  }

  async function uploadImage(scope, input) {
    const file = input.files[0];
    input.value = '';
    if (!file) return;
    const box = document.querySelector(`[data-upload="${scope}"]`);
    const status = box.querySelector('.adm-upload__status');
    const ext = IMAGE_TYPES[file.type];

    if (!ext || !(await hasImageSignature(file))) { status.textContent = 'Format non accepté : choisissez un JPG, PNG ou WebP.'; return; }
    if (file.size > MAX_IMAGE_BYTES) { status.textContent = 'Image trop lourde (5 Mo maximum).'; return; }

    const folder = scope === 'projet' ? `projets/${$('projetCategorie').value}` : 'avis';
    const path = `${folder}/${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;

    status.textContent = 'Envoi en cours…';
    const submit = box.closest('form').querySelector('button[type="submit"]');
    submit.disabled = true;
    const { error } = await db.storage.from('images').upload(path, file, {
      contentType: file.type, cacheControl: '31536000', upsert: false
    });
    submit.disabled = false;
    if (error) { status.textContent = friendlyError(error); return; }

    const { data } = db.storage.from('images').getPublicUrl(path);
    setImage(scope, data.publicUrl);
  }

  $('avisFile').addEventListener('change', (e) => uploadImage('avis', e.target));
  $('projetFile').addEventListener('change', (e) => uploadImage('projet', e.target));
  for (const b of document.querySelectorAll('[data-clear-image]')) {
    b.addEventListener('click', () => setImage(b.closest('[data-upload]').dataset.upload, null));
  }

  // ---------- Démarrage ----------

  (async function boot() {
    const { data } = await db.auth.getSession();
    if (data.session) await enterApp(data.session);
    else show('login');
  })();
})();
