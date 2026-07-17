# MPBP440 V12 Premium — inventaire des assets officiels

Inventaire réalisé sur les 107 fichiers suivis sous `assets/`. Aucun asset n'a été modifié, déplacé, remplacé, régénéré ou supprimé.

## 1. Règle absolue

Les logos, pochettes, photos artistes, flyers, posters, vidéos, audios et visuels d'événements sont des sources officielles protégées. La V12 peut modifier leur présentation : conteneur, ratio, `object-fit`, halo, bordure, chargement différé ou dérivé optimisé validé. Elle ne peut pas écraser l'original.

Un asset sans référence littérale dans le code n'est pas un asset supprimable. Il peut correspondre à une URL partagée, une archive, une source destinée au back-office ou une future publication.

## 2. Vue d'ensemble

| Dossier | Fichiers | Volume approx. | Référencés littéralement | Fonction |
|---|---:|---:|---:|---|
| `assets/clips/` | 4 | 84,90 Mio | 4 | deux vidéos et deux posters récents |
| `assets/videos/` | 2 | 65,79 Mio | 2 | L'Argent et Je sais que tu sais |
| `assets/covers/` | 48 | 12,65 Mio | 41 | catalogue, posters et variantes historiques |
| `assets/makeda-muse/` | 4 | 12,03 Mio | 4 | profil, flyers et événement Makéda |
| `assets/releases/` | 3 | 8,40 Mio | 3 | sorties premium récentes |
| `assets/audio/` | 3 | 2,96 Mio | 2 médias + README | ambiance et jingle |
| `assets/gallery/` | 3 | 1,02 Mio | 3 | galerie homepage |
| `assets/artists/` | 6 | 0,83 Mio | 6 | photos et profils artistes |
| `assets/events/` | 2 | 0,68 Mio | 0 | archives événements |
| `assets/intro/` | 6 | 0,68 Mio | 6 | intro cinématique V11 |
| `assets/logo/` | 2 | 0,42 Mio | 0 | logos historiques/premium |
| `assets/brand/` | 2 | 0,38 Mio | 2 | logo public courant |
| `assets/artist/` | 3 | 0,35 Mio | 2 | anciennes variantes profil |
| `assets/icons/` | 3 | 0,09 Mio | 3 | PWA et favicon |
| `assets/qr/` + QR racine | 10 | < 0,01 Mio | 0 | QR plateformes/contact |
| `assets/screens/` | 4 | < 0,01 Mio | 0 | illustrations plateformes app |
| `assets/seo/` | 1 | < 0,01 Mio | 1 | visuel Open Graph historique |
| SVG racine | 1 | < 0,01 Mio | 0 | emblème MPBP |

Volume total des assets : environ 191 Mio. Les quatre MP4 représentent à eux seuls environ 143 Mio.

## 3. Logos, emblèmes, icônes et intro

| Chemin | Type / taille | Usage actuel | Pages concernées | Duplication / risque | Usage V12 prévu |
|---|---|---|---|---|---|
| `assets/brand/mpbp440-official-logo.jpg` | JPEG, 199 958 o, 600×900 | logo de navigation, fallback image, icône manifeste | homepage, Music Hub, TV, anciennes routes, PWA | déclaré à tort 512×512 et maskable | marque dans header/fallback ; ne pas l'utiliser directement comme icône carrée |
| `assets/brand/mpbp440-official-logo.webp` | WebP, 199 598 o | Open Graph Music Hub et documentation | Music Hub | variante du JPEG, pas un doublon binaire | image sociale ou variante optimisée après vérification |
| `assets/logo/mpbp440-logo-premium.jpg` | JPEG, 280 370 o | aucune référence littérale active | archive | proche fonctionnel du logo public | candidat visuel uniquement après validation de la version officielle |
| `assets/logo/mpbp440-logo.jpg` | JPEG, 162 246 o | aucune référence littérale active | archive | variante historique | préserver, ne pas sélectionner automatiquement |
| `assets/mpbp_emblem.svg` | SVG, 1 104 o | aucune référence littérale active | archive | emblème distinct | icône décorative possible après validation |
| `assets/icons/mpbp440-app-icon.webp` | WebP, 93 596 o | documenté dans anciens patchs | PWA historique | non déclaré dans le manifeste courant | candidat pour dérivés PWA si dimensions conformes |
| `assets/icons/mpbp440-icon.svg` | SVG, 667 o | favicon, badge notification, splash | pages publiques | binaire identique au maskable | favicon et icône UI ; vérifier le safe area |
| `assets/icons/mpbp440-maskable.svg` | SVG, 667 o | ancien manifeste/documentation | PWA historique | copie exacte de `mpbp440-icon.svg` | conserver ; ne pas dédupliquer sans décision |
| `assets/seo/og-mpbp440.svg` | SVG | visuel SEO historique | metadata/outils | usage limité | candidat Open Graph si validé socialement |
| `assets/intro/mpbp-logo-official.webp` | WebP, 0,13 Mio | centre de l'intro et Open Graph homepage | homepage | distinct du logo header | logo du hero/intro V12 |
| `assets/intro/mpbp-universe.webp` | WebP, 0,24 Mio | fond intro | homepage | aucun doublon exact | halo/fond cinématique optionnel |
| `assets/intro/mpbp-canes.webp` | WebP, 0,06 Mio | symbole gauche intro | homepage | aucun | décor contrôlé, masqué en reduced motion si nécessaire |
| `assets/intro/mpbp-feather.webp` | WebP, 0,07 Mio | symbole plume intro | homepage | aucun | décor contrôlé |
| `assets/intro/sparetdee-simon-profile.webp` | WebP, 0,10 Mio | portrait intro | homepage | autre profil dans `assets/artists/` | portrait intro uniquement |
| `assets/intro/juste-une-plume-profile.webp` | WebP, 0,07 Mio | portrait intro | homepage | autre profil dans `assets/artists/` | portrait intro uniquement |

## 4. Photos artistes

| Chemin | Type | Usage actuel | Page / donnée | Duplication éventuelle | Usage V12 prévu |
|---|---|---|---|---|---|
| `assets/artists/sparetdee-simon.webp` | WebP, 0,24 Mio | hero artiste + galerie dédiée | page Sparetdee, `data/gallery.json` | variantes profile et intro | hero artiste et galerie |
| `assets/artists/sparetdee-simon-profile.jpg` | JPEG, 0,14 Mio | carte homepage | homepage | variante WebP profile | carte artiste fallback compatible |
| `assets/artists/sparetdee-simon-profile.webp` | WebP, 0,13 Mio | métadonnées sociales + `data/artists.json` | page artiste | variante JPEG | carte/profile optimisé |
| `assets/artist/sparetdee-avatar.webp` | WebP, 0,14 Mio | données historiques `data.json` | profil/app | variante d'identité | avatar membre/artiste si ce contexte reste actif |
| `assets/artist/sparetdee-photo-reelle.jpg` | JPEG, 0,08 Mio | aucune référence littérale | archive | photo distincte | préserver, usage soumis à validation artistique |
| `assets/artists/juste-une-plume.webp` | WebP, 0,17 Mio | hero artiste + galerie dédiée | page JUP, `data/gallery.json` | variantes profile et intro | hero artiste et galerie |
| `assets/artists/juste-une-plume-profile.jpg` | JPEG, 0,09 Mio | carte homepage | homepage | variante WebP | carte artiste fallback |
| `assets/artists/juste-une-plume-profile.webp` | WebP, 0,06 Mio | metadata + `data/artists.json` | page artiste | variante JPEG | carte/profile optimisé |
| `assets/artist/juste-une-plume-profile.jpg` | JPEG, 0,13 Mio | ancienne donnée `data.json` | historique | autre dossier au singulier | conserver jusqu'à migration des données |
| `assets/makeda-muse/makeda-muse-profile.png` | PNG, 2,94 Mio | intro, homepage, page artiste, galerie, notification | multiples | aucune version optimisée suivie | hero/carte/notification ; créer éventuellement des dérivés, jamais écraser |

Le cadrage recommandé par Figma diffère selon `ArtistCard` et `ArtistHero`. Utiliser un conteneur et `object-position` propres au composant au lieu de modifier les pixels sources.

## 5. Sorties, flyers et posters prioritaires

| Chemin | Type / taille | Usage actuel | Pages concernées | Duplication | Usage V12 prévu |
|---|---|---|---|---|---|
| `assets/releases/sparetdee-simon/brainrot-society-2-0-cover.png` | PNG, 2,89 Mio | sortie disponible prioritaire | homepage, catalogue, artiste | aussi une ancienne pré-sortie WebP | `FeaturedRelease` |
| `assets/releases/sparetdee-simon/dois-je-me-taire-pre-sortie.png` | PNG, 3,19 Mio | prochaine sortie | homepage, catalogue, notification | poster clip séparé | `EditorialFocus` et `UpcomingCard` |
| `assets/releases/makeda-muse/double-pre-sortie-makeda-muse-2026-07-25.png` | PNG, 2,32 Mio | double pré-sortie | homepage, artiste, notification | aucune exacte | `UpcomingCard` |
| `assets/makeda-muse/jour-de-pluie-pre-sortie.png` | PNG, 3,02 Mio | pré-sortie 21/07/2026 | homepage, artiste, notification | aucune exacte | `UpcomingCard` |
| `assets/makeda-muse/sixieme-sens-pre-sortie.png` | PNG, 3,07 Mio | pré-sortie 23/07/2026 | homepage, artiste | aucune exacte | `UpcomingCard` |
| `assets/makeda-muse/live-tiktok-2026-07-11.png` | PNG, 3,00 Mio | événement passé, galerie, notification | homepage/données | ancien flyer événement séparé | archive événement/galerie, ne plus présenter comme futur |
| `assets/clips/makeda-muse/j-existe-cover.png` | PNG, 3,56 Mio | poster clip J'existe | homepage, TV, artiste, notification | aucune exacte | `ClipCard` / poster lecteur |
| `assets/clips/sparetdee-simon/dois-je-me-taire-cover.png` | PNG, 3,99 Mio | poster clip Dois-je me taire ? | homepage, TV, notification | flyer pré-sortie séparé | `ClipCard` / poster lecteur |
| `assets/covers/largent-officiel.webp` | WebP, 0,30 Mio | poster L'Argent | homepage, TV, SEO TV | variantes `l-argent.webp`, `largent.webp`, `l-argent`/`largent` | poster canonique de l'ancre L'Argent |
| `assets/covers/je-sais-juste-une-plume.webp` | WebP, 0,31 Mio | poster Je sais que tu sais | homepage, TV, artiste, notification | identique à un asset event | poster canonique JUP |

## 6. Vidéos officielles

| Chemin | Taille | Usage actuel | URL / page | Risque | Usage V12 prévu |
|---|---:|---|---|---|---|
| `assets/videos/l-argent.mp4` | 32,75 Mio | lecteur direct | `/mpbp-tv/index.html#l-argent` | réseau mobile | vidéo vedette, chargée à l'interaction ou metadata contrôlée |
| `assets/videos/juste-une-plume/je-sais-que-tu-sais-clip-exclusif-2026.mp4` | 33,04 Mio | lecteur direct portrait | `#clip-je-sais-que-tu-sais` | ratio et Safari | lecteur unique compatible portrait |
| `assets/clips/makeda-muse/j-existe-clip-exclusif-2026.mp4` | 24,08 Mio | lecteur direct | `#clip-j-existe` | coût réseau | clip local avec poster réel |
| `assets/clips/sparetdee-simon/dois-je-me-taire-clip-exclusif.mp4` | 53,26 Mio | lecteur direct | `#clip-dois-je-me-taire` | plus gros fichier du dépôt | lazy activation prioritaire |

Ne pas renommer ces chemins : les pages, métadonnées structurées et liens directs les référencent. Toute version de livraison compressée doit porter un nouveau nom, rester optionnelle et conserver l'original.

## 7. Audios officiels

| Chemin | Taille | Usage actuel | Page | Usage V12 prévu |
|---|---:|---|---|---|
| `assets/audio/mpbp-ambiance.mp3` | 1,82 Mio | ambiance globale contrôlée par `script.js` | pages chargeant le script global | contrôleur audio V12, opt-in |
| `assets/audio/mpbp-intro-jingle.mp3` | 1,14 Mio | intro cinématique | homepage | jingle après consentement explicite |
| `assets/audio/README_AUDIO.txt` | 0,2 Kio | documentation | dépôt | préserver comme note de provenance |

## 8. Galerie et événements

| Chemin | Usage actuel | Source | Duplication | Usage V12 prévu |
|---|---|---|---|---|
| `assets/gallery/sparetdee-reflexion.webp` | galerie homepage | `data.json.gallery` | aucune | Galerie / Artistes |
| `assets/gallery/tarot-sparetdee.webp` | galerie homepage | `data.json.gallery` | aucune | Galerie / Artistes ou Archives |
| `assets/gallery/neuvieme-merveille.webp` | galerie homepage | `data.json.gallery` | aucune | Galerie / Archives |
| `assets/events/je-sais-sortie-officielle.webp` | aucune référence littérale active | archive | copie exacte de `je-sais-juste-une-plume.webp` | archive, ne pas supprimer |
| `assets/events/live-tiktok-fete-musique-21062026-full.webp` | aucune référence littérale active | archive | autre événement que le PNG Makéda | Galerie / Événements archivés |

La galerie V12 doit référencer les assets par chemin sans les dupliquer physiquement. Un même fichier peut apparaître dans plusieurs catégories via les métadonnées.

## 9. Catalogue des pochettes

Les 48 fichiers de `assets/covers/` constituent le catalogue et ses variantes. Les fichiers ci-dessous sont référencés par `data.json`, `data/releases.json`, `data/music-library.json`, les pages TV ou artiste, sauf mention contraire.

| Chemin | Usage courant / remarque | Usage V12 |
|---|---|---|
| `assets/covers/11-hivers-et-11-etes.webp` | catalogue | carte sortie |
| `assets/covers/11-hivers-11-etes.webp` | aucune référence littérale | archive/alias à préserver |
| `assets/covers/3-minutes-35.webp` | catalogue | carte sortie |
| `assets/covers/aujourdhui.webp` | catalogue | carte sortie |
| `assets/covers/bizouzouzou-ours.webp` | catalogue | carte sortie |
| `assets/covers/bouffe-ma-vie.webp` | catalogue | carte sortie |
| `assets/covers/brainrot-society-2-0-pre-sortie.webp` | aucune référence littérale | archive pré-sortie |
| `assets/covers/brainrot-society.webp` | catalogue | carte sortie |
| `assets/covers/climat-sous-controle.webp` | catalogue | carte sortie |
| `assets/covers/comme-un-pansement.webp` | catalogue | carte sortie |
| `assets/covers/dans-lombre-des-puissant.webp` | catalogue | carte sortie |
| `assets/covers/de-saint-benoit-a-saint-andre-remix.webp` | catalogue | carte sortie |
| `assets/covers/dernier-chapitre.webp` | catalogue | carte sortie |
| `assets/covers/double-sortie-largent-je-vous-pousse-tous.webp` | visuel double sortie | archive/galerie si validé |
| `assets/covers/fiainana-tsotra.webp` | catalogue | carte sortie |
| `assets/covers/je-sais-juste-une-plume.webp` | poster JUP canonique | TV + carte clip |
| `assets/covers/je-sais-que-tu-sais.jpg` | variante JPEG | archive/candidat social |
| `assets/covers/je-sais-que-tu-sais.webp` | aucune référence littérale | variante à préserver |
| `assets/covers/je-vous-pousse-tous-officiel.webp` | aucune référence littérale | archive officielle |
| `assets/covers/je-vous-pousse-tous.webp` | catalogue | carte sortie |
| `assets/covers/l-argent.webp` | variante catalogue | carte sortie historique |
| `assets/covers/la-france-se-souleve.webp` | catalogue | carte sortie |
| `assets/covers/la-mista-gringa.webp` | catalogue | carte sortie |
| `assets/covers/la-nuit-tu-pleurs-remix.webp` | catalogue | carte sortie |
| `assets/covers/la-route-doree-remix.webp` | catalogue | carte sortie |
| `assets/covers/largent-officiel.webp` | poster TV canonique | TV vedette |
| `assets/covers/largent.webp` | catalogue | carte sortie |
| `assets/covers/lasticot-getga.webp` | catalogue | carte sortie |
| `assets/covers/le-bizz-cest-bon-remix.webp` | catalogue | carte sortie |
| `assets/covers/le-reseau-fantome.webp` | catalogue | carte sortie |
| `assets/covers/le-systeme-officiel.webp` | aucune référence littérale | archive officielle |
| `assets/covers/le-systeme-pre-sortie-27-06-2026.webp` | galerie dédiée | archive/pré-sortie |
| `assets/covers/le-systeme.webp` | catalogue | carte sortie |
| `assets/covers/le-temps-ou-cousin.webp` | catalogue | carte sortie |
| `assets/covers/legalise-la-kalite.webp` | catalogue | carte sortie |
| `assets/covers/les-rues-sembrasent.webp` | catalogue | carte sortie |
| `assets/covers/loin-de-mon-ile.webp` | catalogue | carte sortie |
| `assets/covers/main-tendues.webp` | catalogue | carte sortie |
| `assets/covers/miel-et-soie.webp` | catalogue | carte sortie |
| `assets/covers/monde-alternatif.webp` | catalogue | carte sortie |
| `assets/covers/pou-2-lard-440.webp` | catalogue | carte sortie |
| `assets/covers/prince-des-etoiles-en-mode-vegeta-remix.webp` | catalogue | carte sortie |
| `assets/covers/prince-des-etoiles.webp` | aucune référence littérale | archive single |
| `assets/covers/reves-et-cauchemards-officiel.webp` | aucune référence littérale | archive officielle |
| `assets/covers/reves-et-cauchemards.webp` | catalogue + hero background | carte sortie/hero si conservé |
| `assets/covers/rien-de-plus-rien-de-moins.webp` | catalogue | carte sortie |
| `assets/covers/savoir-la-savoure.webp` | catalogue | carte sortie |
| `assets/covers/un-soleil-dans-lombre.webp` | catalogue | carte sortie |

## 10. QR codes et écrans applicatifs

Les QR suivants existent et ne sont pas référencés actuellement :

- `assets/qr/qr-apple-music.png` ;
- `assets/qr/qr-deezer.png` ;
- `assets/qr/qr-facebook.png` ;
- `assets/qr/qr-instagram.png` ;
- `assets/qr/qr-spotify.png` ;
- `assets/qr/qr-tiktok.png` ;
- `assets/qr/qr-youtube.png` ;
- `assets/qr_apple_music.png` ;
- `assets/qr_contact.png` ;
- `assets/qr_deezer.png`.

Les SVG `assets/screens/app-android.svg`, `app-ios.svg`, `app-ipad.svg` et `app-windows.svg` ne sont pas référencés littéralement. Ils peuvent rester des illustrations de documentation/installation. La V12 ne doit pas les réintroduire sans vérifier qu'ils correspondent encore au parcours PWA réel.

## 11. Duplications binaires exactes

Trois groupes ont le même SHA-256 :

| Groupe | Fichiers | Décision étape 1 |
|---|---|---|
| Poster JUP | `assets/covers/je-sais-juste-une-plume.webp` et `assets/events/je-sais-sortie-officielle.webp` | conserver les deux chemins |
| Icône SVG | `assets/icons/mpbp440-icon.svg` et `assets/icons/mpbp440-maskable.svg` | conserver les deux rôles |
| QR Apple | `assets/qr/qr-apple-music.png` et `assets/qr_apple_music.png` | conserver les deux chemins |

La duplication exacte ne suffit pas à autoriser une suppression : les URL peuvent être des contrats publics.

## 12. Assets sans référence littérale détectée

La recherche a trouvé 28 fichiers non référencés littéralement, notamment les variantes de pochettes indiquées plus haut, les deux assets événements, les logos `assets/logo/`, les QR, les écrans app, `assets/mpbp_emblem.svg` et `assets/artist/sparetdee-photo-reelle.jpg`.

Statut : **archive à préserver**, pas « inutile ». Avant toute future rationalisation, il faudra rechercher les URL dans l'historique Git, les réseaux sociaux, les pages indexées, les notifications déjà envoyées et les exports du back-office.

## 13. Stratégie V12 pour les médias

1. conserver chaque source officielle à son chemin actuel ;
2. ajouter dans les données un identifiant stable, un chemin source, un alt text, un type et les contextes d'usage ;
3. générer seulement après validation des dérivés nommés distinctement pour cartes et mobile ;
4. ne jamais faire dépendre une URL publique d'un hash de build ;
5. appliquer `width`, `height`, `loading`, `decoding` et `object-position` dans le rendu ;
6. charger les MP4 à la demande et n'activer qu'un lecteur à la fois ;
7. tester les posters et profils sur fond noir, mobile 390 px, desktop 1440 px et écran Retina ;
8. documenter toute nouvelle dérivation sans supprimer l'original.

Cet inventaire constitue la liste de protection initiale de la V12. Toute suppression ou substitution d'asset doit faire l'objet d'une mission séparée et d'une validation explicite.
