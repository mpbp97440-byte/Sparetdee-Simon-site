# Plan de rollback V12

La référence de retour est le tag `v11-stable-before-v12` et le commit production `9cc20bb09cc62facb79a5a544ba2935b1e299939`.

En cas de régression après un merge autorisé :

1. Stopper tout déploiement additionnel et relever la route/erreur exacte.
2. Restaurer `main` vers la référence V11 via un commit de revert ou une procédure Git approuvée par le propriétaire ; ne pas forcer l’historique sans autorisation.
3. Vérifier CNAME, manifest, service worker et les quatre URLs MPBP TV.
4. Purger uniquement les caches `mpbp440-*` via une nouvelle version de service worker si nécessaire.
5. Rejouer les contrôles HTTP, ancres, console et mobile avant de réouvrir la release.

La branche `v12-premium` conserve le travail V12 pour correction ; elle ne doit pas être supprimée pendant un rollback.
