# Sauvegarde et retour arrière

Référence exacte : `49e4ae78539e2305296db3c92ad7d8e1a3f528f2` de Sparetdee-Simon-site/main. Le main local d'origine Documents/GitHub n'a pas été modifié. Aucun push, merge, migration, règle Firebase, DNS, compte ou paiement n'a été effectué.

## Sauvegardes locales hors racine servie

Dans le dossier de mission, au même niveau que `source/` et `v15/` :

- `backups/mpbp440-before-v15.bundle` : historique complet et refs ; `git bundle verify` a réussi.
- `backups/mpbp440-baseline-49e4ae7.zip` : sources et médias exacts du HEAD ; test d'intégrité ZIP réussi. 404 fichiers protégés.
- `evidence/backup-sha256.json` : empreintes des archives.
- `evidence/protected-files-sha256.json` : SHA-256 des fichiers du checkout Windows avant toute modification.
- `evidence/git-blob-sha256.json` : SHA-256 des blobs, distincts du checkout lorsque Git applique CRLF.

Ces archives préservent les sources et données statiques versionnées, pas un export Firestore, les secrets du Worker, l'historique Supabase ni les données des appareils utilisateurs. Aucun export distant de données privées n'a été réalisé. Ne pas présenter cette sauvegarde comme une sauvegarde complète du backend.

## Restaurer dans un nouveau dossier, sans écraser le travail

Depuis le dossier de mission, PowerShell :

```powershell
git bundle verify .\backups\mpbp440-before-v15.bundle
git clone .\backups\mpbp440-before-v15.bundle .\restauration-v14
git -C .\restauration-v14 switch --detach 49e4ae78539e2305296db3c92ad7d8e1a3f528f2
git -C .\restauration-v14 status --short
```

Le dernier statut doit être vide. Utiliser un dossier neuf ; ne pas exécuter reset --hard, clean ou suppression récursive sur les copies de travail existantes.

Une répétition de restauration dans `rollback-check/` a matérialisé le HEAD exact : 404 empreintes comparées, aucun écart, statut propre et `git fsck --full` code 0. Preuve : `preuves/rollback-check.json`. Le dossier de restauration est conservé ; aucune suppression n'a été effectuée.

## Retour de production éventuel — nécessite une autorisation

Aujourd'hui rien n'a changé en production : aucun rollback n'est nécessaire. Après une future V15 publiée, préparer dans la branche de travail un commit de restauration des sources depuis le ZIP/HEAD retenu, examiner le diff, exécuter les tests, puis demander l'autorisation de publication. Pas de force-push de main.

Restaurer aussi les métadonnées musicales, canonical, sitemap, manifeste et sw.js de référence. Tester un navigateur avec l'ancien cache et un autre avec le cache V15 pour s'assurer que le SW de restauration reprend le contrôle. Ne pas effacer les favoris/profils/audio locaux. Le rollback du front ne modifie ni Firebase ni le Worker : tout changement futur de backend devra avoir son propre export et plan réversible avant exécution.

## Prévisualisation exacte

Depuis le dossier `v15` :

```powershell
python .\tools\v15-build-design-review.py
python .\tools\v15-preview-server.py --port 4415
```

Ouvrir `http://127.0.0.1:4415/preview/v15/review.html`. Arrêter le serveur par Ctrl+C. Écoute limitée à 127.0.0.1 ; pas d'accès direct depuis un téléphone sur le réseau. Les largeurs mobiles sont vérifiées en navigateur desktop ; tests physiques Safari/Android encore nécessaires.

Le serveur de revue désactive SW/manifeste, bloque connexions/frames externes et formulaires avec CSP, refuse les écritures HTTP et l'énumération de dossiers. Il sert les pages historiques pour lecture/visuel ; il ne permet pas de tester une authentification réelle, un embed distant ou une publication. Les liens externes explicites s'ouvrent seulement si le visiteur les active.
