# MPBP440 V12 Premium — plan d'implémentation

Ce plan découpe la refonte en lots réversibles. Il ne lance aucune intégration et n'autorise aucun déploiement. La production `main`, le domaine `www.mpbp440.com`, les assets officiels et les URL publiques restent inchangés jusqu'à validation explicite.

## 1. Principes de réalisation

1. partir uniquement de `v12-premium` et du tag de sécurité `v11-stable-before-v12` ;
2. livrer de petits commits cohérents, chaque lot testable séparément ;
3. conserver les chemins HTML et ancres publiques ;
4. introduire des composants sans imposer de framework ni de build si le besoin n'est pas démontré ;
5. utiliser les vrais assets et données 2026, jamais les placeholders Figma ;
6. ajouter la couche V12 avant de retirer les correctifs V11 ;
7. ne supprimer aucun fichier historique ou asset dans les lots visuels ;
8. isoler PWA/service worker dans le dernier lot ;
9. ne fusionner vers `main` et ne déployer qu'après recette complète et validation explicite.

## 2. Architecture cible progressive

La cible recommandée reste compatible avec GitHub Pages : HTML statique, CSS et modules JavaScript natifs.

Structure indicative à valider pendant le lot 1 :

```text
styles/
  v12-tokens.css
  v12-base.css
  v12-components.css
  v12-pages.css
js/
  v12/
    core/
      dom.js
      routes.js
      media.js
    data/
      repository.js
      v11-adapter.js
    components/
      header.js
      footer.js
      release-card.js
      clip-card.js
      artist-card.js
      news-card.js
      gallery.js
    pages/
      home.js
      music.js
      tv.js
      artist.js
      news.js
      gallery.js
```

Cette structure est une direction, pas une demande de création immédiate. Elle vise à réduire `style.css` et `script.js` sans casser les pages qui en dépendent encore.

## 3. Stratégie de données

### 3.1 Problème actuel

Le catalogue, les comptes à rebours, événements, vidéos, artistes et galerie ont plusieurs sources concurrentes. La homepage ne lit pas toujours les fichiers produits par le back-office.

### 3.2 Cible

Définir une source canonique par domaine :

| Domaine | Source canonique cible | Compatibilité transitoire |
|---|---|---|
| artistes | `data/artists.json` enrichi des trois artistes | adaptateur `data.json.label_artists` |
| sorties | `data/releases.json` | adaptateur `data.json.tracks` et `music-library.json` |
| pré-sorties | mêmes releases avec statut/date ou `data/countdowns.json` référencé par ID | adaptateur `data.json.upcoming/countdowns` |
| clips | `data/videos.json` enrichi des MP4 locaux et ancres | conserver le HTML statique comme fallback |
| actualités | `data/news.json` | dériver aperçu homepage et notifications éditoriales |
| notifications | `data/notifications.json` pour les messages locaux | URL stables, pas de faux push |
| événements | `data/events.json` | adaptateur `data.json.events` et live séparé |
| galerie | `data/gallery.json` enrichi | adaptateur `data.json.gallery` |
| radio | `data/radio.json` | repli `data.json.radio` |

### 3.3 Séquence sûre

1. documenter un schéma et des identifiants stables ;
2. écrire des validations en lecture seule ;
3. créer un repository JS qui lit d'abord la source canonique puis le format V11 ;
4. comparer le nombre d'éléments et les liens rendus ;
5. migrer une page à la fois ;
6. conserver les anciennes données pendant au moins une livraison validée ;
7. traiter le nettoyage dans une mission distincte.

## 4. LOT 1 — tokens CSS, shell global et responsive

### Objectif

Mettre en place le langage visuel V12 sans changer les contenus ni les comportements métier.

### Travaux

- transcrire les couleurs Figma en tokens CSS ;
- ajouter tokens typographie, spacing, radius, shadow, z-index, motion et tailles tactiles ;
- définir une base `box-sizing`, focus, médias responsives et `prefers-reduced-motion` ;
- construire `SiteHeader`, `MobileMenu`, cloche, skip link et `SiteFooter` ;
- réduire la navigation visible et conserver les destinations secondaires dans le menu ;
- maintenir tous les liens et ancres existants ;
- isoler les styles V12 avec une classe racine ou un fichier chargé après V11 ;
- ajouter des états hover/focus/active/disabled cohérents ;
- corriger les deux ancres héritées via aliases ou liens corrects ;
- préparer les conteneurs 1 280 px desktop et marges 20 px mobile ;
- ne retirer aucune règle V11 à ce stade.

### Fichiers probablement concernés

- `index.html`, `music/index.html`, `mpbp-tv/index.html`, `artistes/*.html` ;
- nouvelles feuilles V12 ou `style.css` uniquement par ajout isolé ;
- nouveau module shell ou adaptation minimale de `script.js` ;
- pages héritées pour les deux liens d'ancres invalides.

### Critères d'acceptation

- aucun overflow horizontal entre 320 et 1 440 px ;
- navigation clavier et focus visibles ;
- menu ouvrable/fermable avec bouton, Échap et clic lien ;
- cibles mobiles ≥ 44 px ;
- toutes les URL de `v12-public-urls-compatibility.md` passent ;
- aucun changement de contenu, donnée, asset ou service worker ;
- capture comparative V11/V12 sur homepage, Music Hub, TV et trois artistes.

### Point de rollback

Retirer le chargement de la feuille/module V12 doit restaurer immédiatement le shell V11.

## 5. LOT 2 — homepage desktop/mobile

### Objectif

Recomposer la homepage selon la hiérarchie Figma avec les vrais contenus 2026 et les adaptateurs V11.

### Travaux

- hero cinématique allégé, consentement audio, skip et reduced motion ;
- dernière sortie BrainRot Society 2.0 à partir des données réelles ;
- mise à la une Dois-je me taire ? avec flyer officiel et date 30/07/2026 ;
- cartes à venir Jour de pluie, Sixième Sens, double pré-sortie, Dois-je me taire ? ;
- compte à rebours partagé, fuseau explicite, état « disponible » sans valeur négative ;
- aperçu des quatre clips conservant les ancres ;
- trois cartes artistes ;
- aperçu actualités à partir de `data/news.json` ;
- événement réel ou état vide si aucun événement futur ;
- aperçu galerie avec vraies catégories ;
- radio/plateformes à partir des données réelles ;
- chargement différé des images et dimensions réservées pour éviter le CLS.

### Risques à maîtriser

- quatre sources de comptes à rebours ;
- événement du 11 juillet expiré ;
- posters PNG de 2 à 4 Mio ;
- grand nombre de sections sur mobile ;
- intro/audio pouvant retarder l'accès au contenu ;
- filtres galerie heuristiques actuels.

### Critères d'acceptation

- contenu identique ou plus récent que V11 ;
- aucune date/biographie/plateforme fictive de Figma ;
- ancres homepage inchangées ;
- fonctionnement sans erreur si un JSON échoue ;
- timers exacts en Europe/Paris et après échéance ;
- images non déformées ;
- pas de lecteur vidéo chargé intégralement dans l'aperçu ;
- tests desktop, iPhone 390/430, tablette 768 et reduced motion.

### Point de rollback

Conserver le HTML V11 ou un rendu fallback jusqu'à validation de toutes les sections dynamiques.

## 6. LOT 3 — MPBP TV, lecteurs, ancres et artistes

### Objectif

Créer l'expérience TV et les pages artistes premium tout en protégeant strictement les liens partagés.

### Travaux MPBP TV

- garder `mpbp-tv/index.html` et les quatre IDs historiques ;
- lecteur vedette L'Argent et cartes pour les trois autres clips ;
- un seul média en lecture, pause/ducking audio global cohérent ;
- activation différée des sources et embeds ;
- partage natif avec repli copie ;
- plein écran uniforme, y compris Safari iOS ;
- liens page artiste réels ;
- état Archives/Exclusivités basé sur les données, sans promesse d'abonnement inexistante ;
- `scroll-margin-top` et deep-link après chargement ;
- sous-titres/transcriptions à planifier avec contenus validés.

### Travaux pages artistes

- template commun conservant les trois fichiers `.html` ;
- configuration par artiste : identité, photo, biographie, tags, liens ;
- dernière sortie et discographie depuis la source canonique ;
- clips pointant vers les ancres TV ;
- galerie filtrée par artiste ;
- favoris avec clé stable et migration des anciennes clés ;
- suppression des duplications visuelles seulement après parité.

### Critères d'acceptation

- tests des huit formes URL TV (`/mpbp-tv/` et `/mpbp-tv/index.html`) ;
- bouton lecture actionnable sans overlay ;
- aucune lecture simultanée involontaire ;
- réseau initial MPBP TV mesuré et inférieur à la V11 ;
- les trois pages artistes gardent title, canonical, Open Graph et route ;
- aucun profil, lien ou contenu fictif.

### Point de rollback

Les quatre sections vidéo statiques V11 restent disponibles derrière un basculement de rendu jusqu'à validation mobile.

## 7. LOT 4 — Actualités premium, galerie, filtres, lightbox, radio et plateformes

### Actualités

- transformer `/actu/` en journal premium ;
- filtres Tout/Sorties/Clips/Artistes/Événements/Label ;
- cartes partageables, dates sémantiques et état vide ;
- aperçu homepage dérivé du même modèle ;
- IDs d'articles stables sans remplacer les anciennes destinations ;
- metadata par page si des pages d'article sont réellement créées.

### Galerie

- unifier `data.json.gallery` et `data/gallery.json` via adaptateur ;
- taxonomie stable : pochettes, flyers, artistes, clips, événements, backstage, archives ;
- filtres accessibles et URL/état partageable si utile ;
- lightbox avec focus trap, Échap, précédent/suivant, retour du focus, alt text ;
- grille deux colonnes mobile seulement si chaque cible reste suffisamment grande ;
- chargement progressif des images.

### Radio et plateformes

- conserver la playlist Spotify réelle ;
- afficher un fallback explicite si l'embed échoue ;
- ne pas appeler le lecteur « en direct » sans flux live ;
- n'afficher que les plateformes possédant une URL officielle ;
- coordonner le lecteur/iframe avec l'ambiance audio ;
- ne pas réintroduire les QR sans besoin validé.

### Critères d'acceptation

- une seule source de rendu pour aperçu et page complète ;
- filtres clavier et lecteur d'écran ;
- lightbox fermable sans souris ;
- aucune image officielle remplacée ;
- absence de liens `#` fictifs ;
- routes `/actu/`, `/galerie/`, `/#actus`, `/#galerie` préservées.

## 8. LOT 5 — PWA, cache, notifications, performance, accessibilité et tests

### PWA et cache

- corriger le manifeste avec des icônes carrées dérivées et validées ;
- définir précisément `start_url`, `scope`, nom, couleurs et screenshots éventuels ;
- réécrire le service worker de manière lisible ;
- limiter les requêtes mises en cache par origine et route ;
- ignorer les URL à query temporel ou normaliser la clé de cache ;
- ne nettoyer que les anciens caches préfixés MPBP440 ;
- séparer shell, données et médias avec stratégies explicites ;
- fournir une page offline utile ;
- traiter mises à jour et reload sans boucle.

### Notifications

- unifier le centre statique et les notifications locales ;
- conserver le consentement explicite ;
- documenter clairement l'absence de push serveur ;
- ne mettre en place Push API/VAPID que dans une mission serveur dédiée ;
- valider chaque URL de notification ;
- tester badge, lecture, tout marquer lu et clic depuis service worker.

### Performance

- un seul lecteur vidéo actif ;
- pas de MP4 téléchargé avant intention utilisateur, hors metadata strictement nécessaire ;
- lazy loading des embeds ;
- dimensions d'image et dérivés sans remplacement d'originaux ;
- suppression des doubles fetch et timers inutiles ;
- arrêt des intervalles lorsque la page est cachée ;
- mesure Lighthouse/WebPageTest et réseau mobile simulé.

Objectifs indicatifs à confirmer sur la preview : LCP ≤ 2,5 s, CLS ≤ 0,1, INP ≤ 200 ms sur une page hors lecture vidéo et absence de requête MP4 complète au chargement initial.

### Accessibilité

- audit clavier complet ;
- labels boutons/icônes ;
- skip link ;
- focus visible ;
- contrastes mesurés avec vrais backgrounds ;
- reduced motion ;
- structure H1/H2 ;
- alt text éditorial ;
- tests VoiceOver iPhone et NVDA/Windows si disponible.

### Critères d'acceptation

- installation PWA desktop/Android et ajout écran d'accueil iPhone ;
- update service worker sans perte de données locales ;
- cache borné ;
- offline déterministe ;
- aucune URL critique cassée ;
- tests automatisés et recette manuelle documentés.

## 9. Stratégie de preview sans impact production

### Évaluation des options

| Option | PC | iPhone | Lien partageable | Risque production | Verdict |
|---|---|---|---|---|---|
| serveur local | oui | oui sur LAN, mais HTTPS/PWA limités | non hors réseau | nul | indispensable pour développement |
| dossier `/v12-preview/` dans le site actuel | oui | oui | oui | élevé : code déployé sur production, SW racine et URL absolues | non recommandé |
| branche `v12-premium` seule | source seulement | non directement | non | nul tant que Pages n'est pas reconfiguré | nécessaire mais insuffisant |
| basculer GitHub Pages du dépôt actuel sur une branche preview | oui | oui | oui | critique : remplace potentiellement la source de production | interdit |
| dépôt GitHub Pages séparé | oui | oui | oui HTTPS | nul pour `mpbp440.com` si aucun CNAME prod | recommandé |
| service de branch previews séparé | oui | oui | oui HTTPS | nul si configuration isolée | bonne alternative après autorisation |

### Recommandation

Utiliser deux niveaux :

1. **développement local** depuis `v12-premium` avec un serveur HTTP, pour les itérations PC et les tests de routes ;
2. **site HTTPS séparé** pour la recette partagée et iPhone, idéalement un dépôt GitHub Pages dédié comme `Sparetdee-Simon-site-v12-preview` ou un service de preview de branches isolé.

Le site de preview doit :

- ne jamais contenir le `CNAME` de production ;
- avoir un hostname distinct ;
- être `noindex` ;
- utiliser un service worker désactivé au début ou strictement limité au hostname/scope preview ;
- gérer le base path si l'URL est `https://<compte>.github.io/<repo-preview>/` ;
- ne jamais publier de secret/back-office ;
- être déployé seulement après validation explicite.

Les URL absolues `/assets/...`, `/data.json` et le scope `/` cassent sous un sous-chemin GitHub Pages. Deux solutions sûres :

- un hostname de preview à la racine, par exemple un sous-domaine distinct validé ;
- un artefact de preview qui applique un `BASE_URL` au moment du déploiement, sans modifier les chemins publics de production.

### Parcours de recette

- PC : Chrome/Edge/Firefox, 1440 et 1920 px ;
- iPhone : Safari normal puis ajout à l'écran d'accueil ;
- Android si disponible : Chrome + installation PWA ;
- réseau lent, offline, mise à jour service worker ;
- liens partagés ouverts depuis une application externe ;
- aucun déploiement vers `www.mpbp440.com` avant signature de la recette.

## 10. Tests automatisés à préparer

### Syntaxe et données

- `node --check` sur tous les modules ;
- validation JSON par schéma ;
- unicité des IDs ;
- dates ISO valides ;
- fichiers d'assets présents ;
- URLs externes au format attendu.

### Routes

- requête HTTP de chaque page critique ;
- existence de chaque ancre critique ;
- validation des URL de news/notifications ;
- validation des canonicals et sitemap ;
- test sans JavaScript.

### UI

- screenshots desktop/mobile par page ;
- détection overflow horizontal ;
- état menu, filtres, lightbox et notifications ;
- deep links MPBP TV ;
- un seul média en lecture.

### PWA

- manifeste installable ;
- icônes et dimensions ;
- précache sans erreur silencieuse ;
- cache borné ;
- scénario update/offline ;
- service worker limité au bon environnement.

## 11. Stratégie de commits et validations

Chaque lot doit comporter :

1. un commit infrastructure/composants ;
2. un commit migration de page ou données ;
3. un commit tests/ajustements ;
4. un rapport de recette ;
5. aucune inclusion de ZIP, patch, média ou modification hors périmètre.

Avant push :

- `git status --short` ;
- inspection de `git diff --stat` et `git diff` ;
- tests syntaxe/JSON/routes ;
- vérification des deux fichiers protégés ;
- comparaison de `main` au tag stable ;
- confirmation qu'aucun asset n'est supprimé.

## 12. Définition de « prêt à fusionner »

La V12 ne sera prête à être proposée à `main` que si :

- les cinq lots sont terminés ou explicitement réduits par décision produit ;
- la preview HTTPS est validée PC et iPhone ;
- toutes les URL critiques passent ;
- aucun asset officiel n'est remplacé ;
- les données réelles 2026 sont cohérentes ;
- le back-office public et ses secrets ont un plan de sécurisation approuvé ;
- performance, accessibilité, PWA et cache sont testés ;
- une procédure de rollback vers le tag V11 est écrite ;
- le propriétaire donne une validation explicite de fusion et de déploiement.

## 13. Hors périmètre de l'étape 1

- intégration HTML/CSS/JS de la V12 ;
- modification ou migration des JSON ;
- compression/régénération de médias ;
- création d'une preview distante ;
- changement GitHub Pages/DNS/CNAME ;
- fusion vers `main` ;
- déploiement production ;
- mise en place d'un serveur push ou d'une authentification backend.

Ce plan rend la refonte exécutable par lots, avec des points de rollback et des critères de validation mesurables, tout en maintenant la V11 de production intacte.
