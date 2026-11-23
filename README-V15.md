Mise à jour Gousto Cuisto et Lumélys : [rapport du 23 novembre 2026](docs/v15/GOUSTO-LUMELYS-20261123.md).

> Actualisation : sorties musicales, accueil et vitrine de sept applications/agent. Voir [la mise à jour du 23 novembre 2026](docs/v15/MISE-A-JOUR-20261123.md) pour le résultat et les preuves courants.

> Correctif musical : régression des images reproduite et corrigée. Les anciens contrôles étaient insuffisants ; voir [le rapport de correction](docs/v15/CORRECTIF-MEDIAS.md).

# Livraison V15 — portail officiel MPBP 440 Corp.

Direction R3 et publication explicitement autorisées par le propriétaire le 23 novembre 2026 : « Oui je valide fait le commit final et met le site à jour ».

Le portail corporate est à `/`, l’accueil musical complet à `/musique/`, Engineering à `/engineering/`. Les maquettes sont archivées sous `preview/v15/`, en noindex. Les preuves du site final sont distinctes dans `docs/v15/preuves/final-captures/`.

Le logo corporate fourni, l’emblème musical historique et le logo Engineering validé sont conservés. Le décor architectural R3 est une création graphique, sans prétendre représenter des locaux ou un produit réel.

## Fonctions livrées

- Accueil corporate et navigation entre les univers.
- Reprise intégrale du corps et des 36 identifiants de l’accueil musical, chemins adaptés. Données, médias, back-office, règles et workflows protégés inchangés.
- Compatibilité des anciens liens `/index.html#...` et `/#...` : passerelle des ancres musicales ; `#morceaux` conserve le Music Hub distinct.
- Engineering : six fiches de projets, recherche et catégories, services, Game Studio, boutique préparée et espace de démonstrations filtrable.
- Aucun achat, paiement, abonnement ou démo non vérifiée activé. Prix, versions et liens Roblox inconnus restent absents.
- Catalogue JSON validé, outil d’édition locale avec import/export et génération statique. Aucun faux bouton de publication distante.
- Canonical, Open Graph, sitemap, page 404, page d’informations à compléter, PWA conservant son identité musicale.

## Exploitation et limites

Lire [AUDIT-INITIAL.md](AUDIT-INITIAL.md), [EXPLOITATION.md](EXPLOITATION.md) et [TESTS-FINAL.md](TESTS-FINAL.md). Firebase a répondu au contrôle de configuration ; ce contrôle ne certifie pas les comptes/rôles. Le Worker répond aux tests publics et refuse la requête administrative anonyme, mais son code de publication n’est pas disponible pour extension sûre. L’administration musicale est préservée. Les contenus Engineering se publient par fichier validé et commit.

myPOS reste sans intégration ni vente active conformément à la demande. Aucun backend, secret, règle de production, service payant ou migration n’a été modifié. Les mentions légales et la confidentialité restent à compléter avec des informations validées ; les traceurs hérités du site musical nécessitent une revue de consentement. Les tests de lecture d’écran, appareils iOS/Android réels, paiement et authentification complète ne sont pas certifiés.

## Prévisualisation exacte

Depuis le dossier du dépôt : `python -m http.server 4417 --bind 127.0.0.1`, puis `http://127.0.0.1:4417/`. Cette adresse fonctionne sur l’ordinateur hôte uniquement. Sur iPhone, utiliser le domaine public après publication. Ne pas utiliser le serveur de maquettes pour tester la PWA réelle : il bloque volontairement SW et manifeste.

## Retour arrière

Baseline : `49e4ae78539e2305296db3c92ad7d8e1a3f528f2`. Bundle et ZIP vérifiés conservés hors dépôt dans `../backups/`. Une restauration indépendante de leurs 404 fichiers a déjà été vérifiée. Lire [SAUVEGARDE-ROLLBACK.md](SAUVEGARDE-ROLLBACK.md). Après publication, préférer un revert du commit V15, puis une republication Pages : aucun force-push, aucune restauration de base de données nécessaire. Le cache SW V15 ne modifie pas les favoris ou profils locaux ; le navigateur récupérera le SW de la version restaurée.
