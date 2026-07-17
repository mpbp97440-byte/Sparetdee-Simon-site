# MPBP440 V12 Premium — mapping Figma vers le site réel

Ce document rapproche les maquettes V12 du dépôt V11 sans lancer l'intégration. Les données, dates, URL et assets du dépôt restent la source de vérité. Figma fournit la structure, la hiérarchie visuelle, les composants et les règles responsive.

## 1. Sources Figma auditées

| Vue | Node | Cadre principal observé |
|---|---|---|
| Homepage desktop | `12:2` | 1440 × 13 828, frame `16:2` |
| Homepage mobile | `12:3` | 390 × 7 457, frame `16:301` |
| MPBP TV | `12:4` | desktop 1440 × 2 075 + mobile, frame `16:487` |
| Pages artistes | `12:5` | trois frames desktop, première frame `16:595` |
| Actualités | `12:6` | desktop 1440 × 865 + mobile, frame `16:712` |
| Galerie | `12:7` | desktop 1440 × 1 650 + mobile, frame `16:894` |
| Design System | `12:8` | 1440 × 20 719, frame `14:3` |

L'audit a utilisé les métadonnées structurées et des captures des frames. L'appel de contexte design complet exigeait une sélection active dans Figma et n'a pas pu être utilisé sur ces liens. Les métadonnées détaillées, textes, dimensions, hiérarchies et captures étaient néanmoins accessibles. La lecture des définitions de variables sur `14:3` a renvoyé `{}` : les tokens sont documentés visuellement dans le canvas, mais ne semblent pas liés à des variables Figma exploitables.

## 2. Règle d'interprétation

Les maquettes ne doivent pas être copiées pixel par pixel.

- Plusieurs conteneurs internes ont des largeurs `1`, `20` ou `100` px et des hauteurs de plusieurs milliers de pixels : ce sont des artefacts d'auto-layout ou de redimensionnement.
- Les captures montrent de grandes zones vides, des grilles comprimées et des placeholders sans visuels réels.
- Plusieurs dates et événements sont en 2025 alors que les données réelles du dépôt sont en juillet 2026.
- Certains textes sont génériques : biographies répétées, « Titre à venir », artistes fictifs du design system, événement « Studio 44 ».
- Les composants « abonnés », « réservation », archives et certaines plateformes ne disposent pas encore d'une donnée ou fonction équivalente dans le dépôt.

La V12 doit donc reprendre :

1. l'ordre des sections ;
2. les niveaux typographiques ;
3. le système noir/or ;
4. les types de cartes et contrôles ;
5. les règles responsive et accessibilité ;
6. les vrais contenus, dates, liens, ancres et médias du dépôt.

## 3. Design system V12

### 3.1 Palette à transformer en tokens CSS

| Token proposé | Valeur Figma | Usage |
|---|---|---|
| `--color-bg` | `#050505` | fond principal |
| `--color-bg-secondary` | `#090806` | bandes et surfaces secondaires |
| `--color-surface` | `#111111` | cartes |
| `--color-gold` | `#D4AF37` | accent principal |
| `--color-gold-light` | `#F6D46B` | hover et éléments secondaires |
| `--color-gold-bright` | `#FFE49A` | highlights et focus |
| `--color-text` | `#F8EED0` | texte principal |
| `--color-text-secondary` | `#CFC5A7` | texte secondaire |
| `--color-text-muted` | `#8E846C` | légendes, à revalider en contexte |

Le canvas documente aussi `Gold Linear`, `Gold Radial`, `Dark Overlay`, `Cinematic Vignette` et `Halo Doré`. Ils doivent devenir des tokens de gradient limités à des usages précis, pas des valeurs recopiées dans chaque composant.

### 3.2 Typographie

Échelle nominale Figma desktop :

| Style | Taille | Graisse indiquée |
|---|---:|---|
| Display XL | 48 px | Extra Bold |
| Display L | 40 px | Bold |
| Heading 1 | 32 px | Bold |
| Heading 2 | 28 px | Semi Bold |
| Heading 3 | 24 px | Semi Bold |
| Body L | 18 px | Regular |
| Body M | 16 px | Regular |
| Body S | 14 px | Regular |
| Caption | 12 px | Regular |
| Badge | 11 px | Semi Bold |
| Button | 14 px | Semi Bold |

La famille de police n'est pas explicitement remontée dans les métadonnées auditées. Ne pas introduire une police distante sur une supposition. Prévoir des variables de famille et valider le choix visuel avant chargement d'une webfont. Les tailles doivent être fluides avec `clamp()` ; la règle Figma « -25 % mobile » est une intention, pas une opération arithmétique obligatoire.

### 3.3 Espacements et grilles

- échelle : 4, 8, 12, 16, 24, 32, 48, 64, 80, 96, 120 px ;
- desktop : 12 colonnes, gouttières 24 px, marges 80 px, largeur utile maximale 1 280 px ;
- tablette : 8 colonnes, marges 32 px ;
- mobile 390/430 : 4 colonnes, gouttières 16 px, marges 20 px ;
- aucune largeur fixe de maquette ne doit produire de débordement ;
- les sections de 2 500 px observées dans le fichier ne doivent pas être reproduites.

### 3.4 Composants définis par Figma

- boutons Primary, Secondary, Ghost et Icon avec états default/hover/pressed/focus/disabled et tailles S/M/L ;
- badges Nouveau, Clip, Pré-sortie, Disponible, Exclusif, Live, Événement, Actualité ;
- header desktop normal/scroll et header mobile fermé/ouvert ;
- cartes sortie, pré-sortie, clip, artiste, actualité et événement ;
- lecteur vidéo desktop ;
- galerie et lightbox ;
- panneau de notifications et états de cloche ;
- contrôleur audio desktop/mobile ;
- footer desktop ;
- règles focus, clavier, zones tactiles et `prefers-reduced-motion`.

## 4. Mapping homepage desktop et mobile

| Bloc Figma | Source réelle V11 | Composant V12 recommandé | Adaptation nécessaire |
|---|---|---|---|
| Header | `.topbar`, `#mainNav`, cloche injectée | `SiteHeader` | navigation courte, menu secondaire pour les routes moins prioritaires |
| Hero cinématique | `#home`, intro `#mpbpIntro`, assets `assets/intro/` | `HomeHero` | conserver consentement audio, skip et reduced motion ; remplacer le placeholder par le logo officiel |
| Dernière sortie | `data.json.tracks`, priorité BrainRot Society 2.0 | `FeaturedRelease` | lire la source canonique, vrais liens plateformes |
| À la une | `data.json.upcoming`, Dois-je me taire ? | `EditorialFocus` | date réelle 30/07/2026, flyer officiel et URL `#avenir` |
| Prochaines sorties | quatre éléments `data.json.upcoming` | `UpcomingRail` + `Countdown` | utiliser Jour de pluie, Sixième Sens, double pré-sortie et Dois-je me taire ; ne pas reprendre les mois 2025 |
| MPBP TV premium | quatre liens statiques + MP4 | `FeaturedClip` + `ClipCard` | garder les quatre ancres existantes et les posters réels |
| Artistes | trois cartes de `index.html` | `ArtistCard` | trois artistes réels, routes `.html` conservées |
| Actualités | `data/news.json` | `NewsPreview` | utiliser dates 2026 et CTA existants |
| Événement | `data.json.events` | `EventCard`/`EmptyState` | l'événement V11 est expiré ; ne pas afficher le placeholder Figma 2025 comme événement réel |
| Galerie aperçu | `data.json.gallery` | `GalleryPreview` | six slots maximum, vraie taxonomie et lien vers `/galerie/` |
| Radio & plateformes | `data.json.radio`, `data.json.socials` | `RadioCard` + `PlatformLinks` | le site a une playlist Spotify, pas un flux live natif |
| Footer | `.footer` | `SiteFooter` | ne pas inventer de pages légales ; masquer ou créer seulement après validation éditoriale |

### Mobile

La frame mobile confirme un parcours en pile : hero, dernière sortie, à la une, cinq pré-sorties, quatre clips, trois artistes, trois actualités, événement, galerie, radio, footer. Pour l'intégration réelle :

- ne pas rendre cinq cartes lourdes et quatre vidéos actives simultanément ;
- utiliser des images responsives et charger les lecteurs à l'interaction ;
- conserver le menu hamburger et la cloche dans des zones de 44 px minimum ;
- rendre les rails horizontaux accessibles au clavier ou préférer une pile verticale ;
- réserver un padding inférieur au contrôleur audio lorsqu'il est visible ;
- tester à 320, 375, 390, 430, 768 et 980 px, pas uniquement 390 px.

## 5. Mapping MPBP TV

### Structure Figma

- navigation « Derniers Clips / Exclusivités / Par Artiste / Archives » ;
- lecteur vedette L'Argent avec barre de progression, volume, partage, page artiste et plein écran ;
- trois cartes de clips récents ;
- sections Exclusivités et Archives ;
- version mobile dédiée ;
- frames nommées avec les ancres `l-argent`, `clip-je-sais-que-tu-sais`, `clip-j-existe`, `clip-dois-je-me-taire`.

### Mapping réel

| Figma | Dépôt | Décision |
|---|---|---|
| L'Argent vedette | `assets/videos/l-argent.mp4` + `largent-officiel.webp` | conserver `id="l-argent"` et l'URL partagée |
| Je sais que tu sais | MP4 Juste Une Plume + poster | conserver `id="clip-je-sais-que-tu-sais"` |
| J'existe | MP4 Makéda + poster PNG | conserver `id="clip-j-existe"` |
| Dois-je me taire ? | MP4 Sparetdee + poster PNG | conserver `id="clip-dois-je-me-taire"` |
| Par artiste | pages artistes existantes | filtre client ou liens, sans changer les URL |
| Archives | aucune source canonique | état vide ou vue filtrée, pas de contenu fictif |
| Abonnés | aucun système d'abonnement | ne pas afficher « réservé aux abonnés » tant que la fonction n'existe pas |

Le lecteur V12 doit utiliser les contrôles natifs comme socle fiable. Un habillage personnalisé ne doit jamais recouvrir la surface cliquable. Une seule vidéo doit jouer à la fois, avec pause de l'ambiance audio et lazy activation des autres lecteurs.

## 6. Mapping pages artistes

Figma fournit trois variantes : Sparetdee Simon, Juste Une Plume et Makéda Muse. La hiérarchie commune est : header, hero/photo, biographie, dernière sortie, clips, galerie artiste, liens officiels, footer.

| Zone | Source V11 | Adaptation V12 |
|---|---|---|
| Identité | HTML de chaque artiste + photos officielles | configuration par artiste, pas duplication complète de template |
| Biographie | HTML réel des trois pages | conserver les textes validés, ne pas utiliser la biographie générique Figma |
| Dernière sortie | `data/releases.json` | sélectionner par artiste et statut/date |
| Clips | liens MPBP TV existants | cartes ciblant les ancres publiques |
| Galerie artiste | `data/gallery.json` / galerie canonique future | filtre par `artistId` |
| Liens officiels | liens de release et plateforme | n'afficher que les liens réels ; ne pas inventer Instagram |

Une structure partagée peut être obtenue par un module `artist-page.js` et un objet de configuration, tout en gardant les trois fichiers HTML publics existants pour GitHub Pages et le référencement.

## 7. Mapping Actualités

Figma prévoit : hero éditorial, filtres Tout/Sorties/Clips/Artistes/Événements/Label, grille desktop, liste mobile, partage, footer.

Source réelle recommandée : un seul fichier canonique d'actualités dérivé de `data/news.json`, avec champs `id`, `publishedAt`, `type`, `title`, `summary`, `image`, `url`, `ctaLabel`, `featured` et éventuellement `shareUrl`.

Écarts à résoudre :

- `actu/index.html` n'affiche actuellement aucun article ;
- les cartes Figma utilisent des dates 2025 et des placeholders ;
- `data/news.json` n'a pas systématiquement d'image ni d'identifiant ;
- le journal homepage dérive actuellement de `data/notifications.json`, pas de `data/news.json` ;
- la catégorie `Label` existe dans Figma mais pas comme filtre cohérent dans toutes les données.

La route `/actu/` doit devenir la vue premium sans retirer `/#actus`. La homepage conserve un aperçu et les notifications conservent leurs URL existantes.

## 8. Mapping Galerie

Figma prévoit les catégories Tout, Pochettes, Flyers, Artistes, Clips, Événements, Backstage et Archives, une grille desktop, une grille mobile deux colonnes et une lightbox précédent/suivant.

Le dépôt contient une galerie homepage de cinq éléments et une galerie dédiée de trois éléments. Avant intégration :

1. définir une taxonomie canonique ;
2. rattacher chaque item à un `assetPath`, un type, un artiste, une date et un texte alternatif ;
3. conserver les fichiers originaux intacts ;
4. ajouter fermeture Échap, focus trap, précédent/suivant, retour du focus et swipe optionnel ;
5. ouvrir la lightbox uniquement à la demande pour limiter le coût mobile.

Le composant lightbox visible en permanence sur la capture Figma est une présentation de composant, pas un état initial de page.

## 9. Mapping des assets réels sur les placeholders

| Placeholder Figma | Asset réel prioritaire |
|---|---|
| Logo officiel | `assets/intro/mpbp-logo-official.webp` ou `assets/brand/mpbp440-official-logo.jpg` selon contexte |
| BrainRot Society 2.0 | `assets/releases/sparetdee-simon/brainrot-society-2-0-cover.png` |
| Dois-je me taire ? pré-sortie | `assets/releases/sparetdee-simon/dois-je-me-taire-pre-sortie.png` |
| Jour de pluie | `assets/makeda-muse/jour-de-pluie-pre-sortie.png` |
| Sixième Sens | `assets/makeda-muse/sixieme-sens-pre-sortie.png` |
| Double pré-sortie Makéda | `assets/releases/makeda-muse/double-pre-sortie-makeda-muse-2026-07-25.png` |
| Poster L'Argent | `assets/covers/largent-officiel.webp` |
| Poster Je sais que tu sais | `assets/covers/je-sais-juste-une-plume.webp` |
| Poster J'existe | `assets/clips/makeda-muse/j-existe-cover.png` |
| Poster Dois-je me taire ? | `assets/clips/sparetdee-simon/dois-je-me-taire-cover.png` |
| Photo Sparetdee | `assets/artists/sparetdee-simon.webp` ou variante profile selon cadrage |
| Photo Juste Une Plume | `assets/artists/juste-une-plume.webp` ou variante profile |
| Photo Makéda | `assets/makeda-muse/makeda-muse-profile.png` |

Le choix entre photo large et profile doit se faire par composant ; aucun fichier source ne doit être recadré ou remplacé. Le cadrage est une propriété CSS du conteneur.

## 10. Contrats responsive et accessibilité

Les règles Figma à conserver comme critères d'acceptation sont :

- aucun overflow horizontal ;
- stack des cartes sur mobile quand la largeur utile devient insuffisante ;
- header 72 px desktop, variante compacte 56 px si le comportement scroll est retenu ;
- cibles tactiles au moins 44 × 44 px et 8 px entre cibles ;
- focus visible 2 px avec offset ;
- navigation clavier complète ;
- Échap ferme menu, modale et lightbox ;
- respect de `prefers-reduced-motion` ;
- le contrôleur audio mobile ne masque jamais le contenu ;
- alt text réel pour les assets et libellés accessibles pour les boutons icônes.

Les ratios de contraste indiqués dans Figma sont des objectifs déclaratifs. Ils devront être recalculés sur les gradients, overlays, images réelles et états disabled.

## 11. Éléments Figma à ne pas intégrer sans décision produit

- contenu réservé aux abonnés ;
- réservation d'événement ;
- plateformes SoundCloud/Tidal/Amazon lorsqu'aucun lien réel n'existe ;
- pages Mentions légales/CGU/Confidentialité/Cookies inexistantes ;
- artistes fictifs du design system ;
- événements, dates, durées et lieux 2025 ;
- biographies génériques ;
- placeholders et blocs « Titre à venir » ;
- hauteurs fixes et grands espaces vides issus des frames.

## 12. Ordre de mapping recommandé

1. transcrire les tokens Figma dans une feuille V12 isolée ;
2. construire header, footer, boutons, badges et états ;
3. brancher les composants sur les sources V11 via des adaptateurs sans modifier les données ;
4. migrer la homepage ;
5. migrer MPBP TV en protégeant les ancres ;
6. unifier le template artiste ;
7. créer les vues Actualités et Galerie premium ;
8. consolider les données seulement après parité de rendu ;
9. finaliser PWA, performances et accessibilité.

Ce mapping n'autorise aucune intégration pendant l'étape 1. Il définit les correspondances et les points de validation nécessaires aux lots suivants.
