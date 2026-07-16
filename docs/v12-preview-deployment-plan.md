# Plan de preview V12

Créer un dépôt GitHub Pages séparé, par exemple `Sparetdee-Simon-site-v12-preview`, sans `CNAME` et avec Pages activé uniquement sur sa branche `main`.

1. Créer le dépôt privé/public selon la décision propriétaire ; ne pas modifier les réglages Pages du dépôt production.
2. Copier le contenu de `v12-premium` dans une branche de preview, en supprimant uniquement le fichier `CNAME` dans ce dépôt séparé.
3. Publier via GitHub Pages sur l’hostname HTTPS dédié.
4. Tester PC et iPhone : routes, manifest, service worker, offline minimal et liens partagés.
5. Supprimer le dépôt ou désactiver Pages après recette si nécessaire.

Cette opération nécessite une autorisation propriétaire : elle n’est pas effectuée par ce lot.
