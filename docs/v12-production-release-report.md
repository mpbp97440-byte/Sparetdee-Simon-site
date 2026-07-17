# MPBP440 V12 — hotfix mobile MPBP TV

## Correction appliquée

Sur iPhone, la règle générique `nav` plaçait la playlist MPBP TV en `position: absolute` avec `top: 74px`. La playlist restait donc visuellement au-dessus de la carte `#l-argent` malgré son rôle de navigation dans le flux.

La feuille V12 MPBP TV remet explicitement cette navigation dans le flux mobile (`position: relative`, `top: auto`), supprime la marge négative, limite sa largeur au conteneur et crée un espacement de 28 px avant la première carte. Elle ajoute aussi le dégagement bas nécessaire au contrôleur audio et aux safe areas iPhone.

## Fichiers

- `assets/css/v12-mpbp-tv.css`
- `mpbp-tv/index.html` (version de feuille CSS)
- `sw.js` (cache `mpbp440-v12-premium-production-202607`)

## Validation

- Largeurs iPhone : 375, 390, 393, 402, 414 et 430 px.
- Régression : 768, 1024 et 1440 px.
- Les quatre ancres publiques MPBP TV sont conservées : `#l-argent`, `#clip-je-sais-que-tu-sais`, `#clip-j-existe`, `#clip-dois-je-me-taire`.
- Les MP4 ne sont pas ajoutés au pré-cache.
- Le cache supprime les anciennes entrées `mpbp440-*` lors de l’activation.

## Publication et rollback

- Le hotfix est publié depuis `v12-premium`, puis fusionné vers `main` avec un merge explicite après validation Preview.
- `v12.0.0` existe déjà et reste inchangé ; aucun tag ni historique n’est réécrit.
- Le rollback immédiat reste disponible via `v11-stable-before-v12`.
