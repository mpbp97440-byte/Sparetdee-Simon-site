# Mission V15 — audit initial, 23 novembre 2026

Cet audit précède toute modification applicative. La V15 est arrêtée au jalon de validation visuelle demandé. Aucun résultat présenté ici ne vaut certification de la future refonte.

## Source réellement publiée

- Dépôt : `mpbp97440-byte/Sparetdee-Simon-site`.
- Branche publiée observée : `main` ; HEAD `49e4ae78539e2305296db3c92ad7d8e1a3f528f2`, 13 octobre 2026, « content: publish Prince Remix and October 2026 releases and clips ».
- Déploiement GitHub Pages `7029376634`, état `success`, URL `https://www.mpbp440.com/` ; workflow dynamique Pages `38342301127`, branche et SHA identiques, terminé avec succès.
- Les réponses publiques de `/`, `/music/`, `/mpbp-tv/`, `/galerie/`, `/actu/`, `/evenements/`, `/members/`, `/mon-espace/`, `/telechargements/`, du manifeste, du SW, de `data.json` et du module Firebase ont le même SHA-256 que les blobs Git du HEAD retenu.
- `CNAME` contient `www.mpbp440.com`. Ce fichier n'a pas servi seul de preuve : déploiement, workflow, en-têtes HTTP et empreintes ont été recoupés.
- `https://mpbp440.com/` répond 301 vers `https://www.mpbp440.com/`, qui répond 200 depuis GitHub.com. Aucune modification DNS.
- API publique `/pages` : 404 sans authentification. Les paramètres privés complets de Pages n'ont pas été consultés. La publication effective depuis main est étayée par les preuves ci-dessus.
- L'ancien dépôt `MPBP440-V12-Preview` est au HEAD `02d151522e7594561c34dfa1b6a39f3f29ba49d3`, daté du 19 septembre 2026. Il n'a fourni aucun fichier à la V15.
- Les deux dépôts sont les seuls dépôts publics retournés pour ce propriétaire. Ce n'est pas un inventaire des dépôts privés.

Preuves : `preuves/remote-audit.json`. [Déploiement Pages](https://api.github.com/repos/mpbp97440-byte/Sparetdee-Simon-site/deployments/7029376634/statuses), [workflow publié](https://github.com/mpbp97440-byte/Sparetdee-Simon-site/actions/runs/38342301127).

## Copies locales et isolation

Le dossier de mission était vide. La copie existante dans Documents/GitHub/Sparetdee-Simon-site est sur main au même HEAD, sans modification ni fichier non suivi selon `git status --short`. Ses branches locales V14 sont antérieures ; aucun code n'y a été écrit. La recherche a également examiné les dossiers MPBP d'audit/API identifiés sur le bureau, sans retrouver de source de Worker. Ce contrôle est borné, pas un examen exhaustif du disque.

Un clone complet `source/` conserve main. Son checkout initial désactivé présentait artificiellement tous les fichiers comme supprimés ; cela provenait du clonage `--no-checkout`, pas de suppressions utilisateur. Après matérialisation du HEAD, main est propre. Le travail est isolé dans `v15/`, branche `codex/mpbp440-corp-v15-dual-universe`. Seuls des fichiers nouveaux de maquette, d'outillage et de documentation y sont ajoutés à ce jalon.

## Architecture et dépendances réelles

Site statique sans package.json ni framework de build. Le dépôt contient 404 fichiers suivis, dont 25 fichiers HTML (deux sont des snippets historiques, pas des pages). Les contenus existent dans plusieurs JSON parallèles : aucune consolidation destructive n'est proposée.

Le graphe complet extrait des HTML, CSS, JS et JSON contient 157 entrées : `preuves/dependency-graph.json`. Il conserve aussi les IDs d'ancres et les origines externes, y compris celles des tests : cette liste ne signifie pas que chaque service est exécuté.

| Élément | Usage actuel / risque de déplacement |
|---|---|
| `index.html` | Accueil musical, intro avec/sans son, sections dynamiques et liens profonds. Le futur portail ne doit pas reprendre ses scripts musicaux. |
| `assets/css/v14-*.css` | Sept feuilles réellement liées depuis l'accueil : compat, tokens, shell, components, home, pages, responsive. Tokens : #02070b, #e7b860, #62c9ca ; Montserrat via Google Fonts. |
| `style.css`, `script.js` | Héritage conservé. `script.js` reste chargé et gère données, audio, intro, notifications, radio et enregistrement du SW. `style.css` est notamment précaché, mais n'est pas une feuille directement liée par l'accueil V14. |
| `v12-homepage.js` | Charge `data.json`, `data/news.json`, `data/events.json`, `data/gallery.json` via `document.baseURI`. Déplacer le HTML sans adapter ces URL casse les données. Médias également résolus avec baseURI. |
| `publicRoot()` dans `script.js` | Reconnaît plusieurs sous-routes, mais pas `musique` ; `actu`, `mon-espace` et `dashboard` sont également absents de cette expression. Adaptation centralisée et tests nécessaires. |
| `v12-navigation.js` | Menus, focus, ancres, comparaison des chemins. Préserver cette logique et adapter explicitement la racine musicale. |
| `v12-preview-basepath.js` | Réécrit les chemins pour l'ancien dépôt Preview et githack. Ce n'est pas une solution générique au déplacement vers /musique/. |
| `v14-motion.js` | Mesure du header, cadres des médias et amélioration visuelle. Réduction du mouvement prise en compte dans le code et les CSS. |
| `music/index.html` | Catalogue de morceaux distinct du futur /musique/ ; conserve #morceaux. |
| `mpbp-tv/index.html`, `v12-mpbp-tv.js` | Lecteurs locaux et YouTube, ancres de clips, bibliothèque issue de `data/videos.json`, contrôles et engagement Firebase. |
| `artistes/` | Trois pages individuelles ; `artist.js` lit `data/releases.json`, `v12-artist.js` lit `data.json`. Aucun index d'artistes : `/artistes/` est actuellement 404 en production. |
| `data/`, `assets/` | Contenus et médias originaux préservés intégralement. Les MP4 lourds ne doivent pas être transférés automatiquement au portail corporate. |
| `manifest.webmanifest`, `sw.js` | PWA musicale avec start_url=/ et scope=/. Changement d'accueil sensible pour les installations existantes. |
| `robots.txt`, `sitemap.xml` | Sitemap sur www ; robots masque les routes admin/preview sans constituer une protection d'accès. Pas de page 404 dédiée versionnée. |

Le label est représenté par trois artistes et les véritables contenus d'octobre sont présents. Le dernier focus éditorial est « Prince des étoiles Remix », Sparetdee Simon, annoncé disponible le 13 octobre 2026 dans le JSON. Cette information éditoriale n'est pas une vérification de lecture audio sur chaque plateforme.

## Administration, membres, statistiques

`admin-440-mpbp-corp/auth.js` exige Firebase Auth, un document `admins/{uid}` actif de rôle admin, puis la validation du Worker. L'UI se ferme sur refus. Le jeton est demandé au moment de la requête ; pas de jeton GitHub client constaté. Attention : une connexion admin valide déclenche aussi un bootstrap de registre ; elle n'a donc pas été tentée dans cet audit en lecture seule.

Le CMS gère les fichiers JSON musique, sorties, countdowns, vidéos, galeries, événements et actualités. Son brouillon est local (`mpbp440.cms.draft.firebase.v1`) ; il comporte uid/payload/date, sans restauration automatique. Les médias temporaires restent en mémoire ; export local et publication distante sont deux opérations distinctes. Les chemins autorisés du Worker ne peuvent pas être déduits du seul code client.

`members/` et `mon-espace/` stockent des profils, favoris et historiques sur l'appareil, dans des familles de clés différentes. Ils ne constituent pas un espace client authentifié, synchronisé ou licencié. Préserver ces clés et ne pas les réutiliser pour des droits commerciaux.

Des rendus HTML de favoris/historiques locaux utilisent des interpolations non échappées dans les modules historiques. Risque de DOM XSS à examiner avec tests dédiés ; aucune exploitation tentée. Ne pas exposer ces espaces à des données clients sensibles.

Les statistiques actuelles utilisent GA4 et Firestore. `data/analytics-config.json` et certains fichiers de compteur sont historiques et ne prouvent pas des statistiques globales actives. GA4 est initialisé sans garde de consentement explicite identifiée dans ce module ; revue des traceurs nécessaire avant commercialisation. Les notifications possèdent un consentement distinct, qui ne vaut pas consentement analytics.

## Firebase aujourd'hui

- SDK 13.0.0 : ressource CDN répond 200. Version fixée dans le code, aucun upgrade réalisé.
- GET de configuration Identity Toolkit avec la clé Web déjà publique : 200 ; domaines localhost, firebaseapp, web.app, www et apex autorisés. L'erreur de clé API du 13 octobre ne se reproduit pas sur cette lecture actuelle.
- Cela ne prouve pas une connexion anonyme ou administrateur : aucune création de compte ni tentative avec un compte réel n'a eu lieu.
- Règles Firestore versionnées : rôles admin non modifiables par le client, registre actif avant écriture, commentaires publics approuvés, suppression définitive refusée, refus par défaut.
- Règles déployées, index, registres, droits réels et comptes : NON TESTÉS. La présence de `firestore.rules` n'est pas une preuve de leur déploiement.
- Likes, commentaires, modération et compteurs réels : NON TESTÉS de bout en bout.

## Worker Cloudflare et Supabase

Worker identifié à `mpbp440-cms-worker.mpbp97440.workers.dev` : `/health` 200, version déclarée 1.0.0, projet Firebase et dépôt cohérents. `/admin-verify` sans jeton renvoie 401 ; OPTIONS origine officielle 204, localhost 403. Cela valide ces réponses seulement, pas l'intégrité des autorisations ni une publication.

La source Cloudflare (Worker, wrangler, contrat des fichiers, gestion des conflits de publication) n'est pas dans le dépôt principal ; aucune implémentation retrouvée dans les emplacements locaux examinés. Les fonctions historiques Supabase ne sont pas cette implémentation. L'accès à la vraie source/version du Worker est un prérequis pour étendre la publication Engineering en sécurité. Pas de faux bouton Publier.

`supabase/` est déprécié à l'exécution, mais `.github/workflows/supabase-migrations.yml` peut encore faire `db push --linked` et déployer deux fonctions sur main pour les chemins concernés. Aucun workflow, migration, secret, règle ou Worker n'a été déclenché ou modifié. Neutralisation/retrait de ce mécanisme à proposer séparément avant tout futur merge touchant ces chemins.

## Paiements et hébergement

Pas d'intégration myPOS opérationnelle constatée dans l'exécution auditée. Les [PayButtons](https://developers.mypos.com/online-payments/payment-links-buttons/payment-buttons) et [PayLinks](https://developers.mypos.com/online-payments/payment-links-buttons/payment-links) redirigent vers des pages de paiement myPOS ; le texte personnalisable « Subscribe » ne démontre pas un renouvellement. La [Link API officielle](https://developers.mypos.com/apis/ecommerce/link) présente des liens réutilisables et des cas de facturation récurrente/manuelle avec des identifiants d'application ; cela ne prouve ni l'éligibilité du compte MPBP ni un prélèvement automatique. L'ancien PDF Checkout v1.3.4 référencé dans les résultats de recherche renvoie 404 lors de l'ouverture : ses détails ne sont pas certifiés. Un contrat Checkout/API actuel et les capacités du compte doivent être obtenus avant conception détaillée de la récurrence.

Aucun accès au compte marchand, aucun lien créé, aucun débit et aucun test sandbox. Vente, licences et abonnements restent désactivés. L'architecture conserve GitHub Pages pour le front ; aucun fournisseur ou service payant supplémentaire n'est nécessaire pour ce jalon.

## Risques avant production

1. Ancres de l'accueil et chemins relatifs sensibles au déplacement ; champs `label/application/liens` actuellement ancres vides, ne pas prétendre à une section pleine sans vérifier l'héritage.
2. PWA : le SW met en cache les GET même de pages admin/membres à origine identique, sans exclusion explicite ; l'auth Firebase distante n'est pas cachée par ce SW. Exclusions sensibles à ajouter avant extension commerciale. Installation et hors ligne réels NON TESTÉS ici.
3. Deux tests hérités échouent déjà au HEAD publié ; les journaux sont conservés, pas les attentes réécrites pour masquer ces écarts.
4. `/artistes/` déjà 404. Fiches individuelles conservées ; index de compatibilité à construire après validation.
5. Dossier légal incomplet dans les pages : informations professionnelles, confidentialité, traceurs, CGV, licence, résiliation, taxes et droits applicables à valider avec les véritables données avant vente. Aucune adresse privée, immatriculation ou clause validée n'est inventée.
6. Aucun lien Roblox ni capture produit vérifié dans cette source : pas de bouton Jouer ou Télécharger actif.

Voir `ARCHITECTURE.md`, `VALIDATION-VISUELLE.md`, `TESTS.md` et `SAUVEGARDE-ROLLBACK.md` pour la suite autorisée.
