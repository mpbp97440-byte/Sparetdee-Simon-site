# Gousto Cuisto et Les Jardins des Lumélys — 23 novembre 2026

Base de cette mise à jour : `040c9ededca7e918bc9221c5da38da969083af91`.
Même branche de travail V15. Aucun logiciel, backend, paiement, règle ou compte modifié.

## Contenu

- Nouvelle fiche `/engineering/projets/gousto-cuisto.html`, neuvième projet du catalogue.
- My Gousto Cuisto reste en développement, libre d’utilisation pour le moment selon le propriétaire. L’accès est une ouverture de l’application publique, pas une vente ni une fausse démonstration.
- Capture réelle dans une session neuve, avec les quatre occurrences du prénom affiché masquées localement. L’image brute reste hors du dépôt et du site.
- Inventaire, préférences et suivi conservés dans le navigateur via localStorage/IndexedDB, selon le JavaScript public v30 examiné. Ne pas promettre une absence totale d’envoi de données : le client appelle `/api/gousto-ai` pour la discussion, les photos et les produits. La discussion transmet question, ingrédients, prénom/pseudo et historique récent ; le scanner transmet une image réduite après accord. L’application mentionne Gemini. La conservation côté serveur n’a pas été auditée.
- Les Jardins des Lumélys : fiche existante conservée, statut Bêta, bêta publique pour les plus de 16 ans selon le propriétaire, qui confirme jouer chaque jour.
- Lien Roblox exact fourni par le propriétaire, sans reconstruire un identifiant de jeu. Le navigateur non connecté est redirigé vers la connexion Roblox. Le parcours joueur est attesté par le propriétaire ; il n’a pas été exécuté par Codex.
- Pochette officielle fournie, convertie en WebP sans modification du visuel.
- Teaser promotionnel fourni : 78,366667 secondes, source 193 041 340 octets. Version web H264/AAC 1280×720, 20 213 350 octets, métadonnées source supprimées et index de lecture placé en début de fichier.
- Lecteur intégré avec contrôles, `playsinline`, `preload="none"`, aucun autoplay. Lien MP4 de secours. Vidéo exclue du cache public du service worker.
- Mention immédiatement sous le lecteur, reliée par `aria-describedby` : « Vidéo promotionnelle — visuels non contractuels. Les images, décors et éléments présentés peuvent différer de ceux du jeu. Le rendu peut varier selon les capacités de l’appareil et les réglages graphiques. »
- La pochette apparaît aussi dans le catalogue et la section Jeux de l’accueil Engineering. L’espace Démos & essais présente deux accès publics : Gousto Cuisto et le jeu Roblox. Les sept autres projets restent inchangés.

## Édition ultérieure

Source du catalogue : `preview/v15/data/engineering.json`. Schéma : `docs/v15/catalogue.schema.json`.
Le type de lien `open` décrit une application publique existante. Comme `play`, il exige les indicateurs de vérification du lien et de l’accès. Aucune vente n’est autorisée.
Le champ optionnel `demoVideoNotice` contient la mention de la vidéo ; il est conservé par l’éditeur local à l’import/export.

Pour régénérer :

```text
python tools/v15-build-design-review.py
python tools/v15-build-production.py
python tools/v15-gousto-lumelys-checks.py
```

Le lecteur MP4 intégré est limité aux médias internes Engineering. Les vidéos externes restent des liens HTTPS. Aucun nouvel hébergement payant ni plateforme tierce n’est ajouté.

## Vérification

Preuves : `docs/v15/preuves/gousto-lumelys-20261123/`.

| Contrôle | Résultat |
| --- | --- |
| Schéma, neuf fiches, interdiction de vente | PASS |
| Refus des liens open/play non vérifiés | PASS |
| Sept autres projets strictement inchangés | PASS |
| Données musicales, accueil musical, catalogue et manifeste inchangés | PASS |
| Tous les médias préexistants conservés | PASS — empreintes comparées à la base |
| Admin, règles, workflows et domaine inchangés | PASS |
| Ressources et liens internes des pages publiques | PASS |
| Captures anonymisées, métadonnées supprimées | PASS |
| Lecteur MP4 contrôlé et mention promotionnelle | PASS |
| Lecture effective du teaser dans le navigateur | PASS — 1280×720, durée 78,366667 s, readyState 4, lecture observée jusqu’à 74,496838 s |
| Quatre pages à 320, 390, 768 et 1440 px | PASS — 16 cas, largeur réellement observée, aucun débordement ni image déclarée cassée |
| Filtres Applications/Jeux et recherche Gousto | PASS — un accès dans chaque catégorie |
| Menu mobile | PASS — ouverture observée à 390 px |
| Régression médias, couche visuelle, routage SW, surface sécurité, CMS/renderer | PASS — cinq suites existantes ou adaptateurs déjà documentés, journaux conservés |
| Partie de jeu exécutée par Codex | NON TESTÉ — usage quotidien confirmé par le propriétaire |
| Gemini, scanner, caméra, micro, conservation serveur de Gousto | NON TESTÉ — aucun message ni média personnel envoyé |
| iPhone Safari physique, installation et cycle hors ligne complets | NON TESTÉ |
| Sous-titres/transcription du teaser | NON FOURNIS — aucun fichier inventé |
| Paiements et autres accès logiciels | DÉSACTIVÉS, aucun test financier |

Les anciens snapshots d’octobre et le rapport de la mise à jour précédente ne sont pas réécrits pour masquer leurs attentes historiques. Le nouveau contrôle utilise la dernière version publiée comme référence et conserve intégralement la musique.

## Sauvegarde et retour arrière

Archive avant changement : `backups/v15-before-gousto-lumelys-040c9ed.zip`, hors du site et du dépôt public, intégrité ZIP vérifiée. Les médias originaux reçus dans Téléchargements sont conservés.
Le relevé `artifacts.json` conserve les empreintes de l’archive, du teaser et des nouveaux visuels.
Retour arrière : créer un commit de réversion du commit de cette mise à jour sur la branche V15, contrôler le diff, puis publier après autorisation. Ne pas forcer l’historique, supprimer des données ou modifier une base. L’archive et le commit de référence permettent de restaurer exactement les sources antérieures.

Prévisualisation locale : `python tools/v15-lumelys-preview.py`, puis `http://127.0.0.1:4417/engineering/`. Le récepteur de capture est strictement local, limité à des noms JPEG autorisés et écrit hors du dépôt.
