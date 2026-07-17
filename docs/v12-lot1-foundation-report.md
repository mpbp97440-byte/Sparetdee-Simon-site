# MPBP440 V12 Premium — rapport du lot 1

Date de recette locale : 17 juillet 2026

Branche de travail : `v12-premium`

Base V11 protégée : `9cc20bb09cc62facb79a5a544ba2935b1e299939`

Commit d'audit de départ : `815f3cc147d9c578922dccff60929ef808fd7ee0`

## 1. Résultat du lot

Le socle visuel V12 est intégré comme une couche réversible sur trois pages pilotes :

- la page d'accueil `/` ;
- le Music Hub `/music/index.html` ;
- MPBP TV `/mpbp-tv/index.html`.

Les contenus, données, assets, vidéos, lecteurs, notifications et comportements métier V11 sont conservés. Les pages artistes restent volontairement sur leur shell V11 dans ce lot ; elles ont été testées en non-régression.

L'architecture du site reste celle d'un site statique GitHub Pages sans framework ni build. La couche V12 est chargée après `style.css` et peut être retirée des trois pages pilotes pour retrouver le shell V11.

## 2. Fichiers créés

| Fichier | Rôle |
|---|---|
| `assets/css/v12-tokens.css` | couleurs, typographie, espacements, rayons, bordures, ombres, halos, opacités, transitions, z-index, cibles tactiles et breakpoints documentés |
| `assets/css/v12-base.css` | base isolée sous `.v12-shell`, focus, médias, skip link, ancres, reduced motion et contraste renforcé |
| `assets/css/v12-components.css` | boutons, badges, conteneurs, grilles, cartes, cadres médias et séparateurs |
| `assets/css/v12-layout.css` | header desktop, menu secondaire, cloche compatible, menu mobile et footer premium |
| `assets/css/v12-responsive.css` | règles fluides et breakpoints 1200, 980, 768, 430, 390 et 375 px |
| `assets/js/v12-navigation.js` | menu mobile, focus trap, Échap, retour de focus, menu Plus, header compact et ancres stabilisées |
| `docs/v12-lot1-foundation-report.md` | présent rapport de réalisation et de recette |

## 3. Fichiers modifiés

| Fichier | Modification |
|---|---|
| `index.html` | chargement V12, skip link, header/menu/footer, cible main et alias `#recherche` |
| `music/index.html` | chargement V12, shell complet, label de recherche et alias HTML `#avenir` |
| `mpbp-tv/index.html` | chargement V12, shell complet, conservation stricte des quatre sections vidéo |
| `script.js` | garde d'une ligne : le correctif d'ancres V11 se désactive sur `.v12-shell` pour éviter deux gestionnaires concurrents |

Aucun JSON, asset officiel, MP4, service worker, manifeste, fichier back-office ou `CNAME` n'a été modifié.

## 4. Design tokens

Les couleurs demandées sont présentes avec leurs valeurs exactes :

- fonds et surfaces : `--mpbp-black`, `--mpbp-black-deep`, `--mpbp-surface`, `--mpbp-surface-raised` ;
- ors : `--mpbp-gold`, `--mpbp-gold-light`, `--mpbp-gold-dark`, `--mpbp-gold-glow` ;
- textes : `--mpbp-text`, `--mpbp-text-secondary`, `--mpbp-text-muted` ;
- statuts : `--mpbp-success`, `--mpbp-info`, `--mpbp-warning`, `--mpbp-error`.

Le fichier de tokens définit aussi :

- une typographie fluide avec `clamp()` ;
- les trois familles déjà utilisées par V11, avec fallbacks système, sans nouvelle police distante ;
- les espacements 4, 8, 12, 16, 24, 32, 48, 64, 96 et 128 px ;
- les rayons 8, 12, 16, 20 et 24 px ;
- les largeurs compactes, standard et immersives jusqu'à 1280 px ;
- les ombres, halos, gradients, opacités et durées ;
- les cibles tactiles 44, 48 et 56 px ;
- les hauteurs de header 72 et 58 px ;
- les couches z-index du header, des menus, overlays et notifications.

## 5. Composants fondamentaux

La couche de composants fournit :

- boutons Primary, Secondary, Ghost et Icon ;
- tailles Small, Medium par défaut et Large ;
- états hover, active, pressed, focus-visible, disabled et loading ;
- badges Nouveau, Disponible, Exclusif, Clip, Pré-sortie, Live, Événement et Actualité ;
- conteneurs compact, standard et immersif ;
- grilles deux et trois colonnes avec stack mobile ;
- carte de surface, cadre média et séparateur ;
- pseudo-éléments décoratifs sans interception de pointeur.

Les contrôles du shell utilisent directement les boutons Ghost/Icon et les états focus. Les autres variantes constituent le contrat réutilisable des lots suivants.

## 6. Header desktop

Le header desktop contient les neuf entrées principales demandées :

1. Accueil ;
2. Sorties ;
3. À venir ;
4. MPBP TV ;
5. Artistes ;
6. Actus ;
7. Événements ;
8. Galerie ;
9. Radio.

Le bouton `Plus` rend accessibles Label, Morceaux, Recherche, Clips, Liens, Application, Mon espace et Téléchargements. Le menu se ferme avec Échap et restitue le focus au bouton.

La cloche V11 est toujours injectée par `script.js` dans le header. Son badge, son panneau, ses liens et ses commandes restent fonctionnels. Le z-index du panneau est harmonisé avec le shell V12.

Mesures navigateur à 1440 px :

- header normal : 72 px ;
- header compact après scroll : 58 px ;
- navigation principale visible ;
- menu hamburger masqué ;
- aucun débordement horizontal.

## 7. Header et menu mobile

Sous 980 px, le header conserve le logo, la cloche et le hamburger. Le panneau mobile présente d'abord la navigation principale puis la section « Label et autres accès ».

Comportements validés :

- `aria-expanded`, `aria-controls`, `aria-hidden` et libellés synchronisés ;
- focus initial sur le bouton de fermeture ;
- focus trap Tab/Maj+Tab ;
- Échap ferme le panneau ;
- clic sur le fond ferme le panneau ;
- clic sur un lien ferme le panneau ;
- scroll du body verrouillé pendant l'ouverture ;
- retour du focus sur le hamburger ;
- surface scrollable et utilisable à une main ;
- aucune cible interactive inférieure à 44 px après correction du logo mobile.

## 8. Footer premium

Le footer partagé comporte :

- le logo officiel ;
- `MPBP440 Corp. 2026` ;
- le claim réel de `data.json`, « Music • Passion • But • Progress » ;
- une navigation principale ;
- les trois pages artistes réelles ;
- Spotify, YouTube, Deezer et Apple Music avec leurs URL officielles ;
- l'adresse e-mail de contact existante.

Aucune page Mentions légales, CGU, Confidentialité ou Cookies n'a été inventée. Le footer indique explicitement que les liens légaux attendent une validation éditoriale.

La grille passe de cinq colonnes à deux puis une colonne. Une collision V11 qui imposait 82 px à tous les `h2` a été neutralisée uniquement pour les titres du footer.

## 9. Navigation et rétrocompatibilité

Les ancres homepage existantes sont conservées. Deux contrats hérités auparavant invalides disposent maintenant d'un fallback HTML :

- `/music/index.html#avenir` mène à une section de transition vers `/#avenir` ;
- `/#recherche` mène au bouton réel « Music Hub complet » vers `/music/index.html#morceaux`.

Les quatre contrats MPBP TV sont inchangés :

- `/mpbp-tv/index.html#l-argent` ;
- `/mpbp-tv/index.html#clip-je-sais-que-tu-sais` ;
- `/mpbp-tv/index.html#clip-j-existe` ;
- `/mpbp-tv/index.html#clip-dois-je-me-taire`.

Chaque ID est unique. Après stabilisation du layout asynchrone, les quatre cibles ont été mesurées à la même position sous le header. Le module utilise `scrollIntoView()` et les offsets CSS ; il ne fabrique pas de position pixel approximative.

## 10. Accessibilité

Le lot ajoute ou garantit :

- un skip link vers le contenu principal ;
- des landmarks header, navigation, main, dialog et footer ;
- des noms accessibles pour boutons icônes et menus ;
- un label associé au champ de recherche du Music Hub ;
- un focus visible de 2 px avec halo et variante `prefers-contrast: more` ;
- des cibles tactiles d'au moins 44 px ;
- un menu modal avec focus trap et retour du focus ;
- la fermeture Échap ;
- `prefers-reduced-motion` pour supprimer animations et scroll doux ;
- des images de marque avec texte alternatif adapté au contexte.

La mesure complète des contrastes sur toutes les images et un passage VoiceOver/NVDA restent à réaliser lors de la recette accessibilité générale.

## 11. Responsive

Contrôles effectués avec un viewport navigateur réel :

| Largeur | Résultat |
|---:|---|
| 1440 px | header desktop, footer cinq colonnes, overflow 0 |
| 1024 px | navigation desktop et Plus visibles, overflow 0 |
| 768 px | hamburger, footer deux colonnes, overflow 0 |
| 430 px | footer une colonne, overflow 0 ; anomalie initiale de largeur du lien logo corrigée |
| 390 px | menu complet, focus trap, cloche, TV et Music Hub testés, overflow 0 |
| 375 px | overflow 0 ; la règle tactile corrigée est commune au breakpoint `max-width: 430px` |

La couche utilise principalement des grilles fluides, `minmax()`, `clamp()` et des gouttières variables plutôt qu'une accumulation de requêtes ponctuelles.

## 12. Tests exécutés

### Syntaxe et intégrité

- `node --check assets/js/v12-navigation.js` : PASS ;
- `node --check script.js` : PASS ;
- `node --check artistes/artist.js` : PASS ;
- `node --check sw.js` : PASS ;
- `git diff --check` : PASS ;
- IDs dupliqués : aucun sur les trois pages pilotes ;
- références vers les cinq CSS et le JS V12 : présentes et résolues ;
- JSON modifiés : aucun.

### HTTP local

Réponse 200 vérifiée pour :

- `/`, `/music/`, `/music/index.html`, `/mpbp-tv/`, `/mpbp-tv/index.html` ;
- les trois pages artistes ;
- `/galerie/` et `/actu/` ;
- les cinq feuilles V12 et le module V12.

### Interactions navigateur

- menu Plus : ouverture, Échap, retour du focus ;
- menu mobile : ouverture, fermeture, lien, backdrop, Échap, focus trap et body lock ;
- cloche : ouverture et fermeture du panneau, badge et z-index ;
- ancres internes homepage ;
- quatre deep links TV desktop et un contrôle mobile ;
- centre du lecteur mobile identifié comme élément `VIDEO`, contrôles natifs présents ;
- Music Hub : 38 cartes chargées, recherche « BrainRot » réduite à deux cartes ;
- pages artistes : heading, images et cloche présents, overflow 0 ;
- console navigateur : aucune erreur critique capturée.

## 13. Exceptions CSS héritées

La couche V12 contient cinq déclarations `!important`, toutes commentées :

- deux pour remplacer la hauteur et le padding du header compact que V11 force déjà avec `!important` ;
- trois pour neutraliser taille, interligne et marge globales des `h2` V11 dans le footer.

Aucune autre règle V12 n'utilise `!important`. Les règles historiques n'ont pas été supprimées.

## 14. Limites et anomalies connues

- Les pages artistes utilisent encore le shell V11 ; leur migration est prévue après le lot homepage.
- Les pages légales n'existent pas et n'ont pas été inventées.
- L'import Google Fonts historique de `style.css` est inchangé ; la V12 n'ajoute aucun chargement de police.
- Le serveur HTTP local simple ne gère pas les requêtes Range comme un serveur de production. En quittant MPBP TV, il a journalisé des connexions MP4 annulées par le navigateur ; aucune erreur application n'est apparue dans la console.
- Le comportement réseau initial des quatre MP4 est hérité de V11 et n'est pas optimisé dans ce lot shell.
- La recette a été faite en navigateur local avec viewports simulés, pas sur un iPhone Safari ou Android physique.
- Installation/offline PWA, cache existant, VoiceOver/NVDA et audit de contraste complet restent hors de ce lot et appartiennent à la recette globale prévue.

## 15. Protections confirmées avant commit

- branche active : `v12-premium` ;
- `main` : `9cc20bb09cc62facb79a5a544ba2935b1e299939` ;
- `origin/main` : `9cc20bb09cc62facb79a5a544ba2935b1e299939` ;
- `CNAME` intact ;
- aucun tag créé ;
- aucun merge ni déploiement production ;
- `mpbp440-jup-clip-intro-fix-files-20260710.zip` reste non suivi ;
- `mpbp440-jup-clip-intro-fix.patch` reste non suivi.

## 16. Prochain lot

Le lot 2 pourra recomposer la homepage desktop/mobile à partir des tokens et composants maintenant disponibles, en branchant les vrais contenus 2026 sans modifier les contrats d'URL. Les priorités seront le hero, la sortie vedette, les pré-sorties, les aperçus TV/artistes/actualités/galerie et la réduction du coût média mobile.
