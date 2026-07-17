# MPBP440 V12 Premium — compatibilité des URL publiques

Objectif : aucun lien déjà partagé ne doit devenir obsolète pendant la migration V12. GitHub Pages ne fournit pas de règles serveur de réécriture comparables à Apache/Nginx ; la compatibilité doit donc être assurée par les fichiers HTML, les identifiants DOM, les liens et éventuellement des pages alias statiques.

## 1. Contrats MPBP TV prioritaires

Les quatre contrats demandés existent sur la base V11 :

| URL publique | Fichier | Ancre présente | Asset principal | Statut |
|---|---|---|---|---|
| `/mpbp-tv/index.html#l-argent` | `mpbp-tv/index.html` | `id="l-argent"` | `assets/videos/l-argent.mp4` | valide |
| `/mpbp-tv/index.html#clip-je-sais-que-tu-sais` | `mpbp-tv/index.html` | `id="clip-je-sais-que-tu-sais"` | MP4 Juste Une Plume | valide |
| `/mpbp-tv/index.html#clip-j-existe` | `mpbp-tv/index.html` | `id="clip-j-existe"` | MP4 Makéda Muse | valide |
| `/mpbp-tv/index.html#clip-dois-je-me-taire` | `mpbp-tv/index.html` | `id="clip-dois-je-me-taire"` | MP4 Sparetdee Simon | valide |

Les formes courtes utilisées dans certains boutons de partage doivent aussi continuer à fonctionner :

- `/mpbp-tv/#l-argent` ;
- `/mpbp-tv/#clip-je-sais-que-tu-sais` ;
- `/mpbp-tv/#clip-j-existe` ;
- `/mpbp-tv/#clip-dois-je-me-taire`.

GitHub Pages résout normalement `/mpbp-tv/` vers `mpbp-tv/index.html`. La V12 doit tester les deux formes, avec et sans `index.html`.

### Règles de migration MPBP TV

1. garder le fichier `mpbp-tv/index.html` ;
2. garder les quatre `id` exacts, accents et casse compris ;
3. si la structure visuelle change, placer l'`id` sur un wrapper stable avant le lecteur ;
4. conserver un `scroll-margin-top` compatible avec le header sticky ;
5. ne pas intercepter le hash avant que la section existe dans le DOM ;
6. préserver les liens directs vers les quatre MP4 ;
7. garder les metadata `VideoObject.url` alignées sur les ancres ;
8. tester l'ouverture depuis une notification, un partage externe, une nouvelle fenêtre et une PWA installée.

## 2. Pages artistes

| Artiste | URL actuelle | Référencée depuis |
|---|---|---|
| Sparetdee Simon | `/artistes/sparetdee-simon.html` | homepage, MPBP TV, sitemap, données artistes |
| Juste Une Plume | `/artistes/juste-une-plume.html` | homepage, MPBP TV, sitemap, données artistes |
| Makéda Muse | `/artistes/makeda-muse.html` | homepage, MPBP TV, news, notifications, sitemap |

Ces trois fichiers doivent rester les URL canoniques même si la V12 partage un template ou un module de rendu. Ne pas les remplacer par une route dynamique inexistante sur GitHub Pages comme `/artistes/:slug`.

Les retours vers `/#artistes`, les liens vers `/music/index.html#morceaux` et les liens vers les ancres TV doivent rester actifs.

## 3. Ancres homepage

Ancres présentes et utilisées :

| Ancre | Fonction | Principaux appelants |
|---|---|---|
| `#home` | accueil | header, correctifs de navigation |
| `#label` | présentation label | header et routes héritées |
| `#sortie` | sorties disponibles | header, footer, accès rapide |
| `#avenir` | pré-sorties/comptes à rebours | header, news, notifications, artistes |
| `#clips` | aperçu MPBP TV | header, TV retour, accès rapide |
| `#artistes` | cartes artistes | header, footer, pages artistes |
| `#actus` | actualités | header, footer, pages artistes |
| `#journal` | journal des notifications | une actualité et Makéda |
| `#events` | événements | header, notifications, Makéda |
| `#galerie` | aperçu galerie | header et anciennes routes |
| `#radio` | radio | header et MPBP TV |
| `#liens` | plateformes | header et pages artistes |
| `#application` | aide PWA | header |

La V12 peut renommer les classes et composants, mais pas ces identifiants pendant la période de compatibilité. Si une section est déplacée vers une page dédiée, conserver sur la homepage une cible alias visible ou un petit bloc de transition avec lien, sans boucle de redirection.

## 4. Music Hub et sorties

Contrats actuels :

- `/music/` ;
- `/music/index.html` ;
- `/music/index.html#morceaux` ;
- `/#sortie` ;
- `/#avenir` ;
- `/sortie/` et `/a-venir/` comme pages historiques.

`music/index.html` possède `id="morceaux"`. Il ne possède pas `id="avenir"`.

La V12 doit conserver `#morceaux` comme cible de recherche/catalogue. Pour les anciennes URL `music/index.html#avenir`, deux options compatibles sont possibles :

1. ajouter une cible alias `id="avenir"` dans Music Hub qui explique que les pré-sorties sont sur `/#avenir` et fournit un lien ;
2. intercepter uniquement ce hash historique et naviguer vers `/#avenir` avec `location.replace`, en préservant un fallback HTML.

L'option 1 est préférable sur GitHub Pages : elle reste fonctionnelle sans JavaScript, évite une navigation inattendue et offre une transition claire.

## 5. URL des actualités et notifications

Toutes les URL actuelles de `data/news.json` et `data/notifications.json` ont été vérifiées : fichier et ancre présents.

Destinations utilisées :

- `/#avenir` ;
- `/mpbp-tv/index.html#clip-dois-je-me-taire` ;
- `/mpbp-tv/index.html#clip-j-existe` ;
- `/mpbp-tv/index.html#clip-je-sais-que-tu-sais` ;
- `/music/index.html#morceaux` ;
- `/artistes/makeda-muse.html` ;
- `#journal` sur la homepage ;
- `/#events`.

Le clic de notification du service worker ouvre directement `notification.data.url`. Toute modification de ces URL aurait donc un impact sur les notifications déjà affichées ou conservées localement.

La future page premium `/actu/` ne doit pas remplacer les destinations actuelles en masse. Les nouvelles actualités pourront pointer vers `/actu/#<id-stable>`, mais les anciennes entrées doivent garder leur destination ou disposer d'un alias.

## 6. Galerie, événements et pages applicatives

Routes physiques présentes à préserver tant qu'elles sont indexées ou liées :

- `/galerie/` et `/galerie/index.html` ;
- `/actu/` ;
- `/notifications/` ;
- `/evenements/` ;
- `/live/` ;
- `/a-venir/` ;
- `/sortie/` ;
- `/application/` ;
- `/members/` ;
- `/mon-espace/` ;
- `/telechargements/` ;
- `/dashboard/` ;
- `/lyrics/je-sais-que-tu-sais.html` ;
- `/lyrics/le-systeme.html`.

Certaines de ces pages sont historiques ou redondantes. Leur retrait éventuel doit être précédé d'une mesure d'usage et d'une page alias statique, jamais d'une suppression silencieuse.

## 7. Ancres obsolètes détectées

Six pages partagent deux liens invalides, soit douze occurrences :

| Pages | Lien invalide | Cause | Cible V12 recommandée |
|---|---|---|---|
| `a-venir/`, `actu/`, `evenements/`, `live/`, `notifications/`, `sortie/` | `/music/index.html#avenir` | ancre absente du Music Hub | alias `#avenir` ou `/#avenir` |
| mêmes pages | `/#recherche` | ancre absente de la homepage | `/music/index.html#morceaux` |

Ces liens ne sont pas des 404 de fichier : la page se charge, mais la navigation n'atteint pas le contenu demandé. Ils doivent être corrigés dans le lot shell/navigation, avec tests de non-régression.

## 8. Chemins d'assets comme contrats

Les chemins de médias déjà exposés par le HTML, les JSON, les metadata sociales ou les liens directs doivent être considérés comme publics, notamment :

- les quatre MP4 MPBP TV ;
- les posters de clips ;
- les flyers de sorties ;
- les photos artistes présentes dans les metadata Open Graph ;
- `/assets/brand/mpbp440-official-logo.jpg` ;
- `/assets/icons/mpbp440-icon.svg`.

Une optimisation V12 doit ajouter un dérivé et laisser l'ancien chemin disponible. Les liens historiques ne doivent jamais être remplacés par un nom hashé sans copie de compatibilité.

## 9. Contraintes GitHub Pages, CNAME et PWA

- `CNAME` fixe la production à `www.mpbp440.com` ; il ne doit pas être modifié pendant la V12.
- `.nojekyll` doit rester présent pour servir les fichiers tels quels.
- les URL racine `/...` fonctionnent en production grâce au domaine racine ; elles cassent dans une preview GitHub Pages sous `/nom-du-repo/` sans adaptation de base path ;
- le service worker a une portée `/` et met les navigations en cache ; une ancienne réponse peut masquer un problème de route ;
- les tests de compatibilité doivent inclure une session sans service worker, une session avec cache existant et une mise à jour de service worker ;
- `sitemap.xml` contient actuellement la homepage, Music Hub, MPBP TV et les trois artistes. Toute nouvelle route canonique devra être ajoutée sans retirer les anciennes avant validation SEO.

## 10. Stratégie de rétrocompatibilité

### Couche 1 — contrats immuables

Créer une liste automatisée de routes/ancres critiques. Les quatre ancres TV, trois pages artistes, `#morceaux` et les ancres homepage doivent bloquer une livraison si elles disparaissent.

### Couche 2 — aliases HTML

Préférer des `id` alias et des pages statiques de transition aux redirections JavaScript. Ils fonctionnent sans script et avec GitHub Pages.

### Couche 3 — adaptateurs de données

Lors de la consolidation JSON, accepter temporairement les anciens champs et produire les mêmes URL. La vue ne doit pas fabriquer un slug différent d'une URL déjà publiée.

### Couche 4 — conservation des fichiers

Ne supprimer ni ancienne page ni asset pendant les lots visuels. Marquer les éléments « legacy » dans la documentation, puis attendre une mission de nettoyage avec preuve d'absence d'usage.

### Couche 5 — cache et migration PWA

Versionner le cache, mais nettoyer uniquement les anciens caches appartenant explicitement à MPBP440. Prévoir une stratégie de rechargement qui n'abandonne pas les anciennes URL en cache.

## 11. Matrice de tests obligatoire

Pour chaque URL critique :

1. réponse HTTP 200 ;
2. document final correct ;
3. ancre existante dans le DOM ;
4. scroll non masqué par le header ;
5. poster visible ;
6. bouton de lecture actionnable ;
7. partage/copie conserve l'URL attendue ;
8. retour arrière du navigateur correct ;
9. ouverture iPhone Safari correcte ;
10. ouverture PWA standalone correcte ;
11. comportement sans JavaScript acceptable ;
12. comportement offline explicite, sans fausse page vide.

Jeu minimal à automatiser :

```text
/
/#sortie
/#avenir
/#actus
/#events
/music/index.html#morceaux
/mpbp-tv/index.html#l-argent
/mpbp-tv/index.html#clip-je-sais-que-tu-sais
/mpbp-tv/index.html#clip-j-existe
/mpbp-tv/index.html#clip-dois-je-me-taire
/artistes/sparetdee-simon.html
/artistes/juste-une-plume.html
/artistes/makeda-muse.html
/galerie/
/actu/
```

## 12. Critère d'acceptation

La compatibilité V12 est acceptée seulement si :

- aucune URL prioritaire ne change ;
- les deux formes `/dossier/` et `/dossier/index.html` restent utilisables pour les pages partagées ;
- les anciennes ancres disposent d'une destination explicite ;
- aucune notification existante ne mène à une cible absente ;
- aucune suppression d'asset/page historique n'est incluse dans les lots visuels ;
- le test est effectué avec et sans cache PWA sur desktop et iPhone.
