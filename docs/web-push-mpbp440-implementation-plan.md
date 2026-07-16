# Plan Web Push MPBP440

Le site MPBP440.com est actuellement une application statique GitHub Pages. La V11.2 ajoute un consentement propre, des notifications locales quand le site ou la PWA est ouvert, et le badge PWA quand le navigateur le supporte. Elle ne met pas en place de vraies notifications recues quand l'application est fermee, car aucun backend Web Push n'existe dans le depot.

## Ce qu'il faut ajouter pour de vraies notifications en arriere-plan

1. Generer des cles VAPID publiques/privees pour identifier l'emetteur Web Push.
2. Garder la cle privee hors du depot GitHub, dans un gestionnaire de secrets ou des variables d'environnement serveur.
3. Ajouter une inscription PushManager cote frontend apres consentement explicite utilisateur.
4. Envoyer l'abonnement PushSubscription a un endpoint serveur securise.
5. Stocker les abonnements dans une base ou un stockage serveur fiable.
6. Ajouter un endpoint de desinscription et une logique de nettoyage des abonnements expires.
7. Creer un service d'envoi qui lit les nouvelles sorties, clips, evenements ou actualites importantes et envoie les payloads Web Push.
8. Gerer les erreurs 404/410 des fournisseurs push pour supprimer les abonnements invalides.
9. Ajouter un handler `push` dans `sw.js` pour afficher les notifications recues en arriere-plan.
10. Garder `notificationclick` pour ouvrir la bonne URL ou ancre publique MPBP440.

## Donnees minimales a envoyer

- `title`
- `body`
- `icon`
- `badge`
- `tag`
- `data.url`
- `notificationId`
- `type`
- `date`

## Limites iPhone/PWA

Sur iPhone, les notifications Web Push necessitent une PWA ajoutee a l'ecran d'accueil et un navigateur/iOS compatible. L'autorisation doit toujours venir d'une action utilisateur. Les comportements peuvent varier selon la version iOS, les reglages de concentration, les autorisations de l'app et le mode economie d'energie.

## Procedure de test

1. Installer la PWA sur Android, desktop et iPhone compatible.
2. Cliquer sur le bouton d'activation des notifications.
3. Verifier que `PushManager.subscribe` cree un abonnement valide.
4. Verifier que l'abonnement est bien stocke cote serveur.
5. Envoyer une notification de test depuis le serveur.
6. Tester site ouvert, PWA ouverte, PWA en arriere-plan et PWA fermee.
7. Verifier le clic notification vers les ancres publiques :
   - `/mpbp-tv/index.html#l-argent`
   - `/mpbp-tv/index.html#clip-je-sais-que-tu-sais`
   - `/mpbp-tv/index.html#clip-j-existe`
   - `/mpbp-tv/index.html#clip-dois-je-me-taire`
8. Verifier que le badge non lu est synchronise apres lecture.

## Decision a valider

Avant implementation, choisir une solution serveur ou fournisseur externe. Ne creer aucun compte, service payant ou stockage externe sans validation du proprietaire MPBP440.
