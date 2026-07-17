# MPBP440 V12.0.5 — Homepage logo and artists gallery fix

## Périmètre

- Homepage : position et taille du logo officiel MPBP440 uniquement.
- Galerie : ajout de Makéda Muse au filtre Artistes uniquement.
- MPBP TV, ancres publiques, vidéos, données musicales et `CNAME` ne sont pas modifiés.

## Cause et corrections

Le logo du Hero était la seconde colonne de la grille et était aligné en bas : il recouvrait donc le flyer. Sur desktop, il est maintenant positionné dans l’espace indépendant situé entre le contenu et le flyer, avec une taille `clamp(5.4rem, 7vw, 7.5rem)` et `object-fit: contain`.

Sur mobile, le logo n’est plus placé après les CTA dans la zone du flyer. Il est affiché avant le bloc texte, à une largeur maximale de `26vw` (donc sous la limite de 28 %), sans déformation.

La galerie manquait de donnée Makéda Muse. L’asset officiel ajouté est `assets/makeda-muse/makeda-muse-profile.png`. Le filtre Artistes affiche désormais les trois artistes avec le même ratio, une lightbox et des liens vers leurs pages artistes.

## Fichiers modifiés

- `index.html`
- `assets/css/v12-0-5-home-logo-gallery.css`
- `galerie/index.html`
- `assets/js/v12-content-experience.js`
- `data/gallery.json`

## Validations

- Hero : 1920, 1600, 1440, 1366, 1280, 1024, 430, 414, 402, 393, 390 et 375 px — aucun overflow horizontal détecté.
- Galerie Artistes : trois cartes validées à 1440 px, deux colonnes à 768 px, une colonne à 430 et 390 px.
- Lightbox Makéda validée ; URL image `assets/makeda-muse/makeda-muse-profile.png`.
- `node --check` validé pour `script.js`, `assets/js/v12-homepage.js`, `assets/js/v12-content-experience.js` et `sw.js`.
- Tous les JSON et le manifeste sont valides ; IDs de homepage uniques ; HTTP local 200 pour homepage, galerie, CSS et portrait Makéda ; `git diff --check` validé.

## Publication

La preview est publiée avant la fusion production. Les commits, tag V12.0.5 et runs GitHub Pages sont renseignés après publication.
