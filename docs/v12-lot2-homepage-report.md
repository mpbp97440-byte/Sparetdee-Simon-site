# MPBP440 V12 Premium — rapport du lot 2

Date : 17 juillet 2026
Branche : `v12-premium`

## Réalisation

La homepage est recomposée en couche V12 sans modification des routes publiques, du service worker, du CNAME, des pages artistes, du Music Hub ou de MPBP TV. Les sections livrées sont : hero, dernière sortie, à la une, prochaines sorties avec compteurs, aperçu MPBP TV, artistes, actualités, événement conditionnel, galerie et plateformes.

## Sources et assets

- `data.json` est la source canonique retenue pour la dernière sortie, les sorties à venir et les liens de plateformes. Elle est déjà consommée par le Music Hub : aucune migration risquée n’est introduite.
- `data/news.json` est la source du magazine. Les quatre éléments affichés excluent l’ancien live TikTok afin qu’il ne soit pas présenté comme une actualité active.
- `data/events.json` est la source de l’événement. La section est masquée s’il n’existe aucun événement futur ; le live du 11 juillet 2026 ne peut donc pas réapparaître comme à venir.
- `data/gallery.json` alimente l’aperçu galerie, pour rester cohérent avec la galerie dédiée.
- Les pochettes, portraits, logos et posters sont tous des assets existants du dépôt ; aucun média n’a été créé, déplacé ou supprimé.

## Comptes à rebours

Un moteur unique dans `assets/js/v12-homepage.js` initialise chaque compteur de la homepage. Les dates ISO restent dans `data.json`, le rendu est français et chaque compteur bascule vers « Disponible maintenant » à échéance, sans valeur négative ni intervalle persistant.

## Responsive, accessibilité et performance

- Grilles fluides desktop et empilement mobile ; les CTA conservent la hauteur minimale V12 de 44 px.
- Images hors écran en `loading="lazy"`, dimensions et ratios fixés pour limiter les sauts de mise en page.
- Les cartes MPBP TV utilisent des posters et des liens profonds : aucun MP4 ni iframe vidéo n’est chargé sur la homepage.
- Hiérarchie H1/H2/H3, textes alternatifs descriptifs, liens nommés, focus de la fondation V12 et `prefers-reduced-motion` sont conservés.

## Tests

- Validation JSON de `data.json`, `data/news.json`, `data/events.json` et `data/gallery.json` : OK.
- `node --check` : `assets/js/v12-homepage.js`, `assets/js/v12-navigation.js`, `script.js`, `artistes/artist.js`, `sw.js` : OK.
- `git diff --check` : OK.
- Les ancres MPBP TV prioritaires restent inchangées dans les liens homepage.
- Contrôle de régression statique : les fichiers MPBP TV, Music Hub, artistes, `sw.js`, `CNAME` et les assets ne sont pas modifiés.

## Limites et suite

La recette sur navigateurs et appareils physiques reste à effectuer avant toute fusion. Le lot 3 peut poursuivre la migration des pages de contenu ; il ne doit pas modifier la source canonique sans stratégie de compatibilité validée.
