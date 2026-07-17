# Audit final V12

## État

La V12 est prête pour une recette HTTPS séparée, pas pour un déploiement production. La branche `v12-premium` garde les routes, assets et ancres publiques V11.

## Correction finale

Un overflow de 12 px à 375 px, provoqué par les liens plateformes injectés dans les pages artistes, a été corrigé dans `artistes/v12-artist.css`. Les tests de largeur sur homepage, Music Hub, TV, artistes, actualités et galerie sont sans overflow après cette correction.

## Tests réalisés

- Syntaxe de tous les JavaScript V12, `script.js`, `artist.js` et `sw.js`.
- Validation JSON et manifeste.
- HTTP local pour les routes V12 et assets critiques.
- Responsive : 1440, 1280, 1024, 768, 430, 390 et 375 px.
- Console locale : aucune erreur critique durant la navigation testée.
- Les quatre ancres MPBP TV restent présentes et les vidéos conservent `preload="none"`.

## Performance et accessibilité

Les MP4 ne sont ni précachés ni préchargés. Les images ajoutées utilisent lazy loading et ratios. Les menus, lightbox et lecteurs reposent sur boutons/liens nommés, focus visible, Échap et retour du focus. Le test VoiceOver/NVDA et une mesure de contraste sur appareils réels restent requis avant merge.

## Notifications et PWA

La cloche reste locale : badge, lu/non lu et App Badge éventuel, sans Web Push serveur. Le manifest emploie les SVG carrés existants. Le service worker final précache le shell, exclut MP4/assets lourds et ne supprime que les caches `mpbp440-*`.
