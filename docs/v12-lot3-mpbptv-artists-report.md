# MPBP440 V12 Premium — rapport du lot 3

Date : 17 juillet 2026

## MPBP TV Premium

La page `mpbp-tv/index.html` a reçu une couche visuelle V12 : hero cinéma, playlist d’ancres, lecteur mis en avant, sections de clips, partage existant et suggestions. Les quatre contrats publics sont inchangés : `#l-argent`, `#clip-je-sais-que-tu-sais`, `#clip-j-existe` et `#clip-dois-je-me-taire`.

Les quatre lecteurs utilisent les MP4 officiels déjà présents, avec leurs posters existants et `preload="none"`. Le module V12 n’ajoute aucun média, aucune iframe et veille à ce qu’une seule vidéo joue à la fois. Les boutons Regarder font défiler vers le lecteur concerné puis demandent sa lecture ; le navigateur conserve son comportement de contrôle natif si la lecture est refusée.

## Pages artistes Premium

Les routes publiques de Sparetdee Simon, Juste Une Plume et Makéda Muse sont conservées. Leur contenu éditorial existant est préservé et enrichi par une couche partagée : hero noir/or, dernière sortie depuis `data/releases.json` lorsqu’elle existe, discographie existante, clip MPBP TV, galerie d’assets officiels et accès Music Hub/MPBP TV.

Les données ne sont pas migrées : `data/releases.json` reste la source de la discographie et les fichiers HTML continuent de porter les biographies validées. Les cartes galerie réutilisent des photos, pochettes et flyers déjà suivis.

## Accessibilité et performance

- Contrôles natifs vidéo, posters, liens et boutons à libellé explicite.
- Liens de playlist et ancres accessibles au clavier.
- `loading="lazy"` pour les images ajoutées dans les galeries.
- Cibles interactives de 44 px minimum dans la couche V12.
- Aucun nouveau MP4, aucune duplication d’asset, aucune iframe vidéo ajoutée.
- `prefers-reduced-motion` reste pris en charge par la fondation V12 ; le défilement du CTA vidéo passe en mode instantané dans ce cas.

## Tests effectués

- Syntaxe : `node --check` pour les deux nouveaux modules, `artist.js`, `script.js` et `sw.js` : OK.
- JSON : `data.json`, `data/releases.json` et `data/gallery.json` : OK.
- MPBP TV : quatre ancres présentes, quatre lecteurs avec `preload="none"`, aucune iframe et une seule lecture simultanée gérée par le module.
- Responsive : 1440, 1024, 768, 430, 390 et 375 px sur MPBP TV et les trois pages artistes ; aucun overflow horizontal après correction de la couche artiste.
- Console : aucune erreur critique durant la recette locale.

## Périmètre préservé

`main`, `origin/main`, `CNAME`, service worker, GitHub Pages et production ne sont pas modifiés. Les deux fichiers locaux protégés restent présents et non suivis.
