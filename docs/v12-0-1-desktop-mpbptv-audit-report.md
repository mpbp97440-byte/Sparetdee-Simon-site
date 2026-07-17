# MPBP440 V12.0.1 — audit desktop et MPBP TV

## Constats et corrections

- **Intro desktop** : les surcharges V9/V12 faisaient dépendre la première ligne de grille d’une hauteur minimale trop grande. Sur les écrans bas, des visuels artistes pouvaient sortir en haut. La scène utilise maintenant une hauteur utile bornée par `100dvh`, des images `contain` bornées par la hauteur et un espacement vertical fluide.
- **Contrôleur d’ambiance** : les styles historiques mélangeaient flex et grilles sans gabarit desktop. Le contrôleur est désormais une grille explicite : action principale, coupe-son, état, puis volume sur une ligne dédiée. Les cibles font au moins 44 px.
- **MPBP TV** : les quatre cartes vidéo indépendantes rendaient quatre lecteurs. Un lecteur central possède désormais une source active, une playlist, les métadonnées, le partage et le lien artiste. Les anciennes cartes conservent les IDs publics mais sont masquées ; aucun MP4 supplémentaire n’est préchargé.
- **YouTube** : six vidéos historiques sont rétablies depuis `data.json`, avec les IDs déjà utilisés par le rendu V11 (`9cc20bb`, rendu dynamique `#videoList`) : `HKzweo2V-iw`, `GiGwGXqL1DY`, `EzsriXQY-04`, `RV87WDHFjKE`, `0YEqshdl7jI`, `zHx-OHSAKcs`.

## Validation

- Desktop : 1920×1080, 1600×900, 1440×900, 1366×768, 1280×720 et 1024×768.
- Non-régression mobile : 430, 414, 402, 393, 390 et 375 px.
- Hashes préservés : `#l-argent`, `#clip-je-sais-que-tu-sais`, `#clip-j-existe`, `#clip-dois-je-me-taire`.
- JS V12, JSON, manifeste, routes locales et `git diff --check` sont validés avant publication.
- Les iframes YouTube utilisent `loading="lazy"`; les vidéos locales utilisent `preload="none"`.

## Limites et rollback

- La lecture effective des MP4 et des iframes YouTube dépend du navigateur et des politiques des plateformes ; aucun autoplay avec son n’est imposé.
- Le rollback reste disponible avec le tag `v11-stable-before-v12`.
