// Anti-clickjacking : GitHub Pages ne permet pas l'en-tête frame-ancestors.
// La page reste masquée (admin.css) tant qu'on n'a pas vérifié qu'elle n'est pas dans une iframe.
if (window.top === window.self) {
  document.documentElement.classList.add('adm-unframed');
} else {
  window.top.location = window.self.location.href;
}
