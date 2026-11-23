> État final : direction R3 et mise en ligne autorisées le 23 novembre 2026. Le contenu ci-dessous conserve les décisions et résultats du jalon préparatoire. Pour la réalisation finale, voir [LIVRAISON.md](LIVRAISON.md) et [TESTS-FINAL.md](TESTS-FINAL.md).

# Tests et réserves — jalon audit / architecture / maquettes

**Révision courante R3 — Atelier numérique :** la direction R2 a été rejetée. Le logo Engineering validé est conservé ; décor, typographies et composants ont été repris. Voir [REVISION-R3.md](REVISION-R3.md). 20 contrôles responsive et 7 interactions PASS ; validation visuelle utilisateur en attente.

**Complément R2 :** le logo Engineering a été validé par le propriétaire. Sept pages de revue (corporate, Music, Engineering, boutique, démos, fiche, éditeur) ont été capturées à 320/390/768/1440 px : 28 contrôles finaux sans débordement, image manquante ou landmark main absent. Un débordement initial corporate à 320 px a été corrigé ; relevé initial conservé. Les imports invalides (vente, URL script, doublon), la sauvegarde, l'ajout, le masquage dans le catalogue et la boutique, l'import source et un vrai export JSON de sept fiches ont été vérifiés dans l'éditeur local. Retour final à six annonces source, aucun accès démo/jeu ou paiement simulé comme opérationnel. Voir `preuves/r2-*.json` et [REVISION-R2.md](REVISION-R2.md). Les données de catalogue R2 sont des annonces de projets ; les six exemples du premier jalon restent des brouillons.

Les PASS ci-dessous sont limités à l'opération décrite. La V15 générale n'est pas implémentée, ni validée par l'utilisateur. Les maquettes sont en noindex, sans intégrations distantes. Aucun test simulé n'est présenté comme un service réel.

## Tests existants exécutés sur le HEAD publié avant ajout des maquettes

| Test | Résultat | Preuve / limite |
|---|---|---|
| `tests/content-20261013.test.js` | PASS | Journal conservé, contrôle du contenu d'octobre. |
| `tests/release-hardening.test.js` | PASS | Contrats locaux et tests isolés du code ; pas une publication réelle. |
| `tests/security-surface.test.js` | PASS | Surface statique et motifs de secrets ; ne certifie pas le backend. |
| `tests/v14-visual-layer.test.js` | PASS | Contrats HTML/CSS V14. |
| `tests/firebase-migration.test.js` | FAIL | Attend le markup de la base V14 antérieure ; l'ajout officiel Sous Le Même Toit sur la fiche Makéda déclenche le premier échec. Échec déjà présent avant V15. |
| `tests/v14-preservation.test.js` | FAIL | Manifeste antérieur à la publication d'octobre : données/countdowns/featured et empreintes ont changé dans la production de référence. Journal complet conservé. Aucune suppression de test ni modification du manifeste. |

Les trois premiers lancements nécessitant un Git enfant ont été bloqués par EPERM de la sandbox. Relance autorisée hors sandbox ; les résultats finaux ci-dessus distinguent les vrais FAIL des restrictions initiales.

`v14-functional-qa.js`, `v14-browser-qa.js`, `v14-capture-qa.js`, `firebase-browser-qa.js` et `content-20261013-browser.js` : NON EXÉCUTÉS en tant que suites. Le premier utilise encore des fixtures RPC Supabase ; le test Firebase annonce explicitement ses mocks. Ils ne démontrent pas la santé réelle des services. Des attentes pertinentes ont été reprises dans les contrôles navigateur ci-dessous, sans revendiquer un PASS global de ces suites.

## Contrôles V15 de ce jalon

| Contrôle | Résultat | Preuve |
|---|---|---|
| 404 fichiers préexistants identiques au checkout de référence | PASS | `protected-files-sha256.json`, vérification sans modification des données/médias/tests/SW/CNAME. |
| Intégrité ZIP + bundle complet | PASS | Test ZIP et `git bundle verify`. Empreintes dans `backup-sha256.json`. |
| Restauration locale depuis bundle | PASS | Clone distinct, checkout du HEAD, fsck, statut propre, comparaison des 404 empreintes ; `rollback-check.json`. |
| Résolution des références locales des maquettes | PASS | `review-checks.json`, 197 références locales vérifiées au premier passage ; compteur exact du passage final dans le JSON. |
| Contrat catalogue proposé | PASS | Six brouillons non publics ; huit cas invalides rejetés, dont script URL, prix non vérifié, date, slug et média sans alt. Validateur standard-library limité aux mots clés effectivement utilisés, pas un validateur JSON Schema général. |
| Deux portes, menu mobile, Échap, focus clavier | PASS | `interaction-review.json`. |
| Filtres agents/jeux, recherche Brenda, résultat vide, deux fiches | PASS | Contrôles navigateur réels dans la maquette, pas d'appels de services. |
| Largeurs 320/390/768/1440, trois vues | PASS pour absence de débordement mesuré | `visual-review.json` + 12 captures complètes. Pas une certification tous navigateurs. |
| Médias représentatifs réellement chargés | PASS aux contrôles après capture 390/1440 | Portraits officiels, logo et pochette ; les premiers relevés sur images lazy étaient antérieurs au chargement, pas des 404. |
| MPBP TV existant | PASS pour sélection par six fragments | `baseline-browser.json` : 18 boutons de bibliothèque et six éléments vidéo observés. Les fragments gérés par JS peuvent ne pas être des IDs HTML ; sélection et titre vérifiés séparément. |
| JS / JSON et contrôle final | Voir `delivery-checks.json` | Compteurs et résultats exacts enregistrés au passage final. |

## Matrice A–O demandée : limites actuelles

| Domaine | État de ce jalon |
|---|---|
| A Portail | PASS sur les deux accès des maquettes ; version finale racine NON TESTÉE car non développée avant validation. |
| B Musique | PASS intégrité des 404 fichiers, rendu de la dernière sortie et trois artistes ; migration complète et tous contrôles audio NON TESTÉS. |
| C URL historiques | Lectures HTTP de dix routes publiques effectuées ; FAIL préexistant `/artistes/` 404. Migration des anciennes ancres vers /musique/ NON TESTÉE/non implémentée. |
| D MPBP TV | Six sélections par lien profond PASS local ; décodage/lecture MP4, embed YouTube, volume, plein écran et engagement réels NON TESTÉS. Frames externes volontairement bloquées. |
| E Artistes/musique | Pages originales et médias identiques ; contrôle global des liens externes et lectures NON TESTÉ. |
| F Engineering | Filtres/recherche et navigation de maquette PASS ; catalogue de production à construire après accord. |
| G Jeux | Fiche de revue accessible PASS ; lien officiel Roblox et jeu réel NON TESTÉS/absents, aucun faux bouton Jouer. |
| H Administration | Worker sans jeton 401 PASS ; login admin, rôle réel, upload et publication NON TESTÉS. Aucun compte modifié. |
| I Paiement | NON TESTÉ, désactivé ; aucun flux réel ni sandbox, aucune activation de droits. |
| J Mobile | Captures et largeur PASS dans Chromium ; appareils Safari iPhone/Android et Mac NON TESTÉS. |
| K Accessibilité | Focus/clavier/menu PASS limité ; labels et landmarks observés. Règle reduced-motion présente. Lecteur d'écran et émulation effective de reduced-motion NON TESTÉS ; aucun audit WCAG exhaustif revendiqué. |
| L PWA | NON TESTÉ dynamiquement, audit statique effectué. SW bloqué par le serveur local de maquettes. |
| M SEO | Hash des ressources et routes publiques contrôlés ; nouvelle architecture proposée seulement. Canonical/sitemap/404 V15 NON TESTÉS/non implémentés. |
| N Sécurité | Test statique existant PASS et refus anonyme Worker PASS ; règles déployées, pénétration, abus de rôle et chaîne de publication NON TESTÉS. Risques hérités documentés. |
| O Performance | NON TESTÉ : pas de mesure LCP/CLS/INP ni comparaison avant/après en production équivalente. Pas de promesse de performance inventée. |

## Conditions avant publication finale

Accord visuel → développement → suites existantes adaptées par contrat V15 explicite sans effacer le manifeste V14 → tests navigateur/local et appareils → PWA mise à jour/rollback → services réels dans environnement autorisé → revue diff → réserves → validation du résultat réel → autorisation explicite de merge/déploiement. Les deux FAIL historiques et le 404 artistes demeurent ouverts à ce jalon.
