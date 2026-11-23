> État final : direction R3 et mise en ligne autorisées le 23 novembre 2026. Le contenu ci-dessous conserve les décisions et résultats du jalon préparatoire. Pour la réalisation finale, voir [LIVRAISON.md](LIVRAISON.md) et [TESTS-FINAL.md](TESTS-FINAL.md).

# Révision R3 — Atelier numérique MPBP Engineering

État : direction visuelle proposée, EN ATTENTE DE VALIDATION. Le propriétaire a rejeté la R2 pour son aspect uniforme, sa typographie et ses boutons trop génériques. Le logo Engineering, déjà validé, reste identique. La R2 est conservée dans son historique et ses captures ; elle n'est pas une référence de design approuvée.

## Nouvelle direction

Un atelier numérique monumental en bleu nuit, titane, cuivre et cyan donne une profondeur architecturale à Engineering. Le décor est une illustration générée, pas une photographie de locaux MPBP ni une capture de logiciel. La composition et l'éclairage créent des zones distinctes pour le texte, les projets et les appels à l'action.

Titres : Space Grotesk. Texte : Manrope. Les huit fichiers de polices sont hébergés localement, sans requête Google Fonts à l'exécution ; les licences OFL sont conservées dans preview/v15/fonts/. Les sources proviennent de Google Fonts et les licences du dépôt officiel google/fonts.

Les boutons sont redessinés avec angles découpés, matières cuivre/verre bleu, séparateur et marque +. Les cartes alternent grands formats éditoriaux et modules de catalogue, avec des visuels d'ambiance clairement décoratifs. Les surfaces translucides et arrière-plans restent dans le même univers sur boutique, démos et fiches. Les préférences de réduction de mouvement sont conservées ; aucun son ou vidéo automatique n'est ajouté.

## Ressources et construction

- Décor original généré : assets/brand/v15/engineering-atelier-r3-source.png.
- Fond de site optimisé : assets/brand/v15/engineering-atelier-r3.webp, 212 854 octets.
- Création du décor : outil imagegen intégré, pas d'appel API facturé via une clé locale. Compression WebP via sharp, original conservé.
- Style limité à Engineering : preview/v15/atelier-r3.css et fonts-r3.css.
- Transformation reproductible après le générateur R2 : tools/v15-build-review-r3.py.
- Captures : preview/v15/captures-r3/ ; les captures R2 ne sont pas écrasées.

La musique, son emblème historique et ses fichiers applicatifs restent inchangés. Le logo corporate fourni et le logo Engineering validé sont également inchangés. Aucun texte de fonctionnalité, version, disponibilité ou prix n'a été inventé pour remplir le décor.

## Contrôles de ce jalon

20 contrôles responsive (cinq vues × 320, 390, 768 et 1440 px) : PASS sur absence de débordement horizontal, médias chargés, landmark main et polices chargées. Les captures proviennent de Chromium sur Windows ; pas d'essai physique sur iPhone Safari revendiqué.

7 contrôles d'interaction : PASS pour menu mobile, Échap/focus, accès au catalogue, filtre agent, recherche vide, six présentations sans achat et zéro fausse démo de jeu. 404 fichiers préexistants inchangés et deux logos approuvés identiques au contenu Git préparé précédemment. Preuves : r3-checks.json, r3-responsive.json et r3-functional.json.

Les deux FAIL hérités du rapport initial ne sont pas effacés. Authentification réelle, publication Worker, paiements, PWA finale et démos distantes restent NON TESTÉS. Les ventes restent verrouillées. Aucun push, merge, migration, DNS, backend ou production modifié.

La présentation sur iPhone est fournie directement sous forme d'images dans la conversation. Aucun lien localhost n'est présenté comme accessible depuis le téléphone.

## Prompt exact du décor (imagegen)

Use case: stylized-concept. Asset: cinematic wide background artwork for MPBP 440 Design & Software Engineering website. Create an unmistakable sophisticated engineering universe, premium architectural visualization, not a generic blue gradient, not a dashboard screenshot. A vast midnight-blue computational atelier with monumental precise machined titanium and brushed copper structures; on the RIGHT two thirds an elegant suspended geometric processor core formed of interlocking beveled metallic planes, with narrow cyan light traces, sculptural gold/copper framework, fine fiber-optic data paths traveling across a polished obsidian floor, distant tall glass slabs and atmospheric light shafts. Deep spatial perspective, restrained haze, rich tactile materials, warm amber key light and icy cyan rim light, high-end cinematic realism. LEFT third is dark but richly textured negative space suitable for large readable typography, no bright elements behind that left area. Strong coherent architectural composition, refined luxurious visual identity, suitable for an independent artistic engineering corporation. Full-bleed landscape 16:9 or wider. No words, no lettering, no brand marks, no diagrams, no UI, no people, no palms, no generic glowing circuit-board wallpaper. Do not copy or change any supplied brand logo. This is decorative artwork, not a photo of real company infrastructure.
