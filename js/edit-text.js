// Lecture/écriture des textes éditables ([data-edit]). Partagé par le site et le backoffice.
// Format de stockage : texte brut, saut de ligne = <br>. Aucune injection de HTML.
window.UtopicText = (function () {
  const SPLIT = /<br\s*\/?>|\r?\n/i;
  const PHONE = /^[\d\s+().-]{6,25}$/;
  const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

  function read(el) {
    const lines = [''];
    for (const n of el.childNodes) {
      if (n.nodeName === 'BR') lines.push('');
      else lines[lines.length - 1] += n.textContent.replace(/[ \t\r\n]+/g, ' ');
    }
    return lines.map((l) => l.trim()).join('\n').trim();
  }

  function valid(kind, value) {
    if (kind === 'tel') return PHONE.test(value);
    if (kind === 'mailto') return EMAIL.test(value);
    return true;
  }

  // Espace insécable avant ? ! : ; et autour des guillemets : évite les retours à la ligne disgracieux.
  function typo(s) {
    return s.replace(/ ([?!:;»])/g, ' $1').replace(/(«) /g, '$1 ');
  }

  function apply(el, value) {
    value = String(value).trim();
    if (!value) return;
    const kind = el.dataset.editLink;
    if (kind && !valid(kind, value)) return;
    const parts = value.split(SPLIT).map((p) => typo(p.trim()));
    const nodes = [];
    parts.forEach((p, i) => {
      if (i) nodes.push(document.createElement('br'));
      nodes.push(document.createTextNode(p));
    });
    el.replaceChildren(...nodes);
    if (kind === 'tel') el.href = 'tel:' + value.replace(/[^\d+]/g, '');
    if (kind === 'mailto') el.href = 'mailto:' + value;
  }

  return { read, apply, valid };
})();
