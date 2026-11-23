# Révision 2 — identités corrigées et Engineering premium

Le propriétaire a corrigé l'identité corporate et demandé une boutique sans vente active, un espace d'essais/démos et des pages Engineering plus professionnelles. Le nouveau logo Engineering a ensuite été explicitement validé dans la conversation. Cette validation porte sur ce logo, pas sur une publication en production ni sur l'ensemble des nouvelles pages.

## Identités de référence

| Usage | Fichier | État |
|---|---|---|
| MPBP 440 Corp. | `assets/brand/v15/mpbp440-corp-user-official.jpg` | Image jointe par le propriétaire, copie identique octet pour octet. |
| MPBP Music | `assets/brand/mpbp440-corp-official.png` | Ancien emblème conservé à la demande du propriétaire, aucun remplacement du fichier historique. |
| Design & Software Engineering | `assets/brand/v15/mpbp440-engineering-concept-v1.png` | Nouveau logo généré avec imagegen intégré, puis explicitement validé par le propriétaire. Le nom de fichier initial « concept » est conservé pour éviter des copies/redirections inutiles ; l'asset est désormais approuvé. |

L'affirmation de la première maquette qui traitait l'ancien emblème musical comme logo corporate est corrigée par la présente instruction du propriétaire. L'audit historique du dépôt décrit ce qui était utilisé dans la source ; il ne doit pas être interprété comme une autorité supérieure au propriétaire sur son identité.

Le logo Engineering reprend l'or et le cuivre métalliques, une structure géométrique et un accent circuit cyan. Il est conservé tel que validé, sans retouche ni substitution. Le prompt et la provenance sont enregistrés dans `LOGO-ENGINEERING.md`.

## Pages de revue révisées

- `preview/v15/index.html` : logo corporate fourni, deux univers clairement identifiés.
- `preview/v15/musique.html` : ancien emblème musical et mêmes contenus représentatifs ; accueil musical original intégral toujours intact.
- `preview/v15/engineering.html` : nouvelle identité, hiérarchie éditoriale, catalogue en lignes, services et Game Studio.
- `preview/v15/projets/*.html` : fiches avec présentation, informations techniques, accès/démos et mises à jour.
- `preview/v15/boutique.html` : catalogue commercial préparé, aucun tarif inventé, aucune vente ni transaction possible.
- `preview/v15/demos.html` : filtres applications/agents/jeux et recherche ; seuls les accès publics vérifiés pourront apparaître.
- `preview/v15/contenus.html` : outil de préparation local, pas le back-office Firebase. Import, ajout, modification, masquage et export fonctionnent sans publication distante.

Le catalogue de revue réel est `preview/v15/data/engineering.json`, validé avant génération contre le schéma copié à côté. Les exemples `docs/v15/catalogue.candidats.json` restent les brouillons non publics du premier jalon.

Les six entrées de revue sont des annonces de noms/catégories fournis dans le brief. Elles sont affichables comme présentations de projets, avec `status: null`, caractéristiques vides, aucun prix, aucune version, aucune démo ni plateforme inventée. La vérification de contenu enregistrée concerne ces seules informations. Clarification du contrat R1 : un statut inconnu peut rester null dans une annonce publique factuelle si elle ne revendique aucune disponibilité ; `public` ne vaut pas « disponible à la vente ».

## Politique commerciale actuelle

Toutes les offres restent `pricing.enabled=false`. Le validateur navigateur et le générateur refusent un catalogue activant une vente ou un CTA purchase. La boutique ne comporte ni panier ni checkout, ni formulaire myPOS. Les modèles commerciaux futurs restent présentés à titre de structure, sans achat ou abonnement. Il faudra une demande et une implémentation sécurisée distinctes pour ouvrir les ventes.

Aucune démonstration vérifiée n'est fournie pour le moment. Le compteur affiche donc zéro, pas une fausse démo. Ajouter une vidéo HTTPS ou un lien d'essai/jeu exige une vérification explicite de son caractère officiel et public avant affichage dans le hub. Les démonstrations ne doivent pas exposer d'agent local privé.

## Édition et mises à jour sans Codex

1. Démarrer `python tools/v15-preview-server.py --port 4415` depuis `v15/`.
2. Ouvrir `http://127.0.0.1:4415/preview/v15/contenus.html`.
3. Choisir une fiche ou en ajouter une. Renseigner texte, catégorie, informations vérifiées, statut éventuel, compatibilités et liens. Laisser les informations inconnues vides.
4. Le nom, l'ID et le slug servent à identifier la fiche. Les IDs et slugs des fiches déjà vérifiées sont verrouillés dans le formulaire pour préserver les liens. Une migration de slug nécessite un traitement de compatibilité explicite.
5. Décocher l'affichage pour masquer, puis enregistrer. Le brouillon est local à cet appareil et à cette origine, sous une clé distincte des espaces musicaux. Aucun compte n'est requis ou créé.
6. Exporter le catalogue JSON validé, conserver le précédent fichier, puis remplacer `preview/v15/data/engineering.json` dans les sources. Les champs avancés (images, prérequis, limites, cas d'usage, historique et documentation) sont conservés lors de l'édition et peuvent être alimentés via JSON/import.
7. Exécuter `python tools/v15-build-design-review.py`, puis vérifier la prévisualisation et le diff. Les nouvelles fiches obtiennent alors leur HTML ; les fiches masquées ou retirées sont remplacées par une page neutre sans leur contenu, sans supprimer de source musicale.
8. Les modifications dans l'éditeur seules ne constituent pas une mise à jour publiée du site. Toute future publication restera séparée, revue et autorisée.

L'éditeur n'est autorisé à enregistrer que sur localhost/127.0.0.1. Cela ne le transforme pas en back-office sécurisé : il ne doit pas être utilisé pour des données privées ou pour attribuer des droits clients. L'extension distante attend toujours la vraie source du Worker et la vérification des autorisations.

## État des contrôles R2

Les résultats courants sont dans `preuves/r2-contract-checks.json`, `preuves/r2-browser-checks.json` et `preuves/r2-responsive.json`. Les tests d'ajout/import/export portent sur l'éditeur local réel. La fiche QA temporaire a été retirée du brouillon en réimportant le catalogue source à six entrées. Le fichier exporté de test est conservé comme preuve et clairement identifié QA.

Les réserves du rapport initial demeurent : production inchangée, deux tests hérités FAIL, source Worker absente, PWA finale et services réels NON TESTÉS. Les captures R1 sont conservées ; les nouvelles sont dans `preview/v15/captures-r2/`.
