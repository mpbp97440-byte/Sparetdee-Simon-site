> État final : direction R3 et mise en ligne autorisées le 23 novembre 2026. Le contenu ci-dessous conserve les décisions et résultats du jalon préparatoire. Pour la réalisation finale, voir [LIVRAISON.md](LIVRAISON.md) et [TESTS-FINAL.md](TESTS-FINAL.md).

# Direction V15 — proposition à valider ensemble

**Révision courante R3 — Atelier numérique :** la direction R2 a été rejetée. Le logo Engineering validé est conservé ; décor, typographies et composants ont été repris. Voir [REVISION-R3.md](REVISION-R3.md). 20 contrôles responsive et 7 interactions PASS ; validation visuelle utilisateur en attente.

**Révision prioritaire R2 :** voir [REVISION-R2.md](REVISION-R2.md). Le propriétaire a fourni le véritable logo corporate et confirmé que l'ancien emblème appartient à Music. Le nouveau logo Engineering est validé. Les anciennes descriptions/captures ci-dessous documentent R1 ; elles ne remplacent pas ces nouvelles instructions. La présentation révisée reste à valider dans son ensemble.

Les trois vues sont des maquettes HTML navigables isolées, pas une refonte déjà appliquée. Point de départ : logo officiel `assets/brand/mpbp440-corp-official.png`, image de scène V14 existante, portraits et pochette de Prince des étoiles Remix issus des contenus publiés. Aucun nouveau logo ou faux screenshot logiciel.

## Références

- `/preview/v15/index.html` : entreprise et deux portes d'entrée.
- `/preview/v15/musique.html` : entrée musicale et contenu représentatif ; l'accueil intégral V14 reste accessible par le lien prévu.
- `/preview/v15/engineering.html` : vitrine, filtres/recherche, six projets et six fiches de revue, services, jeu et modèles commerciaux non activés.
- `/preview/v15/review.html` : présentation regroupée et captures.

Captures JPEG complètes dans `preview/v15/captures/` : corporate, music, engineering, chacune en 320, 390, 768 et 1440 pixels. Les captures sont produites dans un navigateur Chromium ; pas une simulation Safari/iPhone. Les médias chargés à la demande peuvent être absents d'une mesure prise avant capture ; les captures et le contrôle après chargement font foi pour leur rendu.

## Spécification proposée

Palette : fond #050a10, panneaux #0b1620, texte #fff5df, secondaire #b9c8cd, or #e7b860, cuivre #bd8557 et cyan #62c9ca. Corps 16 px, labels principaux 14 px minimum ; Arial/Helvetica système pour une maquette autonome sans requête de police externe. Les couleurs proviennent de l'identité V14, avec une base plus sombre pour le corporate.

Desktop : largeur utile maximale 1280 px, marges 48 px ; en-tête ~92 px, identité en deux colonnes texte/emblème ; deux portes égales séparées de 24 px, ~370 px de haut, texte ancré en bas. Musique : scène V14, couleur chaude, intro accessible avec choix utilisateur, focus réel puis artistes. Engineering : cyan, composition typographique et schéma décoratif, catalogue en deux colonnes ; aucune capture de produit inventée.

Mobile ≤640 px : marges 18 px, menu déroulant et Échap, entrée corporate à une colonne ; logo officiel dans l'en-tête, emblème secondaire masqué pour limiter la hauteur ; portes empilées, boutons pleine largeur. Musique : focus/pochette puis trois artistes, navigation musicale repliée sur plusieurs lignes. Engineering : hero empilé, filtres tactiles, catalogue à une colonne. Tablette : marges 24 px et grille conservée selon place disponible.

Survol discret, pas de musique automatique. Transitions désactivées par CSS avec prefers-reduced-motion. Les maquettes ne comportent pas de vidéos automatiques, de bandeau de vente actif, de faux login ou de fausse publication.

## Accord demandé

Valider la composition des trois entrées et leurs adaptations mobiles, les couleurs, la hiérarchie, l'emplacement du logo, la distinction musique/technologie et la navigation générale. Une seule validation cohérente pour ce jalon. Après accord, les captures et cette spécification deviennent les références ; une modification matérielle de direction nécessitera un nouvel accord groupé.

L'accord visuel ne vaut pas autorisation de paiement, déploiement, migration ou création de compte. La préservation de l'accueil musical complet sera contrôlée après le déplacement, pas déduite de cette sélection éditoriale.

État : **EN ATTENTE DE VALIDATION UTILISATEUR**.
