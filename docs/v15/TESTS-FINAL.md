> Actualisation : sorties musicales, accueil et vitrine de sept applications/agent. Voir [la mise à jour du 23 novembre 2026](MISE-A-JOUR-20261123.md) pour le résultat et les preuves courants.

> Correctif musical : régression des images reproduite et corrigée. Les anciens contrôles étaient insuffisants ; voir [le rapport de correction](CORRECTIF-MEDIAS.md).

# Tests finaux V15 — 23 novembre 2026

Les résultats concernent les actions effectivement exécutées, avant publication. Les preuves de publication seront conservées hors du commit dans `../evidence/` et le HEAD/deployment seront communiqués à la livraison.

| Contrôle | Résultat | Preuve et limite |
|---|---|---|
| A Portail | PASS | Deux portes testées dans le navigateur, destination réelle Music et Engineering. |
| B Préservation musicale | PASS | 234 fichiers protégés byte-identiques, données/médias/backend/workflows originaux ; tous les textes du corps, 36 IDs et ressources d’origine préservés. Featured Prince des étoiles Remix rendu réellement depuis JSON. |
| C URL historiques | PASS | Liens réécrits de façon contrôlée ; 5 cas exécutés sur la passerelle JS réelle en VM, `index.html#artistes` et `/#morceaux` testés dans le navigateur. Anciennes routes conservées. 426 références des pages finales résolues. |
| D MPBP TV | PASS partiel | 18 entrées, sélection effective Prince Remix par hash, 6 éléments vidéo, aucune lecture automatique. Lecture audiovisuelle complète et statistiques distantes : NON TESTÉ. |
| E Artistes et musique | PASS partiel | Makéda affichée, médias présents ; Music Hub distinct atteint. Lectures de toutes les plateformes : NON TESTÉ. |
| F Engineering | PASS | 6 fiches réelles issues du catalogue, schéma validé, filtre agent, recherche vide, menu/Escape et focus. 4 cas de données invalides refusés. |
| G Jeux / démos | PASS pour la présentation | Fiche Lumélys et espace de démonstrations présents. Aucun lien Roblox ou essai non vérifié annoncé. Jouer à un jeu public : NON TESTÉ, aucun accès vérifié disponible. |
| H Administration | PASS statique / NON TESTÉ distant | CMS musical protégé inchangé. Éditeur local déjà testé (ajout, édition, masquage, import/export réel) en R2 ; absence de publication distante annoncée. Connexion admin, publication authentifiée et refus des rôles réels : NON TESTÉ. Requête Worker anonyme refusée lors de l’audit. |
| I Paiement | NON TESTÉ / désactivé | Aucun achat ni abonnement. Politique données refuse ventes et CTA purchase. Aucun débit, sandbox ou droit logiciel activé. |
| J Responsive | PASS | 32 contrôles navigateur : corporate, music, engineering, boutique, démos, fiche projet, TV, artiste × 320/390/768/1440. Aucun débordement horizontal ni image manquante observé. Captures finales sauvegardées. iPhone Safari/Android/Mac réels : NON TESTÉ. |
| K Accessibilité | PASS partiel | Navigation sémantique, labels, skip links, menu clavier/Escape et focus testés. CSS de mouvements réduits préservé. Lecteur d’écran, audit WCAG complet et réglage OS reduced motion : NON TESTÉ. |
| L PWA | PASS local partiel | Ancien SW installé sur origine QA dédiée, mise à jour vers V15 observée, ancien cache remplacé, marqueur local conservé, aucun chemin de compte/admin mis en cache. Serveur arrêté : accueil musical et featured se chargent encore. Installation iOS/Android et mise à jour des installations réelles : NON TESTÉ. |
| M SEO | PASS statique | 13 canoniques uniques attendus, 14 pages vérifiées avec la 404 ; corporate indexable, sitemap complété ; anciennes routes conservées. Indexation des moteurs : NON TESTÉ. |
| N Sécurité | PASS statique partiel | `security-surface.test.js` passe. Données/backend/règles/secrets/workflows préservés. Catalogue échappe les textes et refuse URL script et accès non vérifié. Aucun espace client ni publication distante fictifs. Pentest backend complet : NON TESTÉ. |
| O Performance | Mesures partielles | Fond R3 WebP 212854 octets, polices locales, pas de vidéo Engineering téléchargée automatiquement. Trois mesures HTTPS HTML avant/après prévues ; elles ne constituent ni LCP ni Lighthouse. Comparaison Core Web Vitals et tests réseau mobile réels : NON TESTÉ. |

## Tests existants : résultats bruts conservés

- `content-20261013.test.js`, `release-hardening.test.js`, `security-surface.test.js` : PASS.
- `v14-visual-layer.test.js` brut : FAIL, car il impose la classe musicale à `/index.html`. La même suite originale, inchangée, exécutée via l’adaptateur `tools/v15-visual-migration.test.cjs` qui lit `/musique/index.html` comme accueil musical : PASS sur 21 routes publiques, CMS intact. Aucun test d’origine supprimé.
- `firebase-migration.test.js` : FAIL déjà présent sur la baseline (markup Makéda enrichi en octobre), auquel s’ajoutent les adaptations intentionnelles de liens V15. Exigence d’identité intégrale à une ancienne version incompatible avec la migration autorisée.
- `v14-preservation.test.js` : FAIL déjà présent sur la baseline (ancien manifeste de préservation antérieur au contenu d’octobre), et différences intentionnelles root/chemins. Le manifeste original n’a pas été modifié. Les empreintes réellement auditées, contenus et comparaisons V15 sont distincts.
- Suites navigateur historiques avec mocks Supabase/Firebase : NON EXÉCUTÉES comme preuve d’un backend réel. Les tests UI décrits ci-dessus utilisent les pages finales dans le navigateur et les vrais JSON locaux.

Les journaux bruts `final-*.log`, `v15-final-static.json`, `final-captures/browser.json` et `final-captures/pwa.json` sont fournis. Les captures des maquettes R1/R2/R3 et l’audit initial sont conservés séparément. Aucune réserve de backend ou paiement n’est transformée en faux PASS.
