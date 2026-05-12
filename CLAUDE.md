# CLAUDE.md — Utopi'C Website (HTML statique → GitHub Pages)

## Projet

Migration du site Wix de Cléa Laubier (Utopi'C) vers du HTML/CSS/JS statique hébergé sur GitHub Pages.
URL cible : `https://utopi-c.com`
Local : `C:\Documents\Projects\Startup\ClaudeCode\CleaPortfolio\utopic`

## ⚠️ Règles de développement — LIRE EN PREMIER

### Mode économie de tokens

**Tu codes en mode minimal.** Pas de refactor global, pas de réécriture complète de fichiers.

- **Édite chirurgicalement** : modifie UNIQUEMENT les lignes concernées. Ne réécris jamais un fichier entier pour changer 3 lignes.
- **Pas d'over-engineering** : pas de build tools, pas de frameworks, pas de bundlers. C'est du HTML/CSS/JS vanilla servi en statique.
- **Réponds court** : explique en 1-2 phrases ce que tu as fait, pas de pavés. Si je veux plus de détails, je demande.
- **Un changement = un commit logique** : ne mélange pas 5 sujets dans un seul passage.
- **Vérifie avant de coder** : lis le fichier concerné d'abord, repère la ligne exacte, puis édite. Pas de réécriture "au cas où".
- **Pas de commentaires inutiles** dans le code. Le HTML/CSS est auto-documenté. Commente uniquement les hacks ou les trucs non-évidents.
- **Ne touche pas aux fichiers non demandés.** Si je dis "fixe le footer", ne refactor pas le header en passant.

### Quand je dis "applique sur toutes les pages"

Les pages du site sont :
```
index.html
a-propos.html
portfolio.html
identite-visuelle.html
communication-print.html
communication-digitale.html
contact.html
mentions-legales.html
politique-confidentialite.html
```
Applique le changement sur chacune. Le header et le footer sont dupliqués dans chaque fichier (pas de composants/includes).

## Stack technique

- **HTML5 / CSS3 / JS vanilla** — Pas de framework, pas de React, pas de build step
- **Hébergement** : GitHub Pages (statique uniquement, pas de server-side)
- **Fonts** : Google Fonts (voir charte ci-dessous)
- **Images** : dossier `assets/images/`, formats JPG/PNG/WebP
- **Logos** : dossier `assets/logos/`
- **CSS** : fichier(s) dans `assets/css/` ou `<style>` inline selon la page

## Charte graphique (source : brief Cléa — Mai 2025)

### Typographie
| Usage | Font | Weight | Source |
|-------|------|--------|--------|
| Titres (h1, h2, h3) | **Bodoni Moda** | 400-700 | Google Fonts |
| Corps (p, spans, nav, boutons) | **Montserrat** | 147 (variable) ou 300 fallback | Google Fonts |

Import Google Fonts :
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Montserrat:wght@100..900&display=swap" rel="stylesheet">
```

### Couleurs
| Nom | Hex | Usage |
|-----|-----|-------|
| Navy | `#12263E` | Texte principal, header, titres |
| Jaune/Or | `#e9a708` | CTA, boutons, liens actifs, accents |
| Beige | `#f5eee6` | Fond hero, fond sections claires |
| Blanc | `#ffffff` | Fond principal |
| Olive/Kaki | `#4A5D52` | Fond section "Expériences" / dark |
| Taupe | `#cec0b3` | Rectangle derrière carrousels portfolio |

### Meta
- `<title>` : "Utopi'C — Chargée de communication 360°"
- Favicon : logo Utopi'C

## Structure des pages

### Navbar (toutes les pages)
- Logo Utopi'C à gauche (lien vers index.html)
- Menu à droite : ACCUEIL | À PROPOS | PORTFOLIO (dropdown: IV, Print, Digital) | CONTACT
- Bouton jaune "Contact" → contact.html
- Barre navy en haut avec icônes sociales (Instagram, Facebook, LinkedIn)

### Footer (toutes les pages)
- Logo signature Cléa (pas le logo UC rond)
- Tagline : "Crée avec passion / Communiquez avec émotion."
- Icônes sociales
- Navigation 3 colonnes :
  - Col 1 : Accueil, À propos, Portfolio, Contact
  - Col 2 : Identité visuelle, Print, Digitale
  - Col 3 : Blog/FAQ, Mentions légales, Politique confid., CGV
- Barre gold "2026 © Utopi'C" centrée

### Page Accueil (index.html)
1. Hero : titre + sous-titre + CTA "Un projet ? Parlons-en !" + photo forme organique
2. Réalisations : galerie/carrousel projets
3. Prestations : 3 cartes (Identité visuelle, Print, Digital) + titre "Imaginer, concevoir ensemble / Rayonner."
4. Expériences : section dark (fond olive) — Presse + Avis clients (carrousel)

### Autres pages
- **À Propos** : photo blob, bio, formations, expériences, compétences (hard + soft skills)
- **Portfolio** : encart + 3 catégories
- **IV / Print / Digital** : titre + description (rect #cec0b3), carrousel projets, "Pq choisir Utopi'C", navigation inter-catégories
- **Contact** : formulaire (reprendre le style Wix), icônes sociales (logos seuls)
- **Mentions légales / Politique confid.** : texte statique

## Ce qui est validé par Cléa (ne pas toucher)

- Layout bandeau avis clients ✓
- Structure footer ✓ (mais contenu à modifier)
- Bandeau défilant accueil ✓
- Pages portfolio 3 services ✓
- "Ils m'ont fait confiance" ✓
- Sections avantages/missions/pq choisir dans IV/Print/Digital ✓
- Titre page contact ✓