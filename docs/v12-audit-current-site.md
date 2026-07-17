# MPBP440 V12 Premium — audit technique du site V11

Audit réalisé le 17 juillet 2026 sur la branche `v12-premium`, créée depuis le commit stable `9cc20bb09cc62facb79a5a544ba2935b1e299939`. Aucun fichier public n'a été modifié pendant l'audit.

## 1. Résumé exécutif

Le site est une application statique GitHub Pages sans étape de build. La production repose principalement sur `index.html`, `style.css`, `script.js`, `data.json`, plusieurs pages HTML secondaires et un service worker racine. Cette simplicité facilite le déploiement, mais les correctifs successifs V3 à V11 ont créé un empilement important de CSS, de JavaScript et de sources JSON concurrentes.

Les quatre liens publics MPBP TV prioritaires sont présents et valides. Les fichiers JSON sont syntaxiquement valides et les 33 fichiers JavaScript suivis passent le contrôle syntaxique Node. Les risques majeurs avant toute refonte sont les suivants :

1. plusieurs sources de vérité décrivent les mêmes sorties, événements, artistes, vidéos et galeries ;
2. `style.css` contient 2 852 lignes, 49 media queries et 960 occurrences de `!important` ;
3. `script.js` concentre 1 715 lignes et de nombreux correctifs historiques exécutés sur plusieurs pages ;
4. le service worker peut faire croître le cache sans limite et supprime tous les caches dont le nom ne correspond pas à son cache courant ;
5. l'icône déclarée `512x512` dans le manifeste est en réalité une image JPEG `600x900` non carrée ;
6. le back-office est livré publiquement avec un contrôle d'accès entièrement côté navigateur et des identifiants présents dans le JavaScript client ;
7. quatre MP4 totalisent environ 143 Mio et cohabitent avec six embeds YouTube dynamiques sur MPBP TV ;
8. six pages héritées contiennent douze ancres obsolètes.

La V12 doit donc commencer par une couche de compatibilité et une consolidation des données, pas par une substitution massive du HTML existant.

## 2. État et métriques du dépôt

| Élément | État observé |
|---|---|
| Branche d'audit | `v12-premium` suivant `origin/v12-premium` |
| Base stable | `9cc20bb09cc62facb79a5a544ba2935b1e299939` |
| Domaine | `www.mpbp440.com` via `CNAME` |
| Fichiers suivis | 307 |
| Volume suivi | 201 197 856 octets |
| Assets suivis | 107 |
| HTML / CSS / JS / JSON | 32 / 28 / 33 / 38 |
| Build applicatif | aucun |
| Framework | aucun, HTML/CSS/JavaScript natif |
| Tests automatisés du dépôt | aucun framework de test détecté |

Deux fichiers locaux non suivis sont volontairement hors périmètre et doivent rester intacts :

- `mpbp440-jup-clip-intro-fix-files-20260710.zip` — 34 625 111 octets ;
- `mpbp440-jup-clip-intro-fix.patch` — 90 487 878 octets.

## 3. Contrôles techniques exécutés

| Contrôle | Résultat |
|---|---|
| `node --check script.js` | OK |
| `node --check artistes/artist.js` | OK |
| `node --check sw.js` | OK |
| Contrôle des 33 fichiers JavaScript suivis | OK |
| Validation de 38 JSON + `manifest.webmanifest` | 39 fichiers valides |
| Existence des entrées du précache | toutes présentes |
| Recherche de références CSS locales manquantes | aucune dans les CSS |
| Vérification des quatre ancres MPBP TV | toutes présentes |
| Vérification des URL de `data/news.json` | toutes valides |
| Vérification des URL de `data/notifications.json` | toutes valides |

Le premier appel direct à `node` a échoué parce que le binaire n'était pas dans le `PATH`. Les validations ont ensuite été exécutées avec le runtime Node fourni par Codex ; cet incident n'indique pas une erreur du code.

## 4. Architecture actuelle

### 4.1 Entrées publiques principales

| Fichier | Rôle actuel | Nature |
|---|---|---|
| `index.html` | homepage, intro, navigation, sections label/sorties/TV/artistes/actus/événements/galerie/radio/liens/PWA | squelette surtout statique, contenu injecté |
| `style.css` | feuille globale homepage, Music Hub, MPBP TV, notifications, intro, responsive | globale, historique, fortement surchargée |
| `script.js` | rendu de `data.json`, recherche, comptes à rebours, intro, audio, PWA, notifications, actualités, vidéo, navigation | contrôleur global monolithique |
| `music/index.html` | catalogue / recherche | squelette statique, catalogue issu de `data.json` via `script.js` |
| `mpbp-tv/index.html` | quatre clips locaux prioritaires + rayon YouTube | clips locaux statiques, vidéos YouTube dynamiques |
| `artistes/*.html` | trois profils artistes | biographies statiques, discographie partiellement dynamique |
| `artistes/artist.js` | favoris et discographie artiste | lit `data/releases.json` |
| `artistes/artist.css` | styles des pages artistes | feuille séparée, avec correctifs V4.3/V8.5/Makéda |
| `galerie/index.html` | galerie dédiée et lightbox | page séparée |
| `galerie/galerie.js` | filtres et lightbox | lit `data/gallery.json` |
| `actu/index.html` | ancienne route Actualités | page de présentation statique sans liste d'articles |
| `manifest.webmanifest` | métadonnées PWA | manifeste racine |
| `sw.js` | précache, cache réseau, clic notification | service worker global |

### 4.2 Pages et systèmes secondaires

- `application/`, `dashboard/`, `members/`, `mon-espace/`, `notifications/` et `telechargements/` chargent encore des modules PWA ou applicatifs plus anciens.
- `a-venir/`, `actu/`, `evenements/`, `live/`, `notifications/` et `sortie/` partagent une navigation V6.4.4 statique.
- `music/music.js` et `music/music-hub.js` sont deux implémentations historiques du catalogue ; la page `music/index.html` actuelle ne les charge pas.
- `refonte/refonte.js` et `refonte/safe-restore.js` sont quasi parallèles et représentent une autre couche historique.
- 63 fichiers `README_*.txt`, snippets ou guides de patch restent suivis. Ils documentent l'historique mais ne constituent pas l'exécution courante.

## 5. Sections statiques et dynamiques

| Zone | Source réelle | Mode | Observation V12 |
|---|---|---|---|
| Intro / hero homepage | `index.html`, assets `assets/intro/`, `script.js` | statique + animation | préserver le mécanisme de consentement audio et `prefers-reduced-motion` |
| Label | `index.html` | statique | transformable en composant de contenu simple |
| Sorties disponibles | `data.json.tracks` | dynamique | trois priorités codées dans `script.js` |
| À venir | `data.json.upcoming` | dynamique | comptes à rebours et dates réelles 2026 |
| Quatre clips homepage | `index.html` | statique | protège explicitement les URL partagées |
| Rayon vidéo YouTube | `data.json.videos` | dynamique | six iframes possibles |
| Artistes homepage | `index.html` | statique | trois cartes et trois pages réelles |
| Actualités homepage | `data/news.json` | dynamique | liste séparée du journal de notifications |
| Journal homepage | `data/notifications.json` | dynamique | duplique partiellement les actualités |
| Événements homepage | `data.json.events` | dynamique | l'événement du 11/07/2026 est désormais expiré et filtré |
| Galerie homepage | `data.json.gallery` | dynamique | filtre heuristique sur texte/chemin |
| Galerie dédiée | `data/gallery.json` | dynamique | autre jeu de données, filtres exacts et lightbox |
| Radio | `data.json.radio`, repli `data/radio.json` | dynamique | iframe initialement `about:blank`, remplie ensuite |
| Liens officiels | `data.json.socials` | dynamique | liens du compte/label principal |
| Catalogue Music Hub | `data.json.tracks` | dynamique | recherche et filtres gérés par `script.js` |
| Discographies artistes | `data/releases.json` | dynamique | uniquement si `#artistDiscography` existe |
| Comptes à rebours Makéda | HTML inline de `makeda-muse.html` | statique + JS inline | duplique les données de countdown |

## 6. Audit des fichiers centraux

### `index.html`

- Structure sémantique exploitable avec des sections identifiées : `home`, `label`, `sortie`, `avenir`, `clips`, `artistes`, `actus`, `journal`, `events`, `galerie`, `radio`, `liens`, `application`.
- Les quatre clips importants sont présents comme liens statiques, ce qui offre un filet de sécurité si `data.json` échoue.
- La navigation compte 17 entrées sur desktop ; elle est trop dense et dépend de plusieurs correctifs JavaScript sur mobile.
- Plusieurs contenus sont injectés après `DOMContentLoaded`, ce qui produit des états de chargement et exige un comportement sans JavaScript acceptable.
- La radio contient un iframe `about:blank` remplacé par le JavaScript ; un échec du script laisse un lecteur vide.

### `style.css`

- 110 176 octets, 2 852 lignes, 49 media queries, quatre blocs `:root` et 960 `!important`.
- Les blocs sont ajoutés chronologiquement de V3.2.1 à V11.2. Les règles V8.5, V9.x, V10 et V11 coexistent au lieu de remplacer les anciennes.
- Les sélecteurs globaux (`.hero`, `.section`, `.card`, `.topbar`, `.btn`) sont réutilisés par plusieurs pages, augmentant le risque de régression transversale.
- Les breakpoints 980, 820, 768, 720, 560, 520, 420 et d'autres variantes se chevauchent.
- La V12 doit introduire une nouvelle couche organisée et supprimer les anciennes règles uniquement après comparaison visuelle page par page. Une réécriture totale en un seul commit serait trop risquée.

### `script.js`

- 73 224 octets, 1 715 lignes, 15 enregistrements `DOMContentLoaded`, huit appels `fetch`, trois intervalles, dix timeouts et 17 références à `localStorage`.
- Le même bouton de menu reçoit au moins deux couches de gestion historiques (`v647` puis `v94`), chacune avec son propre marqueur `dataset`.
- `data.json` est chargé au moins deux fois : rendu principal puis correctif radio/plateformes.
- Les fonctions globales couvrent trop de responsabilités : rendu, routing d'ancres, audio, notifications, PWA, partage, plein écran, live et responsive.
- Les templates HTML utilisent beaucoup `innerHTML`. Les données sont locales et maîtrisées, mais une future source distante imposerait une stratégie d'échappement plus stricte. `safeText` convertit en chaîne sans échapper le HTML.
- Le statut live est demandé toutes les 30 secondes avec un query string temporel.

### `sw.js`

- Les dix entrées explicites du précache existent.
- La stratégie est réseau d'abord avec repli cache pour les requêtes GET hors `/assets/` et hors MP4.
- Les assets et vidéos sont réseau uniquement, donc l'expérience hors ligne ne comprend pas les pochettes, logos ou audios.
- `cache.addAll(PRECACHE).catch(()=>{})` masque un échec global de précache.
- Chaque réponse réseau est stockée sans limite ni expiration. Le polling `/live_status.json?v=<timestamp>` crée potentiellement une nouvelle entrée toutes les 30 secondes.
- À l'activation, tout cache dont le nom diffère de `MPBP_CACHE` est supprimé. Cela peut effacer `mpbp440-user-cache-v6-1-1` créé par `app/offline-manager.js`.
- Les erreurs et réponses non souhaitées peuvent rester en cache ; aucune liste blanche de routes ni politique de quota n'existe.

### `manifest.webmanifest`

- `start_url` et `scope` sont `/`, adaptés au domaine racine de production.
- Une seule icône est déclarée comme `512x512`, `purpose: any maskable`.
- Le fichier réel est `assets/brand/mpbp440-official-logo.jpg`, 600 × 900 px : le manifeste est donc incohérent et l'icône n'est pas carrée.
- Une preview sous un sous-chemin GitHub Pages ne fonctionnera pas correctement sans gestion d'un préfixe, car le manifeste et le site utilisent des URL absolues racine.

### `music/index.html`

- Page volontairement courte : hero, champ `#searchInput`, conteneur `#tracks`.
- La source réellement exécutée est `script.js` + `data.json`, pas `music/music.js` ni `music/music-hub.js`.
- L'ancre publique stable est `#morceaux`.

### `mpbp-tv/index.html`

- Les quatre clips locaux sont des sections statiques avec `preload="metadata"`, `playsinline`, poster et source MP4.
- Les boutons de partage ont des URL explicites. Deux utilisent `/mpbp-tv/#...`, deux `/mpbp-tv/index.html#...` ; les deux formes doivent rester valides.
- Les contrôles plein écran sont ajoutés pour J'existe et Dois-je me taire, mais pas uniformément sur les deux premiers clips.
- `#videoList` ajoute ensuite jusqu'à six embeds YouTube venant de `data.json`.
- Aucun sous-titre `<track>`, transcription ni durée réelle contrôlée n'est fourni pour les MP4 locaux.

### Pages artistes

- Les trois pages ont des biographies et liens statiques, mais leur structure n'est pas totalement uniforme.
- Sparetdee Simon et Juste Une Plume affichent la discographie dynamique de `data/releases.json`.
- Juste Une Plume contient en plus une sortie statique qui peut dupliquer la carte dynamique ; un timeout masque seulement le message vide.
- Makéda Muse maintient trois sorties et leurs timers directement dans le HTML, en doublon de `data/countdowns.json`, `data/releases.json` et `data.json.upcoming`.
- Les pages artistes chargent `artist.js` puis le lourd `script.js`, qui ajoute aussi menu, audio, service worker et notifications.

### Actualités et galerie

- L'actualité principale visible est intégrée à la homepage via `data/news.json`.
- `actu/index.html` et `notifications/index.html` sont des routes héritées très différentes de la maquette V12 ; elles ne constituent pas aujourd'hui un journal premium complet.
- La homepage utilise `data.json.gallery` (5 éléments) ; `/galerie/` utilise `data/gallery.json` (3 éléments). Les filtres et catégories diffèrent.
- La lightbox séparée n'a ni fermeture par Échap, ni navigation clavier, ni gestion de focus, ni boutons précédent/suivant.

## 7. Données dupliquées et divergence de sources

| Domaine | Sources concurrentes | Écart observé |
|---|---|---|
| Catalogue | `data.json.tracks` (38), `data/releases.json` (40), `data/music-library.json` (38) | trois sorties Makéda uniquement dans `releases`; Je sais que tu sais uniquement dans les deux listes de 38 |
| À venir | `data.json.upcoming`, `data.json.countdowns`, `data/countdowns.json`, HTML Makéda | mêmes concepts avec formats et responsabilités différents |
| Événements | `data.json.events`, `data/events.json`, `data/live_events.json`, `live_status.json`, `data/live_status.json` | plusieurs chemins et états de live |
| Galerie | `data.json.gallery` (5), `data/gallery.json` (3) | contenu et taxonomie divergents |
| Vidéos | `data.json.videos` (6), `data/videos.json` (2), `data/mpbp-tv-v64.json` | listes différentes, MP4 locaux codés dans le HTML |
| Artistes | `data.json.label_artists` (3), `data/artists.json` (2), HTML artistes | Makéda absente de l'ancien fichier artistes |
| Actualités | `data/news.json`, `data/news-feed.json`, `data/notifications.json`, notifications locales | annonces largement dupliquées |
| Radio | `data.json.radio`, `data/radio.json`, iframe HTML | repli JavaScript nécessaire |

Conséquence critique : le back-office modifie ou exporte principalement les fichiers `data/*.json`, tandis que la homepage lit `data.json` pour les sorties, événements, vidéos et galerie. Une publication réussie dans le back-office peut donc ne pas apparaître sur la homepage.

Recommandation V12 : définir un schéma canonique unique par domaine, puis conserver temporairement des adaptateurs de lecture pour les formats V11. La migration doit être testée avant suppression de toute ancienne source.

## 8. CSS, JS et composants réutilisables

### Duplications CSS

- tokens or/noir répétés dans `style.css`, `artist.css`, `galerie.css`, `site.css` et les modules PWA ;
- styles génériques `.btn`, `.card`, `.hero`, `.top`, `.sup`, `.section` redéfinis dans plusieurs feuilles ;
- responsive ajouté par vagues successives et souvent forcé par `!important` ;
- styles de notifications présents à la fois dans `style.css` et injectés en ligne par `script.js` pour les pages artistes.

### Duplications JavaScript

- code de back-office dupliqué entre `admin-pro/` et `admin-440-mpbp-corp/` ;
- `refonte/refonte.js` et `refonte/safe-restore.js` largement parallèles ;
- plusieurs implémentations de `slugify`, `loadJson`, `render`, `renderMusic`, galerie et navigation ;
- systèmes de notifications distincts : centre V10 de `script.js`, notifications locales `app/member-system.js`, `pwa/pwa-advanced.js` et page `notifications/` ;
- enregistrement du service worker depuis `script.js`, `pwa/pwa.js`, `pwa/pwa-advanced.js` et `app/app-shell.js`.

### Composants à extraire en V12

- `SiteHeader`, `MobileMenu`, `NotificationBell` et `SiteFooter` ;
- `ReleaseCard`, `UpcomingCard`, `Countdown`, `PlatformLinks` ;
- `ClipCard`, `VideoPlayer`, `ShareAction`, `FullscreenAction` ;
- `ArtistCard`, `ArtistHero`, `ArtistDiscography` ;
- `NewsCard`, `FilterBar`, `EventCard` ;
- `GalleryGrid`, `GalleryItem`, `Lightbox` ;
- `AudioController`, `InstallPrompt`, `EmptyState` et `ErrorState`.

Dans le contexte sans build, un composant peut être une fonction de rendu et un bloc CSS préfixé. Il n'est pas nécessaire d'introduire un framework pour obtenir une architecture modulaire.

## 9. Navigation, routes et ancres

Les routes prioritaires suivantes sont valides :

- `/mpbp-tv/index.html#l-argent` ;
- `/mpbp-tv/index.html#clip-je-sais-que-tu-sais` ;
- `/mpbp-tv/index.html#clip-j-existe` ;
- `/mpbp-tv/index.html#clip-dois-je-me-taire`.

Les URL présentes dans `data/news.json` et `data/notifications.json` ciblent toutes un fichier et, le cas échéant, une ancre existante.

Douze ancres héritées sont toutefois invalides : chaque page parmi `a-venir/`, `actu/`, `evenements/`, `live/`, `notifications/` et `sortie/` contient :

- `/music/index.html#avenir`, alors que `music/index.html` ne possède que `#morceaux` ;
- `/#recherche`, alors que la recherche actuelle est `/music/index.html#morceaux`.

Ces erreurs ne doivent pas être corrigées pendant l'étape 1, mais doivent entrer dans le lot de compatibilité V12.

## 10. Responsive et mobile

- Le menu principal contient beaucoup d'entrées et dépend de deux générations de gestionnaires JavaScript.
- Les nombreux breakpoints se chevauchent ; une modification locale peut être annulée par une règle plus tardive.
- Les `safe-area-inset-*` et correctifs iPhone existent dans les blocs récents, mais doivent être testés sur Safari réel.
- Les sections vidéo, cartes de sortie, notifications et contrôle audio sont les zones les plus exposées au débordement.
- Les cartes Makéda et les posters PNG de 2 à 4 Mio doivent être adaptés avec `srcset`, dimensions et formats de livraison, sans toucher aux originaux.
- La V12 Figma exige des zones tactiles de 44 × 44 px, aucune largeur hors viewport et un contrôleur audio de 56 px qui ne masque pas le contenu. Ces règles ne sont pas garanties uniformément en V11.

## 11. Vidéo et audio

### MP4 locaux

| Fichier | Taille |
|---|---:|
| `assets/clips/sparetdee-simon/dois-je-me-taire-clip-exclusif.mp4` | 53,26 Mio |
| `assets/videos/juste-une-plume/je-sais-que-tu-sais-clip-exclusif-2026.mp4` | 33,04 Mio |
| `assets/videos/l-argent.mp4` | 32,75 Mio |
| `assets/clips/makeda-muse/j-existe-clip-exclusif-2026.mp4` | 24,08 Mio |

Risques : coût réseau mobile, temps avant lecture, consommation mémoire Safari, quatre lecteurs plus six iframes YouTube, absence de sous-titres et absence de test de codecs automatisé. Les sources originales ne doivent pas être remplacées ; la V12 peut ajouter des versions de livraison dérivées uniquement après validation explicite.

### Audio

- `mpbp-ambiance.mp3` pèse 1,82 Mio et `mpbp-intro-jingle.mp3` 1,14 Mio.
- `script.js` effectue des requêtes HEAD, crée deux objets `Audio`, mémorise le mode et le volume, et réduit l'ambiance lorsqu'un média interne joue.
- Les politiques d'autoplay imposent une interaction utilisateur. L'intro fournit ce point d'entrée mais les états restent complexes (`off`, `paused`, `on`, audio bloqué, ducking).
- Le contrôleur global ne doit pas recouvrir les CTA ni les commandes vidéo en mobile.

## 12. PWA et notifications

Le centre de notifications V10 lit `data/notifications.json`, mémorise les éléments lus dans `localStorage`, met à jour le badge d'application et peut afficher une notification locale après consentement. Il n'existe ni serveur push, ni abonnement Push API, ni clé VAPID. Le terme « notification » désigne donc aujourd'hui un flux statique et des notifications locales déclenchées à l'ouverture du site.

Risques spécifiques :

- plusieurs implémentations de notifications et plusieurs clés `localStorage` ;
- absence de synchronisation entre appareils ;
- consentement navigateur et consentement applicatif gérés séparément ;
- absence de push en arrière-plan ;
- cache potentiellement illimité ;
- manifeste avec icône incohérente ;
- versionnement du service worker différent des modules PWA historiques ;
- clic de notification qui navigue correctement vers `data.url`, ce qui rend les URL publiques critiques.

## 13. Back-office

Trois surfaces existent : `admin.html`, `admin-pro/` et `admin-440-mpbp-corp/`.

- `admin.html` fonctionne comme un studio local : lecture des JSON, brouillons en `localStorage`, préparation d'assets et téléchargement de fichiers à replacer manuellement.
- `admin-440-mpbp-corp/` charge plusieurs sources, permet l'édition en mémoire et génère un ZIP d'update.
- L'authentification de cette dernière surface est entièrement côté client. Les identifiants sont intégrés dans un fichier JavaScript public ; `robots.txt` et la suppression des liens de navigation ne constituent pas une protection.
- Aucun appel d'écriture GitHub ou API serveur n'a été détecté. Le back-office ne publie pas directement : il prépare des fichiers téléchargés.

Risque critique : toute personne connaissant l'URL peut lire le JavaScript, contourner l'écran local et accéder aux fonctions d'édition/export. Avant de qualifier cette surface de privée, il faut la sortir du site public ou l'adosser à une authentification serveur réelle. La rotation des secrets éventuellement réutilisés ailleurs est à traiter séparément et explicitement.

## 14. Registre des risques

| Priorité | Risque | Impact | Action préalable recommandée |
|---|---|---|---|
| P0 | identifiants back-office dans le client public | accès non sécurisé, secret exposé | retirer la confiance du client, rotation contrôlée, hébergement privé |
| P0 | sources JSON concurrentes | contenu divergent ou publication invisible | schéma canonique + adaptateurs V11 |
| P1 | cache illimité avec query strings temporels | stockage croissant, données périmées | routes autorisées, expiration, nettoyage ciblé |
| P1 | suppression de tous les autres caches à l'activation | perte du cache utilisateur/app | préfixe partagé et liste de versions appartenant à MPBP |
| P1 | 960 `!important` et 49 media queries | régressions responsive | couche V12 isolée, tests visuels par lot |
| P1 | quatre MP4 lourds + six embeds | lenteur et instabilité mobile | lazy activation, un lecteur actif, mesures réseau |
| P1 | manifeste iconographique invalide | installation PWA dégradée | produire des dérivés carrés validés sans remplacer l'original |
| P1 | ancres historiques obsolètes | navigation silencieusement incorrecte | aliases/redirects compatibles |
| P2 | actualités et notifications parallèles | doublons éditoriaux | modèle `content-item` canonique avec vues filtrées |
| P2 | lightbox non accessible | blocage clavier/lecteur d'écran | focus trap, Échap, libellés, navigation |
| P2 | événement expiré comme seule donnée | section vide | état vide assumé et workflow d'archivage |

## 15. Fichiers et contrats à ne pas toucher sans validation dédiée

- les 107 fichiers sous `assets/`, en particulier logos, pochettes, photos, flyers, posters, vidéos et audios officiels ;
- `CNAME`, `.nojekyll`, `robots.txt` et `sitemap.xml` pendant les travaux visuels ;
- `main` et le tag `v11-stable-before-v12` ;
- les identifiants d'ancres MPBP TV et les URL d'artistes ;
- les deux fichiers locaux non suivis protégés ;
- les JSON de production avant définition de la source canonique et d'un plan de migration ;
- `sw.js` et `manifest.webmanifest` en dehors du lot PWA testé sur HTTPS ;
- tout média original, même s'il semble dupliqué ou non référencé.

## 16. Conclusion d'audit

La base V11 est fonctionnelle et son contenu officiel est bien présent, mais sa stabilité repose sur de nombreux correctifs superposés. La stratégie sûre consiste à introduire la V12 par couches : tokens et shell, migration progressive des sections, conservation des URL, consolidation des données, puis PWA. Aucun asset ni ancienne source ne doit être supprimé tant que la parité fonctionnelle et la compatibilité publique ne sont pas démontrées.
