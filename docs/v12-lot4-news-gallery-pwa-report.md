# MPBP440 V12 Premium — rapport du lot 4

Date : 17 juillet 2026

## Fichiers et architecture

- `/actu/index.html` est la page Actualités V12. `data/news.json` est son unique source éditoriale ; les notifications restent indépendantes dans `data/notifications.json` pour la cloche et les états lu/non lu.
- `/galerie/index.html` est la page Galerie V12. `data/gallery.json` reste la base de la galerie et est complétée à l’affichage par des posters, flyers et archives officiels existants, sans modifier les données ni les assets.
- `assets/js/v12-content-experience.js` porte les filtres, le partage et la lightbox, sans variables globales.
- `assets/css/v12-content.css` isole l’interface noir/or responsive.

## Actualités, galerie et radio

Les actualités proposent les filtres Tout, Sorties, Clips, Artistes, Événements et Label. Le live TikTok passé est exclu de la vue active. Chaque carte rend date, catégorie, résumé, CTA existant et partage.

La galerie propose les catégories demandées lorsqu’elles disposent d’assets réels. La lightbox offre précédent/suivant, Échap, flèches clavier, focus trap, retour du focus et restauration du défilement.

La homepage conserve la radio et les plateformes existantes ; le CTA Spotify pointe vers la playlist officielle de `data/radio.json`, sans lecture automatique ni ajout d’iframe.

## PWA et notifications

Le manifeste utilise désormais les icônes SVG carrées existantes au lieu de déclarer le logo portrait comme carré. Le service worker V12 précache un shell léger, ne met jamais les MP4/assets lourds en cache, ne met pas en cache les URL à query string et ne supprime que les caches `mpbp440-*`. La cloche et ses états localStorage existants ne sont pas modifiés ; aucune promesse de Web Push serveur n’est ajoutée.

## Accessibilité, performance et limites

Les filtres sont de vrais boutons avec état sélectionné ; les images ont des textes alternatifs, dimensions réservées et chargement différé. Les contrôles lightbox sont utilisables au clavier et font au moins 44 px. Les images officielles ne sont ni remplacées ni supprimées.

Le cache et le manifeste sont validables localement, mais l’installation et le comportement hors ligne complet doivent être vérifiés sur une preview HTTPS au Lot 5. Aucune modification GitHub Pages, CNAME ou production n’est réalisée.
